import 'dart:convert';

import 'package:flutter/material.dart';
import '../models/preset.dart';

class ExportSheet extends StatelessWidget {
  const ExportSheet({super.key, required this.preset});

  final TapForgePreset preset;

  @override
  Widget build(BuildContext context) {
    final settingsJson = jsonEncode(preset.settings.toJson());
    final sharePayload = jsonEncode({
      'name': preset.name,
      'settings': preset.settings.toJson(),
    });

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Export preset', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          const Text('Settings JSON'),
          SelectableText(settingsJson),
          const SizedBox(height: 12),
          const Text('Share payload'),
          SelectableText(sharePayload),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          )
        ],
      ),
    );
  }
}
