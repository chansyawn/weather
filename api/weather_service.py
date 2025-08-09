import os
import numpy as np
import xarray as xr
from datetime import datetime

# 数据文件路径
DATA_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'weather_data.nc')

def load_weather_data():
    """加载气象数据文件"""
    try:
        ds = xr.open_dataset(DATA_FILE_PATH)
        return ds
    except Exception as e:
        raise Exception(f"Failed to load data file: {str(e)}")

def find_nearest_point(ds, lat, lon):
    """找到最接近指定经纬度的网格点"""
    # 使用xarray的sel方法找到最接近的点
    point = ds.sel(latitude=lat, longitude=lon, method='nearest')
    
    # 获取实际选中的坐标
    actual_lat = point.latitude.values
    actual_lon = point.longitude.values
    
    # 找到这些坐标在原数组中的索引
    lat_idx = np.where(ds.latitude.values == actual_lat)[0][0]
    lon_idx = np.where(ds.longitude.values == actual_lon)[0][0]
    
    return lat_idx, lon_idx

def filter_by_time(ds, start_timestamp, end_timestamp):
    """根据时间戳过滤数据"""
    try:
        # 将时间戳转换为datetime对象
        start_time = datetime.fromtimestamp(start_timestamp)
        end_time = datetime.fromtimestamp(end_timestamp)
        
        # 过滤时间范围
        ds_filtered = ds.sel(time=slice(start_time, end_time))
        return ds_filtered
    except Exception as e:
        raise Exception(f"Failed to filter by time: {str(e)}")

def calculate_wind_speed(u10, v10):
    """计算风速 (从u10和v10分量)"""
    return np.sqrt(u10**2 + v10**2)

def extract_data_for_point(ds, lat, lon, data_type):
    """为指定点提取指定类型的数据"""
    try:
        # 直接选择最接近的点，不使用索引
        point_data = ds.sel(latitude=lat, longitude=lon, method='nearest')
        
        result_data = []
        
        for time_val in ds.time.values:
            timestamp = int(time_val.astype('datetime64[s]').astype(int))
            
            # 选择特定时间的数据
            time_data = point_data.sel(time=time_val)
            
            if data_type == 'temperature':
                if 't2m' in ds.data_vars:
                    value = float(time_data.t2m.values)
                    # 转换为摄氏度 (从开尔文)
                    value = value - 273.15
                else:
                    continue
            elif data_type == 'wind_speed':
                if 'u10' in ds.data_vars and 'v10' in ds.data_vars:
                    u10_val = float(time_data.u10.values)
                    v10_val = float(time_data.v10.values)
                    value = float(calculate_wind_speed(u10_val, v10_val))
                else:
                    continue
            elif data_type == 'precipitation':
                if 'tp6h' in ds.data_vars:
                    value = float(time_data.tp6h.values)
                else:
                    continue
            else:
                continue
            
            # 检查是否为有效值
            if not np.isnan(value) and not np.isinf(value):
                result_data.append({
                    'timestamp': timestamp,
                    'value': value
                })
        
        return result_data
    except Exception as e:
        raise Exception(f"Failed to extract data: {str(e)}")

def validate_parameters(start_timestamp, end_timestamp, latitude, longitude, data_type):
    """验证API参数"""
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

def get_weather_data_service(start_timestamp, end_timestamp, latitude, longitude, data_type):
    """气象数据服务主函数"""
    # 验证参数
    is_valid, error_msg = validate_parameters(start_timestamp, end_timestamp, latitude, longitude, data_type)
    if not is_valid:
        raise ValueError(error_msg)
    
    # 加载数据
    ds = load_weather_data()
    
    try:
        # 按时间过滤
        ds_filtered = filter_by_time(ds, start_timestamp, end_timestamp)
        
        if len(ds_filtered.time) == 0:
            raise ValueError('No data available for the specified time range')
        
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
    finally:
        # 确保数据集被关闭
        ds.close()
