import { saveFeedback } from "../services/feedbackService";

/* ================================================================
 * Mock firebase/firestore and firebaseClient
 * ================================================================ */
const mockAddDoc = vi.fn().mockResolvedValue({ id: "doc1" });

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "feedbackCollection"),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
}));

vi.mock("../services/firebaseClient", () => ({
  db: "mockDb",
  isFirebaseConfigured: true,
}));

const LOCAL_QUEUE_KEY = "gymbuddy_feedback_queue";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.removeItem(LOCAL_QUEUE_KEY);
});

describe("feedbackService", () => {
  const baseEntry = {
    rating: 5,
    category: "feature",
    message: "  Great app!  ",
    view: "plan",
  };

  /* ----------------------------------------------------------
   * Remote (authenticated) scope
   * ---------------------------------------------------------- */
  it("saves to Firestore for authenticated users", async () => {
    await saveFeedback("user123", baseEntry);

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.uid).toBe("user123");
    expect(savedData.message).toBe("Great app!"); // trimmed
    expect(savedData.rating).toBe(5);
    expect(savedData.category).toBe("feature");
    expect(savedData.createdAt).toBe("SERVER_TIMESTAMP");
  });

  it("trims message and defaults category/rating", async () => {
    await saveFeedback("user123", { rating: null, category: "general", message: "  Hello  ", view: "log" });

    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.message).toBe("Hello");
    expect(savedData.rating).toBeNull();
    expect(savedData.category).toBe("general");
  });

  /* ----------------------------------------------------------
   * Guest scope — localStorage
   * ---------------------------------------------------------- */
  it("saves to localStorage for guest users", async () => {
    await saveFeedback("guest", baseEntry);

    expect(mockAddDoc).not.toHaveBeenCalled();
    const queue = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) ?? "null");
    expect(queue).toHaveLength(1);
    expect(queue[0].uid).toBe("guest");
    expect(queue[0].message).toBe("Great app!");
    expect(queue[0].createdAt).toBeDefined();
  });

  it("appends to existing localStorage queue", async () => {
    await saveFeedback("guest", { ...baseEntry, message: "First" });
    await saveFeedback("guest", { ...baseEntry, message: "Second" });

    const queue = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) ?? "null");
    expect(queue).toHaveLength(2);
    expect(queue[0].message).toBe("First");
    expect(queue[1].message).toBe("Second");
  });

  /* ----------------------------------------------------------
   * Firestore fallback
   * ---------------------------------------------------------- */
  it("falls back to localStorage when Firestore write fails", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("permission-denied"));

    await saveFeedback("user123", baseEntry);

    // Should have attempted Firestore
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    // Should have fallen back to localStorage
    const queue = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) ?? "null");
    expect(queue).toHaveLength(1);
    expect(queue[0].uid).toBe("user123");
  });
});
