import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'transmission-remote.db');

export const db = initDb(dbPath);
