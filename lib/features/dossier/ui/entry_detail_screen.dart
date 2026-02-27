import 'package:flutter/material.dart';
import '../data/dossier_api.dart';
import '../models/entry.dart';
import '../models/tag.dart';
import 'tag_picker_sheet.dart';

class EntryDetailScreen extends StatefulWidget {
  const EntryDetailScreen({super.key, required this.api, required this.entry});

  final DossierApi api;
  final DossierEntry entry;

  @override
  State<EntryDetailScreen> createState() => _EntryDetailScreenState();
}

class _EntryDetailScreenState extends State<EntryDetailScreen> {
  late TextEditingController titleController;
  late TextEditingController bodyController;
  late List<String> tags;
  List<DossierTag> availableTags = [];

  @override
  void initState() {
    super.initState();
    titleController = TextEditingController(text: widget.entry.title);
    bodyController = TextEditingController(text: widget.entry.body);
    tags = List.from(widget.entry.tags);
    loadTags();
  }

  Future<void> loadTags() async {
    try {
      final data = await widget.api.listTags();
      setState(() => availableTags = data);
    } catch (_) {}
  }

  Future<void> save() async {
    final updated = await widget.api.updateEntry(
      widget.entry.id,
      title: titleController.text,
      body: bodyController.text,
      tags: tags,
    );
    if (!mounted) return;
    Navigator.pop(context, updated);
  }

  Future<void> deleteEntry() async {
    await widget.api.deleteEntry(widget.entry.id);
    if (!mounted) return;
    Navigator.pop(context, null);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Entry'),
        actions: [
          IconButton(onPressed: save, icon: const Icon(Icons.save)),
          IconButton(onPressed: deleteEntry, icon: const Icon(Icons.delete)),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Title')),
          TextField(controller: bodyController, decoration: const InputDecoration(labelText: 'Body'), maxLines: 4),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: widget.entry.occurredAt,
                firstDate: DateTime(2000),
                lastDate: DateTime.now().add(const Duration(days: 1)),
              );
              if (picked != null) {
                await widget.api.updateEntry(widget.entry.id, occurredAt: picked);
              }
            },
            child: const Text('Adjust occurred date'),
          ),
          const SizedBox(height: 12),
          Wrap(spacing: 8, children: tags.map((t) => Chip(label: Text(t))).toList()),
          TextButton(
            onPressed: () async {
              final selected = await showModalBottomSheet<List<String>>(
                context: context,
                builder: (_) => TagPickerSheet(tags: availableTags, selected: tags),
              );
              if (selected != null) setState(() => tags = selected);
            },
            child: const Text('Edit tags'),
          ),
        ],
      ),
    );
  }
}
