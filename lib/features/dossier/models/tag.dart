class DossierTag {
  DossierTag({required this.id, required this.name});

  final String id;
  final String name;

  factory DossierTag.fromJson(Map<String, dynamic> json) {
    return DossierTag(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}
