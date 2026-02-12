<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <h4>Elegir método de pago</h4>

      <!-- ============================================== -->
      <!-- SECCIÓN DE CUPÓN DE DESCUENTO                  -->
      <!-- ============================================== -->
      <!-- 
        Esta sección permite al usuario introducir un código de cupón.
        - El input guarda el código en la variable 'codigoCupon'
        - El botón 'Aplicar cupón' llama a la función 'aplicarCupon()'
        - Si el cupón es válido, se muestra el descuento aplicado
        - Si ya hay un cupón aplicado, se muestra un botón para quitarlo
      -->
      <div class="cupon-section mt-3 mb-3">
        <!-- Etiqueta del campo de cupón -->
        <label for="cupon-input" class="cupon-label">
          🎟️ ¿Tienes un código de descuento?
        </label>
        
        <!-- Contenedor flex para el input y botón de aplicar -->
        <div class="cupon-input-group">
          <!-- 
            Input del código de cupón
            - v-model vincula el valor al estado 'codigoCupon'
            - placeholder muestra texto de ayuda
            - :disabled se desactiva si ya hay un cupón aplicado
          -->
          <input 
            id="cupon-input"
            v-model="codigoCupon" 
            type="text" 
            placeholder="Introduce tu código"
            :disabled="cuponAplicado"
            class="cupon-input"
            @keyup.enter="aplicarCupon"
          />
          
          <!-- 
            Botón para aplicar el cupón
            - Solo se muestra si NO hay cupón aplicado
            - Llama a la función aplicarCupon() al hacer click
          -->
          <button 
            v-if="!cuponAplicado" 
            class="btn btn-outline-primary btn-cupon" 
            @click="aplicarCupon"
            :disabled="!codigoCupon.trim()"
          >
            Aplicar cupón
          </button>
          
          <!-- 
            Botón para quitar el cupón aplicado
            - Solo se muestra si HAY un cupón aplicado
            - Llama a la función quitarCupon() al hacer click
          -->
          <button 
            v-else 
            class="btn btn-outline-danger btn-cupon" 
            @click="quitarCupon"
          >
            Quitar cupón
          </button>
        </div>
        
        <!-- 
          Mensaje de error del cupón
          - Solo se muestra si 'errorCupon' tiene contenido
          - Muestra el mensaje de error en rojo
        -->
        <p v-if="errorCupon" class="cupon-error">
          ❌ {{ errorCupon }}
        </p>
        
        <!-- 
          Mensaje de éxito cuando el cupón se aplica correctamente
          - Solo se muestra si 'cuponAplicado' es true
          - Muestra el nombre del cupón y el descuento aplicado
        -->
        <p v-if="cuponAplicado" class="cupon-exito">
          ✅ Cupón "{{ codigoCupon }}" aplicado: -{{ descuentoCupon }}€ 
          ({{ cuponInfo.tipo === 'porcentaje' ? cuponInfo.valor + '%' : cuponInfo.valor + '€' }})
        </p>

        <!-- ============================================== -->
        <!-- CARTEL DE CUPONES DE PRUEBA (para desarrollo) -->
        <!-- ============================================== -->
        <!-- 
          Este cartel muestra los códigos de cupón disponibles para probar.
          Es similar al cartel de credenciales del login.
          PUEDES ELIMINAR ESTE BLOQUE EN PRODUCCIÓN si no quieres 
          que los usuarios vean los códigos.
        -->
        <div class="cupones-prueba mt-2">
          <div class="alert alert-info py-2 mb-0">
            <strong><i class="bi bi-ticket-perforated me-1"></i> Cupones de prueba:</strong>
            <div class="cupones-lista">
              <span class="cupon-badge"><code>CUPON500</code> → 500€</span>
              <span class="cupon-badge"><code>CUPON2000</code> → 2.000€</span>
              <span class="cupon-badge"><code>CUPON5000</code> → 5.000€</span>
            </div>
          </div>
        </div>
        <!-- ============================================== -->
        <!-- FIN CARTEL CUPONES DE PRUEBA                  -->
        <!-- ============================================== -->
      </div>
      <!-- ============================================== -->
      <!-- FIN SECCIÓN DE CUPÓN                           -->
      <!-- ============================================== -->

      <!-- 
        Resumen de precios con descuento aplicado
        - Muestra el subtotal original
        - Si hay cupón, muestra la línea de descuento
        - Muestra el total final
      -->
      <div class="resumen-precios mb-3">
        <div class="precio-linea">
          <span>Subtotal:</span>
          <span>{{ cesta.totalPrecio }}€</span>
        </div>
        <!-- Línea de descuento: solo visible si hay cupón aplicado -->
        <div v-if="cuponAplicado" class="precio-linea descuento">
          <span>Descuento ({{ codigoCupon }}):</span>
          <span class="texto-descuento">-{{ descuentoCupon }}€</span>
        </div>
        <!-- Total final con o sin descuento -->
        <div class="precio-linea total">
          <span><strong>Total a pagar:</strong></span>
          <span><strong>{{ totalConDescuento }}€</strong></span>
        </div>
      </div>

      <div class="options">
        <button class="option-btn" @click="seleccionar('tarjeta')">Pago con tarjeta</button>
        <button class="option-btn" @click="seleccionar('transferencia')">Transferencia bancaria</button>
        <button class="option-btn" @click="seleccionar('financiacion')">Financiación</button>
      </div>

          <div v-if="metodo === 'tarjeta'" class="mt-3">
            <p>Se abrirá Stripe Checkout para procesar el pago seguro con tarjeta.</p>
            <div class="mt-2">
              <button class="btn btn-primary" @click="confirmarTarjeta">Pagar con tarjeta (Stripe Checkout) — {{ formatoImporte }}</button>
              <button class="btn btn-link" @click="resetear">Volver</button>
            </div>
          </div>

      <div v-if="metodo === 'transferencia'" class="mt-3">
        <p>Por favor realiza una transferencia a:</p>
        <ul>
          <li>Banco: Banco Ejemplo</li>
          <li>IBAN: ES00 0000 0000 0000 0000</li>
          <li>Concepto: Compra {{ referencia }}</li>
        </ul>
        <div class="mt-2">
          <button class="btn btn-primary" @click="confirmarTransferencia">He realizado la transferencia</button>
          <button class="btn btn-link" @click="resetear">Volver</button>
        </div>
      </div>

      <div class="mt-3 text-end">
        <button class="btn btn-secondary" @click="close">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCestaStore } from '@/store/cesta'
