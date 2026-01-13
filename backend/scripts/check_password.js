import bcrypt from 'bcryptjs';

const plain = process.argv[2] || 'ainhoa1';
const hash = process.argv[3] || '$2a$10$isInp.0VibiAME8U2oOaEOat0IgW1sH/P65C7MTszegrukkXVrMLq';

const ok = await bcrypt.compare(plain, hash);
console.log(ok ? 'MATCH' : 'NO MATCH');
