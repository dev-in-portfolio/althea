import 'package:flutter/material.dart';
import 'features/presets/ui/preset_list_screen.dart';

void main() {
  runApp(const TapForgeApp());
}

class TapForgeApp extends StatelessWidget {
  const TapForgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TapForge',
      theme: ThemeData.dark(useMaterial3: true),
      home: const PresetListScreen(apiBaseUrl: 'http://localhost:4000'),
    );
  }
}
