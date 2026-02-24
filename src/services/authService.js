import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "./firebaseClient";

export function isAuthEnabled() {
  return Boolean(auth);
}

export function subscribeToAuthState(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase Auth no está configurado");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}
