import '../../../core/api_client.dart';
import '../models/preset.dart';

class PresetApi {
  PresetApi(this.client);

  final ApiClient client;

  Future<List<TapForgePreset>> listPresets() async {
    final res = await client.get('/api/tapforge/presets');
    final data = res.data as List<dynamic>;
    return data.map((row) => TapForgePreset.fromJson(Map<String, dynamic>.from(row as Map))).toList();
  }

  Future<TapForgePreset> createPreset(String name, PresetSettings settings) async {
    final res = await client.post('/api/tapforge/presets', data: {
      'name': name,
      'settings': settings.toJson(),
    });
    return TapForgePreset.fromJson(Map<String, dynamic>.from(res.data as Map));
  }

  Future<TapForgePreset> updatePreset(String id, String name, PresetSettings settings) async {
    final res = await client.patch('/api/tapforge/presets/$id', data: {
      'name': name,
      'settings': settings.toJson(),
    });
    return TapForgePreset.fromJson(Map<String, dynamic>.from(res.data as Map));
  }

  Future<void> deletePreset(String id) async {
    await client.delete('/api/tapforge/presets/$id');
  }

  Future<TapForgePreset> duplicatePreset(String id) async {
    final res = await client.post('/api/tapforge/presets/$id/duplicate');
    return TapForgePreset.fromJson(Map<String, dynamic>.from(res.data as Map));
  }
}
