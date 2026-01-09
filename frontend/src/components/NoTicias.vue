<template>
  <div class="container py-4">
    <h4 class="text-center my-2 bg-primary-subtle text-primary p-3 rounded mb-4">
      <i class="bi bi-newspaper"></i> Noticias
    </h4>

    <!-- Formulario de creación / edición -->
    <form @submit.prevent="guardarNoticia" class="mb-4">
      <div class="card shadow-sm p-4 mb-5">
        <div class="mb-3">
          <label class="form-label fw-semibold">Título:</label>
          <input
            type="text"
            class="form-control"
            v-model="nuevaNoticia.titulo"
            placeholder="Introduce el título de la noticia"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Contenido:</label>
          <textarea
            class="form-control"
            rows="4"
            placeholder="Escribe el contenido de la noticia"
            v-model="nuevaNoticia.contenido"
            required
          ></textarea>
        </div>

        <div class="text-center">
          <button type="submit" class="btn btn-primary fw-bold">
            {{ editando ? "Modificar" : "Publicar" }}
          </button>
        </div>
      </div>
    </form>

    <!-- Noticias dinámicas -->
    <div
      v-for="noticia in noticias"
      :key="noticia.id"
      class="card mb-3 shadow-sm"
      :aria-expanded="String(expandidas.has(noticia.id))"
      role="button"
      tabindex="0"
    >
      <div class="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
        <h5 class="mb-0 text-primary fw-semibold">{{ noticia.titulo }}</h5>
        <div class="d-flex align-items-center gap-2">
          <small class="text-muted text-nowrap">
            <i class="bi bi-calendar-event me-1"></i>
            {{ formatearFecha(noticia.fecha_publicacion) }}
          </small>
          <button
            @click.stop="editarNoticia(noticia.id)"
            class="btn btn-outline-primary btn-sm shadow-none rounded"
            title="Editar noticia"
            aria-label="Editar noticia"
          >
            <i class="bi bi-pencil"></i>
          </button>
          <button
            @click.stop="eliminarNoticia(noticia.id)"
            class="btn btn-outline-danger btn-sm shadow-none rounded"
            title="Eliminar noticia"
            aria-label="Eliminar noticia"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>

      <div class="card-body">
        <transition name="fade" mode="out-in">
          <p
            :key="String(expandidas.has(noticia.id))"
            class="card-text mb-0 text-secondary lh-base"
          >
            {{
              expandidas.has(noticia.id)
                ? noticia.contenido
                : truncarTexto(noticia.contenido, 256)
            }}
          </p>
        </transition>

        <div
          v-if="noticia.contenido && noticia.contenido.length > 256"
          class="text-end mt-2"
        >
          <button
            class="btn btn-link p-0 text-primary fw-bold"
            @click.stop="toggleNoticia(noticia.id)"
            :aria-expanded="String(expandidas.has(noticia.id))"
          >
            {{ expandidas.has(noticia.id) ? "Ver menos ▲" : "Ver más ▼" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Si no hay noticias -->
    <div v-if="noticias.length === 0" class="text-center text-muted">
      <p>No hay noticias disponibles.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Swal from "sweetalert2";
import { getNoticias, addNoticia, deleteNoticia, updateNoticia } from "@/api/noticias.js";

const noticias = ref([]);
const expandidas = ref(new Set());

const editando = ref(false);
const noticiaEditandoId = ref(null);

const nuevaNoticia = ref({
  titulo: "",
  contenido: "",
  fecha_publicacion: "",
});

const noticiaVacia = { titulo: "", contenido: "", fecha_publicacion: "" };

onMounted(async () => {
  await cargarNoticias();
});

const updateTabla = async () => {
  const data = await getNoticias();
  noticias.value = data.sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));
};

const cargarNoticias = async () => {
  await updateTabla();
};

const toggleNoticia = (id) => {
  if (expandidas.value.has(id)) {
    expandidas.value.delete(id);
  } else {
    expandidas.value.add(id);
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";
  const date = new Date(fecha);
  return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
};

const truncarTexto = (texto, maxCaracteres) => {
  if (!texto || texto.length <= maxCaracteres) return texto;
  return texto.substring(0, maxCaracteres) + "...";
};

const guardarNoticia = async () => {
  const result = await Swal.fire({
    title: editando.value ? "¿Desea modificar esta noticia?" : "¿Desea grabar esta noticia?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: editando.value ? "Modificar" : "Grabar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    if (editando.value) {
      await updateNoticia(noticiaEditandoId.value, nuevaNoticia.value);
      Swal.fire({ icon: "success", title: "Noticia modificada correctamente", timer: 1500, showConfirmButton: false });
    } else {
      nuevaNoticia.value.fecha_publicacion = new Date().toISOString().split("T")[0];
      await addNoticia(nuevaNoticia.value);
      Swal.fire({ icon: "success", title: "Noticia agregada correctamente", timer: 1500, showConfirmButton: false });
    }

    nuevaNoticia.value = { ...noticiaVacia };
    editando.value = false;
    noticiaEditandoId.value = null;
    await updateTabla();
  } catch (error) {
    console.error("Error al guardar la noticia:", error);
    Swal.fire({ icon: "error", title: "Error al guardar la noticia", text: "Inténtelo de nuevo.", timer: 1500, showConfirmButton: false });
  }
};

const editarNoticia = (id) => {
  const noticia = noticias.value.find((n) => n.id === id);
  if (!noticia) {
    Swal.fire({ icon: "error", title: "Noticia no encontrada", timer: 1500, showConfirmButton: false });
    return;
  }
  nuevaNoticia.value = { ...noticia };
  editando.value = true;
  noticiaEditandoId.value = noticia.id;
};

const eliminarNoticia = async (id) => {
  const noticiaAEliminar = noticias.value.find((n) => n.id === id);
  if (!noticiaAEliminar) {
    Swal.fire({ icon: "error", title: "Noticia no encontrada", timer: 1500, showConfirmButton: false });
    return;
  }

  const result = await Swal.fire({
    title: `¿Eliminar la noticia "${noticiaAEliminar.titulo}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  await deleteNoticia(noticiaAEliminar.id);
  await updateTabla();

  Swal.fire({ icon: "success", title: "Noticia eliminada", timer: 1500, showConfirmButton: false });
};
</script>

<style scoped>
.container {
  max-width: 800px;
}
.btn-primary {
  background-color: #4a6cf7;
  border: none;
}
.btn-primary:hover {
  background-color: #3a5de0;
}
.card {
  border-radius: 12px;
  border: 1px solid rgba(16, 24, 40, 0.12);
  background: #fff;
  overflow: hidden;
}
.card + .card {
  margin-top: 1rem;
}
.card-header {
  background: transparent;
  border-bottom: 1px solid rgba(16, 24, 40, 0.12);
  padding: 0.85rem 1rem;
}
</style>
