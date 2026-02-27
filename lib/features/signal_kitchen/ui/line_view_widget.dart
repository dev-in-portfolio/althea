import 'package:flutter/material.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/timer_run.dart';

class LineViewWidget extends StatelessWidget {
  const LineViewWidget({super.key, required this.runs, required this.now});

  final List<TimerRun> runs;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final sorted = [...runs]..sort((a, b) {
      return a.remaining(now).inSeconds.compareTo(b.remaining(now).inSeconds);
    });
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final run = sorted[index];
        final remaining = run.remaining(now);
        final label = run.label.isEmpty ? 'Timer' : run.label;
        final highlight = index == 0;
        return ListTile(
          tileColor: highlight ? Colors.amber.withOpacity(0.2) : null,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Text(label),
          subtitle: Text(
            'Finishes in ${remaining.inMinutes}m ${remaining.inSeconds % 60}s',
          ),
          trailing: highlight ? const Icon(Icons.bolt) : null,
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: sorted.length,
    );
  }
}
