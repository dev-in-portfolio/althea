import 'dart:convert';

import 'package:flutter/material.dart';
import '../../../core/api_client.dart';
import '../data/preset_api.dart';
import '../models/preset.dart';
import 'export_sheet.dart';
import 'preset_editor_screen.dart';

class PresetListScreen extends StatefulWidget {
  const PresetListScreen({super.key, required this.apiBaseUrl});

  final String apiBaseUrl;

  @override
  State<PresetListScreen> createState() => _PresetListScreenState();
}

class _PresetListScreenState extends State<PresetListScreen> {
  late PresetApi api;
  bool loading = false;
  List<TapForgePreset> presets = [];
  String status = '';
  String query = '';
  String sort = 'updated';

  @override
  void initState() {
    super.initState();
    api = PresetApi(ApiClient(baseUrl: widget.apiBaseUrl));
    loadPresets();
  }

  Future<void> loadPresets() async {
    setState(() => loading = true);
    try {
      final data = await api.listPresets();
      setState(() {
        presets = data;
        status = '';
      });
    } catch (e) {
      setState(() => status = 'Failed to load presets.');
    }
    setState(() => loading = false);
  }

  Future<void> createPreset() async {
    final newPreset = TapForgePreset(
      id: 'new',
      name: 'New Preset',
      settings: PresetSettings(
        controls: [
          ControlSpec(
            id: 'speed',
            type: 'slider',
            label: 'Speed',
            min: 0,
            max: 100,
            step: 1,
            value: 50,
          ),
        ],
        haptics: {'onChange': 'light', 'onCommit': 'medium'},
        animation: {'curve': 'easeOut', 'ms': 180},
      ),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    final updated = await Navigator.push<TapForgePreset>(
      context,
      MaterialPageRoute(builder: (_) => PresetEditorScreen(initial: newPreset)),
    );

    if (updated == null) return;

    try {
      final saved = await api.createPreset(updated.name, updated.settings);
      setState(() {
        presets = [saved, ...presets];
      });
    } catch (_) {
      setState(() => status = 'Failed to save preset.');
    }
  }

  Future<void> duplicatePreset(TapForgePreset preset) async {
    try {
      final dup = await api.duplicatePreset(preset.id);
      setState(() => presets = [dup, ...presets]);
    } catch (_) {
      setState(() => status = 'Failed to duplicate.');
    }
  }

  Future<void> deletePreset(TapForgePreset preset) async {
    try {
      final existing = presets;
      await api.deletePreset(preset.id);
      setState(() => presets = presets.where((p) => p.id != preset.id).toList());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Deleted ${preset.name}'),
          action: SnackBarAction(
            label: 'Undo',
            onPressed: () async {
              try {
                final restored = await api.createPreset(preset.name, preset.settings);
                setState(() => presets = [restored, ...existing]);
              } catch (_) {
                setState(() => status = 'Failed to restore preset.');
              }
            },
          ),
        ),
      );
    } catch (_) {
      setState(() => status = 'Failed to delete.');
    }
  }

  void exportPreset(TapForgePreset preset) {
    showModalBottomSheet(
      context: context,
      builder: (_) => ExportSheet(preset: preset),
    );
  }

  void importPreset() async {
    final controller = TextEditingController();
    final nameController = TextEditingController(text: 'Imported Preset');
    final result = await showDialog<TapForgePreset>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Import preset JSON'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Preset name')),
            TextField(controller: controller, decoration: const InputDecoration(labelText: 'Settings JSON'), maxLines: 6),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              try {
                final settings = PresetSettings.fromJson(
                  Map<String, dynamic>.from(jsonDecode(controller.text) as Map),
                );
                final preset = TapForgePreset(
                  id: 'import',
                  name: nameController.text,
                  settings: settings,
                  createdAt: DateTime.now(),
                  updatedAt: DateTime.now(),
                );
                Navigator.pop(context, preset);
              } catch (_) {
                Navigator.pop(context);
              }
            },
            child: const Text('Import'),
          ),
        ],
      ),
    );

    if (result == null) return;
    try {
      final saved = await api.createPreset(result.name, result.settings);
      setState(() => presets = [saved, ...presets]);
    } catch (_) {
      setState(() => status = 'Failed to import preset.');
    }
  }

  Future<void> editPreset(TapForgePreset preset) async {
    final updated = await Navigator.push<TapForgePreset>(
      context,
      MaterialPageRoute(builder: (_) => PresetEditorScreen(initial: preset)),
    );
    if (updated == null) return;
    try {
      final saved = await api.updatePreset(updated.id, updated.name, updated.settings);
      setState(() {
        presets = presets.map((p) => p.id == saved.id ? saved : p).toList();
      });
    } catch (_) {
      setState(() => status = 'Failed to update preset.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = presets.where((p) => p.name.toLowerCase().contains(query.toLowerCase())).toList();
    filtered.sort((a, b) {
      if (sort == 'name') return a.name.compareTo(b.name);
      if (sort == 'created') return b.createdAt.compareTo(a.createdAt);
      return b.updatedAt.compareTo(a.updatedAt);
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('TapForge Presets'),
        actions: [
          IconButton(onPressed: createPreset, icon: const Icon(Icons.add)),
          IconButton(onPressed: importPreset, icon: const Icon(Icons.file_upload)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: loadPresets,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (status.isNotEmpty) Text(status, style: const TextStyle(color: Colors.redAccent)),
            if (loading) const LinearProgressIndicator(),
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(labelText: 'Search presets'),
                      onChanged: (value) => setState(() => query = value),
                    ),
                  ),
                  const SizedBox(width: 12),
                  DropdownButton<String>(
                    value: sort,
                    items: const [
                      DropdownMenuItem(value: 'updated', child: Text('Updated')),
                      DropdownMenuItem(value: 'created', child: Text('Created')),
                      DropdownMenuItem(value: 'name', child: Text('Name')),
                    ],
                    onChanged: (value) => setState(() => sort = value ?? 'updated'),
                  ),
                ],
              ),
            ),
            ...filtered.map((preset) => Card(
              child: ListTile(
                title: Text(preset.name),
                subtitle: Text('Updated ${preset.updatedAt.toLocal()}'),
                onTap: () => editPreset(preset),
                trailing: PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'duplicate') duplicatePreset(preset);
                    if (value == 'delete') deletePreset(preset);
                    if (value == 'export') exportPreset(preset);
                  },
                  itemBuilder: (_) => [
                    const PopupMenuItem(value: 'duplicate', child: Text('Duplicate')),
                    const PopupMenuItem(value: 'export', child: Text('Export')),
                    const PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                ),
              ),
            )),
          ],
        ),
      ),
    );
  }
}
