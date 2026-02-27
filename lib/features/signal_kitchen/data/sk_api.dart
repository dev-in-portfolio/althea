import 'package:dio/dio.dart';
import 'package:signal_kitchen/core/api_client.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/preset.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/timer_run.dart';

class SkApi {
  SkApi(this._client);

  final ApiClient _client;

  Future<List<Preset>> fetchPresets() async {
    final response = await _client.dio.get('/api/sk/presets');
    final data = response.data as Map<String, dynamic>;
    final presets = (data['presets'] as List<dynamic>? ?? [])
        .map((item) => Preset.fromJson(item as Map<String, dynamic>))
        .toList();
    return presets;
  }

  Future<Preset> createPreset({
    required String name,
    required int seconds,
  }) async {
    final response = await _client.dio.post(
      '/api/sk/presets',
      data: {
        'name': name,
        'seconds': seconds,
      },
    );
    return Preset.fromJson(
      (response.data as Map<String, dynamic>)['preset']
          as Map<String, dynamic>,
    );
  }

  Future<void> deletePreset(String id) async {
    await _client.dio.delete('/api/sk/presets/$id');
  }

  Future<Preset> updatePreset({
    required String id,
    required String name,
    required int seconds,
  }) async {
    final response = await _client.dio.patch(
      '/api/sk/presets/$id',
      data: {
        'name': name,
        'seconds': seconds,
      },
    );
    return Preset.fromJson(
      (response.data as Map<String, dynamic>)['preset']
          as Map<String, dynamic>,
    );
  }

  Future<List<TimerRun>> fetchRuns({String? status, int limit = 50}) async {
    final response = await _client.dio.get(
      '/api/sk/runs',
      queryParameters: {
        if (status != null) 'status': status,
        'limit': limit,
      },
    );
    final data = response.data as Map<String, dynamic>;
    final runs = (data['runs'] as List<dynamic>? ?? [])
        .map((item) => TimerRun.fromJson(item as Map<String, dynamic>))
        .toList();
    return runs;
  }

  Future<TimerRun> startRun({
    String? presetId,
    String? label,
    required int targetSeconds,
  }) async {
    final response = await _client.dio.post(
      '/api/sk/runs',
      data: {
        if (presetId != null) 'presetId': presetId,
        if (label != null) 'label': label,
        'targetSeconds': targetSeconds,
      },
    );
    return TimerRun.fromJson(
      (response.data as Map<String, dynamic>)['run'] as Map<String, dynamic>,
    );
  }

  Future<TimerRun> stopRun({
    required String id,
    required String status,
  }) async {
    final response = await _client.dio.patch(
      '/api/sk/runs/$id/stop',
      data: {'status': status},
    );
    return TimerRun.fromJson(
      (response.data as Map<String, dynamic>)['run'] as Map<String, dynamic>,
    );
  }
}
