import 'package:flutter/material.dart';
import 'core/api_client.dart';
import 'features/dossier/data/dossier_api.dart';
import 'features/dossier/ui/timeline_screen.dart';

void main() {
  runApp(const PocketDossierApp());
}

class PocketDossierApp extends StatelessWidget {
  const PocketDossierApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = DossierApi(ApiClient(baseUrl: 'http://localhost:4001'));
    return MaterialApp(
      title: 'Pocket Dossier',
      theme: ThemeData.dark(useMaterial3: true),
      home: TimelineScreen(api: api),
    );
  }
}
