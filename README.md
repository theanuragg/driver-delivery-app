# Driver Delivery App

A functional Driver Delivery App built with React Native (Expo) and Firebase. This app handles authentication, delivery management, route optimisation, and push notifications.

## Features

- **Authentication**: Email/Password login + Mobile number OTP verification.
- **Deliveries Screen**: List of assigned deliveries with real-time updates from Firestore.
- **Optimised Route Screen**: 
  - Interactive map showing all delivery stops.
  - Route optimisation using a greedy nearest-neighbor algorithm.
  - Real-time re-optimisation when a stop is marked as delivered.
- **Push Notifications**: Integrated FCM handling for foreground, background, and killed states.
- **Local Testing Mode**: The app automatically switches to **Mock Mode** if Firebase credentials are not provided in the environment.

## Prerequisites

- Node.js (v18+)
- Expo Go app on your mobile device (for testing) or an Android Emulator.

## Setup Instructions

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    - Copy `.env.example` to `.env`.
    - (Optional) Fill in your Firebase credentials. If left blank, the app runs in **Mock Mode** for local testing.

3.  **Start the App**:
    ```bash
    npx expo start
    ```
    Scan the QR code with your Expo Go app or press `a` for Android Emulator.

## Local Testing Guide

### 1. Authentication
- **Login**: Use any email and password (e.g., `driver@test.com` / `password`).
- **Mobile**: Enter any 10-digit mobile number.
- **OTP**: Use the mock OTP code: **`123456`**.

### 2. Deliveries & Route
- Once logged in, you'll see a list of mock deliveries.
- Click **"Optimised Route"** to see the map and the efficient delivery order.
- Click the **Checkmark** next to a stop to mark it as delivered. The route will re-optimise automatically for the remaining stops.

### 3. Testing Push Notifications
Since real FCM requires a physical device and server-side setup, you can test the notification handling in the app using Expo's push notification tool:

1.  Go to [Expo Push Tool](https://expo.dev/notifications).
2.  Your push token will be logged in the console when the app starts.
3.  Enter the token and send a message.
4.  Tapping the notification will redirect you to the Deliveries screen.

## Project Structure

- `app/`: Expo Router screens and layouts.
- `src/lib/`: Firebase initialization and Mock Firebase implementation.
- `src/context/`: Auth state management.
- `src/components/`: Reusable UI components.
- `functions/`: Firebase Cloud Function source code for notification triggers.

## Deliverables Status
- [x] React Native source code — structured and runnable.
- [x] Firebase config via `.env.example`.
- [x] README.md with setup and test instructions.
- [ ] APK file (Requires `eas build -p android` - instructions in README).
- [ ] Video walkthrough (Not provided in this format).
