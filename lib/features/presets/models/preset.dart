class ControlSpec {
  ControlSpec({
    required this.id,
    required this.type,
    required this.label,
    this.min,
    this.max,
    this.step,
    this.value,
    this.options,
  });

  final String id;
  final String type;
  final String label;
  final double? min;
  final double? max;
  final double? step;
  final dynamic value;
  final List<String>? options;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'label': label,
      if (min != null) 'min': min,
      if (max != null) 'max': max,
      if (step != null) 'step': step,
      if (value != null) 'value': value,
      if (options != null) 'options': options,
    };
  }

  factory ControlSpec.fromJson(Map<String, dynamic> json) {
    return ControlSpec(
      id: json['id'] as String,
      type: json['type'] as String,
      label: json['label'] as String,
      min: (json['min'] as num?)?.toDouble(),
      max: (json['max'] as num?)?.toDouble(),
      step: (json['step'] as num?)?.toDouble(),
      value: json['value'],
      options: (json['options'] as List?)?.map((e) => e.toString()).toList(),
    );
  }
}

class PresetSettings {
  PresetSettings({required this.controls, required this.haptics, required this.animation, this.version = 1});

  final int version;
  final List<ControlSpec> controls;
  final Map<String, dynamic> haptics;
  final Map<String, dynamic> animation;

  Map<String, dynamic> toJson() {
    return {
      'version': version,
      'controls': controls.map((c) => c.toJson()).toList(),
      'haptics': haptics,
      'animation': animation,
    };
  }

  factory PresetSettings.fromJson(Map<String, dynamic> json) {
    return PresetSettings(
      version: json['version'] as int? ?? 1,
      controls: (json['controls'] as List)
          .map((c) => ControlSpec.fromJson(Map<String, dynamic>.from(c as Map)))
          .toList(),
      haptics: Map<String, dynamic>.from(json['haptics'] as Map? ?? {}),
      animation: Map<String, dynamic>.from(json['animation'] as Map? ?? {}),
    );
  }
}

class TapForgePreset {
  TapForgePreset({
    required this.id,
    required this.name,
    required this.settings,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final PresetSettings settings;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory TapForgePreset.fromJson(Map<String, dynamic> json) {
    return TapForgePreset(
      id: json['id'] as String,
      name: json['name'] as String,
      settings: PresetSettings.fromJson(Map<String, dynamic>.from(json['settings'] as Map)),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'settings': settings.toJson(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
