import 'package:flutter/material.dart';
import '../data/dossier_api.dart';
import '../models/entry.dart';
import 'entry_detail_screen.dart';
import 'quick_add_screen.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key, required this.api});

  final DossierApi api;

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  List<DossierEntry> entries = [];
  String query = '';
  String tag = '';
  bool loading = false;
  String? cursor;
  String dateRange = 'week';

  @override
  void initState() {
    super.initState();
    loadEntries();
  }

  Future<void> loadEntries({bool reset = false}) async {
    if (loading) return;
    setState(() => loading = true);
    try {
      DateTime? from;
      if (dateRange == 'today') {
        final now = DateTime.now();
        from = DateTime(now.year, now.month, now.day);
      } else if (dateRange == 'week') {
        final now = DateTime.now();
        from = now.subtract(const Duration(days: 7));
      } else if (dateRange == 'month') {
        final now = DateTime.now();
        from = DateTime(now.year, now.month - 1, now.day);
      }
      final data = await widget.api.listEntries(
        cursor: reset ? null : cursor,
        q: query,
        tag: tag,
        from: from?.toIso8601String(),
      );
      setState(() {
        if (reset) {
          entries = data;
        } else {
          entries.addAll(data);
        }
        if (data.isNotEmpty) {
          cursor = data.last.occurredAt.toIso8601String();
        }
      });
    } catch (_) {}
    setState(() => loading = false);
  }

  void openQuickAdd() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => QuickAddScreen(
        api: widget.api,
        onSaved: (entry) {
          setState(() => entries.insert(0, entry));
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pocket Dossier'),
        actions: [
          IconButton(onPressed: openQuickAdd, icon: const Icon(Icons.add)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => loadEntries(reset: true),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
              decoration: const InputDecoration(labelText: 'Search'),
              onChanged: (value) {
                setState(() => query = value);
                loadEntries(reset: true);
              },
            ),
            TextField(
              decoration: const InputDecoration(labelText: 'Filter tag'),
              onChanged: (value) {
                setState(() => tag = value);
                loadEntries(reset: true);
              },
            ),
            if (tag.isNotEmpty)
              Align(
                alignment: Alignment.centerLeft,
                child: Chip(label: Text('Tag: $tag')),
              ),
            DropdownButton<String>(
              value: dateRange,
              items: const [
                DropdownMenuItem(value: 'today', child: Text('Today')),
                DropdownMenuItem(value: 'week', child: Text('Last 7 days')),
                DropdownMenuItem(value: 'month', child: Text('Last 30 days')),
                DropdownMenuItem(value: 'all', child: Text('All time')),
              ],
              onChanged: (value) {
                setState(() => dateRange = value ?? 'week');
                loadEntries(reset: true);
              },
            ),
            const SizedBox(height: 12),
            ...entries.map((entry) {
              final body = entry.body;
              if (query.isEmpty) {
                return Card(
                  child: ListTile(
                    title: Text(entry.title.isEmpty ? '(Untitled)' : entry.title),
                    subtitle: Text(body),
                    onTap: () async {
                      final updated = await Navigator.push<DossierEntry?>(
                        context,
                        MaterialPageRoute(builder: (_) => EntryDetailScreen(api: widget.api, entry: entry)),
                      );
                      if (updated == null) {
                        setState(() => entries.removeWhere((e) => e.id == entry.id));
                      } else {
                        setState(() {
                          entries = entries.map((e) => e.id == updated.id ? updated : e).toList();
                        });
                      }
                    },
                    trailing: Text(
                      '${entry.occurredAt.month}/${entry.occurredAt.day}',
                      style: const TextStyle(color: Colors.white54),
                    ),
                  ),
                );
              }

              final idx = body.toLowerCase().indexOf(query.toLowerCase());
              final preview = idx >= 0
                  ? body.substring(idx, (idx + 80).clamp(0, body.length))
                  : body;
              return Card(
                child: ListTile(
                  title: Text(entry.title.isEmpty ? '(Untitled)' : entry.title),
                  subtitle: Text(preview),
                  onTap: () async {
                    final updated = await Navigator.push<DossierEntry?>(
                      context,
                      MaterialPageRoute(builder: (_) => EntryDetailScreen(api: widget.api, entry: entry)),
                    );
                    if (updated == null) {
                      setState(() => entries.removeWhere((e) => e.id == entry.id));
                    } else {
                      setState(() {
                        entries = entries.map((e) => e.id == updated.id ? updated : e).toList();
                      });
                    }
                  },
                  trailing: Text(
                    '${entry.occurredAt.month}/${entry.occurredAt.day}',
                    style: const TextStyle(color: Colors.white54),
                  ),
                ),
              );
            }),
            if (loading) const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
            if (!loading)
              TextButton(
                onPressed: loadEntries,
                child: const Text('Load more'),
              ),
          ],
        ),
      ),
    );
  }
}
