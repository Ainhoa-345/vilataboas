#!/usr/bin/env node
// Script para normalizar la estructura de datos de clientes en db.json
// Uso: node normalize_clients.js
// Este script renombra 'tipoCliente' a 'tipo_cliente' y asegura que exista el campo 'tipo'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo db.json
const DB_PATH = path.resolve(__dirname, '..', 'data', 'db.json');

// Función para normalizar un cliente
function normalizeClient(c) {
  // Renombrar tipoCliente -> tipo_cliente si existe
  if (c.tipoCliente !== undefined && c.tipo_cliente === undefined) {
    c.tipo_cliente = c.tipoCliente;
    delete c.tipoCliente;
  }

  // Asegurar que tipo_cliente exista (cadena vacía por defecto)
  if (c.tipo_cliente === undefined) c.tipo_cliente = '';

  // Asegurar que tipo exista y tenga valor por defecto 'user'
  if (!c.tipo || String(c.tipo).trim() === '') c.tipo = 'user';

  return c;
}

function main() {
  // Verificar que el archivo existe
  if (!fs.existsSync(DB_PATH)) {
    console.error('No se encontró', DB_PATH);
    process.exit(1);
  }

  // Leer el archivo
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  let db;
  try {
    db = JSON.parse(raw);
  } catch (e) {
    console.error('Error parseando db.json:', e.message);
    process.exit(1);
  }

  // Verificar que exista la colección de clientes
  if (!Array.isArray(db.clientes)) {
    console.error('db.json no contiene la colección clientes');
    process.exit(1);
  }

  // Normalizar todos los clientes
  const before = db.clientes.length;
  db.clientes = db.clientes.map(normalizeClient);

  // Guardar los cambios
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Normalizados ${before} clientes en ${DB_PATH}. Se ha asegurado campo 'tipo' y renombrado 'tipoCliente'->'tipo_cliente' si existía.`);
}

main();
