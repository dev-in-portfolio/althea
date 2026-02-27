class TimerRun {
  TimerRun({
    required this.id,
    required this.presetId,
    required this.label,
    required this.startedAt,
    required this.targetSeconds,
    required this.endedAt,
    required this.status,
  });

  final String id;
  final String? presetId;
  final String label;
  final DateTime startedAt;
  final int targetSeconds;
  final DateTime? endedAt;
  final String status;

  factory TimerRun.fromJson(Map<String, dynamic> json) {
    return TimerRun(
      id: json['id'] as String,
      presetId: json['preset_id'] as String?,
      label: json['label'] as String? ?? '',
      startedAt: DateTime.tryParse(json['started_at'] as String? ?? '') ??
          DateTime.now(),
      targetSeconds: json['target_seconds'] as int? ?? 0,
      endedAt: json['ended_at'] == null
          ? null
          : DateTime.tryParse(json['ended_at'] as String),
      status: json['status'] as String? ?? 'running',
    );
  }

  Duration remaining(DateTime now) {
    final elapsed = now.difference(startedAt).inSeconds;
    final remainingSeconds = targetSeconds - elapsed;
    return Duration(seconds: remainingSeconds);
  }
}
