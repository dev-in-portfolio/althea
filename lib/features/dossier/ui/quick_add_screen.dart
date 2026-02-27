import 'package:flutter/material.dart';
import '../data/dossier_api.dart';
import '../models/entry.dart';
import '../models/tag.dart';
import 'tag_picker_sheet.dart';

class QuickAddScreen extends StatefulWidget {
  const QuickAddScreen({super.key, required this.api, required this.onSaved});

  final DossierApi api;
  final void Function(DossierEntry entry) onSaved;

  @override
  State<QuickAddScreen> createState() => _QuickAddScreenState();
}

class _QuickAddScreenState extends State<QuickAddScreen> {
  final TextEditingController titleController = TextEditingController();
  final TextEditingController bodyController = TextEditingController();
  List<String> tags = [];
  List<DossierTag> availableTags = [];
  bool saving = false;

  @override
  void initState() {
    super.initState();
    loadTags();
  }

  Future<void> loadTags() async {
    try {
      final data = await widget.api.listTags();
      setState(() => availableTags = data);
    } catch (_) {}
  }

  Future<void> saveEntry() async {
    if (bodyController.text.trim().isEmpty) return;
    setState(() => saving = true);
    final entry = await widget.api.createEntry(
      bodyController.text.trim(),
      title: titleController.text.trim(),
      tags: tags,
    );
    widget.onSaved(entry);
    if (!mounted) return;
    Navigator.pop(context);
  }

  void clearForm() {
    titleController.clear();
    bodyController.clear();
    setState(() => tags = []);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Quick Add', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Title (optional)')),
          TextField(
            controller: bodyController,
            decoration: const InputDecoration(labelText: 'Body (required)'),
            maxLines: 4,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: tags.map((tag) => Chip(label: Text(tag))).toList(),
          ),
          TextButton(
            onPressed: () async {
              final selected = await showModalBottomSheet<List<String>>(
                context: context,
                builder: (_) => TagPickerSheet(tags: availableTags, selected: tags),
              );
              if (selected != null) {
                setState(() => tags = selected);
              }
            },
            child: const Text('Pick tags'),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: saving ? null : saveEntry,
            child: Text(saving ? 'Saving...' : 'Save'),
          ),
          TextButton(
            onPressed: clearForm,
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}
