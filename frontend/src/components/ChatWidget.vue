<template>
  <div>
    <!-- Botón flotante -->
    <button
      class="btn btn-success rounded-circle shadow position-fixed d-flex align-items-center justify-content-center chat-toggle"
      style="bottom: 20px; right: 20px; width: 60px; height: 60px; z-index: 9999;"
      @click="toggleChat"
      aria-label="Abrir chat"
      title="Abrir chat"
    >
      <img src="@/assets/logo-chat-bubble-white.svg" alt="Chat" class="chat-icon" />
    </button>

    <!-- Ventana del chat -->
    <div
      v-if="open"
      class="card shadow position-fixed"
      style="bottom: 90px; right: 20px; width: 320px; height: 450px; z-index: 9999; animation: slideUp .3s;"
    >
      <!-- Header -->
      <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <span>Asistente IA</span>
        <button class="btn-close btn-close-white" @click="toggleChat"></button>
      </div>

      <!-- Mensajes -->
      <div class="card-body overflow-auto" style="height: 330px;" ref="messageContainer">
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
      <div class="card-footer d-flex">
        <input
          type="text"
          class="form-control me-2"
          placeholder="Escribe un mensaje..."
          v-model="input"
          @keyup.enter="send"
        >
        <button class="btn btn-success" @click="send">Enviar</button>
      </div>
    </div>
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
</style>