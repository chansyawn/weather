from flask import Flask, request, jsonify
from weather_service import get_weather_data_service

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
        return jsonify({'error': 'Internal server error'}), 500

@app.route("/api/health", methods=['GET'])
def health_check():
    """健康检查端点"""
    try:
        return jsonify({'status': 'healthy', 'message': 'Weather API is running'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # 设置Flask配置
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max request size
    app.run(debug=True, host='0.0.0.0', port=5328)
