import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    const { dni, password } = req.body;

    try {

        const response = await axios.get(`http://localhost:3000/clientes?dni=${dni}`);
        const user = response.data[0];

        if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ message: 'Contraseña incorrecta' });

        // Usar secreto de entorno o un secreto por defecto para desarrollo
        const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
        const token = jwt.sign(
            {
                dni: user.dni,
                tipo: user.tipo || 'user'
            },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ token, nombre: user.nombre, tipo: user.tipo || 'user' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const checkAdmin = async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No autorizado' });
        const token = auth.split(' ')[1];

        const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        // Intentar devolver info del usuario desde json-server para confirmar rol y nombre
        const response = await axios.get(`http://localhost:3000/clientes?dni=${decoded.dni}`);
        const user = response.data && response.data[0];
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        return res.json({ tipo: user.tipo || 'user', nombre: user.nombre || '' });
    } catch (error) {
        console.error('Error en checkAdmin:', error.message || error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
}