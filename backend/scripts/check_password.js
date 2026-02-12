// Script para verificar si una contraseña coincide con su hash bcrypt
// Uso: node check_password.js "contraseña" "hash_bcrypt"
import bcrypt from 'bcryptjs';

// Contraseña en texto plano (primer argumento o valor por defecto)
const plain = process.argv[2] || 'ainhoa1';
// Hash bcrypt a comparar (segundo argumento o valor por defecto)
const hash = process.argv[3] || '$2a$10$isInp.0VibiAME8U2oOaEOat0IgW1sH/P65C7MTszegrukkXVrMLq';

const ok = await bcrypt.compare(plain, hash);
// Muestra COINCIDE si la contraseña es correcta, NO COINCIDE si no lo es
console.log(ok ? 'COINCIDE' : 'NO COINCIDE');
