import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/url_utils.dart';
import '../../state/bookmarks_provider.dart';
import '../../state/history_provider.dart';
import '../../state/settings_provider.dart';
import '../../widgets/grouped_list.dart';
import '../../widgets/headers.dart';
import '../../widgets/mint_button.dart';
import '../../widgets/site_icon.dart';

class _Suggestion {
  const _Suggestion(this.url, this.title, this.icon);
  final String url;
  final String title;
  final IconData icon;
}

/// Address entry with live suggestions. Pops with the text to load.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key, this.initial = ''});

  final String initial;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _controller = TextEditingController(text: widget.initial)
    ..selection = TextSelection(baseOffset: 0, extentOffset: widget.initial.length);
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _submit(String value) {
    final v = value.trim();
    if (v.isEmpty) return;
    HapticFeedback.selectionClick();
    Navigator.of(context).pop(v);
  }

  List<_Suggestion> _suggestions(String q) {
    final query = q.trim().toLowerCase();
    final bookmarks = ref.read(bookmarksProvider);
    final history = ref.read(historyProvider);
    final out = <_Suggestion>[];
    final seen = <String>{};
    void add(String url, String title, IconData icon) {
      if (out.length >= 8 || !seen.add(normalizeUrl(url))) return;
      out.add(_Suggestion(url, title, icon));
    }

    bool matches(String url, String title) =>
        query.isEmpty || url.toLowerCase().contains(query) || title.toLowerCase().contains(query);

    for (final b in bookmarks) {
      if (matches(b.url, b.title)) add(b.url, b.title, LucideIcons.star);
    }
    for (final h in history) {
      if (matches(h.url, h.title)) add(h.url, h.title, LucideIcons.clock);
    }
    return out;
  }

  @override
  Widget build(BuildContext context) {
    final c = context.mint;
    final text = _controller.text;
    final settings = ref.watch(settingsProvider);
    final isUrl = UrlUtils.looksLikeUrl(text);
    final suggestions = _suggestions(text == widget.initial ? '' : text);

    return Scaffold(
      body: SafeArea(
        child: ContentWidth(
          padding: 0,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 48,
                        padding: const EdgeInsets.only(left: 14, right: 6),
                        decoration: BoxDecoration(
                          color: c.elevated,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: c.accent, width: 1.5),
                        ),
                        child: Row(
                          children: [
                            Icon(LucideIcons.search, size: 18, color: c.textSecondary),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _controller,
                                focusNode: _focus,
                                autofocus: true,
                                keyboardType: TextInputType.url,
                                textInputAction: TextInputAction.go,
                                autocorrect: false,
                                enableSuggestions: false,
                                onSubmitted: _submit,
                                style: context.text.bodyLarge,
                                decoration: InputDecoration(
                                  isDense: true,
                                  border: InputBorder.none,
                                  hintText: 'Search or type URL',
                                  hintStyle: context.text.bodyLarge?.copyWith(color: c.textSecondary),
                                ),
                              ),
                            ),
                            if (text.isNotEmpty)
                              MintIconButton(
                                icon: LucideIcons.circleX,
                                size: 36,
                                iconSize: 18,
                                color: c.textSecondary,
                                tooltip: 'Clear',
                                onPressed: () => _controller.clear(),
                              ),
                          ],
                        ),
                      ),
                    ),
                    MintTextButton(
                      label: 'Cancel',
                      color: c.textPrimary,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  children: [
                    AnimatedSize(
                      duration: Motion.quick,
                      curve: Motion.emphasized,
                      child: text.trim().isEmpty || text == widget.initial
                          ? const SizedBox(width: double.infinity)
                          : GroupedCard(children: [
                              GroupedTile(
                                icon: isUrl ? LucideIcons.globe : LucideIcons.search,
                                title: isUrl ? text.trim() : '“${text.trim()}”',
                                subtitle: isUrl ? 'Open this address' : 'Search with ${settings.searchEngine.label}',
                                trailing: Icon(LucideIcons.arrowRight, size: 18, color: c.accentInk),
                                onTap: () => _submit(text),
                              ),
                            ]),
                    ),
                    if (suggestions.isNotEmpty) ...[
                      SectionLabel(text.trim().isEmpty || text == widget.initial ? 'Suggested' : 'Matches'),
                      GroupedCard(children: [
                        for (final s in suggestions)
                          GroupedTile(
                            leading: SiteIcon(url: s.url, size: 34, radius: 17),
                            title: s.title.isEmpty ? UrlUtils.display(s.url) : s.title,
                            subtitle: UrlUtils.display(s.url),
                            trailing: GestureDetector(
                              behavior: HitTestBehavior.opaque,
                              onTap: () {
                                _controller.text = s.url;
                                _controller.selection = TextSelection.collapsed(offset: s.url.length);
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(6),
                                child: Icon(LucideIcons.arrowUpLeft, size: 18, color: c.textSecondary),
                              ),
                            ),
                            onTap: () => _submit(s.url),
                          ),
                      ]),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