import { getClienteLogueado } from '@/api/clientes'

const emit = defineEmits(['close','financing','paid','require-client'])
const cesta = useCestaStore()

const metodo = ref('')
const tarjeta = ref({ numero:'', exp:'', cvc:'' })
const referencia = generateRef()
const clienteData = ref(null)
const cargandoCliente = ref(true)

// ============================================== 
// VARIABLES PARA EL SISTEMA DE CUPONES
// ============================================== 
/**
 * codigoCupon: String que guarda el código introducido por el usuario
 * - Se vincula al input con v-model
 * - Se usa para buscar el cupón en la lista de cupones válidos
 */
const codigoCupon = ref('')

/**
 * cuponAplicado: Booleano que indica si hay un cupón activo
 * - true = hay un cupón válido aplicado
 * - false = no hay cupón o el cupón introducido no era válido
 */
const cuponAplicado = ref(false)

/**
 * errorCupon: String con el mensaje de error si el cupón no es válido
 * - Se muestra en rojo debajo del input
 * - Se limpia cuando el usuario aplica un cupón válido o lo quita
 */
const errorCupon = ref('')

/**
 * cuponInfo: Objeto con la información del cupón aplicado
 * - tipo: 'porcentaje' o 'fijo' (tipo de descuento)
 * - valor: número (porcentaje o cantidad fija en euros)
 * - nombre: string (nombre descriptivo del cupón)
 */
const cuponInfo = ref(null)

/**
 * CUPONES_VALIDOS: Lista de cupones aceptados por el sistema
 * 
 * CÓMO AÑADIR UN NUEVO CUPÓN:
 * 1. Añade un nuevo objeto al array con:
 *    - codigo: el código que el usuario debe escribir (en MAYÚSCULAS)
 *    - tipo: 'porcentaje' (ej: 10% de descuento) o 'fijo' (ej: 5€ de descuento)
 *    - valor: el número del descuento
 *    - nombre: nombre descriptivo para mostrar al usuario
 *    - minimo: (opcional) compra mínima requerida para usar el cupón
 *    - activo: true/false para activar/desactivar el cupón
 *    - fechaExpiracion: (opcional) fecha límite del cupón en formato 'YYYY-MM-DD'
 * 
 * EJEMPLO para añadir cupón del 15%:
 * { codigo: 'VERANO15', tipo: 'porcentaje', valor: 15, nombre: 'Descuento verano', activo: true }
 * 
 * EJEMPLO para añadir cupón de 20€ fijos:
 * { codigo: 'REGALO20', tipo: 'fijo', valor: 20, nombre: 'Regalo especial', minimo: 50, activo: true }
 */
