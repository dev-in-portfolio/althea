class Preset {
  Preset({
    required this.id,
    required this.name,
    required this.seconds,
    required this.soundProfile,
    required this.hapticProfile,
    required this.createdAt,
  });

  final String id;
  final String name;
  final int seconds;
  final String soundProfile;
  final String hapticProfile;
  final DateTime createdAt;

  factory Preset.fromJson(Map<String, dynamic> json) {
    return Preset(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      seconds: json['seconds'] as int? ?? 0,
      soundProfile: json['sound_profile'] as String? ?? 'default',
      hapticProfile: json['haptic_profile'] as String? ?? 'default',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
