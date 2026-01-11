import 'package:agrisight/router.dart';
import 'package:agrisight/theme/theme_provider.dart';
import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await themeProvider.initialize();
  runApp(const AgriSightApp());
}

class AgriSightApp extends StatefulWidget {
  const AgriSightApp({super.key});

  @override
  State<AgriSightApp> createState() => _AgriSightAppState();
}

class _AgriSightAppState extends State<AgriSightApp> {
  @override
  void initState() {
    super.initState();
    themeProvider.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    themeProvider.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return ShadApp.router(
      title: 'AgriSight',
      routerConfig: router,
      themeMode: themeProvider.themeMode,
      theme: ShadThemeData(
        brightness: Brightness.light,
        colorScheme: const ShadZincColorScheme.light(),
      ),
      darkTheme: ShadThemeData(
        brightness: Brightness.dark,
        colorScheme: const ShadZincColorScheme.dark(),
      ),
      builder: (context, child) {
        return AnimatedTheme(
          data: themeProvider.isDarkMode
              ? ThemeData.dark()
              : ThemeData.light(),
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
