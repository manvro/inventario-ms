// src/scripts/ventas-semanales.ts

type CartItem = {
    id: string;       // idealmente el id real del producto; temporalmente usamos nombre si no hay id
    nombre: string;
    precio: number;   // CLP por unidad
    cantidad: number;
};

const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

if (typeof window !== "undefined" && typeof document !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
        // ----- Referencias UI -----
        const inpBuscar = document.getElementById("buscarProducto") as HTMLInputElement;
        const btnAgregar = document.getElementById("btnAgregarBusqueda") as HTMLButtonElement;
        const tbody = document.getElementById("tbodyCarrito") as HTMLTableSectionElement;

        const lblItems = document.getElementById("lblItems")!;
        const lblBruto = document.getElementById("lblBruto")!;
        const lblTotal = document.getElementById("lblTotal")!;
        const inpDesc = document.getElementById("inpDescuento") as HTMLInputElement;

        // ----- Estado -----
        const cart: CartItem[] = [];
        let descuento = 0;

        // ----- Utilidades -----
        function normaliza(s: string) {
            return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        }

        function readProductos(): Array<{ id?: string; nombre: string; precio_venta: number }> {
            const el = document.getElementById("data-productos");
            if (!el) return [];
            try { return JSON.parse(el.textContent || "[]"); } catch { return []; }
        }
        const PRODUCTOS = readProductos();
        console.log("Tiene nodo:", !!document.getElementById("data-productos"));
        console.log("Texto bruto:", document.getElementById("data-productos")?.textContent?.slice(0, 120));
        console.log("PRODUCTOS cargados:", PRODUCTOS.length, PRODUCTOS.slice(0, 2));


        // Rellena datalist
        const datalist = document.getElementById("listaProductos") as HTMLDataListElement | null;
        if (datalist) {
            datalist.innerHTML = PRODUCTOS.map(p => `<option value="${p.nombre}"></option>`).join("");
        }

        // ----- Render -----
        function render() {
            tbody.innerHTML = cart.map((it, idx) => `
        <tr class="[&>td]:px-4 [&>td]:py-2" data-row data-id="${it.id}">
            <td>${idx + 1}</td>
            <td>${it.nombre}</td>
            <td class="text-right">${CLP.format(it.precio)}</td>
            <td class="text-center">
                <div class="inline-flex items-center gap-2">
                <button data-act="dec" class="border rounded px-2 py-1" title="Quitar 1">−</button>
                <span data-q>${it.cantidad}</span>
                <button data-act="inc" class="border rounded px-2 py-1" title="Agregar 1">+</button>
                </div>
            </td>
            <td class="text-right" data-sub>${CLP.format(it.precio * it.cantidad)}</td>
            <td class="text-right">
                <button data-act="del" class="text-red-600 hover:underline">Eliminar</button>
            </td>
            </tr>
        `).join("");

            const items = cart.reduce((a, it) => a + it.cantidad, 0);
            const bruto = cart.reduce((a, it) => a + it.precio * it.cantidad, 0);
            const neto = Math.max(0, bruto - descuento);

            lblItems.textContent = String(items);
            lblBruto.textContent = CLP.format(bruto);
            lblTotal.textContent = CLP.format(neto);
        }

        // ----- Eventos -----

        // Habilita "Agregar" solo si hay match exacto con el catálogo
        inpBuscar.addEventListener("input", () => {
            const val = inpBuscar.value.trim();
            const match = PRODUCTOS.some(p => normaliza(p.nombre) === normaliza(val));
            btnAgregar.disabled = !match;
        });

        // Agrega el producto real (usa precio_venta del catálogo)
        btnAgregar.addEventListener("click", () => {
            const query = inpBuscar.value.trim();
            if (!query) return;

            const qn = normaliza(query);
            const prod =
                PRODUCTOS.find(p => normaliza(p.nombre) === qn) ??
                PRODUCTOS.find(p => normaliza(p.nombre).includes(qn));

            if (!prod) {
                alert("Producto no encontrado en el catálogo.");
                return;
            }

            const id = (prod as any).id ?? prod.nombre; // temporal si el JSON no tiene id
            const existing = cart.find(it => it.id === id);

            if (existing) {
                existing.cantidad += 1;
            } else {
                cart.push({
                    id,
                    nombre: prod.nombre,
                    precio: Math.floor(Number(prod.precio_venta) || 0),
                    cantidad: 1,
                });
            }

            inpBuscar.value = "";
            btnAgregar.disabled = true;
            render();
        });

        // + / − / Eliminar desde el carrito (delegación)
        tbody.addEventListener("click", (ev) => {
            const btn = (ev.target as HTMLElement).closest("button");
            if (!btn) return;

            const row = (ev.target as HTMLElement).closest("[data-row]") as HTMLElement | null;
            if (!row) return;

            const id = row.getAttribute("data-id")!;
            const act = btn.getAttribute("data-act");
            const idx = cart.findIndex(i => i.id === id);
            if (idx === -1) return;

            if (act === "inc") cart[idx].cantidad += 1;
            if (act === "dec") cart[idx].cantidad = Math.max(1, cart[idx].cantidad - 1);
            if (act === "del") cart.splice(idx, 1);

            render();
        });

        // Descuento en CLP
        inpDesc.addEventListener("input", () => {
            const v = Number(inpDesc.value || 0);
            descuento = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
            render();
        });

        // Primer pintado
        render();
    });
}