const CUPONES_VALIDOS = [
  // ============================================== 
  // CUPONES PARA COMPRA DE VEHÍCULOS
  // Descuentos fijos en euros para coches
  // ============================================== 
  
  // Cupón de 500€ de descuento
  { 
    codigo: 'CUPON500',         // Código que debe escribir el usuario
    tipo: 'fijo',               // Tipo: cantidad fija en euros
    valor: 500,                 // 500€ de descuento
    nombre: 'Cupón 500€',       // Nombre para mostrar
    activo: true                // Cupón activo
  },
  
  // Cupón de 2000€ de descuento
  { 
    codigo: 'CUPON2000',        // Código que debe escribir el usuario
    tipo: 'fijo',               // Tipo: cantidad fija en euros
    valor: 2000,                // 2000€ de descuento
    nombre: 'Cupón 2000€',      // Nombre para mostrar
    activo: true                // Cupón activo
  },
  
  // Cupón de 5000€ de descuento
  { 
    codigo: 'CUPON5000',        // Código que debe escribir el usuario
    tipo: 'fijo',               // Tipo: cantidad fija en euros
    valor: 5000,                // 5000€ de descuento
    nombre: 'Cupón 5000€',      // Nombre para mostrar
    activo: true                // Cupón activo
  }
  
  // ============================================== 
  // AÑADE MÁS CUPONES AQUÍ SIGUIENDO EL MISMO FORMATO:
  // { codigo: 'CUPON1000', tipo: 'fijo', valor: 1000, nombre: 'Cupón 1000€', activo: true }
  // ============================================== 
]

/**
 * descuentoCupon: Computed que calcula el descuento en euros
 * - Si el tipo es 'porcentaje': calcula el % sobre el totalPrecio
 * - Si el tipo es 'fijo': devuelve el valor directamente
 * - Redondea a 2 decimales para evitar problemas con céntimos
 * - El descuento nunca puede ser mayor que el total de la cesta
 */
const descuentoCupon = computed(() => {
  // Si no hay cupón aplicado, el descuento es 0
  if (!cuponAplicado.value || !cuponInfo.value) return 0
  
  let descuento = 0
  
  // Calcular descuento según el tipo de cupón
  if (cuponInfo.value.tipo === 'porcentaje') {
    // Para porcentaje: (totalPrecio * porcentaje) / 100
    descuento = (cesta.totalPrecio * cuponInfo.value.valor) / 100
  } else if (cuponInfo.value.tipo === 'fijo') {
    // Para fijo: el valor directamente en euros
    descuento = cuponInfo.value.valor
  }
  
  // Asegurarse de que el descuento no supere el total
  // (no queremos totales negativos)
  if (descuento > cesta.totalPrecio) {
    descuento = cesta.totalPrecio
  }
  
  // Redondear a 2 decimales
  return Math.round(descuento * 100) / 100
})

/**
 * totalConDescuento: Computed que calcula el precio final
 * - Resta el descuento del precio total de la cesta
 * - Se usa en todos los lugares donde se muestra el total a pagar
 */
const totalConDescuento = computed(() => {
  const total = cesta.totalPrecio - descuentoCupon.value
  // Asegurar que nunca sea negativo y redondear a 2 decimales
  return Math.round(Math.max(0, total) * 100) / 100
})

/**
 * aplicarCupon: Función que valida y aplica un código de cupón
 * 
 * PROCESO DE VALIDACIÓN:
 * 1. Limpia errores anteriores
 * 2. Convierte el código a mayúsculas (los cupones no distinguen mayúsculas)
 * 3. Busca el cupón en la lista de CUPONES_VALIDOS
 * 4. Verifica que el cupón esté activo
 * 5. Verifica si hay compra mínima requerida
 * 6. Verifica si el cupón ha expirado
 * 7. Si todo es correcto, aplica el cupón
 * 
 * CÓMO MODIFICAR LA VALIDACIÓN:
 * - Para añadir más validaciones, añade más condiciones if después del paso 3
 * - Para cambiar los mensajes de error, modifica las asignaciones a errorCupon.value
 */
