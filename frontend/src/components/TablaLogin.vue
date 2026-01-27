<template>
  <div class="d-flex flex-column justify-content-center align-items-center vh-75 mt-5">
    <div class="text-center mb-4">
        <!-- Logo arriba del login -->
        <img src="@/assets/logoEmpresaTeis.svg" alt="Logo Empresa" class="login-logo mb-3" />
        <h5 class="fw-bold text-uppercase text-primary position-relative d-inline-block">
          <i class="bi bi-people-fill me-2 fs-3"></i>
          Iniciar sesión
          <span class="underline-effect"></span>
        </h5>
      </div>

    <div class="border p-4 shadow-sm rounded w-100" style="max-width: 400px;">
      <form @submit.prevent="iniciarSesion">
        <div class="mb-3">
          <label for="dni" class="form-label fw-bold">DNI:</label>
          <input type="text" id="dni" autocomplete="off" @blur="capitalizarTexto" class="form-control text-center"
            v-model="dni" required />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label fw-bold">Contraseña:</label>
          <input type="password" id="password" autocomplete="new-password" class="form-control" v-model="pass" placeholder="Más de 4 caracteres"
            required />
        </div>

        <div class="text-center">
          <button type="submit" class="btn btn-primary w-50">Iniciar sesión</button>
        </div>

        <div class="text-center mt-3">
          <p class="text-muted mb-0">
            ¿No tienes cuenta? <router-link to="/clientes" class="text-primary fw-bold text-decoration-none">Regístrate</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
// DEBE QUEDAR CLARO QUE ESTA É UNHA SIMULACIÓN DE LOGIN PARA FINS DIDÁCTICOS CON JSON-SERVER
// EN NINGÚN CASO DEBE USARSE ESTA IMPLEMENTACIÓN EN PRODUCCIÓN
// PARA UNHA APLICACIÓN REAL, O LOGIN DEBE XESTIONARSE NO LADO DO SERVIDOR CON HTTPS Y JWT SEGURO

