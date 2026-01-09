<template>
  <div class="chat-container">
    <!-- Botón flotante para abrir/cerrar el chat -->
    <button 
      v-if="!isOpen" 
      @click="toggleChat" 
      class="chat-button"
      title="Abrir chat con IA"
    >
  <!-- Mostrar el logo en forma de burbuja en el botón flotante -->
  <img src="@/assets/logo-chat-bubble-white.svg" alt="Chat" class="chat-button-logo" />
    </button>

    <!-- Ventana del chat -->
    <div v-if="isOpen" class="chat-window">
      <!-- Header del chat -->
      <div class="chat-header">
        <div class="header-content">
          <!-- Logo de la empresa -->
          <img src="@/assets/logoEmpresaTeis.svg" alt="Logo" class="chat-logo" />
          <span>Asistente Gemini AI</span>
        </div>
        <button @click="toggleChat" class="close-btn" title="Cerrar chat">
          <!-- Close (crux) symbol as inline SVG -->
          <svg class="svg-icon svg-icon-close" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12l-5.775 5.775a1 1 0 1 0 1.414 1.414L12 13.414l5.775 5.775a1 1 0 0 0 1.414-1.414L13.414 12l5.775-5.775a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <!-- Área de mensajes -->
      <div class="chat-messages" ref="messagesContainer">
        <!-- Mensaje de bienvenida -->
        <div v-if="messages.length === 0" class="welcome-message">
          <i class="bi bi-stars"></i>
          <h3>¡Hola! Soy tu asistente Gemini</h3>
          <p>¿En qué puedo ayudarte hoy?</p>
        </div>

        <!-- Mensajes del chat -->
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.role]"
        >
          <div class="message-content">
            <div class="message-icon">
              <i :class="msg.role === 'user' ? 'bi bi-person-fill' : 'bi bi-robot'"></i>
            </div>
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
          </div>
          <div class="message-time">{{ msg.timestamp }}</div>
        </div>

        <!-- Indicador de escritura -->
        <div v-if="isTyping" class="message assistant">
          <div class="message-content">
            <div class="message-icon">
              <i class="bi bi-robot"></i>
            </div>
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input de mensaje -->
      <div class="chat-input-container">
        <form @submit.prevent="sendMessage" class="chat-input-form">
          <textarea
            v-model="userInput"
            @keydown.enter.exact.prevent="sendMessage"
            placeholder="Escribe tu mensaje..."
            class="chat-input"
            rows="1"
            ref="inputField"
            :disabled="isTyping"
          ></textarea>
          <button 
            type="submit" 
            class="send-btn"
            :disabled="!userInput.trim() || isTyping"
          >
            <!-- Send arrow symbol as inline SVG -->
            <svg class="svg-icon svg-icon-send" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
            </svg>
          </button>
        </form>
        <div class="chat-actions">
          <button @click="clearChat" class="action-btn" title="Limpiar chat" aria-label="Limpiar chat">
            <!-- Trash icon as inline SVG to avoid missing icon font -->
            <svg class="svg-icon svg-icon-trash" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 3h6a1 1 0 0 1 1 1v1h3a1 1 0 0 1 0 2h-1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h3V4a1 1 0 0 1 1-1zm1 4v10h2V7H10zm4 0v10h2V7h-2zM10 1h4v1h-4V1z" fill="currentColor" />
            </svg>
            <span class="action-label">Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import axios from 'axios';

const isOpen = ref(false);
const messages = ref([]);
const userInput = ref('');
const isTyping = ref(false);
const messagesContainer = ref(null);
const inputField = ref(null);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      inputField.value?.focus();
    });
  }
};

