import 'package:dio/dio.dart';
import 'device_key.dart';

class ApiClient {
  ApiClient({required this.baseUrl});

  final String baseUrl;
  Dio? _dio;

  Future<Dio> _getDio() async {
    if (_dio != null) return _dio!;
    final deviceKey = await getDeviceKey();
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {
        'X-Device-Key': deviceKey,
        'Content-Type': 'application/json'
      },
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
    ));
    _dio = dio;
    return dio;
  }

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? query}) async {
    final dio = await _getDio();
    return dio.get<T>(path, queryParameters: query);
  }

  Future<Response<T>> post<T>(String path, {dynamic data}) async {
    final dio = await _getDio();
    return dio.post<T>(path, data: data);
  }

  Future<Response<T>> patch<T>(String path, {dynamic data}) async {
    final dio = await _getDio();
    return dio.patch<T>(path, data: data);
  }

  Future<Response<T>> delete<T>(String path) async {
    final dio = await _getDio();
    return dio.delete<T>(path);
  }
}
