// Script para hashear contraseñas en claro de todos los clientes en db.json
// Uso: node hash-passwords.js
// Este script busca contraseñas que no estén hasheadas (no empiezan por $2) y las hashea con bcrypt
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

// Ruta al archivo db.json donde están los clientes
const dbPath = path.resolve(new URL('..', import.meta.url).pathname, 'data', 'db.json');

async function run() {
  try {
    // Leer el archivo db.json
    const raw = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(raw);

    // Verificar que exista la colección de clientes
    if (!Array.isArray(db.clientes)) {
      console.error('No se encontró la colección clientes en db.json');
      process.exit(1);
    }

    let changed = 0; // Contador de contraseñas modificadas

    // Recorrer todos los clientes y hashear contraseñas en claro
    const clientes = db.clientes.map((c) => {
      const copy = { ...c };
      const pwd = (copy.password || '').toString();
      // Considerar como hash si empieza por $2a$ o $2b$ o $2y$ (formatos bcrypt)
      if (pwd && !pwd.startsWith('$2')) {
        // Hashear con bcrypt usando salt de 10 rondas
        copy.password = bcrypt.hashSync(pwd, 10);
        changed++;
      }
      return copy;
    });

    // Si no hubo cambios, informar y salir
    if (changed === 0) {
      console.log('No se encontraron contraseñas en claro. Nada que hacer.');
      return;
    }

    // Guardar los cambios en db.json
    db.clientes = clientes;
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`Hasheadas ${changed} contraseñas y actualizado ${dbPath}`);
  } catch (err) {
    console.error('Error al hashear contraseñas:', err);
    process.exit(1);
  }
}

run();
