import { expect, it, vi } from "vitest";
import { ReceiverDatabase } from "./receiverDatabase.js";
it("fills receiver metadata asynchronously, follows shards and reuses blocks", async () => {
  const fetchImpl = vi.fn(
    async (url: RequestInfo | URL) =>
      new Response(
        JSON.stringify(
          String(url).endsWith("/C.json")
            ? { children: ["C0"] }
            : { "1234": { r: "C-GABC", t: "C172" }, "5678": { t: "B738" } }
        )
      )
  );
  const db = new ReceiverDatabase("http://receiver/skyaware/db", fetchImpl);
  const records = [{ hex: "c01234" }, { hex: "c05678", t: "B739" }];
  expect(db.enrich(records)).toEqual(records);
  await vi.waitFor(() => expect(db.enrich(records)[0]?.t).toBe("C172"));
  expect(db.enrich(records)[0]?.reg).toBe("C-GABC");
  expect(db.enrich(records)[1]?.t).toBe("B739");
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  db.dispose();
});
it("does not block live aircraft when an optional database is missing", async () => {
  const db = new ReceiverDatabase(
    "http://receiver/db",
    async () => new Response("", { status: 404 })
  );
  const records = [{ hex: "abc123", flight: "TEST1" }];
  expect(db.enrich(records)).toEqual(records);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(db.enrich(records)).toEqual(records);
  db.dispose();
});
