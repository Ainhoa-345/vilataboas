import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Inicializar Gemini AI sólo si tenemos API key
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.warn('No se pudo inicializar Gemini AI:', err.message);
    genAI = null;
  }
}

// Inicializar Resend (pasarela de correo) si hay API key
let resend = null;
if (process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
  } catch (err) {
    console.warn('No se pudo inicializar Resend:', err.message);
    resend = null;
  }
}

// Ruta para enviar mensajes al chat
router.post("/message", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    // Si no hay API key, devolver un fallback local
    if (!genAI) {
      const fallback = `Hola, gracias por tu mensaje: "${message}".\n\nActualmente el asistente está en modo local (sin Gemini API key).\nPuedes preguntar por: horarios, contacto, servicios o precios.`;
      return res.json({ success: true, response: fallback });
    }

  // Envolver la creación del modelo, la inicialización del chat y la petición
    // en un único try/catch para capturar errores que puedan ocurrir en cualquiera
    // de esos pasos (p. ej. clave inválida, 403, errores de cuota, etc.).
  let text;
  console.log('chatRoutes: iniciando flujo Gemini para mensaje:', message ? message.slice(0,50) : '<empty>');
  try {
      // Usar el modelo Gemini 2.5 Flash (rápido y con mejores límites de cuota)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Configurar el contexto del chat si hay historial
      let chat;
      if (history && history.length > 0) {
        // Convertir el historial al formato de Gemini
        const formattedHistory = history.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));

        chat = model.startChat({
          history: formattedHistory,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.9,
            topP: 1,
            topK: 40,
          },
        });
      } else {
        chat = model.startChat({
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.9,
            topP: 1,
            topK: 40,
          },
        });
      }

      // Enviar el mensaje y obtener la respuesta
      const result = await chat.sendMessage(message);
      const response = await result.response;
      text = response.text();
    } catch (err) {
      // Si la llamada a Gemini falla por cualquier motivo (clave inválida, 403, cuota, etc.)
      // no devolvemos 500 al frontend: enviamos un fallback amigable y registramos el error.
      console.error('Error llamando a Gemini desde /api/chat/message:', err?.message || err);
      const fallback = `Hola, gracias por tu mensaje: "${message}".\n\nNo puedo conectar con el asistente ahora mismo. Inténtalo más tarde.`;
      return res.json({ success: true, response: fallback });
    }

    console.log('chatRoutes: Gemini respondió correctamente (o se consiguió texto)');

    res.json({
      success: true,
      response: text,
    });

    // Enviar notificación por correo al admin (si Resend está configurado)
    const EMAIL_TO = process.env.EMAIL_TO || 'ainhoa.taboas@gmail.com';
    if (resend && EMAIL_TO) {
      (async () => {
        try {
          await resend.emails.send({
            from: "Contacto <onboarding@resend.dev>",
            to: [EMAIL_TO],
            subject: `Nuevo mensaje de chat recibido`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d6efd;">Nuevo mensaje desde el chat</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Mensaje recibido:</strong></p>
                  <p style="white-space: pre-wrap;">${message}</p>
                </div>
                <div style="margin: 20px 0;">
                  <h3 style="color: #0d6efd;">Respuesta del asistente:</h3>
                  <p style="white-space: pre-wrap;">${text}</p>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 12px;">Mensaje enviado desde el widget de chat del sitio.</p>
              </div>
            `,
          });
        } catch (err) {
          console.error('Error enviando notificación por correo desde chatRoutes:', err.message || err);
        }
      })();
    }
  } catch (error) {
    // Si el error proviene del cliente de Gemini (p. ej. clave 403 o clave filtrada),
    // retornar un fallback en 200 para que el frontend muestre una respuesta amigable
    // en lugar de fallar con 500. Logueamos el detalle para diagnóstico.
    console.error("Error en el chat de Gemini (outer):", error);

  const msg = (error && (error.message || error.toString())) ? String(error.message || error.toString()) : '';
    const isGeminiAuthError = /403 Forbidden|reported as leaked|GoogleGenerativeAI/.test(msg);

    if (isGeminiAuthError) {
      const fallback = `Hola, gracias por tu mensaje.\n\nNo puedo conectar con el asistente ahora mismo (problema de autenticación). Inténtalo más tarde.`;
      return res.json({ success: true, response: fallback });
    }

    res.status(500).json({
      success: false,
      error: "Error al procesar el mensaje",
      details: msg,
    });
  }
});

export default router;