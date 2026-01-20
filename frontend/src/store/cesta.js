import { defineStore } from 'pinia';

export const useCestaStore = defineStore('cesta', {
    state: () => ({
        // cargar saved items desde localStorage para persistencia across refresh
        items: typeof localStorage !== 'undefined' && localStorage.getItem('cesta')
            ? JSON.parse(localStorage.getItem('cesta'))
            : []
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
                localStorage.setItem('cesta', JSON.stringify(this.items));
            } catch (e) {
                // si falla (por ejemplo storage no disponible), no rompemos la app
                console.warn('No se pudo guardar la cesta en localStorage', e);
            }
        }
    }

});
