import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
  type NextOrObserver,
} from "firebase/auth";
import { auth } from "./firebaseClient";

export function isAuthEnabled(): boolean {
  return Boolean(auth);
}

export function subscribeToAuthState(callback: NextOrObserver<User>): () => void {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("FIREBASE_AUTH_NOT_CONFIGURED");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}
