from flask import Flask, request, jsonify
import os
import numpy as np
import xarray as xr
from datetime import datetime
import threading
import gc
import weakref

# 数据文件路径
DATA_FILE_PATH = os.path.join('weather_data.nc')

# 全局锁，防止并发访问数据集
_dataset_lock = threading.Lock()

# 缓存数据集的基本信息
_dataset_info = None
_dataset_info_lock = threading.Lock()

# 数据集缓存（使用弱引用）
_dataset_cache = weakref.WeakValueDictionary()

def get_dataset_info():
    """获取数据集的基本信息（缓存）"""
    global _dataset_info
    
    with _dataset_info_lock:
        if _dataset_info is None:
            try:
                # 只读取数据集的基本信息，不加载全部数据
                with xr.open_dataset(DATA_FILE_PATH, engine='netcdf4') as ds:
                    _dataset_info = {
                        'time_range': (ds.time.min().values, ds.time.max().values),
                        'lat_range': (ds.latitude.min().values, ds.latitude.max().values),
                        'lon_range': (ds.longitude.min().values, ds.longitude.max().values),
                        'variables': list(ds.data_vars.keys()),
                        'time_size': len(ds.time),
                        'lat_size': len(ds.latitude),
                        'lon_size': len(ds.longitude)
                    }
            except Exception as e:
                raise Exception(f"Failed to read dataset info: {str(e)}")
    
    return _dataset_info

def load_weather_data():
    """加载气象数据文件（使用上下文管理器和分块加载）"""
    try:
        # 使用分块加载以减少内存使用，并设置较小的块大小
        ds = xr.open_dataset(
            DATA_FILE_PATH, 
            chunks={'time': 500, 'latitude': 50, 'longitude': 50},
            engine='netcdf4',
            decode_times=True,
            decode_coords=True
        )
        return ds
    except Exception as e:
        raise Exception(f"Failed to load data file: {str(e)}")

def find_nearest_point(ds, lat, lon):
    """找到最接近指定经纬度的网格点"""
    try:
        # 使用xarray的sel方法找到最接近的点
        point = ds.sel(latitude=lat, longitude=lon, method='nearest')
        
        # 获取实际选中的坐标
        actual_lat = point.latitude.values
        actual_lon = point.longitude.values
        
        # 找到这些坐标在原数组中的索引
        lat_idx = np.where(ds.latitude.values == actual_lat)[0][0]
        lon_idx = np.where(ds.longitude.values == actual_lon)[0][0]
        
        return lat_idx, lon_idx
    except Exception as e:
        raise Exception(f"Failed to find nearest point: {str(e)}")

def filter_by_time(ds, start_timestamp, end_timestamp):
    """根据时间戳过滤数据"""
    try:
        # 将时间戳转换为datetime对象
        start_time = datetime.fromtimestamp(start_timestamp)
        end_time = datetime.fromtimestamp(end_timestamp)
        
        # 过滤时间范围，如果超出范围则返回空数据集
        try:
            ds_filtered = ds.sel(time=slice(start_time, end_time))
            return ds_filtered
        except:
            # 如果时间范围超出数据集范围，返回空数据集
            return ds.isel(time=slice(0, 0))  # 返回空的时间切片
    except Exception as e:
        raise Exception(f"Failed to filter by time: {str(e)}")

def calculate_wind_speed(u10, v10):
    """计算风速 (从u10和v10分量)"""
    try:
        return np.sqrt(u10**2 + v10**2)
    except Exception as e:
        raise Exception(f"Failed to calculate wind speed: {str(e)}")

