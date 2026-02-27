import 'package:flutter/material.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/timer_run.dart';

class TimerCard extends StatelessWidget {
  const TimerCard({
    super.key,
    required this.run,
    required this.now,
    required this.onStop,
    required this.onCancel,
  });

  final TimerRun run;
  final DateTime now;
  final VoidCallback onStop;
  final VoidCallback onCancel;

  String _format(Duration duration) {
    final totalSeconds = duration.inSeconds.clamp(0, 86400);
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final remaining = run.remaining(now);
    final progress = 1 -
        (remaining.inSeconds / run.targetSeconds).clamp(0.0, 1.0).toDouble();
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              run.label.isEmpty ? 'Timer' : run.label,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(
              _format(remaining),
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: progress),
            const SizedBox(height: 12),
            Row(
              children: [
                TextButton.icon(
                  onPressed: onStop,
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Done'),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: onCancel,
                  icon: const Icon(Icons.cancel_outlined),
                  label: const Text('Cancel'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
