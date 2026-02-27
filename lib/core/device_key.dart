import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

const _deviceKeyStorage = 'sk_device_key_v1';

class DeviceKeyStore {
  Future<String> getOrCreate() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_deviceKeyStorage);
    if (existing != null && existing.isNotEmpty) {
      return existing;
    }
    const uuid = Uuid();
    final fresh = uuid.v4();
    await prefs.setString(_deviceKeyStorage, fresh);
    return fresh;
  }
}
