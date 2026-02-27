import 'package:flutter/material.dart';
import 'package:signal_kitchen/features/signal_kitchen/data/sk_api.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/preset.dart';

class PresetManagerScreen extends StatefulWidget {
  const PresetManagerScreen({super.key, required this.api});

  final SkApi api;

  @override
  State<PresetManagerScreen> createState() => _PresetManagerScreenState();
}

class _PresetManagerScreenState extends State<PresetManagerScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _secondsController = TextEditingController();
  List<Preset> _presets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final presets = await widget.api.fetchPresets();
      setState(() => _presets = presets);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createPreset() async {
    final name = _nameController.text.trim();
    final seconds = int.tryParse(_secondsController.text.trim()) ?? 0;
    if (name.isEmpty || seconds < 1) return;
    await widget.api.createPreset(name: name, seconds: seconds);
    _nameController.clear();
    _secondsController.clear();
    await _load();
  }

  Future<void> _editPreset(Preset preset) async {
    final nameController = TextEditingController(text: preset.name);
    final secondsController =
        TextEditingController(text: preset.seconds.toString());
    final updated = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit preset'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: secondsController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Seconds',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (updated != true) return;
    final name = nameController.text.trim();
    final seconds = int.tryParse(secondsController.text.trim()) ?? 0;
    if (name.isEmpty || seconds < 1) return;
    await widget.api.updatePreset(
      id: preset.id,
      name: name,
      seconds: seconds,
    );
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Presets',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Preset name',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 110,
                    child: TextField(
                      controller: _secondsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Seconds',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: ElevatedButton(
                  onPressed: _createPreset,
                  child: const Text('Add preset'),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemBuilder: (context, index) {
                    final preset = _presets[index];
                    return ListTile(
                      title: Text(preset.name),
                      subtitle: Text('${preset.seconds} seconds'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit_outlined),
                            onPressed: () => _editPreset(preset),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () async {
                              await widget.api.deletePreset(preset.id);
                              await _load();
                            },
                          ),
                        ],
                      ),
                    );
                  },
                  separatorBuilder: (_, __) => const Divider(),
                  itemCount: _presets.length,
                ),
        ),
      ],
    );
  }
}