function aplicarCupon() {
  // Paso 1: Limpiar error anterior
  errorCupon.value = ''
  
  // Paso 2: Obtener código en mayúsculas y sin espacios
  const codigo = codigoCupon.value.trim().toUpperCase()
  
  // Verificar que se ha introducido algo
  if (!codigo) {
    errorCupon.value = 'Por favor, introduce un código de cupón'
    return
  }
  
  // Paso 3: Buscar el cupón en la lista de cupones válidos
  // find() devuelve el primer cupón que coincida o undefined si no existe
  const cupon = CUPONES_VALIDOS.find(c => c.codigo === codigo)
  
  // Si no se encuentra el cupón
  if (!cupon) {
    errorCupon.value = 'El código introducido no es válido'
    return
  }
  
  // Paso 4: Verificar que el cupón esté activo
  if (!cupon.activo) {
    errorCupon.value = 'Este cupón ya no está disponible'
    return
  }
  
  // Paso 5: Verificar compra mínima (si el cupón la tiene)
  if (cupon.minimo && cesta.totalPrecio < cupon.minimo) {
    errorCupon.value = `Este cupón requiere una compra mínima de ${cupon.minimo}€`
    return
  }
  
  // Paso 6: Verificar fecha de expiración (si el cupón la tiene)
  if (cupon.fechaExpiracion) {
    const hoy = new Date()
    const fechaExp = new Date(cupon.fechaExpiracion)
    if (hoy > fechaExp) {
      errorCupon.value = 'Este cupón ha expirado'
      return
    }
  }
  
  // Paso 7: Todo correcto - aplicar el cupón
  cuponInfo.value = cupon           // Guardar info del cupón
  cuponAplicado.value = true        // Marcar como aplicado
  codigoCupon.value = codigo        // Guardar código en mayúsculas
  
  // Log para depuración (puedes quitarlo en producción)
  console.log('Cupón aplicado:', cupon)
}

/**
 * quitarCupon: Función para eliminar el cupón aplicado
 * - Resetea todas las variables relacionadas con el cupón
 * - Permite al usuario probar otro cupón diferente
 */
function quitarCupon() {
  codigoCupon.value = ''          // Limpiar código
  cuponAplicado.value = false     // Desmarcar como aplicado
  cuponInfo.value = null          // Limpiar info del cupón
  errorCupon.value = ''           // Limpiar errores
  
  console.log('Cupón eliminado')
}
// ============================================== 
// FIN SISTEMA DE CUPONES
// ==============================================

function generateRef(){
  return Math.random().toString(36).substring(2,10) + '-' + Date.now().toString().slice(-4)
}

/**
 * formatoImporte: Computed que muestra el importe a pagar
 * - MODIFICADO: Ahora usa totalConDescuento en lugar de cesta.totalPrecio
 * - Así el botón de pago muestra el precio con el descuento aplicado
 */
const formatoImporte = computed(()=>`${totalConDescuento.value} €`)

// Cargar datos del cliente desde el backend (db.json) al montar el componente
onMounted(async () => {
  cargandoCliente.value = true
  
  // Primero intentar obtener los datos del cliente logueado desde el backend
  try {
    const logged = await getClienteLogueado()
    if (logged && (logged.nombre || logged.dni)) {
      clienteData.value = {
        nombre: `${logged.nombre || ''} ${logged.apellidos || ''}`.trim(),
        nif: logged.dni || '',
        email: logged.email || '',
        telefono: logged.movil || '',
        direccion: logged.direccion || ''
      }
      // Guardar también en sessionStorage para compatibilidad con otros componentes
      sessionStorage.setItem('cliente', JSON.stringify(clienteData.value))
    }
  } catch (e) {
    console.warn('No se pudo obtener cliente logueado desde el backend', e)
  }

  // Si no hay cliente del backend, intentar leer de sessionStorage como fallback
  if (!clienteData.value) {
    try {
      const raw = sessionStorage.getItem('cliente')
      if (raw) {
        clienteData.value = JSON.parse(raw)
      }
    } catch (e) {
      console.warn('No se pudo leer cliente desde sessionStorage', e)
    }
  }

  cargandoCliente.value = false
})

// Función auxiliar para verificar si hay datos del cliente disponibles
async function verificarCliente() {
  // Si ya tenemos datos del cliente cargados, retornar true
  if (clienteData.value && (clienteData.value.nombre || clienteData.value.nif)) {
    return true
  }
  
  // Intentar cargar desde el backend una vez más
  try {
    const logged = await getClienteLogueado()
    if (logged && (logged.nombre || logged.dni)) {
      clienteData.value = {
        nombre: `${logged.nombre || ''} ${logged.apellidos || ''}`.trim(),
        nif: logged.dni || '',
        email: logged.email || '',
        telefono: logged.movil || '',
        direccion: logged.direccion || ''
      }
      sessionStorage.setItem('cliente', JSON.stringify(clienteData.value))
      return true
    }
  } catch (e) {
    console.warn('No se pudo verificar cliente desde el backend', e)
  }

  return false
}