def extract_data_for_point(ds, lat, lon, data_type):
    """为指定点提取指定类型的数据（优化版本）"""
    try:
        # 检查数据集是否为空
        if len(ds.time) == 0:
            return []
        
        # 直接选择最接近的点，不使用索引
        point_data = ds.sel(latitude=lat, longitude=lon, method='nearest')
        
        result_data = []
        
        # 获取时间值并转换为列表以避免重复计算
        time_values = list(ds.time.values)
        
        for i, time_val in enumerate(time_values):
            try:
                timestamp = int(time_val.astype('datetime64[s]').astype(int))
                
                # 选择特定时间的数据
                time_data = point_data.sel(time=time_val)
                
                value = None
                
                if data_type == 'temperature':
                    if 't2m' in ds.data_vars:
                        try:
                            temp_value = float(time_data.t2m.values)
                            # 转换为摄氏度 (从开尔文)
                            temp_value = temp_value - 273.15
                            # 检查是否为有效值
                            if np.isnan(temp_value) or np.isinf(temp_value):
                                value = None
                            else:
                                value = str(temp_value)
                        except:
                            value = None
                elif data_type == 'wind_speed':
                    if 'u10' in ds.data_vars and 'v10' in ds.data_vars:
                        try:
                            u10_val = float(time_data.u10.values)
                            v10_val = float(time_data.v10.values)
                            # 检查是否为有效值
                            if np.isnan(u10_val) or np.isinf(u10_val) or np.isnan(v10_val) or np.isinf(v10_val):
                                value = None
                            else:
                                # 返回矢量值，用逗号分割
                                value = f"{u10_val},{v10_val}"
                        except:
                            value = None
                elif data_type == 'precipitation':
                    if 'tp6h' in ds.data_vars:
                        try:
                            precip_value = float(time_data.tp6h.values)
                            # 检查是否为有效值
                            if np.isnan(precip_value) or np.isinf(precip_value):
                                value = None
                            else:
                                value = str(precip_value)
                        except:
                            value = None
                
                # 添加数据点，即使值为null
                result_data.append({
                    'timestamp': timestamp,
                    'value': value
                })
                    
            except Exception as e:
                # 如果出现错误，添加null值
                try:
                    timestamp = int(time_val.astype('datetime64[s]').astype(int))
                except:
                    timestamp = 0
                result_data.append({
                    'timestamp': timestamp,
                    'value': None
                })
                continue
        
        return result_data
    except Exception as e:
        raise Exception(f"Failed to extract data: {str(e)}")

def validate_parameters(start_timestamp, end_timestamp, latitude, longitude, data_type):
    """验证API参数"""
    try:
        # 验证必需参数
        if not all([start_timestamp, end_timestamp, latitude, longitude, data_type]):
            return False, 'Missing required parameters. Need: start_time, end_time, lat, lon, type'
        
        # 验证数据类型
        valid_types = ['temperature', 'wind_speed', 'precipitation']
        if data_type not in valid_types:
            return False, f'Invalid type. Must be one of: {valid_types}'
        
        # 验证时间戳
        if start_timestamp >= end_timestamp:
            return False, 'start_time must be less than end_time'
        
        # 验证经纬度范围
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            return False, 'Invalid coordinates. Latitude must be [-90, 90], longitude must be [-180, 180]'
        
        return True, None
    except Exception as e:
        return False, f'Parameter validation failed: {str(e)}'

def get_weather_data_service(start_timestamp, end_timestamp, latitude, longitude, data_type):
    """气象数据服务主函数（优化版本）"""
    ds = None
    ds_filtered = None
    try:
        # 验证参数
        is_valid, error_msg = validate_parameters(start_timestamp, end_timestamp, latitude, longitude, data_type)
        if not is_valid:
            raise ValueError(error_msg)
        
        # 使用锁确保同一时间只有一个请求访问数据集
        with _dataset_lock:
            # 加载数据
            ds = load_weather_data()
            
            # 按时间过滤
            ds_filtered = filter_by_time(ds, start_timestamp, end_timestamp)
            
            # 提取指定点的数据
            data = extract_data_for_point(ds_filtered, latitude, longitude, data_type)
            
            return {
                'data': data,
                'metadata': {
                    'latitude': latitude,
                    'longitude': longitude,
                    'type': data_type,
                    'start_timestamp': start_timestamp,
                    'end_timestamp': end_timestamp,
                    'count': len(data)
                }
            }
    except Exception as e:
        raise e
    finally:
        # 确保数据集被关闭
        if ds_filtered is not None:
            try:
                ds_filtered.close()
            except Exception:
                pass
        
        if ds is not None:
            try:
                ds.close()
            except Exception:
                pass
        
        # 强制垃圾回收
        gc.collect()

app = Flask(__name__)

@app.route("/api/weather", methods=['GET'])
def get_weather_data():
    """获取气象数据API"""
    try:
        # 获取参数
        start_timestamp = request.args.get('start_time', type=int)
        end_timestamp = request.args.get('end_time', type=int)
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lon', type=float)
        data_type = request.args.get('type', type=str)
        
        # 调用服务层处理业务逻辑
        result = get_weather_data_service(
            start_timestamp, end_timestamp, latitude, longitude, data_type
        )
        
        return jsonify(result)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
