<template>
  <div>
    <!-- Botón flotante -->
    <button
      class="chat-toggle modern-toggle"
      @click="toggleChat"
      :aria-pressed="open.toString()"
      aria-label="Abrir chat"
      title="Abrir chat"
    >
      <img src="@/assets/stock-chat-logo.svg" alt="Chat" class="chat-icon" />
    </button>

    <!-- Ventana del chat -->
    <transition name="fade-slide">
      <div
        v-if="open"
        class="chat-window card shadow position-fixed"
        aria-live="polite"
      >
        <!-- Header -->
        <div class="chat-header d-flex align-items-center">
          <img src="@/assets/stock-chat-logo.svg" alt="Logo" class="header-logo" />
          <div class="header-title">
            <div class="title">Asistente</div>
            <div class="subtitle">Respuestas rápidas y útiles</div>
          </div>
          <button class="btn-close btn-close-white ms-auto" @click="toggleChat" aria-label="Cerrar"></button>
        </div>

        <!-- Mensajes -->
        <div class="chat-messages overflow-auto" ref="messageContainer">
        <div v-for="(msg,index) in messages" :key="index" class="mb-2">
          
          <!-- Usuario -->
          <div v-if="msg.from === 'user'" class="d-flex justify-content-end">
            <div class="p-2 px-3 bg-success text-white rounded-pill chat-bubble text-end">
              {{ msg.text }}
            </div>
          </div>

          <!-- Bot -->
          <div v-else class="d-flex align-items-start">
            <div class="p-2 px-3 bg-light border rounded-pill chat-bubble">
              {{ msg.text }}
            </div>
          </div>
        </div>

        <!-- Indicador escribiendo -->
        <div v-if="typing" class="text-muted small ms-2">
          El bot está escribiendo...
        </div>
        </div>

        <!-- Input -->
        <div class="chat-input d-flex align-items-center">
          <input
            type="text"
            class="form-control chat-input-field"
            placeholder="Escribe un mensaje..."
            v-model="input"
            @keyup.enter="send"
          />
          <button class="btn send-btn" @click="send" aria-label="Enviar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 21L23 12L2 3L2 10L17 12L2 14L2 21Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
    import { ref, nextTick } from "vue";
    import axios from "axios";

    const open = ref(false);
    const input = ref("");
    const typing = ref(false);
    const messages = ref([]);
    const messageContainer = ref(null);

    const toggleChat = () => {
      open.value = !open.value;
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
        }
      });
    };

    const send = async () => {
      if (!input.value.trim()) return;

      // Añadir mensaje del usuario
      messages.value.push({ from: "user", text: input.value });
      scrollToBottom();

      const userMessage = input.value;
      input.value = "";
      typing.value = true;

      try {
          // Llamada a la API del bot (configurable vía VITE_API_BASE)
          const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
          const response = await axios.post(`${API_BASE}/api/chat/message`, {
          message: userMessage,
          // opcional: podríamos enviar el historial si lo deseamos
        });

        // El backend devuelve { success: true, response: text }
        const botReply = response.data?.response || response.data?.reply || "Lo siento, no hay respuesta.";

        setTimeout(() => {
          messages.value.push({ from: "bot", text: botReply });
          typing.value = false;
          scrollToBottom();
        }, 600);

      } catch (error) {
        console.error("Error enviando mensaje al chat:", error?.message || error);
        messages.value.push({ from: "bot", text: "No se puede conectar con el asistente ahora. Comprueba tu conexión o inténtalo más tarde." });
        typing.value = false;
        scrollToBottom();
      }
    };
</script>

<style scoped>
@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Icono dentro del botón del chat */
.chat-icon {
  width: 28px;
  height: 28px;
  display: block;
}

/* Ajustes menores para el botón flotante cuando está activo */
.chat-toggle[aria-pressed="true"] {
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}

/* Burbujas de chat: evitar overflow y forzar wrap */
.chat-bubble {
  display: inline-block;
  max-width: 80%;       /* no ocupar más del 80% del contenedor */
  word-wrap: break-word;
  overflow-wrap: anywhere; /* rompe palabras largas si es necesario */
  white-space: pre-wrap;   /* respetar saltos de línea y envolver */
}

/* Modern styles for the chat widget (purple theme) */
.modern-toggle {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background: linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%);
  box-shadow: 0 8px 30px rgba(88,24,163,0.25);
  border: none;
  cursor: pointer;
}
.modern-toggle .chat-icon{ width:32px; height:32px }

.chat-window{
  right: 22px;
  bottom: 100px;
  width: 360px;
  height: 520px;
  z-index: 9999;
  border-radius: 14px;
  overflow: hidden;
  backdrop-filter: blur(6px);
}

.chat-header{
  display:flex;
  align-items:center;
  gap:12px;
  padding:14px 16px;
  background: linear-gradient(90deg,#6D28D9 0%,#8B5CF6 100%);
  color: #fff;
}
.header-logo{ width:40px; height:40px; border-radius:8px; background:#fff; padding:6px }
.header-title .title{ font-weight:700 }
.header-title .subtitle{ font-size:12px; opacity:0.9 }

.chat-messages{ padding:16px; height:360px; }
.chat-messages .chat-bubble{ padding:10px 14px; border-radius:18px }
.chat-messages .d-flex.justify-content-end .chat-bubble{ background: linear-gradient(90deg,#7C3AED,#6D28D9); color:#fff }
.chat-messages .d-flex.align-items-start .chat-bubble{ background:#F3E8FF; color:#2b2b2b }

.chat-input{ padding:12px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); display:flex; gap:8px }
.chat-input-field{ border-radius:999px; padding:10px 14px; border: none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02); outline: none }
.chat-input-field:focus{ box-shadow: 0 0 0 4px rgba(124,58,237,0.12) }
.send-btn{ width:44px; height:44px; border-radius:999px; background:linear-gradient(90deg,#7C3AED,#6D28D9); border:none; display:flex; align-items:center; justify-content:center; box-shadow: 0 6px 20px rgba(99,102,241,0.18); cursor:pointer }
.send-btn svg{ transform: rotate(0deg) }

/* transition */
.fade-slide-enter-active, .fade-slide-leave-active{ transition: all .28s cubic-bezier(.2,.9,.2,1) }
.fade-slide-enter-from{ opacity:0; transform: translateY(12px) }
.fade-slide-enter-to{ opacity:1; transform: translateY(0) }
.fade-slide-leave-from{ opacity:1 }
.fade-slide-leave-to{ opacity:0; transform: translateY(8px) }
</style>