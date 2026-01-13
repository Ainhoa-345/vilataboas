import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(new URL('..', import.meta.url).pathname, 'data', 'db.json');

async function run() {
  try {
    const raw = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(raw);

    if (!Array.isArray(db.clientes)) {
      console.error('No se encontró la colección clientes en db.json');
      process.exit(1);
    }

    let changed = 0;

    const clientes = db.clientes.map((c) => {
      const copy = { ...c };
      const pwd = (copy.password || '').toString();
      // Considerar como hash si empieza por $2a$ o $2b$ o $2y$
      if (pwd && !pwd.startsWith('$2')) {
        copy.password = bcrypt.hashSync(pwd, 10);
        changed++;
      }
      return copy;
    });

    if (changed === 0) {
      console.log('No se encontraron contraseñas en claro. Nada que hacer.');
      return;
    }

    db.clientes = clientes;
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`Hasheadas ${changed} contraseñas y actualizado ${dbPath}`);
  } catch (err) {
    console.error('Error al hashear contraseñas:', err);
    process.exit(1);
  }
}

run();
