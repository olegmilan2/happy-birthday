const fs = require("fs");
const path = require("path");
const {
  storageFilePath,
  firebaseProjectId,
  firebaseClientEmail,
  firebasePrivateKey,
  firebaseDatabaseUrl,
  firebaseServiceAccountPath,
} = require("./config");

let realtimeDb = null;

function isRealtimeDbEnabled() {
  const hasFileCreds =
    Boolean(firebaseServiceAccountPath) &&
    fs.existsSync(path.resolve(firebaseServiceAccountPath));
  const hasEnvCreds = Boolean(
    firebaseProjectId && firebaseClientEmail && firebasePrivateKey
  );
  return Boolean(firebaseDatabaseUrl && (hasFileCreds || hasEnvCreds));
}

function getServiceAccountFromFile() {
  if (!firebaseServiceAccountPath) {
    return null;
  }
  const resolvedPath = path.resolve(firebaseServiceAccountPath);
  if (!fs.existsSync(resolvedPath)) {
    return null;
  }
  const raw = fs.readFileSync(resolvedPath, "utf8");
  return JSON.parse(raw);
}

function getRealtimeDb() {
  if (!isRealtimeDbEnabled()) {
    return null;
  }
  if (realtimeDb) {
    return realtimeDb;
  }

  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    const serviceAccountFromFile = getServiceAccountFromFile();
    const serviceAccount =
      serviceAccountFromFile ||
      {
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey.replace(/\\n/g, "\n"),
      };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: firebaseDatabaseUrl,
    });
  }
  realtimeDb = admin.database();
  return realtimeDb;
}

function ensureStorageFile() {
  const dir = path.dirname(storageFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(storageFilePath)) {
    fs.writeFileSync(storageFilePath, "[]", "utf8");
  }
}

function loadBirthdaysFromFile() {
  ensureStorageFile();
  const raw = fs.readFileSync(storageFilePath, "utf8");
  return JSON.parse(raw);
}

function saveBirthdaysToFile(items) {
  ensureStorageFile();
  fs.writeFileSync(storageFilePath, JSON.stringify(items, null, 2), "utf8");
}

async function loadBirthdays() {
  const db = getRealtimeDb();
  if (!db) {
    return loadBirthdaysFromFile();
  }

  const snapshot = await db.ref("birthdays").once("value");
  const value = snapshot.val();
  const items = value
    ? Object.entries(value).map(([id, item]) => ({
        id: item && item.id ? item.id : id,
        ...item,
      }))
    : [];
  return items.sort((a, b) =>
    String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
  );
}

async function saveBirthdays(items) {
  const db = getRealtimeDb();
  if (!db) {
    saveBirthdaysToFile(items);
    return;
  }

  const payload = {};
  for (const item of items) {
    payload[String(item.id)] = item;
  }
  await db.ref("birthdays").set(payload);
}

async function addBirthday(item) {
  const db = getRealtimeDb();
  if (!db) {
    const list = loadBirthdaysFromFile();
    list.push(item);
    saveBirthdaysToFile(list);
    return;
  }
  await db.ref(`birthdays/${String(item.id)}`).set(item);
}

async function removeBirthday(id) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) {
    return false;
  }

  const db = getRealtimeDb();
  if (!db) {
    const list = loadBirthdaysFromFile();
    const next = list.filter((item) => String(item.id) !== normalizedId);
    if (next.length === list.length) {
      return false;
    }
    saveBirthdaysToFile(next);
    return true;
  }

  const ref = db.ref(`birthdays/${normalizedId}`);
  const snapshot = await ref.once("value");
  if (!snapshot.exists()) {
    return false;
  }
  await ref.remove();
  return true;
}

module.exports = {
  loadBirthdays,
  saveBirthdays,
  addBirthday,
  removeBirthday,
};
