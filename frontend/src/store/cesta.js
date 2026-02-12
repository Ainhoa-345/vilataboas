import { defineStore } from 'pinia';
import { getArticuloById, getArticulos } from '@/api/articulos'

export const useCestaStore = defineStore('cesta', {
    state: () => ({
        // cargar saved items desde localStorage para persistencia across refresh
        // ahora la cesta se guarda por usuario en localStorage. La clave depende del token de sesión
        items: (function(){
            try{
                if (typeof localStorage === 'undefined') return [];
                // Usar DNI como identificador de usuario estable para la clave de la cesta. Fallback al token
                // para compatibilidad con sesiones antiguas.
                const dni = sessionStorage.getItem('dni');
                const token = sessionStorage.getItem('token');
                const userId = dni || token;
                const userKey = userId ? `cesta_${userId}` : 'cesta_guest';
                const raw = localStorage.getItem(userKey);
                return raw ? JSON.parse(raw) : [];
            }catch(e){
                console.warn('Error leyendo cesta desde localStorage', e);
                return [];
            }
        })()
    }),

    getters: {
        totalItems(state) {
            return state.items.reduce((total, item) => total + item.cantidad, 0);
        },
        totalPrecio(state) {
            return state.items.reduce((total, item) => total + item.precio * item.cantidad, 0);
        }
    },

    actions: {
        addProducto(producto) {
            const existente = this.items.find(item => item.id === producto.id);
            if (existente) {
                existente.cantidad++;
            } else {
                this.items.push({ 
                    ...producto, 
                    cantidad: 1 
                });
            }
            this.save()
        },
        async hydrateItems(){
            // Intentar enriquecer items almacenados en la cesta con datos del backend
            if (!this.items || this.items.length === 0) return
            let changed = false
            let allArticulos = null
            for (let i = 0; i < this.items.length; i++){
                const it = this.items[i]
                try{
                    // si ya tiene matricula, anio y kms, saltar
                    if (it.matricula && (it.anio || it.ano) && (it.kms || it.kilometros)) continue
                    if (!it.id) continue
                    let full = null
                    try{
                        full = await getArticuloById(it.id)
                    }catch(e){
                        // no encontrado por id, seguiremos intentando por nombre
                        full = null
                    }

                    if (!full){
                        // intentar cargar lista completa y buscar por nombre (marca+modelo o nombre)
                        try{
                            if (!allArticulos) allArticulos = await getArticulos()
                            const nombre = (it.nombre || '').toString().toLowerCase()
                            const found = allArticulos.find(a => {
                                const candidate = (`${a.marca || ''} ${a.modelo || a.nombre || ''}`).toString().toLowerCase()
                                return candidate.includes(nombre) || nombre.includes(candidate)
                            })
                            if (found) full = found
                        }catch(e){
                            // no pasa nada, seguimos
                        }
                    }

                    if (full){
                        this.items[i].matricula = this.items[i].matricula || full.matricula || ''
                        this.items[i].anio = this.items[i].anio || full.anio || full.ano || ''
                        this.items[i].kms = this.items[i].kms || full.kilometros || full.kms || ''
                        this.items[i].precio = this.items[i].precio || full.precio || 0
                        // si no teníamos id pero encontramos uno, intentar usar _id
                        if (!this.items[i].id && (full._id || full.id)) this.items[i].id = full._id || full.id
                        changed = true
                    }
                }catch(e){
                    console.warn('hydrateItems: error al obtener artículo', it.id, e.message || e)
                }
            }
            if (changed) this.save()
        },
        removeProducto(productoId) {
            this.items = this.items.filter(item => item.id !== productoId);
            this.save()
        },
        incrementar(id) {
            const item = this.items.find(item => item.id === id);
            if (item) item.cantidad++;
            this.save()
        },
        decrementar(id) {
            const item = this.items.find(item => item.id === id);
            if (item && item.cantidad > 1) item.cantidad--;
            this.save()
        },
        clearCesta() {
            this.items = [];
            this.save()
        }
        ,
        // guardar estado actual en localStorage
        save() {
            try {
                // Persistir la cesta usando DNI si está disponible (clave estable por usuario).
                // Se mantiene compatibilidad con sesiones antiguas usando token como fallback.
                const dni = sessionStorage.getItem('dni');
                const token = sessionStorage.getItem('token');
                const userId = dni || token;
                const userKey = userId ? `cesta_${userId}` : 'cesta_guest';
                localStorage.setItem(userKey, JSON.stringify(this.items));
            } catch (e) {
                // si falla (por ejemplo storage no disponible), no rompemos la app
                console.warn('No se pudo guardar la cesta en localStorage', e);
            }
        }
    }

});
