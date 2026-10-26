import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/url_utils.dart';
import '../../../state/bookmarks_provider.dart';
import '../../../widgets/mint_button.dart';
import '../../../widgets/mint_text_field.dart';
import '../../../widgets/sheets.dart';
import '../../../widgets/toast.dart';

Future<void> showAddFavoriteSheet(BuildContext context, WidgetRef ref, {String url = '', String title = ''}) {
  return showMintSheet<void>(
    context,
    builder: (_) => _AddFavoriteForm(initialUrl: url, initialTitle: title),
  );
}

class _AddFavoriteForm extends ConsumerStatefulWidget {
  const _AddFavoriteForm({required this.initialUrl, required this.initialTitle});

  final String initialUrl;
  final String initialTitle;

  @override
  ConsumerState<_AddFavoriteForm> createState() => _AddFavoriteFormState();
}

class _AddFavoriteFormState extends ConsumerState<_AddFavoriteForm> {
  late final _name = TextEditingController(text: widget.initialTitle);
  late final _url = TextEditingController(text: widget.initialUrl);
  String? _urlError;
  String? _nameError;

  @override
  void dispose() {
    _name.dispose();
    _url.dispose();
    super.dispose();
  }

  void _save() {
    final raw = _url.text.trim();
    final name = _name.text.trim();
    setState(() {
      _urlError = UrlUtils.looksLikeUrl(raw) ? null : 'Enter a web address like example.com';
      _nameError = name.isEmpty ? 'Give it a short name' : null;
    });
    if (_urlError != null || _nameError != null) return;
    final url = raw.contains('://') ? raw : 'https://$raw';
    ref.read(bookmarksProvider.notifier).add(url, name, favorite: true);
    Navigator.of(context).pop();
    MintToast.show(context, title: 'Added to favorites', message: name, kind: ToastKind.success);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Add favorite', style: context.text.headlineSmall),
          const SizedBox(height: 4),
          Text('It appears on every new tab.', style: context.text.bodySmall),
          const SizedBox(height: 18),
          MintTextField(
            controller: _name,
            label: 'Name',
            hint: 'e.g. News',
            error: _nameError,
            autofocus: true,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          MintTextField(
            controller: _url,
            label: 'Web address',
            hint: 'example.com',
            error: _urlError,
            keyboardType: TextInputType.url,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _save(),
          ),
          const SizedBox(height: 22),
          MintButton(label: 'Save', onPressed: _save),
        ],
      ),
    );
  }
}
