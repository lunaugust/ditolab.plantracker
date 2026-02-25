import { getExerciseMedia } from "../services/exerciseMediaService";

describe("exerciseMediaService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ExerciseDB gif when available", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch" as never).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ gifUrl: "https://cdn.example.com/pushup.gif" }],
    } as Response);

    const media = await getExerciseMedia("Push Up", "d1_plancha");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(media.imageUrl).toBe("https://cdn.example.com/pushup.gif");
    expect(media.wgerExerciseId).toBeNull();
    expect(media.youtubeUrl).toContain("Push%20Up");
  });

  it("falls back to wger image when ExerciseDB returns no result", async () => {
    vi.spyOn(globalThis, "fetch" as never)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestions: [{ data: { id: 1, base_id: 321 } }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ image: "https://wger.de/media/exercise-images/321/main.jpg", is_main: true }] }),
      } as Response);

    const media = await getExerciseMedia("Lat Pulldown", "d2_jalon");

    expect(media.imageUrl).toBe("https://wger.de/media/exercise-images/321/main.jpg");
    expect(media.wgerExerciseId).toBe(321);
  });
});
