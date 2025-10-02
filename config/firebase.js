const admin = require('firebase-admin');
const path = require('path');

// Construct a full, absolute path to the service account key
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account-key.json');

// Require the file using the absolute path
const serviceAccount = require(serviceAccountPath);

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get a reference to the Firestore database
const db = admin.firestore();

// Export the database reference
module.exports = db;