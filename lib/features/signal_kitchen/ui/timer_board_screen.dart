import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:signal_kitchen/features/signal_kitchen/data/sk_api.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/preset.dart';
import 'package:signal_kitchen/features/signal_kitchen/models/timer_run.dart';
import 'package:signal_kitchen/features/signal_kitchen/ui/line_view_widget.dart';
import 'package:signal_kitchen/features/signal_kitchen/ui/preset_manager_screen.dart';
import 'package:signal_kitchen/features/signal_kitchen/ui/run_history_screen.dart';
import 'package:signal_kitchen/features/signal_kitchen/ui/timer_card.dart';

class TimerBoardScreen extends StatefulWidget {
  const TimerBoardScreen({super.key, required this.api});

  final SkApi api;

  @override
  State<TimerBoardScreen> createState() => _TimerBoardScreenState();
}

class _TimerBoardScreenState extends State<TimerBoardScreen> {
  static const _tabStorageKey = 'sk_last_tab';
  List<TimerRun> _running = [];
  List<TimerRun> _history = [];
  List<Preset> _presets = [];
  bool _loading = true;
  int _tabIndex = 0;
  DateTime _now = DateTime.now();
  Timer? _ticker;
  Timer? _refreshTimer;
  bool _wakeLockEnabled = false;

  @override
  void initState() {
    super.initState();
    _restoreTab();
    _loadAll();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _now = DateTime.now());
    });
    _refreshTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      _loadRuns();
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _refreshTimer?.cancel();
    _applyWakelock(false);
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    await Future.wait([_loadPresets(), _loadRuns()]);
    setState(() => _loading = false);
  }

  Future<void> _restoreTab() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getInt(_tabStorageKey);
    if (stored != null && stored >= 0 && stored <= 3) {
      setState(() => _tabIndex = stored);
    }
  }

  Future<void> _storeTab(int index) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_tabStorageKey, index);
  }

  Future<void> _loadRuns() async {
    final running = await widget.api.fetchRuns(status: 'running');
    final history = await widget.api.fetchRuns(status: 'done', limit: 200);
    setState(() {
      _running = running;
      _history = history;
    });
    _applyWakelock(running.isNotEmpty);
  }

  Future<void> _loadPresets() async {
    final presets = await widget.api.fetchPresets();
    setState(() => _presets = presets);
  }

  Future<void> _stopRun(TimerRun run, String status) async {
    await widget.api.stopRun(id: run.id, status: status);
    await _loadRuns();
  }

  void _applyWakelock(bool enabled) {
    if (_wakeLockEnabled == enabled) return;
    _wakeLockEnabled = enabled;
    if (enabled) {
      WakelockPlus.enable();
    } else {
      WakelockPlus.disable();
    }
  }

  void _showLimitMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Max 12 running timers reached.'),
      ),
    );
  }

  Future<void> _startRun() async {
    final result = await showModalBottomSheet<_StartRunPayload>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _StartRunSheet(presets: _presets),
    );
    if (result == null) return;
    try {
      await widget.api.startRun(
        presetId: result.presetId,
        label: result.label,
        targetSeconds: result.targetSeconds,
      );
      await _loadRuns();
    } catch (err) {
      _showLimitMessage();
    }
  }

  Widget _buildBoard() {
    if (_running.isEmpty) {
      return const Center(child: Text('No active timers.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final run = _running[index];
        return TimerCard(
          run: run,
          now: _now,
          onStop: () => _stopRun(run, 'done'),
          onCancel: () => _stopRun(run, 'canceled'),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemCount: _running.length,
    );
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      _buildBoard(),
      LineViewWidget(runs: _running, now: _now),
      RunHistoryScreen(runs: _history),
      PresetManagerScreen(api: widget.api),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Signal Kitchen'),
        actions: [
          if (_running.isNotEmpty)
            Icon(
              _wakeLockEnabled ? Icons.bolt : Icons.bolt_outlined,
              size: 18,
            ),
          IconButton(
            onPressed: _loadAll,
            icon: const Icon(Icons.refresh),
          )
        ],
      ),
      body: _loading ? const Center(child: CircularProgressIndicator()) : tabs[_tabIndex],
      floatingActionButton: _tabIndex == 0
          ? FloatingActionButton.extended(
              onPressed: _startRun,
              label: const Text('Start timer'),
              icon: const Icon(Icons.add),
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tabIndex,
        onTap: (value) {
          setState(() => _tabIndex = value);
          _storeTab(value);
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.timer_outlined),
            label: 'Board',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt_outlined),
            label: 'Line',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'History',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.tune),
            label: 'Presets',
          ),
        ],
      ),
    );
  }
}

class _StartRunPayload {
  const _StartRunPayload({
    required this.targetSeconds,
    required this.presetId,
    required this.label,
  });

  final int targetSeconds;
  final String? presetId;
  final String? label;
}

class _StartRunSheet extends StatefulWidget {
  const _StartRunSheet({required this.presets});

  final List<Preset> presets;

  @override
  State<_StartRunSheet> createState() => _StartRunSheetState();
}

class _StartRunSheetState extends State<_StartRunSheet> {
  final TextEditingController _labelController = TextEditingController();
  final TextEditingController _secondsController = TextEditingController();
  Preset? _selectedPreset;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        top: 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Start timer',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<Preset>(
            value: _selectedPreset,
            items: [
              const DropdownMenuItem<Preset>(
                value: null,
                child: Text('Custom timer'),
              ),
              ...widget.presets.map(
                (preset) => DropdownMenuItem(
                  value: preset,
                  child: Text('${preset.name} (${preset.seconds}s)'),
                ),
              ),
            ],
            onChanged: (value) => setState(() => _selectedPreset = value),
            decoration: const InputDecoration(
              labelText: 'Preset',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _labelController,
            decoration: const InputDecoration(
              labelText: 'Label (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _secondsController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Seconds',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton(
              onPressed: () {
                final preset = _selectedPreset;
                final seconds = preset?.seconds ??
                    int.tryParse(_secondsController.text.trim()) ??
                    0;
                if (seconds < 1) return;
                Navigator.of(context).pop(
                  _StartRunPayload(
                    targetSeconds: seconds,
                    presetId: preset?.id,
                    label: _labelController.text.trim().isEmpty
                        ? null
                        : _labelController.text.trim(),
                  ),
                );
              },
              child: const Text('Start'),
            ),
          ),
        ],
      ),
    );
  }
}