const formatMessage = (text) => {
  // Convertir markdown básico a HTML
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrita
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Cursiva
    .replace(/`(.*?)`/g, '<code>$1</code>') // Código inline
    .replace(/\n/g, '<br>'); // Saltos de línea
  
  return formatted;
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isTyping.value) return;

  const message = userInput.value.trim();
  
  // Agregar mensaje del usuario
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: getCurrentTime()
  });

  userInput.value = '';
  isTyping.value = true;
  scrollToBottom();

  try {
    // Preparar historial para el contexto
    const history = messages.value.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Enviar mensaje al backend probando varias URLs (5000, 3000, 3001)
    const endpoints = [
      'http://localhost:5000/api/chat/message',
      'http://localhost:3000/api/chat/message',
      'http://localhost:3001/api/chat/message'
    ];

    let backendResponse = null;
    for (const url of endpoints) {
      try {
        const resp = await axios.post(url, { message, history }, { timeout: 4000 });
        if (resp && resp.data) {
          backendResponse = resp.data;
          break;
        }
      } catch (err) {
        // ignora y prueba el siguiente endpoint
      }
    }

    if (backendResponse && backendResponse.success) {
      messages.value.push({
        role: 'assistant',
        content: backendResponse.response,
        timestamp: getCurrentTime()
      });
    } else {
      // Fallback local si no hay backend disponible
      const fallbackLocal = generateLocalReply(message);
      messages.value.push({
        role: 'assistant',
        content: fallbackLocal,
        timestamp: getCurrentTime()
      });
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    messages.value.push({
      role: 'assistant',
      content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
      timestamp: getCurrentTime()
    });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

const clearChat = () => {
  if (confirm('¿Estás seguro de que quieres limpiar el chat?')) {
    messages.value = [];
  }
};

// Generador simple de respuestas locales para el modo offline
const generateLocalReply = (userMsg) => {
  const text = userMsg.toLowerCase();
  if (text.includes('horario') || text.includes('hora')) {
    return 'Nuestro horario es L-V 9:00-18:00. ¿Quieres que te muestre los detalles de contacto?';
  }
  if (text.includes('precio') || text.includes('coste')) {
    return 'Para precios y presupuestos, por favor indícanos el servicio o el modelo del vehículo.';
  }
  if (text.includes('contacto') || text.includes('teléfono')) {
    return 'Puedes llamarnos al 600-000-000 o escribir a contacto@empresa.com';
  }
  return 'Lo siento, ahora mismo estoy en modo local. Puedo ayudarte con horarios, contacto y servicios. ¿Qué necesitas?';
};
</script>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

/* Botón flotante */
.chat-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #646cff 0%, #535bf2 100%);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(100, 108, 255, 0.6);
}

/* Logo dentro del botón flotante del chat */
.chat-button-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
  border-radius: 0; /* don't force round clipping */
  background: transparent;
  padding: 0;
  box-shadow: none;
  border: none; /* remove white circle/border */
}

/* Inline SVG icon sizing */
.svg-icon {
  width: 18px;
  height: 18px;
  display: inline-block;
}

.svg-icon svg,
.svg-icon path {
  vertical-align: middle;
}

.svg-icon-send {
  width: 18px;
  height: 18px;
  color: white; /* send button is colored on gradient background */
}

.svg-icon-close {
  width: 18px;
  height: 18px;
  color: white; /* close icon in header */
}

/* Trash icon in action button */
.svg-icon-trash {
  width: 16px;
  height: 16px;
  color: rgba(255,255,255,0.9);
  margin-right: 6px;
}

.action-label {
  display: inline-block;
}

/* Ventana del chat */
.chat-window {
  width: 400px;
  height: 600px;
  background-color: #1a1a1a;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #333;
}

/* Header */
.chat-header {
  background: linear-gradient(135deg, #646cff 0%, #535bf2 100%);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
}

.header-content i {
  font-size: 20px;
}

/* Logo pequeño en el header del chat */
.chat-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Área de mensajes */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #242424;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #444;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-track {
  background-color: #1a1a1a;
}

/* Mensaje de bienvenida */
.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.welcome-message i {
  font-size: 48px;
  color: #646cff;
  margin-bottom: 16px;
}

.welcome-message h3 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 18px;
}

.welcome-message p {
  margin: 0;
  font-size: 14px;
}

/* Mensajes */
.message {
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.message.user .message-icon {
  background: linear-gradient(135deg, #646cff 0%, #535bf2 100%);
  color: white;
}

.message.assistant .message-icon {
  background-color: #333;
  color: #646cff;
}

.message-text {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  font-size: 14px;
}

.message.user .message-text {
  background: linear-gradient(135deg, #646cff 0%, #535bf2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-text {
  background-color: #2a2a2a;
  color: rgba(255, 255, 255, 0.9);
  border-bottom-left-radius: 4px;
}

.message-text :deep(strong) {
  font-weight: 600;
}

.message-text :deep(code) {
  background-color: rgba(100, 108, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
  padding-left: 44px;
}

/* Indicador de escritura */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background-color: #2a2a2a;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #646cff;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Input de mensaje */
.chat-input-container {
  border-top: 1px solid #333;
  background-color: #1a1a1a;
  padding: 16px;
}

.chat-input-form {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.chat-input {
  flex: 1;
  background-color: #2a2a2a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  max-height: 120px;
  transition: border-color 0.3s ease;
}

.chat-input:focus {
  outline: none;
  border-color: #646cff;
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #646cff 0%, #535bf2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Acciones del chat */
.chat-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  background-color: transparent;
  border: 1px solid #333;
  color: rgba(255, 255, 255, 0.6);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background-color: #2a2a2a;
  border-color: #646cff;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 100px);
    max-width: 400px;
  }
}
</style>