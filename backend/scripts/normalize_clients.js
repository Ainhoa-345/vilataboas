#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'data', 'db.json');

function normalizeClient(c) {
  // Rename tipoCliente -> tipo_cliente if present
  if (c.tipoCliente !== undefined && c.tipo_cliente === undefined) {
    c.tipo_cliente = c.tipoCliente;
    delete c.tipoCliente;
  }

  // Ensure tipo_cliente exists (empty string default)
  if (c.tipo_cliente === undefined) c.tipo_cliente = '';

  // Ensure tipo exists and default to 'user'
  if (!c.tipo || String(c.tipo).trim() === '') c.tipo = 'user';

  return c;
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('No se encontró', DB_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  let db;
  try {
    db = JSON.parse(raw);
  } catch (e) {
    console.error('Error parseando db.json:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(db.clientes)) {
    console.error('db.json no contiene la colección clientes');
    process.exit(1);
  }

  const before = db.clientes.length;
  db.clientes = db.clientes.map(normalizeClient);

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Normalizados ${before} clientes en ${DB_PATH}. Se ha asegurado campo 'tipo' y renombrado 'tipoCliente'->'tipo_cliente' si existía.`);
}

main();
