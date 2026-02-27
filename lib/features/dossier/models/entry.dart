class DossierEntry {
  DossierEntry({
    required this.id,
    required this.title,
    required this.body,
    required this.occurredAt,
    required this.createdAt,
    required this.updatedAt,
    required this.tags,
  });

  final String id;
  final String title;
  final String body;
  final DateTime occurredAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<String> tags;

  factory DossierEntry.fromJson(Map<String, dynamic> json) {
    return DossierEntry(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      body: json['body'] as String,
      occurredAt: DateTime.parse(json['occurred_at'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      tags: (json['tags'] as List? ?? []).map((e) => e.toString()).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'occurred_at': occurredAt.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'tags': tags,
    };
  }
}
