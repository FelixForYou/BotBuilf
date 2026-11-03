import 'package:flutter/cupertino.dart';

/// Ikon kategori (components/category-icon.tsx → lucide download/sparkles/image/smile/wrench).
IconData categoryIcon(String id) => switch (id) {
  'downloader' => CupertinoIcons.cloud_download,
  'ai' => CupertinoIcons.sparkles,
  'ai-image' => CupertinoIcons.photo,
  'entertainment' => CupertinoIcons.smiley,
  'tools' => CupertinoIcons.wrench,
  _ => CupertinoIcons.square_grid_2x2,
};
