# FastTrack Driver Delivery Orchestration Platform

### Enterprise-Grade Senior Technical Documentation

The FastTrack Driver application is a high-performance, event-driven mobile platform engineered to handle real-time logistics, route optimization, and multi-factor authentication. This documentation provides a comprehensive architectural deep-dive for senior engineers and stakeholders to facilitate deployment, scaling, and maintenance.

---

## 1. Architectural Overview

### Modular Codebase Structure

The application adheres to a strict modular architecture that prioritizes separation of concerns and maintainability. The codebase is organized into domain-specific directories that decouple UI components from business logic and infrastructure adapters:

- **`app/` (Expo Router)**: Implements a file-based, URL-aware navigation system. The use of groups like `(auth)` and `(app)` provides native route guarding, ensuring the identity state is validated before accessing protected delivery orchestration logic.
- **`src/context/` (State Management)**: Centralizes global identity state using the React Context API. This acts as a single source of truth for the driver's session, managing transitions between unauthenticated, partially authenticated (MFA pending), and fully authorized states.
- **`src/lib/` (Infrastructure Adapters)**: Implements the Adapter pattern for external services. This allows the application to swap between a live Firebase instance and a local mock service seamlessly, significantly reducing the cost of integration testing.
- **`components/` (UI/UX Layer)**: Follows an atomic design philosophy. Components are split between domain-neutral primitives and domain-specific molecules like `DeliveryCard`, which encapsulate complex interaction logic like "Slide-to-Confirm."

### Navigation Flow & State Strategy

Navigation is managed as a state machine. Upon app initialization, the `RootLayout` observes the `AuthContext` to determine the initial route. If no valid session exists, the driver is funneled into the `(auth)` group. Successful authentication triggers a transition to the `(app)` group. Within the app, state is primarily reactive; `onSnapshot` listeners in `DeliveriesScreen` ensure that the UI is an eventual-consistency reflection of the Firestore database.

### Build Configuration

The project utilizes **Expo SDK 54** with **EAS (Expo Application Services)** for production builds. This hybrid approach allows for rapid development using the Expo Go environment while maintaining the ability to generate customized prebuilds for native modules like `react-native-maps` and `expo-notifications`.

---

## 2. Environment Configuration (.env.example)

The application relies on several environment-specific variables. To maintain security, actual credentials must never be committed to version control. Below is the template for `.env.example`, which should be copied to `.env` and populated with real project values.

```bash
# --- FIREBASE CORE CONFIGURATION ---
# Obtain these from your Firebase Console -> Project Settings -> General -> Your Apps
FIREBASE_API_KEY=AIzaSy...           # Web API Key for authentication and SDK initialization
FIREBASE_AUTH_DOMAIN=driver-app.firebaseapp.com
FIREBASE_PROJECT_ID=driver-app-123   # Unique identifier for your Firebase project
FIREBASE_STORAGE_BUCKET=driver-app-123.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567 # Required for FCM push notification routing
FIREBASE_APP_ID=1:1234567:web:abc...  # Specific ID for the React Native client

# --- GOOGLE MAPS CONFIGURATION ---
# Obtain from Google Cloud Console -> APIs & Services -> Credentials
# Ensure Directions API, Distance Matrix API, and Maps SDK for Android/iOS are enabled.
GOOGLE_MAPS_API_KEY=AIzaSy...        # Key for road-aware routing and polyline rendering

# --- DEVELOPMENT FLAGS ---
# Set to "true" to connect to local Firebase Emulators instead of production
EXPO_PUBLIC_USE_EMULATORS=false
```

---

## 3. End-to-End Setup Guide

### Environment Preparation

1. **Node.js**: Ensure you are using Node.js 18 (LTS) or later.
2. **Global CLI**: Install the EAS CLI: `npm install -g eas-cli`.
3. **Firebase Project**: Create a new project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Email/Password** in Authentication.
   - Create a **Firestore** database in test mode.
   - Register an Android/iOS app to obtain the configuration variables.

### Dependency Installation

Clone the repository and install dependencies using npm:

```bash
npm install
```

### Device & Emulator Configuration

- **Android**: Launch an AVD via Android Studio. Ensure "Google Play Services" is included in the image.
- **iOS**: Launch a simulator via Xcode. Note that push notifications require a physical device or a simulator running on macOS 13+ with an Apple Silicon chip.

### Triggering a Test Notification

1. **Start the Notification Worker**:
   ```bash
   npm run worker
   ```
2. **Execute the Payload**:
   In a separate terminal, use `curl` to send a simulated FCM event to the local worker:
   ```bash
   curl -X POST http://localhost:3001/notifications \
     -H "Content-Type: application/json" \
     -d '{
       "title": "New Assignment",
       "body": "You have a new delivery at Pier 39",
       "driverId": "current-user-uid",
       "data": { "orderId": "ORD-777", "deliveryId": "DEL-999" }
     }'
   ```

---

## 4. Production APK Generation

### Signing Key Creation

Before building, you must generate a secure keystore for Android app signing. This should be kept private and backed up securely.

```bash
keytool -genkey -v -keystore release.keystore -alias driver-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Build Variants & Gradle Configuration

The project is configured to support multiple build variants (development, preview, production). These are managed via `eas.json`.

### Build Execution

To generate a production-ready APK for sideloading:

1. **Configure Build Profile**: Ensure `eas.json` has a profile with `distribution: internal`.
2. **Run EAS Build**:
   ```bash
   eas build --platform android --profile preview
   ```
3. **Download & Sideload**: Once the build completes on the EAS servers, a URL will be provided. Download the `.apk` file and transfer it to your Android device for installation.

### CI/CD Integration (Extension Point)

For enterprise scale, this process should be automated via **GitHub Actions** or **Fastlane**.

- **GitHub Actions**: Use the `expo/expo-github-action` to trigger EAS builds on every merge to `main`.
- **Fastlane**: Implement `match` for credential management and `supply` to automatically upload successful builds to the Google Play Console Internal Track.

---

_This documentation is maintained by the Engineering Leadership team. For troubleshooting pathways or architectural clarifications, please refer to the internal technical wiki._
