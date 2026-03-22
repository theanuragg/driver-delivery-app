const admin = require('firebase-admin');

// Ensure we connect to local emulators
// Updated lines in scripts/seed-emulator.js
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'driver-app-dev',
});

const db = admin.firestore();
const auth = admin.auth();

const seedData = async () => {
  try {
    console.log('🌱 Starting Emulator Seeding...');

    // 1. Create Test Driver
    const driverEmail = 'test@driver.com';
    let user;
    try {
      user = await auth.createUser({
        email: driverEmail,
        password: 'password123',
        uid: 'test-driver-id',
      });
      console.log(`✅ Created test user: ${driverEmail}`);
    } catch (e) {
      if (e.code === 'auth/uid-already-exists') {
        user = await auth.getUser('test-driver-id');
        console.log(`ℹ️ User already exists: ${driverEmail}`);
      } else {
        throw e;
      }
    }

    // 2. Create Driver Record in Firestore
    await db.collection('drivers').doc(user.uid).set({
      email: driverEmail,
      name: 'Test Driver',
      mobile: '+61400000000',
      fcmToken: 'mock-fcm-token',
      status: 'active',
      lastLocation: new admin.firestore.GeoPoint(-33.8688, 151.2093),
    });
    console.log('✅ Created driver record in Firestore');

    // 3. Create Sample Deliveries
    const deliveries = [
      {
        orderId: 'ORD-101',
        customerName: 'Alice Johnson',
        address: '100 George St, Sydney',
        status: 'pending',
        latitude: -33.8634,
        longitude: 151.2111,
        assignedDriver: user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        orderId: 'ORD-102',
        customerName: 'Charlie Smith',
        address: '250 Pitt St, Sydney',
        status: 'pending',
        latitude: -33.8732,
        longitude: 151.2084,
        assignedDriver: user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        orderId: 'ORD-103',
        customerName: 'Diana Prince',
        address: '50 Circular Quay, Sydney',
        status: 'delivered',
        latitude: -33.8599,
        longitude: 151.2113,
        assignedDriver: user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    ];

    const batch = db.batch();
    deliveries.forEach((d) => {
      const docRef = db.collection('deliveries').doc();
      batch.set(docRef, d);
    });
    
    await batch.commit();
    console.log(`✅ Seeded ${deliveries.length} sample deliveries`);

    console.log('🚀 Seeding Complete! Ready for local development.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seedData();
