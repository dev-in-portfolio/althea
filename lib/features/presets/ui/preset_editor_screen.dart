import 'package:flutter/material.dart';
import '../models/preset.dart';
import 'preset_preview_widget.dart';

class PresetEditorScreen extends StatefulWidget {
  const PresetEditorScreen({super.key, required this.initial});

  final TapForgePreset initial;

  @override
  State<PresetEditorScreen> createState() => _PresetEditorScreenState();
}

class _PresetEditorScreenState extends State<PresetEditorScreen> {
  late TextEditingController nameController;
  late List<ControlSpec> controls;

  @override
  void initState() {
    super.initState();
    nameController = TextEditingController(text: widget.initial.name);
    controls = List.from(widget.initial.settings.controls);
  }

  void addControl(String type) {
    setState(() {
      controls.add(
        ControlSpec(
          id: 'control_${controls.length + 1}',
          type: type,
          label: type[0].toUpperCase() + type.substring(1),
          min: type == 'slider' ? 0 : null,
          max: type == 'slider' ? 100 : null,
          step: type == 'slider' ? 1 : null,
          value: type == 'toggle' ? false : type == 'segmented' ? 'A' : 50,
          options: type == 'segmented' ? ['A', 'B', 'C'] : null,
        ),
      );
    });
  }

  void editControl(ControlSpec control) {
    final labelController = TextEditingController(text: control.label);
    final minController = TextEditingController(text: (control.min ?? 0).toString());
    final maxController = TextEditingController(text: (control.max ?? 100).toString());
    final stepController = TextEditingController(text: (control.step ?? 1).toString());
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Edit control'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: labelController, decoration: const InputDecoration(labelText: 'Label')),
            if (control.type == 'slider') ...[
              TextField(controller: minController, decoration: const InputDecoration(labelText: 'Min')),
              TextField(controller: maxController, decoration: const InputDecoration(labelText: 'Max')),
              TextField(controller: stepController, decoration: const InputDecoration(labelText: 'Step')),
            ],
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              setState(() {
                final idx = controls.indexOf(control);
                controls[idx] = ControlSpec(
                  id: control.id,
                  type: control.type,
                  label: labelController.text.trim().isEmpty ? control.label : labelController.text.trim(),
                  min: control.type == 'slider' ? double.tryParse(minController.text) ?? control.min : control.min,
                  max: control.type == 'slider' ? double.tryParse(maxController.text) ?? control.max : control.max,
                  step: control.type == 'slider' ? double.tryParse(stepController.text) ?? control.step : control.step,
                  value: control.value,
                  options: control.options,
                );
              });
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void reorder(int index, int direction) {
    final next = index + direction;
    if (next < 0 || next >= controls.length) return;
    setState(() {
      final temp = controls[index];
      controls[index] = controls[next];
      controls[next] = temp;
    });
  }

  PresetSettings buildSettings() {
    return PresetSettings(
      controls: controls,
      haptics: {
        'onChange': 'light',
        'onCommit': 'medium',
      },
      animation: {
        'curve': 'easeOut',
        'ms': 180,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Preset'),
        actions: [
          TextButton(
            onPressed: () {
              final updated = TapForgePreset(
                id: widget.initial.id,
                name: nameController.text,
                settings: buildSettings(),
                createdAt: widget.initial.createdAt,
                updatedAt: DateTime.now(),
              );
              Navigator.pop(context, updated);
            },
            child: const Text('Save'),
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: nameController,
            decoration: const InputDecoration(labelText: 'Preset name'),
          ),
          const SizedBox(height: 16),
          const Text('Controls', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...controls.asMap().entries.map((entry) {
            final index = entry.key;
            final control = entry.value;
            return Card(
              child: ListTile(
                title: Text(control.label),
                subtitle: Text(control.type),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(onPressed: () => reorder(index, -1), icon: const Icon(Icons.arrow_upward)),
                    IconButton(onPressed: () => reorder(index, 1), icon: const Icon(Icons.arrow_downward)),
                    IconButton(onPressed: () => editControl(control), icon: const Icon(Icons.edit)),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              OutlinedButton(onPressed: () => addControl('slider'), child: const Text('Add Slider')),
              OutlinedButton(onPressed: () => addControl('toggle'), child: const Text('Add Toggle')),
              OutlinedButton(onPressed: () => addControl('segmented'), child: const Text('Add Segmented')),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Live Preview', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            switchInCurve: Curves.easeOut,
            switchOutCurve: Curves.easeInOut,
            transitionBuilder: (child, animation) {
              return ScaleTransition(
                scale: Tween<double>(begin: 0.98, end: 1.0).animate(
                  CurvedAnimation(parent: animation, curve: Curves.easeOut),
                ),
                child: FadeTransition(opacity: animation, child: child),
              );
            },
            child: PresetPreviewWidget(
              key: ValueKey(controls.length),
              settings: buildSettings(),
            ),
          ),
        ],
      ),
    );
  }
}
