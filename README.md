# FastTrack Driver: Senior Technical Assessment

### A production-aware delivery orchestration engine built with React Native and Firebase.

---

## What this is

- **Event-Driven Authentication**: Secure multi-factor flow starting with Firebase Email/Password, followed by an asynchronous mobile OTP verification step persisted via `AsyncStorage` and Firestore.
- **Real-Time Delivery Synchronization**: Reactive delivery dashboard powered by Firestore `onSnapshot` listeners, ensuring the driver’s view is always a reflection of the current system state without manual polling.
- **Algorithmic Route Optimization**: Heuristic-based routing using a greedy nearest-neighbor approach, integrated with the Google Directions API for road-aware navigation and traffic-compliant polylines.
- **Resilient Notification Pipeline**: Integrated push notification handling using `expo-notifications`, featuring a decoupled development worker to simulate FCM payloads in restricted environments.
- **Atomic Status Transitions**: State-machine guarded delivery lifecycle, allowing drivers to transition orders from `pending` to `delivered` via high-intent gestures (Slide-to-Confirm).

---

## Architecture overview

The system follows a decoupled service architecture, ensuring that the UI layer remains agnostic of the underlying data source (Mock vs. Real Firebase).

```ascii
      ┌────────────────┐          ┌─────────────────────────┐
      │  React Native  │          │    Firebase Service     │
      │   Components   │◄─────────┤   (Firestore / Auth)    │
      └───────┬────────┘          └────────────┬────────────┘
              │                                │
      ┌───────▼────────┐          ┌────────────▼────────────┐
      │  Auth Context  │          │    Google Maps API      │
      │ (Global State) │◄─────────┤   (Directions/Routing)  │
      └───────┬────────┘          └────────────┬────────────┘
              │                                │
      ┌───────▼────────┐          ┌────────────▼────────────┐
      │  Local Storage │          │   Notification Worker   │
      │ (AsyncStorage) │◄─────────┤     (Express.js)        │
      └────────────────┘          └─────────────────────────┘
```

---

## Project structure

```bash
driver/
├── app/                      # Expo Router file-based navigation tree
│   ├── (app)/                # Protected delivery orchestration group
│   │   ├── index.tsx         # Delivery dashboard: O(n) list with real-time sync
│   │   ├── map.tsx           # Optimization engine: Route calculation & MapView
│   │   ├── details.tsx       # Order detail: Atomic status management & editing
│   │   └── profile.tsx       # Driver identity & session management
│   ├── (auth)/               # Unauthenticated onboarding group
│   │   ├── login.tsx         # Identity verification entry point
│   │   ├── mobile.tsx        # MFA: Mobile number capture
│   │   └── otp.tsx           # MFA: OTP verification logic
│   └── _layout.tsx           # Global provider orchestration & route guarding
├── src/
│   ├── context/
│   │   └── AuthContext.tsx   # Global state: Single source of truth for identity
│   ├── lib/
│   │   ├── firebase.ts       # Adapter pattern: Decoupled Firebase interface
│   │   ├── mockFirebase.ts   # Local development data & mock methods
│   │   └── notifications.ts  # Push notification registration & handling
├── components/               # Atomic & Molecular UI components
│   ├── custom/               # Domain-specific components (DeliveryCard, StatusPill)
│   └── ui/                   # Shared primitive components
├── constants/
│   └── theme.ts              # Design system: Typography, Palette, Spacing
└── scripts/
    └── dev-worker.js         # Simulated FCM backend for local verification
```

---

## Technology decisions

### **Expo Router (File-based Navigation)**

Chosen over `React Navigation` (Object-based) to leverage a more scalable, URL-aware routing system. It eliminates the maintenance overhead of large navigation configuration objects and provides out-of-the-box support for deep linking, which is critical for tapping push notifications directly into specific delivery details. At scale, this prevents "navigation state bloat" as the app grows to hundreds of screens.

### **React Context (Global State)**

The `AuthContext` was chosen over `Redux` or `Zustand` because the application’s global state requirements are currently limited to authentication and driver identity. Context provides a native, low-boilerplate solution that avoids the complexity of external state managers while maintaining a clean "Single Source of Truth." If the app were to introduce complex offline caching or massive global data manipulation, we would transition to `Zustand` for its optimized selector-based re-renders.

### **Firebase (Real-time DB & Auth)**

Chosen because it eliminates the need for a custom WebSocket implementation. The `onSnapshot` listener provides a reactive data flow that is inherently difficult to replicate with traditional REST APIs without introducing significant latency or polling overhead. At production scale, we would introduce a Cloud Function middleware to gate Firestore writes, moving away from direct client-side SDK writes for enhanced security.

### **Google Directions API**

Utilized to bridge the gap between "as the crow flies" straight lines and real-world road networks. While standard `Polyline` components are easy to implement, road-aware routing is essential for driver trust and accurate ETA calculations.

---

## State management

The application employs a **Single Source of Truth** pattern via `AuthContext`. We manage the user's session as a state machine:

