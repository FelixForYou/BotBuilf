import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../core/format.dart';
import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/feedback.dart';
import '../widgets/page.dart';
import 'admin/admin_screen.dart';
import 'auth/auth_screen.dart';
import 'dashboard/keys_screen.dart';
import 'dashboard/orders_screen.dart';
import 'dashboard/pricing_screen.dart';
import 'dashboard/settings_screen.dart';
import 'dashboard/usage_screen.dart';
import 'guide_screen.dart';
import 'legal_screen.dart';
import 'onboarding_screen.dart';
import 'shell.dart';

/// Menu (drawer website / screenshot "Menu"): kuota, preferensi, panduan, legal.
class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final fx = Fx.of(context);
    final app = App.of(context);
    final go = ShellScope.of(context);
    return ValueListenableBuilder<User?>(
      valueListenable: app.me,
      builder: (context, me, _) => FxPage(
        title: 'Menu',
        onRefresh: me == null ? null : () => app.refreshMe().catchError((Object e) => toastError(e)),
        children: [
          if (me != null) ...[
            SectionLabel(
              'Request hari ini',
              top: 14,
              trailing: Text(
                '${fmtNum(me.quota?.used ?? 0)} of ${fmtNum(me.quota?.limit ?? 0)}',
                style: TextStyle(color: fx.mint, fontWeight: FontWeight.w600),
              ),
            ),
            FxCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SegmentBar(used: me.quota?.used ?? 0, limit: me.quota?.limit ?? 1, segments: 5),
                  const SizedBox(height: 10),
                  Text(
                    '${fmtNum(((me.quota?.limit ?? 0) - (me.quota?.used ?? 0)).clamp(0, 1 << 31))} request tersisa hari ini · reset ${fmtTimeWib(me.quota?.reset)} WIB',
                    style: TextStyle(color: fx.muted, fontSize: 13.5),
                  ),
                ],
              ),
            ),
            const SectionLabel('Akun'),
            ListGroup(
              children: [
                ListRow(icon: CupertinoIcons.square_grid_2x2, label: 'Dashboard', sub: me.email, onTap: () => go(Tabs.account)),
                ListRow(icon: CupertinoIcons.lock_shield, label: 'API Key', onTap: () => push(context, const KeysScreen())),
                ListRow(icon: CupertinoIcons.chart_bar, label: 'Statistik', onTap: () => push(context, const UsageScreen())),
                ListRow(icon: CupertinoIcons.doc_plaintext, label: 'Riwayat order', onTap: () => push(context, const OrdersScreen())),
                ListRow(icon: CupertinoIcons.gear, label: 'Pengaturan', onTap: () => push(context, const SettingsScreen())),
                if (me.isAdmin) ListRow(icon: CupertinoIcons.checkmark_shield, label: 'Panel admin', onTap: () => push(context, const AdminScreen())),
              ],
            ),
          ] else ...[
            const SizedBox(height: 14),
            FxCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Belum masuk', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text('Masuk untuk membuat API key, melihat kuota, dan statistik.', style: TextStyle(color: fx.muted)),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(child: FxButton('Masuk', onTap: () => push(context, const AuthScreen()))),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FxButton('Daftar', variant: BtnVariant.secondary, onTap: () => push(context, const AuthScreen(register: true))),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SectionLabel('Jelajahi'),
          ListGroup(
            children: [
              ListRow(icon: CupertinoIcons.house, label: 'Beranda', onTap: () => go(Tabs.home)),
              ListRow(icon: CupertinoIcons.book, label: 'Dokumentasi', onTap: () => go(Tabs.docs)),
              ListRow(icon: CupertinoIcons.chevron_left_slash_chevron_right, label: 'API Explorer', onTap: () => go(Tabs.explorer)),
              ListRow(
                icon: CupertinoIcons.square_grid_2x2,
                label: 'Kategori',
                onTap: () {
                  app.docsCategory.value = 'all';
                  go(Tabs.docs);
                },
              ),
              ListRow(icon: CupertinoIcons.creditcard, label: 'Paket & harga', onTap: () => push(context, const PricingScreen())),
            ],
          ),
          const SectionLabel('Bahasa & tampilan'),
          ListGroup(
            children: [
              const ListRow(icon: CupertinoIcons.globe, label: 'Bahasa', value: 'Indonesia', chevron: false),
              ValueListenableBuilder<ThemeMode>(
                valueListenable: app.themeMode,
                builder: (context, m, _) => ListRow(
                  icon: m == ThemeMode.dark ? CupertinoIcons.moon_fill : CupertinoIcons.sun_max_fill,
                  label: 'Tampilan',
                  value: m == ThemeMode.dark ? 'Gelap' : 'Terang',
                  onTap: () => app.setTheme(m == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark),
                ),
              ),
            ],
          ),
          const SectionLabel('Panduan'),
          ListGroup(
            children: [
              ListRow(icon: CupertinoIcons.compass, label: 'Ikuti tur', onTap: () => push(context, const OnboardingScreen(replay: true))),
              ListRow(
                icon: CupertinoIcons.sparkles,
                label: 'Fitur',
                onTap: () => push(context, const GuideScreen(section: 'features')),
              ),
              ListRow(
                icon: CupertinoIcons.question_circle,
                label: 'Cara kerja',
                onTap: () => push(context, const GuideScreen(section: 'how')),
              ),
              ListRow(
                icon: CupertinoIcons.doc_text,
                label: 'FAQ',
                onTap: () => push(context, const GuideScreen(section: 'faq')),
              ),
              ListRow(
                icon: CupertinoIcons.wrench,
                label: 'Tips & troubleshooting',
                onTap: () => push(context, const GuideScreen(section: 'tips')),
              ),
            ],
          ),
          const SectionLabel('Legal'),
          ListGroup(
            children: [
              ListRow(icon: CupertinoIcons.shield, label: 'Kebijakan Privasi', onTap: () => push(context, const LegalScreen(terms: false))),
              ListRow(icon: CupertinoIcons.doc_plaintext, label: 'Syarat Layanan', onTap: () => push(context, const LegalScreen(terms: true))),
            ],
          ),
          if (me != null) ...[
            const SizedBox(height: 22),
            ListGroup(
              children: [
                ListRow(
                  icon: CupertinoIcons.square_arrow_right,
                  label: 'Keluar',
                  sub: me.email,
                  danger: true,
                  onTap: () async {
                    final ok = await confirmSheet(context, title: 'Keluar?', text: 'Sesi di perangkat ini akan diakhiri.', confirm: 'Keluar');
                    if (ok) {
                      await app.logout();
                      toast('Kamu sudah keluar.', kind: ToastKind.info);
                    }
                  },
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
