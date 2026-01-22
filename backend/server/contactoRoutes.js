import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

// Cargar variables de entorno
dotenv.config();

const router = express.Router();

// Inicializar Resend con la API Key (tolerante si no está definida)
let resend = null;
if (process.env.RESEND_API_KEY) {
    try {
        resend = new Resend(process.env.RESEND_API_KEY);
    } catch (err) {
        console.warn('No se pudo inicializar Resend en contactoRoutes:', err.message);
        resend = null;
    }
}
// Email por defecto para notificaciones (usa .env si existe)
const EMAIL_TO = process.env.EMAIL_TO || 'ainhoa.taboas@gmail.com';

// Ruta POST para enviar correo
router.post("/", async (req, res) => {
    const { nombre, email, asunto, mensaje } = req.body;

    // Validar campos
    if (!nombre || !email || !asunto || !mensaje) {
        return res.status(400).json({ 
            success: false, 
            message: "Todos los campos son obligatorios" 
        });
    }

    try {
        console.log('contactoRoutes: resend is', !!resend);
        // Enviar correo con Resend (si está inicializado y la API está disponible)
        if (!(resend && resend.emails && typeof resend.emails.send === 'function')) {
            console.warn('Resend no está configurado o no dispone de .emails.send, no se enviará correo.');
            console.log('Contacto recibido:', { nombre, email, asunto });
            return res.status(200).json({ success: true, message: 'Contacto recibido (email no enviado: Resend no configurado)' });
        }

        const { data, error } = await resend.emails.send({
            from: "Contacto <onboarding@resend.dev>",
            to: [EMAIL_TO], // Tu email configurado en .env o fallback
            subject: `Nuevo mensaje de contacto: ${asunto}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0d6efd;">Nuevo mensaje de contacto</h2>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Nombre:</strong> ${nombre}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Asunto:</strong> ${asunto}</p>
                    </div>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #0d6efd;">Mensaje:</h3>
                        <p style="white-space: pre-wrap;">${mensaje}</p>
                    </div>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; font-size: 12px;">
                        Este mensaje fue enviado desde el formulario de contacto de tu sitio web.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Error al enviar correo:", error);
            return res.status(400).json({ 
                success: false, 
                message: "Error al enviar el correo",
                error: error.message 
            });
        }

        console.log("Correo enviado exitosamente:", data);
        res.status(200).json({ 
            success: true, 
            message: "Correo enviado correctamente",
            data 
        });

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor",
            error: error.message 
        });
    }
});

export default router;