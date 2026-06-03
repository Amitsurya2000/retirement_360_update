// Retirement360 — cross-platform client (Flutter). Single codebase targets
// iOS, Android, Windows, macOS, and web. Talks to the FastAPI backend.
//
// Point it at your backend with:  flutter run --dart-define=API_BASE=http://10.0.2.2:8000/api
// (10.0.2.2 is the host loopback from the Android emulator; use your LAN IP on a device.)
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

const apiBase = String.fromEnvironment('API_BASE', defaultValue: 'http://10.0.2.2:8000/api');

void main() => runApp(const Retire360App());

class Retire360App extends StatelessWidget {
  const Retire360App({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Retirement360',
      theme: ThemeData(colorSchemeSeed: const Color(0xFF0F766E), useMaterial3: true),
      home: const PlanScreen(),
    );
  }
}

class PlanScreen extends StatefulWidget {
  const PlanScreen({super.key});
  @override
  State<PlanScreen> createState() => _PlanScreenState();
}

class _PlanScreenState extends State<PlanScreen> {
  final _age = TextEditingController(text: '60');
  final _corpus = TextEditingController(text: '10000000');
  final _income = TextEditingController(text: '80000');
  String _risk = 'moderate';
  Map<String, dynamic>? _plan;
  String? _error;
  bool _loading = false;

  Future<void> _generate() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await http.post(
        Uri.parse('$apiBase/plan'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'age': int.parse(_age.text),
          'corpus': double.parse(_corpus.text),
          'desired_monthly_income': double.parse(_income.text),
          'risk_appetite': _risk,
        }),
      );
      if (res.statusCode == 200) {
        setState(() => _plan = jsonDecode(res.body) as Map<String, dynamic>);
      } else {
        setState(() => _error = 'HTTP ${res.statusCode}: ${res.body}');
      }
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _loading = false);
    }
  }

  String _inr(num n) => n >= 1e7
      ? '₹${(n / 1e7).toStringAsFixed(2)} Cr'
      : n >= 1e5
          ? '₹${(n / 1e5).toStringAsFixed(2)} L'
          : '₹${n.round()}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Retirement360'), backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: _age, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Age')),
          TextField(controller: _corpus, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Corpus (₹)')),
          TextField(controller: _income, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Desired monthly income (₹)')),
          const SizedBox(height: 8),
          DropdownButton<String>(
            value: _risk,
            isExpanded: true,
            items: const [
              DropdownMenuItem(value: 'conservative', child: Text('Conservative')),
              DropdownMenuItem(value: 'moderate', child: Text('Moderate')),
              DropdownMenuItem(value: 'balanced', child: Text('Balanced')),
            ],
            onChanged: (v) => setState(() => _risk = v!),
          ),
          const SizedBox(height: 12),
          FilledButton(onPressed: _loading ? null : _generate, child: Text(_loading ? 'Calculating…' : 'Generate plan')),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red))),
          if (_plan != null) ..._buildPlan(),
        ],
      ),
    );
  }

  List<Widget> _buildPlan() {
    final p = _plan!;
    final summary = p['summary'] as Map<String, dynamic>;
    final buckets = p['buckets'] as List<dynamic>;
    return [
      const SizedBox(height: 20),
      Text('Blended return: ${(p['blended_return'] as num).toStringAsFixed(2)}%', style: const TextStyle(fontWeight: FontWeight.bold)),
      Text('Year-1 net income: ${_inr(summary['monthly_income_year1'] as num)}/mo'),
      Text(p['shortfall_year'] == null ? 'Sustainable for the full horizon ✅' : 'Corpus runs out at year ${p['shortfall_year']} ⚠'),
      const SizedBox(height: 12),
      for (final b in buckets)
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${b['name']} (${b['years_covered']}) — ${_inr(b['amount'] as num)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                for (final i in (b['instruments'] as List<dynamic>))
                  Text('• ${i['name']}: ${_inr(i['amount'] as num)} @ ${i['expected_return']}%'),
              ],
            ),
          ),
        ),
    ];
  }
}
