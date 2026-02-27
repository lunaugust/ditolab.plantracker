import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseClient";

const LOCAL_QUEUE_KEY = "gymbuddy_feedback_queue";

interface FeedbackEntry {
  rating: number | null;
  category: string;
  message: string;
  view: string;
}

function isRemoteScope(scope: string): boolean {
  return scope !== "guest" && Boolean(db) && isFirebaseConfigured;
}

export async function saveFeedback(scope: string, entry: FeedbackEntry): Promise<void> {
  const base = {
    uid: scope,
    rating: entry.rating ?? null,
    category: entry.category || "general",
    message: entry.message.trim(),
    view: entry.view || "",
  };

  if (isRemoteScope(scope)) {
    try {
      await addDoc(collection(db!, "feedback"), {
        ...base,
        createdAt: serverTimestamp(),
      });
      return;
    } catch (error) {
      console.warn("[FeedbackService] Firestore write failed, saving locally:", error instanceof Error ? error.message : error);
    }
  }

  // Fallback / guest: append to localStorage queue
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ ...base, createdAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("[FeedbackService] localStorage write failed:", err instanceof Error ? err.message : err);
  }
}
