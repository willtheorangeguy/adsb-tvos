import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 7070);
const baseUrl = process.env.PIAWARE_BASE_URL ?? "http://piaware.local";

app.use(cors());

function buildUrl(path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function readPiAwareJson(path: string): Promise<unknown> {
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`PiAware request failed (${response.status}) for ${path}`);
  }

  return response.json();
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    upstream: baseUrl,
  });
});

app.get("/api/aircraft", async (_req, res, next) => {
  try {
    res.json(await readPiAwareJson("/skyaware/data/aircraft.json"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/receiver", async (_req, res, next) => {
  try {
    res.json(await readPiAwareJson("/skyaware/data/receiver.json"));
  } catch (error) {
    next(error);
  }
});

app.get("/api/history", async (_req, res, next) => {
  try {
    res.json(await readPiAwareJson("/skyaware/data/history_0.json"));
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown proxy error";
  res.status(502).json({
    error: message,
  });
});

app.listen(port, () => {
  console.log(`PiAware proxy listening on http://localhost:${port}`);
});
