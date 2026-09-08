import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {createPiAwareClient} from '@adsb/shared';
dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 7070);
const baseUrl = process.env.PIAWARE_BASE_URL ?? 'http://piaware.local';
const client = createPiAwareClient({baseUrl, mode: 'direct'});
app.use(cors());
app.get('/', (_req, res) => res.json({name: 'Local ADS-B receiver proxy', upstream: baseUrl, endpoints: ['/api/health', '/api/aircraft', '/api/receiver', '/api/history']}));
app.get('/api/health', (_req, res) => res.json({ok: true, upstream: baseUrl}));
app.get('/api/aircraft', async (_req, res, next) => {
  try {const snapshot = await client.getAircraftSnapshot(); res.json({now: snapshot.sourceTimestampMs / 1000, aircraft: snapshot.aircraft});} catch (error) {next(error);}
});
app.get('/api/receiver', async (_req, res, next) => {
  try {res.json(await client.getReceiver() ?? {});} catch (error) {next(error);}
});
app.get('/api/history', async (_req, res, next) => {
  try {const history = await client.getHistory(); if (history === undefined) res.status(404).json({error: 'Receiver history unavailable'}); else res.json(history);} catch (error) {next(error);}
});
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {res.status(502).json({error: error instanceof Error ? error.message : 'Unknown receiver error'});});
app.listen(port, '127.0.0.1', () => console.log(`Local receiver proxy listening on http://127.0.0.1:${port}`));
