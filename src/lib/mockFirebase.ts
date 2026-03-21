import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Auth
export const mockAuth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: (user: any) => void) => {
    AsyncStorage.getItem('mock_user').then(userStr => {
      const user = userStr ? JSON.parse(userStr) : null;
      mockAuth.currentUser = user;
      callback(user);
    });
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string, pass: string) => {
    if (email && pass) {
      const user = { uid: 'driver-123', email };
      await AsyncStorage.setItem('mock_user', JSON.stringify(user));
      mockAuth.currentUser = user;
      return { user };
    }
    throw new Error('Invalid credentials');
  },
  signOut: async () => {
    await AsyncStorage.removeItem('mock_user');
    mockAuth.currentUser = null;
  }
};

// Mock Firestore
const MOCK_DELIVERIES = [
  {
    id: 'del-1',
    orderId: 'ORD-001',
    customerName: 'John Doe',
    address: '123 Main St, Sydney',
    status: 'pending',
    latitude: -33.8688,
    longitude: 151.2093,
    assignedDriver: 'driver-123',
  },
  {
    id: 'del-2',
    orderId: 'ORD-002',
    customerName: 'Jane Smith',
    address: '456 George St, Sydney',
    status: 'pending',
    latitude: -33.8708,
    longitude: 151.2073,
    assignedDriver: 'driver-123',
  },
  {
    id: 'del-3',
    orderId: 'ORD-003',
    customerName: 'Bob Brown',
    address: '789 Pitt St, Sydney',
    status: 'pending',
    latitude: -33.8728,
    longitude: 151.2053,
    assignedDriver: 'driver-123',
  }
];

export const mockFirestore = {
  collection: (path: string) => ({
    where: (field: string, op: string, val: any) => ({
      onSnapshot: (callback: (snap: any) => void) => {
        if (path === 'deliveries') {
          callback({
            docs: MOCK_DELIVERIES.map(d => ({
              id: d.id,
              data: () => d
            }))
          });
        }
        return () => {};
      }
    }),
    doc: (docId: string) => ({
      update: async (data: any) => {
        const index = MOCK_DELIVERIES.findIndex(d => d.id === docId);
        if (index !== -1) {
          MOCK_DELIVERIES[index] = { ...MOCK_DELIVERIES[index], ...data };
        }
      }
    })
  })
};

// Mock FCM
export const mockFCM = {
  getToken: async () => 'mock-fcm-token',
  onMessage: (callback: (msg: any) => void) => {
    return () => {};
  },
  setBackgroundMessageHandler: (callback: (msg: any) => void) => {}
};
