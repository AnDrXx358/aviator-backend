const admin = require('firebase-admin');
const env = require('../config/env');

const serviceAccount = {
  projectId: env.firebase.projectId,
  clientEmail: env.firebase.clientEmail,
  privateKey: env.firebase.privateKey,
};

const firebaseApp =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

const db = firebaseApp.firestore();

module.exports = {
  admin,
  firebaseApp,
  db,
};