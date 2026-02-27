import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/preset.dart';

class PresetPreviewWidget extends StatelessWidget {
  const PresetPreviewWidget({super.key, required this.settings});

  final PresetSettings settings;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: settings.controls.map((control) {
        switch (control.type) {
          case 'slider':
            final min = control.min ?? 0;
            final max = control.max ?? 100;
            final value = (control.value as num?)?.toDouble() ?? min;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(control.label, style: const TextStyle(fontWeight: FontWeight.bold)),
                Slider(
                  value: value.clamp(min, max),
                  min: min,
                  max: max,
                  onChanged: (_) {
                    HapticFeedback.lightImpact();
                  },
                ),
              ],
            );
          case 'toggle':
            final value = control.value == true;
            return SwitchListTile(
              value: value,
              onChanged: (_) {
                HapticFeedback.mediumImpact();
              },
              title: Text(control.label),
            );
          case 'segmented':
            final options = control.options ?? [];
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(control.label, style: const TextStyle(fontWeight: FontWeight.bold)),
                Wrap(
                  spacing: 8,
                  children: options.map((option) {
                    final selected = option == control.value;
                    return Chip(
                      label: Text(option),
                      backgroundColor: selected ? Colors.blueAccent : Colors.grey.shade200,
                    );
                  }).toList(),
                ),
              ],
            );
          default:
            return Text('Unknown control ${control.type}');
        }
      }).toList(),
    );
  }
}
