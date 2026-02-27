import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

const _deviceKeyStorage = 'tapforge_device_key';

Future<String> getDeviceKey() async {
  final prefs = await SharedPreferences.getInstance();
  final existing = prefs.getString(_deviceKeyStorage);
  if (existing != null && existing.isNotEmpty) {
    return existing;
  }
  final key = const Uuid().v4();
  await prefs.setString(_deviceKeyStorage, key);
  return key;
}
