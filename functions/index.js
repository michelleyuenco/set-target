const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.adminResetPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { uid, newPassword } = data;
  if (!uid || !newPassword) {
    throw new functions.https.HttpsError("invalid-argument", "uid and newPassword are required.");
  }
  if (newPassword.length < 6) {
    throw new functions.https.HttpsError("invalid-argument", "Password must be at least 6 characters.");
  }

  // Verify caller is admin
  const callerRecord = await getAuth().getUser(context.auth.uid);
  const adminsDoc = await getFirestore().doc("config/admins").get();
  if (!adminsDoc.exists) {
    throw new functions.https.HttpsError("permission-denied", "Admin config not found.");
  }
  const adminEmails = adminsDoc.data().emails || [];
  if (!adminEmails.includes(callerRecord.email)) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can reset passwords.");
  }

  // Reset the member's password
  await getAuth().updateUser(uid, { password: newPassword });
  return { success: true };
});