- `Loading`: App initialization and session recovery.
- `Unauthenticated`: Identity unknown, restricted to the `(auth)` group.
- `Authenticated (Partial)`: Email verified but MFA (Mobile) pending.
- `Authenticated (Full)`: Full access to delivery orchestration.

We leverage **Derived State** in the delivery list, using `useMemo` to compute filtered views (Pending/Completed) without duplicating the underlying data in memory. This prevents **Impossible States** where a delivery could appear as both pending and completed simultaneously.

---

## Error handling

The application uses a **Layered Error Strategy**:

1.  **UI Level**: Immediate feedback via `Alert.alert` for user-fixable errors (e.g., missing fields).
2.  **Service Level**: Try-catch blocks wrap all Firebase and API operations, logging errors to the console while providing a fallback state to the user.
3.  **Adapter Level**: The `firebase.ts` wrapper acts as a **Single Seam** for error normalization, ensuring that whether we are in Mock or Real mode, the UI receives a consistent error structure.

---

## Performance optimisations

### **O(1) Rendering with FlatList**

In `app/(app)/index.tsx`, we utilize `FlatList` with optimized props to ensure smooth 60FPS scrolling even with hundreds of deliveries.

```typescript
// app/(app)/index.tsx
<FlatList
  removeClippedSubviews={true} // Unmounts off-screen components
  maxToRenderPerBatch={10}     // Limits JS thread load per frame
  windowSize={5}               // Constrains memory footprint
/>
```

### **Stable References with useCallback**

The `renderItem` and `onPress` handlers are wrapped in `useCallback` to prevent unnecessary re-renders of child components when the parent state changes.

```typescript
const renderItem = useCallback(({ item }) => (
  <DeliveryCard {...item} />
), [router]);
```

### **Memoized Derived State**

Expensive filtering logic is wrapped in `useMemo` to ensure that searching for a shipment doesn't trigger a re-calculation unless the search query or the delivery list actually changes.

```typescript
const filteredDeliveries = useMemo(() => {
  return list.filter((d) => d.customerName.includes(searchQuery));
}, [deliveries, searchQuery]);
```

---

## Animations and UX

Interaction design is treated as a first-class citizen.

- **Slide-to-Confirm**: We implemented a custom `PanResponder` and `Animated` value to create a high-intent gesture for delivery confirmation. This prevents accidental status changes (butt-clicks) which are common in rugged driver environments.
- **In-App Feedback**: The `InAppBanner` provides immediate visibility into new assignments while the app is in the foreground, bridging the gap between push notifications and the active UI state.
- **Haptic Integration**: (Future) Tactical feedback would be added to the confirm gesture to provide O(1) physical confirmation to the driver.

---

## Setup — step by step

### **1. Clone and Install**

```bash
git clone <repo-url>
cd driver
npm install
```

### **2. Configure Environment**

Copy `.env.example` to `.env` and fill in your Firebase/Google Maps credentials.

```bash
cp .env.example .env
```

### **3. Run Development Environment**

Start the Metro bundler and the notification worker in parallel:

```bash
# Terminal 1
npm start

# Terminal 2
npm run worker
```

---

## Interview questions and answers

### **"What breaks at scale?"**

Direct Firestore listeners (`onSnapshot`) on large collections can become expensive. At scale (10k+ drivers), we would transition to a "Windowed Sync" strategy where only the most recent 50 deliveries are synced in real-time, and older records are fetched via paginated REST calls.

### **"What's the race condition in your auth flow?"**

In `app/_layout.tsx`, the redirect logic runs on every `segments` change. If the `user` object updates while a navigation transition is already in flight, there's a risk of multiple `router.replace` calls firing. We mitigate this by checking `loading` states and ensuring redirects only happen when the identity state is "Stable."

### **"Why not write Firestore directly from the client in production?"**

Direct client writes expose the database to malicious actors who could bypass app-level validation. In a production environment, we would use Firebase Security Rules to restrict writes or move all status updates to a Firebase Cloud Function to ensure server-side validation and audit logging.

### **"Why did you choose nearest-neighbor for route optimization?"**

It's a "Good Enough" solution for the Traveling Salesperson Problem (TSP) at the scale of 5-10 stops. At production scale (50+ stops), we would offload this to a backend service using a more sophisticated algorithm like Ant Colony Optimization or a dedicated logistics API (e.g., Routific).

### **"How do you handle animations on the JS thread?"**

We use the `useNativeDriver: true` property for our `Animated` values whenever possible (e.g., the Slide-to-Confirm gesture). This offloads the frame-by-frame calculations to the **UI Thread**, ensuring animations remain buttery smooth even if the **JS Thread** is busy with a large Firestore sync.

---

## Known limitations and extension points

- **Offline Mode**: Currently relies on Firebase's built-in persistence. A production solution would implement a formal `OfflineSyncQueue` for status updates.
- **Background Location**: Only fetches location when the app is active. Production requires `expo-location` background tasks to track drivers for fleet management.
- **Unit Testing**: While the architecture is decoupled for testing, the current coverage is focused on core logic. Production would require 80%+ coverage using `Jest` and `React Native Testing Library`.
