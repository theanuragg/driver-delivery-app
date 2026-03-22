import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock Auth
export const mockAuth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: (user: any) => void) => {
    AsyncStorage.getItem("mock_user").then((userStr) => {
      const user = userStr ? JSON.parse(userStr) : null;
      mockAuth.currentUser = user;
      callback(user);
    });
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string, pass: string) => {
    const user = { uid: "test-driver-id", email };
    await AsyncStorage.setItem("mock_user", JSON.stringify(user));
    mockAuth.currentUser = user;
    return { user };
  },
  signOut: async () => {
    await AsyncStorage.removeItem("mock_user");
    mockAuth.currentUser = null;
  },
};

// Mock Firestore Data
const MOCK_DATA: Record<string, any[]> = {
  deliveries: [
    {
      id: "del-1",
      orderId: "ORD-101",
      customerName: "Alice Johnson",
      address: "Pier 39, San Francisco",
      status: "pending",
      latitude: 37.8087,
      longitude: -122.4098,
      assignedDriver: "test-driver-id",
    },
    {
      id: "del-2",
      orderId: "ORD-102",
      customerName: "Charlie Smith",
      address: "Union Square, San Francisco",
      status: "pending",
      latitude: 37.7879,
      longitude: -122.4074,
      assignedDriver: "test-driver-id",
    },
    {
      id: "del-3",
      orderId: "ORD-103",
      customerName: "Diana Prince",
      address: "Golden Gate Park, San Francisco",
      status: "pending",
      latitude: 37.7694,
      longitude: -122.4862,
      assignedDriver: "test-driver-id",
    },
    {
      id: "del-4",
      orderId: "ORD-104",
      customerName: "Ethan Hunt",
      address: "Mission District, San Francisco",
      status: "pending",
      latitude: 37.7599,
      longitude: -122.4148,
      assignedDriver: "test-driver-id",
    },
  ],
  drivers: [],
};

export const mockFirestore = {
  collection: (path: string) => ({
    add: async (data: any) => {
      const id = `mock-${Math.random().toString(36).substr(2, 9)}`;
      if (!MOCK_DATA[path]) MOCK_DATA[path] = [];
      MOCK_DATA[path].push({ id, ...data });
      return { id };
    },
    where: (field: string, op: string, val: any) => ({
      onSnapshot: (callback: (snap: any) => void) => {
        const collectionData = MOCK_DATA[path] || [];
        callback({
          docs: collectionData.map((d) => ({
            id: d.id,
            data: () => d,
          })),
        });
        return () => {};
      },
    }),
    doc: (docId: string) => ({
      update: async (data: any) => {
        const collectionData = MOCK_DATA[path] || [];
        const index = collectionData.findIndex((d) => d.id === docId);
        if (index !== -1) {
          collectionData[index] = { ...collectionData[index], ...data };
        }
      },
      set: async (data: any, options: any) => {
        if (!MOCK_DATA[path]) MOCK_DATA[path] = [];
        const collectionData = MOCK_DATA[path];
        const index = collectionData.findIndex((d) => d.id === docId);
        if (index !== -1) {
          MOCK_DATA[path][index] = options?.merge
            ? { ...collectionData[index], ...data }
            : data;
        } else {
          MOCK_DATA[path].push({ id: docId, ...data });
        }
      },
      onSnapshot: (callback: (snap: any) => void) => {
        const collectionData = MOCK_DATA[path] || [];
        const d = collectionData.find((item) => item.id === docId);
        callback({
          id: docId,
          exists: !!d,
          data: () => d,
        });
        return () => {};
      },
    }),
  }),
};

// Mock FCM
export const mockFCM = {
  getToken: async () => "mock-fcm-token",
  onMessage: (callback: (msg: any) => void) => {
    return () => {};
  },
  setBackgroundMessageHandler: (callback: (msg: any) => void) => {},
};
