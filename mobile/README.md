# Retirement360 — cross-platform app (Flutter)

One Dart codebase for **Android, iOS, Windows, macOS, and web** — the "Frontend Apps"
box in the architecture diagram.

## Why Flutter
Native Windows/Mac/iOS/Android apps from a single codebase. (React Native / .NET MAUI
are alternatives; Flutter gives desktop + mobile + web from one source.)

## Prerequisites (this is the part a Windows dev machine alone can't fully cover)
- Install the Flutter SDK: https://docs.flutter.dev/get-started/install
- **Android**: Android Studio + Android SDK (works on Windows/Mac/Linux).
- **iOS**: requires **macOS + Xcode** — Apple does not allow iOS builds on Windows.
- **Windows desktop**: Visual Studio with the "Desktop development with C++" workload.
- **macOS desktop**: Xcode.

## First-time setup
This folder holds the app source (`lib/`, `pubspec.yaml`). Generate the platform
runner projects (android/, ios/, windows/, macos/, web/) once:

```bash
cd mobile
flutter create .          # creates the platform folders around the existing lib/
flutter pub get
```

## Run / build (point it at your backend)
```bash
# Android emulator (10.0.2.2 = host loopback)
flutter run --dart-define=API_BASE=http://10.0.2.2:8000/api

# Physical device / desktop — use your machine's LAN IP or the deployed URL
flutter run --dart-define=API_BASE=https://retire360.example.com/api

# Release builds
flutter build apk      --dart-define=API_BASE=https://retire360.example.com/api   # Android
flutter build ipa      --dart-define=API_BASE=...   # iOS (macOS only)
flutter build windows  --dart-define=API_BASE=...   # Windows .exe
flutter build macos    --dart-define=API_BASE=...   # macOS .app
```

The app calls the same FastAPI endpoints (`/api/plan`, `/api/chat`, …) as the web frontend.