import Swal from 'sweetalert2';
import { loginUsuario } from "@/api/authApi.js";
export default {
  name: "TablaLogin",
  data() {
    return {
      dni: "",
      pass: "",
    };
  },

  computed: {
    formularioValido() {
      return this.pass.length > 4 && this.verificarDNI(this.dni);
    }
  },

  methods: {
    verificarDNI(dni) {
      const dniRegex = /^[0-9]{8}[A-Za-z]$/;
      return dniRegex.test(dni);
    },

    async iniciarSesion() {
      // Asegurar formato del DNI y validar formulario antes de enviar
      this.dni = this.dni.toUpperCase().trim();
      if (!this.formularioValido) {
        Swal.fire({
          title: "Formulario inválido",
          text: "El DNI debe tener 8 dígitos y una letra, y la contraseña más de 4 caracteres.",
          icon: "warning",
          confirmButtonText: "Aceptar"
        });
        return;
      }

      try {
        const data = await loginUsuario(this.dni, this.pass);

        // Guardar token y datos del usuario en sessionStorage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userName', data.nombre);

        // Extraer DNI desde el payload del JWT y guardarlo como identificador estable
        try {
          if (data.token) {
            const parts = data.token.split('.');
            if (parts.length >= 2) {
              const payload = JSON.parse(atob(parts[1]));
              if (payload && payload.dni) {
                sessionStorage.setItem('dni', payload.dni);
              }
            }
          }
        } catch (e) {
          console.warn('No se pudo parsear el token para extraer DNI:', e);
        }

        // Migración compatibilidad: si hay una cesta guardada con la clave antigua basada en token
        // (cesta_<token>), fusionarla en la nueva clave basada en DNI (cesta_<dni>) y eliminar la antigua.
        try {
          const tokenOld = data.token;
          const dniForKey = sessionStorage.getItem('dni');
          if (tokenOld && dniForKey && typeof localStorage !== 'undefined') {
            const oldKey = `cesta_${tokenOld}`;
            const newKey = `cesta_${dniForKey}`;
            if (oldKey !== newKey) {
              const oldRaw = localStorage.getItem(oldKey);
              if (oldRaw) {
                try {
                  const oldItems = JSON.parse(oldRaw || '[]');
                  const newRawExisting = localStorage.getItem(newKey);
                  const newItemsExisting = newRawExisting ? JSON.parse(newRawExisting || '[]') : [];
                  // merge oldItems into newItemsExisting
                  const map = new Map();
                  for (const it of newItemsExisting) {
                    if (!it || !it.id) continue;
                    map.set(it.id, { ...it });
                  }
                  for (const it of oldItems) {
                    if (!it || !it.id) continue;
                    if (map.has(it.id)) {
                      const ex = map.get(it.id);
                      ex.cantidad = (ex.cantidad || 0) + (it.cantidad || 0);
                      map.set(it.id, ex);
                    } else {
                      map.set(it.id, { ...it });
                    }
                  }
                  const merged = Array.from(map.values());
                  localStorage.setItem(newKey, JSON.stringify(merged));
                } catch (e) {
                  // parsing error: fallback to moving the raw value
                  localStorage.setItem(newKey, oldRaw);
                }
                // remove old key after migration
                try { localStorage.removeItem(oldKey); } catch (e) { /* noop */ }
              }
            }
          }
        } catch (e) {
          console.warn('Error migrando cesta basada en token a cesta basada en dni:', e);
        }

        // Fusionar la cesta de invitado (cesta_guest) en la cesta del usuario (cesta_<dni>)
        try {
          const dni = sessionStorage.getItem('dni');
          if (dni && typeof localStorage !== 'undefined') {
            const userKey = `cesta_${dni}`;
            const guestRaw = localStorage.getItem('cesta_guest');
            const userRaw = localStorage.getItem(userKey);

            const guestItems = guestRaw ? JSON.parse(guestRaw || '[]') : [];
            const userItems = userRaw ? JSON.parse(userRaw || '[]') : [];

            // Build map from userItems
            const map = new Map();
            for (const it of userItems) {
              if (!it || !it.id) continue;
              map.set(it.id, { ...it });
            }
            // Merge guest items, summing quantities
            for (const it of guestItems) {
              if (!it || !it.id) continue;
              if (map.has(it.id)) {
                const existing = map.get(it.id);
                existing.cantidad = (existing.cantidad || 0) + (it.cantidad || 0);
                map.set(it.id, existing);
              } else {
                map.set(it.id, { ...it });
              }
            }

            const merged = Array.from(map.values());
            localStorage.setItem(userKey, JSON.stringify(merged));

            // Eliminar la cesta_guest para evitar duplicados futuros
            try { localStorage.removeItem('cesta_guest'); } catch (e) { /* noop */ }
          }
        } catch (e) {
          console.warn('Error al fusionar cesta guest en user:', e);
        }

        Swal.fire({
          title: "Bienvenido",
          text: `Hola ${data.nombre}`,
          icon: "success",
          showConfirmButton: false,
          timer: 2000
        });
        // Redirigir a la página de inicio y recargar con $router
        // $router se usa para evitar problemas de historial en SPA
        // window.location.reload() recarga la página para reflejar el estado autenticado
        this.$router.push({ name: 'Inicio' }).then(() => window.location.reload());

      } catch (error) {
        console.error("Error en iniciarSesion:", error);
        // Intentar mostrar el mensaje concreto devuelto por el backend
        const serverMessage = error && error.response && error.response.data && error.response.data.message;
        Swal.fire({
          title: "Error de autenticación",
          text: serverMessage || "Error usuario o contraseña. Verifica tus credenciales.",
          icon: "error",
          confirmButtonText: "Aceptar"
        });
      }
    },
    // Función única: capitaliza y asigna en el mismo paso
    capitalizarTexto() {
      this.dni = this.dni.toUpperCase().trim();
    }
  }
};
</script>

<style>
.form-label {
  background-color: transparent !important;
  margin-bottom: 0.5rem;
}

/* Estilos para el logo en la pantalla de login */
.login-logo {
  width: 72px;
  height: auto;
  object-fit: contain;
}
</style>