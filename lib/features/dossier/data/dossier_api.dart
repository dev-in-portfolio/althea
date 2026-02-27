import '../../../core/api_client.dart';
import '../models/entry.dart';
import '../models/tag.dart';

class DossierApi {
  DossierApi(this.client);

  final ApiClient client;

  Future<List<DossierEntry>> listEntries({String? cursor, String? q, String? tag, String? from, String? to}) async {
    final res = await client.get('/api/dossier/entries', query: {
      if (cursor != null) 'cursor': cursor,
      if (q != null && q.isNotEmpty) 'q': q,
      if (tag != null && tag.isNotEmpty) 'tag': tag,
      if (from != null) 'from': from,
      if (to != null) 'to': to,
    });
    final data = res.data as List<dynamic>;
    return data.map((row) => DossierEntry.fromJson(Map<String, dynamic>.from(row as Map))).toList();
  }

  Future<DossierEntry> createEntry(String body, {String title = '', DateTime? occurredAt, List<String>? tags}) async {
    final res = await client.post('/api/dossier/entries', data: {
      'title': title,
      'body': body,
      'occurredAt': occurredAt?.toIso8601String(),
      'tags': tags ?? [],
    });
    return DossierEntry.fromJson(Map<String, dynamic>.from(res.data as Map));
  }

  Future<DossierEntry> updateEntry(String id, {String? title, String? body, DateTime? occurredAt, List<String>? tags}) async {
    final res = await client.patch('/api/dossier/entries/$id', data: {
      if (title != null) 'title': title,
      if (body != null) 'body': body,
      if (occurredAt != null) 'occurredAt': occurredAt.toIso8601String(),
      if (tags != null) 'tags': tags,
    });
    return DossierEntry.fromJson(Map<String, dynamic>.from(res.data as Map));
  }

  Future<void> deleteEntry(String id) async {
    await client.delete('/api/dossier/entries/$id');
  }

  Future<List<DossierTag>> listTags() async {
    final res = await client.get('/api/dossier/tags');
    final data = res.data as List<dynamic>;
    return data.map((row) => DossierTag.fromJson(Map<String, dynamic>.from(row as Map))).toList();
  }
}
