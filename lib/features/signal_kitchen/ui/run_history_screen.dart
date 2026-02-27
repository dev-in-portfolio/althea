import 'package:flutter/material.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/timer_run.dart';

class RunHistoryScreen extends StatelessWidget {
  const RunHistoryScreen({super.key, required this.runs});

  final List<TimerRun> runs;

  @override
  Widget build(BuildContext context) {
    if (runs.isEmpty) {
      return const Center(child: Text('No completed runs yet.'));
    }
    final now = DateTime.now();
    final grouped = <String, List<TimerRun>>{};
    for (final run in runs) {
      final local = run.startedAt.toLocal();
      final key =
          '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')}';
      grouped.putIfAbsent(key, () => []).add(run);
    }
    final keys = grouped.keys.toList()
      ..sort((a, b) => b.compareTo(a));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        if (index.isOdd) {
          return const SizedBox(height: 8);
        }
        final dayKey = keys[index ~/ 2];
        final dayRuns = grouped[dayKey] ?? [];
        final dayTotal = dayRuns.fold<int>(
          0,
          (sum, run) => sum + run.targetSeconds,
        );
        final dayLabel = dayKey == _formatDate(now)
            ? 'Today'
            : dayKey == _formatDate(now.subtract(const Duration(days: 1)))
                ? 'Yesterday'
                : dayKey;
        return Card(
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$dayLabel • ${dayTotal ~/ 60}m total',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                ...dayRuns.map(
                  (run) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            run.label.isEmpty ? 'Timer' : run.label,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text('${run.targetSeconds ~/ 60}m'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
      itemCount: keys.length * 2 - 1,
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
