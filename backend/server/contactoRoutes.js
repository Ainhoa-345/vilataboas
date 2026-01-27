import express from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

// Cargar variables de entorno
dotenv.config();

const router = express.Router();

// Inicializar Resend solo si hay API key
let resend = null;
if (process.env.RESEND_API_KEY) {
    try {
        resend = new Resend(process.env.RESEND_API_KEY);
    } catch (err) {
        console.warn('No se pudo inicializar Resend:', err.message || err);
        resend = null;
    }
} else {
    console.log('contactoRoutes: resend is false');
    console.log('Resend no está configurado o no dispone de .emails.send, no se enviará correo.');
}

// Ruta POST para enviar correo
router.post("/", async (req, res) => {
    const { nombre, email, asunto, mensaje } = req.body;

    // Log de entrada para depuración rápida
    console.log('contactoRoutes POST recibido - resend disponible:', !!resend, 'RESEND_API_KEY present:', !!process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0,6)}***` : 'unset');

    // Validar campos
    if (!nombre || !email || !asunto || !mensaje) {
        return res.status(400).json({ 
            success: false, 
            message: "Todos los campos son obligatorios" 
        });
    }

    try {
        // Si Resend no está configurado, no enviar correo y devolver respuesta informativa
        if (!resend) {
            console.log('Contacto recibido:', { nombre, email, asunto, mensaje });
            return res.status(200).json({
                success: true,
                message: 'Correo NO enviado: Resend no configurado en el servidor (modo desarrollo). Revisa RESEND_API_KEY en .env',
            });
        }

        // Enviar correo con Resend
        const sendResult = await resend.emails.send({
            from: process.env.EMAIL_FROM || "Contacto <onboarding@resend.dev>",
            to: [process.env.EMAIL_TO], // Tu email configurado en .env
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

        // Registrar la respuesta completa para depuración
        console.log('Resend send result:', sendResult);

        // El SDK puede devolver error en diferentes formas; comprobar y devolver info útil
        if (sendResult && sendResult.error) {
            console.error("Error al enviar correo (Resend):", sendResult.error);
            return res.status(400).json({ 
                success: false, 
                message: "Error al enviar el correo",
                error: sendResult.error 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Correo enviado correctamente",
            data: sendResult 
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