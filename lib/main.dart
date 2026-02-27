import 'package:flutter/material.dart';
import 'package:signal_kitchen/core/api_client.dart';
import 'package:signal_kitchen/core/device_key.dart';
import 'package:signal_kitchen/features/signal_kitchen/data/sk_api.dart';
import 'package:signal_kitchen/features/signal_kitchen/ui/timer_board_screen.dart';

void main() {
  runApp(const SignalKitchenApp());
}

class SignalKitchenApp extends StatefulWidget {
  const SignalKitchenApp({super.key});

  @override
  State<SignalKitchenApp> createState() => _SignalKitchenAppState();
}

class _SignalKitchenAppState extends State<SignalKitchenApp> {
  final _deviceKeyStore = DeviceKeyStore();

  Future<SkApi> _createApi() async {
    final deviceKey = await _deviceKeyStore.getOrCreate();
    const apiBaseUrl = 'http://localhost:4002';
    final client = ApiClient(baseUrl: apiBaseUrl, deviceKey: deviceKey);
    return SkApi(client);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Signal Kitchen',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepOrange),
        useMaterial3: true,
      ),
      home: FutureBuilder<SkApi>(
        future: _createApi(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          return TimerBoardScreen(api: snapshot.data!);
        },
      ),
    );
  }
}