async function seleccionar(m){
  // Antes de permitir elegir cualquier método, asegurarnos de que existen los datos del cliente
  const tieneCliente = await verificarCliente()
  if (!tieneCliente) {
    emit('require-client')
    return
  }

  if (m === 'financiacion'){
    // ============================================== 
    // GUARDAR INFO DEL CUPÓN PARA FINANCIACIÓN
    // ============================================== 
    /**
     * Guardamos la información del cupón antes de emitir 'financing'
     * para que la factura pueda mostrar el descuento aplicado
     */
    if (cuponAplicado.value && cuponInfo.value) {
      sessionStorage.setItem('cuponInfo', JSON.stringify({
        codigo: codigoCupon.value,
        descuento: descuentoCupon.value,
        tipo: cuponInfo.value.tipo,
        valor: cuponInfo.value.valor
      }))
    } else {
      sessionStorage.removeItem('cuponInfo')
    }
    // ============================================== 
    
    // financiar: llevar a la sección de factura
    emit('financing')
    return
  }
  metodo.value = m
}

async function confirmarTarjeta(){
  // Antes de crear la sesión, asegurarnos que hay datos del cliente
  const tieneCliente = await verificarCliente()
  if (!tieneCliente) {
    emit('require-client')
    return
  }

  try{
    // ============================================== 
    // GUARDAR INFO DEL CUPÓN ANTES DE PAGAR
    // ============================================== 
    /**
     * Guardamos la información del cupón en sessionStorage
     * para que la factura pueda mostrar el descuento aplicado
     */
    if (cuponAplicado.value && cuponInfo.value) {
      sessionStorage.setItem('cuponInfo', JSON.stringify({
        codigo: codigoCupon.value,
        descuento: descuentoCupon.value,
        tipo: cuponInfo.value.tipo,
        valor: cuponInfo.value.valor
      }))
    } else {
      // Limpiar si no hay cupón
      sessionStorage.removeItem('cuponInfo')
    }
    // ============================================== 
    
    // Llamar al backend para crear Checkout Session
    // MODIFICADO: Usar totalConDescuento en lugar de cesta.totalPrecio
    const resp = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: totalConDescuento.value,  // Precio con descuento aplicado
        description: cuponAplicado.value 
          ? `Compra Vilataboas (Cupón: ${codigoCupon.value})` 
          : 'Compra Vilataboas'
      })
    })

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({ error: 'error' }))
      alert('No se pudo iniciar el pago: ' + (err.error || 'error del servidor'))
      return
    }

    const data = await resp.json()
    if (data && data.url) {
      // Redirigir al Checkout de Stripe
      window.location.href = data.url
      return
    }

    alert('No se obtuvo la URL de pago de Stripe.')
  } catch (e) {
    console.error('confirmarTarjeta error', e)
    alert('Error al procesar el pago. Inténtelo de nuevo más tarde.')
  }
}

async function confirmarTransferencia(){
  // comprobar que existen datos del cliente
  const tieneCliente = await verificarCliente()
  if (!tieneCliente) {
    emit('require-client')
    return
  }

  // ============================================== 
  // GUARDAR INFO DEL CUPÓN PARA LA FACTURA
  // ============================================== 
  /**
   * Guardamos la información del cupón en sessionStorage
   * para que la factura pueda mostrar el descuento aplicado
   */
  if (cuponAplicado.value && cuponInfo.value) {
    sessionStorage.setItem('cuponInfo', JSON.stringify({
      codigo: codigoCupon.value,
      descuento: descuentoCupon.value,
      tipo: cuponInfo.value.tipo,
      valor: cuponInfo.value.valor
    }))
  } else {
    sessionStorage.removeItem('cuponInfo')
  }
  // ============================================== 

  alert('Gracias. Cuando confirmemos la transferencia se procesará el pedido.')
  
  // MODIFICADO: Incluir información del cupón en el payload del pago
  emit('paid', { 
    metodo: 'transferencia', 
    referencia,
    // Añadir info del cupón si existe
    cupon: cuponAplicado.value ? {
      codigo: codigoCupon.value,
      descuento: descuentoCupon.value
    } : null,
    totalFinal: totalConDescuento.value
  })
  emit('close')
}

