import type {AppConfig} from './config';
const baseUrl = import.meta.env.VITE_PIAWARE_BASE_URL;
const poll = Number(import.meta.env.VITE_POLL_MS ?? 2000);
export const defaultConfig: AppConfig = {
  mode: import.meta.env.VITE_PIAWARE_MODE === 'direct' ? 'direct' : 'proxy',
  baseUrl: baseUrl || 'http://127.0.0.1:7070',
  pollMs: Number.isFinite(poll) && poll >= 1000 ? poll : 2000,
  demo: !baseUrl,
  onlineDetails: true,
};
export const POLL_OPTIONS_MS = [1000, 2000, 5000];
