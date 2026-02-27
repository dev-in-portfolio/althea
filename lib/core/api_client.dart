import 'package:dio/dio.dart';

class ApiClient {
  ApiClient({required this.baseUrl, required this.deviceKey}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 8),
        headers: {'X-Device-Key': deviceKey},
      ),
    );
  }

  final String baseUrl;
  final String deviceKey;
  late final Dio _dio;

  Dio get dio => _dio;
}
