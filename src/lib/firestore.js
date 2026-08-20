import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

// ── Users ──────────────────────────────────────────────────────────────
export const usersCol = collection(db, "users");

export function watchUsers(callback) {
  const q = query(usersCol, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createUser({ name, email }) {
  return addDoc(usersCol, {
    name,
    email,
    createdAt: serverTimestamp(),
    sheetConnected: false,
    connectorsCount: 0,
  });
}

export async function deleteUser(userId) {
  return deleteDoc(doc(db, "users", userId));
}

// ── Sheet config (users/{uid}/config/sheet) ──────────────────────────────
export function sheetConfigRef(userId) {
  return doc(db, "users", userId, "config", "sheet");
}

export async function saveSheetConfig(userId, config) {
  await setDoc(
    sheetConfigRef(userId),
    { ...config, updatedAt: serverTimestamp() },
    { merge: true }
  );
  await setDoc(doc(db, "users", userId), { sheetConnected: true }, { merge: true });
}

export function watchSheetConfig(userId, callback) {
  return onSnapshot(sheetConfigRef(userId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// ── Connectors (users/{uid}/connectors/{platform}) ───────────────────────
export function connectorsCol(userId) {
  return collection(db, "users", userId, "connectors");
}

export async function saveConnector(userId, platform, fields) {
  await setDoc(
    doc(db, "users", userId, "connectors", platform),
    {
      platform,
      status: "connected",
      updatedAt: serverTimestamp(),
      ...fields,
    },
    { merge: true }
  );
}

export async function removeConnector(userId, platform) {
  return deleteDoc(doc(db, "users", userId, "connectors", platform));
}

export function watchConnectors(userId, callback) {
  return onSnapshot(connectorsCol(userId), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