function resetear(){ metodo.value = '' }
function close(){ emit('close') }
</script>

<style scoped>
.modal-backdrop{
  position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:2000;
}
.modal-card{ background:white; padding:18px; border-radius:8px; width:420px; max-width:90%; }
.options{ display:flex; gap:8px; justify-content:space-between; }
.option-btn{ flex:1; padding:8px 10px; border-radius:6px; border:1px solid #ddd; background:#f8f9fa; cursor:pointer }
input{ width:100%; padding:6px; margin:6px 0 10px; }

/* ============================================== */
/* ESTILOS PARA LA SECCIÓN DE CUPÓN              */
/* ============================================== */

/**
 * Contenedor principal de la sección de cupón
 * - Fondo gris claro para destacar del resto
 * - Bordes redondeados y padding interno
 */
.cupon-section {
  background-color: #f8f9fa;    /* Fondo gris claro */
  border: 1px solid #e9ecef;    /* Borde sutil */
  border-radius: 8px;           /* Esquinas redondeadas */
  padding: 12px 15px;           /* Espaciado interno */
}

/**
 * Etiqueta del campo de cupón
 * - Negrita y con icono de ticket
 */
.cupon-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #495057;
}

/**
 * Grupo input + botón en línea
 * - Flexbox para alinear horizontalmente
 */
.cupon-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

/**
 * Input del código de cupón
 * - Ocupa el espacio disponible (flex: 1)
 * - Bordes y padding para mejor apariencia
 */
.cupon-input {
  flex: 1;
  padding: 10px 12px !important;
  border: 1px solid #ced4da !important;
  border-radius: 6px;
  font-size: 14px;
  margin: 0 !important;
}

/**
 * Input deshabilitado (cuando hay cupón aplicado)
 */
.cupon-input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

/**
 * Botón de aplicar/quitar cupón
 * - Ancho fijo para consistencia visual
 */
.btn-cupon {
  white-space: nowrap;
  padding: 10px 16px;
  font-size: 14px;
}

/**
 * Mensaje de error del cupón
 * - Color rojo y tamaño pequeño
 */
.cupon-error {
  color: #dc3545;
  font-size: 13px;
  margin: 8px 0 0 0;
}

/**
 * Mensaje de éxito cuando el cupón es válido
 * - Color verde y tamaño pequeño
 */
.cupon-exito {
  color: #198754;
  font-size: 13px;
  margin: 8px 0 0 0;
  font-weight: 500;
}

/* ============================================== */
/* ESTILOS PARA EL RESUMEN DE PRECIOS            */
/* ============================================== */

/**
 * Contenedor del resumen de precios
 */
.resumen-precios {
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px 15px;
}

/**
 * Cada línea del resumen (subtotal, descuento, total)
 */
.precio-linea {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

/**
 * Línea de descuento - color diferente para destacar
 */
.precio-linea.descuento {
  color: #198754;  /* Verde para indicar ahorro */
}

/**
 * Texto del descuento con formato especial
 */
.texto-descuento {
  font-weight: 600;
}

/**
 * Línea del total final
 * - Borde superior para separar
 * - Fuente más grande
 */
.precio-linea.total {
  border-top: 1px solid #dee2e6;
  margin-top: 8px;
  padding-top: 8px;
  font-size: 16px;
}

/* ============================================== */
/* ESTILOS PARA EL CARTEL DE CUPONES DE PRUEBA   */
/* ============================================== */

/**
 * Contenedor del cartel de cupones de prueba
 * - Estilo similar al cartel de credenciales del login
 */
.cupones-prueba .alert {
  font-size: 13px;
  border-radius: 6px;
}

/**
 * Lista de cupones en formato horizontal
 * - Usa flexbox para distribuir los cupones
 * - Se adapta a pantallas pequeñas
 */
.cupones-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

/**
 * Cada cupón individual como badge
 * - Fondo blanco semi-transparente
 * - Bordes redondeados
 */
.cupon-badge {
  background: rgba(255, 255, 255, 0.7);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/**
 * Código del cupón dentro del badge
 * - Color azul para destacar
 * - Fondo gris claro
 */
.cupon-badge code {
  background: #e9ecef;
  padding: 2px 5px;
  border-radius: 3px;
  color: #0d6efd;
  font-weight: 600;
}

/* ============================================== */
/* FIN ESTILOS CARTEL CUPONES                    */
/* ============================================== */

/* ============================================== */
/* FIN ESTILOS CUPÓN                             */
/* ============================================== */
</style>
