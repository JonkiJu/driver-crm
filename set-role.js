import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const email = process.argv[2];
const role = process.argv[3]; // admin | user
const keyPathArg = process.argv[4];
const resolvedKeyPath = path.resolve(
  keyPathArg || process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json",
);

if (!email || !["admin", "user"].includes(role)) {
  console.log("Usage: node set-role.js <email> <admin|user> [path/to/serviceAccountKey.json]");
  process.exit(1);
}

if (!fs.existsSync(resolvedKeyPath)) {
  console.error(`Service account key not found: ${resolvedKeyPath}`);
  console.error("Download it from Firebase Console -> Project settings -> Service accounts -> Generate new private key");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(resolvedKeyPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { role });

console.log(`Role '${role}' assigned to ${email}`);
console.log(`Using key: ${resolvedKeyPath}`);
process.exit(0);