const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggered when a new delivery is added to Firestore.
 * Sends a push notification to the assigned driver.
 */
exports.sendDeliveryNotification = functions.firestore
    .document('deliveries/{deliveryId}')
    .onCreate(async (snapshot, context) => {
        const deliveryData = snapshot.data();
        const driverId = deliveryData.assignedDriver;

        if (!driverId) {
            console.log('No driver assigned to this delivery.');
            return null;
        }

        // Get driver's FCM token from 'drivers' collection
        const driverDoc = await admin.firestore().collection('drivers').doc(driverId).get();
        const fcmToken = driverDoc.data()?.fcmToken;

        if (!fcmToken) {
            console.log(`No FCM token found for driver ${driverId}`);
            return null;
        }

        const message = {
            notification: {
                title: 'New Delivery Assigned!',
                body: `You have a new delivery to ${deliveryData.customerName} at ${deliveryData.address}`,
            },
            data: {
                deliveryId: context.params.deliveryId,
                type: 'NEW_DELIVERY',
            },
            token: fcmToken,
        };

        try {
            await admin.messaging().send(message);
            console.log('Notification sent successfully');
        } catch (error) {
            console.error('Error sending notification:', error);
        }
        return null;
    });
