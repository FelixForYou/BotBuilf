import 'package:flutter/material.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../widgets/common.dart';
import 'auth/auth_screen.dart';
import 'dashboard/dashboard_screen.dart';

/// Tab Akun: dashboard bila login, formulir masuk/daftar bila belum.
class AccountTab extends StatelessWidget {
  const AccountTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<User?>(
      valueListenable: App.of(context).me,
      builder: (context, me, _) => Swap(
        child: me == null ? const AuthScreen(key: ValueKey('auth'), embedded: true) : DashboardScreen(key: ValueKey('dash-${me.id}')),
      ),
    );
  }
}
