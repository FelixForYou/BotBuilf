import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/url_utils.dart';
import '../../data/models/app_settings.dart';
import '../../state/settings_provider.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/mint_text_field.dart';
import '../../widgets/site_icon.dart';
import '../../widgets/toast.dart';

class SearchEngineScreen extends ConsumerStatefulWidget {
  const SearchEngineScreen({super.key});

  @override
  ConsumerState<SearchEngineScreen> createState() => _SearchEngineScreenState();
}

class _SearchEngineScreenState extends ConsumerState<SearchEngineScreen> {
  late final _custom = TextEditingController(text: ref.read(settingsProvider).customSearchTemplate);
  String? _error;

  @override
  void dispose() {
    _custom.dispose();
    super.dispose();
  }

  void _select(SearchEngine e) {
    if (e == SearchEngine.custom && !UrlUtils.isValidTemplate(_custom.text)) {
      setState(() {});
      return;
    }
    ref.read(settingsProvider.notifier).update((s) => s.copyWith(searchEngine: e));
  }

  void _saveCustom() {
    final t = _custom.text.trim();
    if (!UrlUtils.isValidTemplate(t)) {
      setState(() => _error = 'Use a full https:// address with %s where the search terms go.');
      return;
    }
    setState(() => _error = null);
    FocusScope.of(context).unfocus();
    ref
        .read(settingsProvider.notifier)
        .update((s) => s.copyWith(customSearchTemplate: t, searchEngine: SearchEngine.custom));
    MintToast.show(context, title: 'Custom search engine saved', kind: ToastKind.success);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final current = ref.watch(settingsProvider.select((s) => s.searchEngine));
    return Scaffold(
      appBar: const MintTopBar(title: 'Search engine'),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          ContentWidth(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionLabel('Used for the address bar'),
                GroupedCard(children: [
                  for (final e in SearchEngine.values.where((e) => e != SearchEngine.custom))
                    GroupedTile(
                      leading: SiteIcon(url: e.template.replaceAll('%s', ''), size: 36, radius: 18),
                      title: e.label,
                      subtitle: UrlUtils.host(e.template),
                      trailing: _Check(selected: current == e),
                      onTap: () => _select(e),
                    ),
                ]),
                const SectionLabel('Custom'),
                MintTextField(
                  controller: _custom,
                  label: 'Search URL',
                  hint: 'https://example.com/search?q=%s',
                  error: _error,
                  keyboardType: TextInputType.url,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _saveCustom(),
                  onChanged: (_) {
                    if (_error != null) setState(() => _error = null);
                  },
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        current == SearchEngine.custom ? 'Custom engine is in use.' : '%s is replaced by your search.',
                        style: context.text.labelMedium?.copyWith(
                          color: current == SearchEngine.custom ? c.accentInk : c.textSecondary,
                        ),
                      ),
                    ),
                    MintButton(label: 'Use custom', expand: false, height: 46, onPressed: _saveCustom),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Check extends StatelessWidget {
  const _Check({super.key, required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    return AnimatedContainer(
      duration: Motion.quick,
      curve: Motion.emphasized,
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: selected ? c.accent : Colors.transparent,
        shape: BoxShape.circle,
        border: Border.all(color: selected ? c.accent : c.divider, width: 2),
      ),
      child: AnimatedScale(
        duration: Motion.quick,
        scale: selected ? 1 : 0,
        child: Icon(LucideIcons.check, size: 15, color: c.onAccent),
      ),
    );
  }
}

/// Radio indicator reused by other settings pages.
class SelectionCheck extends _Check {
  const SelectionCheck({super.key, required super.selected});
}
