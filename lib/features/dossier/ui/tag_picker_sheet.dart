import 'package:flutter/material.dart';
import '../models/tag.dart';

class TagPickerSheet extends StatefulWidget {
  const TagPickerSheet({super.key, required this.tags, required this.selected});

  final List<DossierTag> tags;
  final List<String> selected;

  @override
  State<TagPickerSheet> createState() => _TagPickerSheetState();
}

class _TagPickerSheetState extends State<TagPickerSheet> {
  late List<String> selected;
  String query = '';

  @override
  void initState() {
    super.initState();
    selected = List.from(widget.selected);
  }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.tags.where((tag) => tag.name.contains(query)).toList();
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            decoration: const InputDecoration(labelText: 'Search tags'),
            onChanged: (value) => setState(() => query = value),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: filtered.map((tag) {
              final isSelected = selected.contains(tag.name);
              return FilterChip(
                label: Text(tag.name),
                selected: isSelected,
                onSelected: (value) {
                  setState(() {
                    if (value) {
                      selected.add(tag.name);
                    } else {
                      selected.remove(tag.name);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, selected),
            child: const Text('Done'),
          )
        ],
      ),
    );
  }
}
