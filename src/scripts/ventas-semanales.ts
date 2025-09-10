// src/scripts/ventas-semanales.ts

type CatalogoItem = { id?: string; nombre: string; precio_venta: number };
type CartItem = { id: string; nombre: string; precio: number; cantidad: number };

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

if (typeof window !== "undefined" && typeof document !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
        // ---------- UI ----------
        const inpBuscar = document.getElementById("buscarProducto") as HTMLInputElement;
        const btnAgregar = document.getElementById("btnAgregarBusqueda") as HTMLButtonElement;
        const sugList = document.getElementById("sugerencias") as HTMLUListElement | null; // dropdown de sugerencias
        const tbody = document.getElementById("tbodyCarrito") as HTMLTableSectionElement;

        const lblItems = document.getElementById("lblItems")!;
        const lblBruto = document.getElementById("lblBruto")!;
        const lblTotal = document.getElementById("lblTotal")!;
        const inpDesc = document.getElementById("inpDescuento") as HTMLInputElement;

        // ---------- Estado ----------
        const cart: CartItem[] = [];
        let descuento = 0;

        // ---------- Catálogo ----------
        function readProductos(): CatalogoItem[] {
            const el = document.getElementById("data-productos");
            if (!el) return [];
            try { return JSON.parse(el.textContent || "[]"); } catch { return []; }
        }
        const PRODUCTOS = readProductos();
        const INDEX = PRODUCTOS.map(p => ({ ...p, _n: normaliza(p.nombre) }));

        // ---------- Utils ----------
        function normaliza(s: string) {
            return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        }
        function debounce<T extends (...a: any) => void>(fn: T, ms = 120) {
            let t: number | undefined; return (...args: Parameters<T>) => { clearTimeout(t); t = window.setTimeout(() => fn(...args), ms); };
        }
        function highlight(text: string, qn: string) {
            const n = normaliza(text);
            const i = n.indexOf(qn);
            if (i < 0) return text;
            const end = i + qn.length;
            return text.slice(0, i) + `<mark class="bg-yellow-200">${text.slice(i, end)}</mark>` + text.slice(end);
        }

        // ---------- Render carrito ----------
        function render() {
            tbody.innerHTML = cart.map((it, idx) => `
        <tr class="[&>td]:px-4 [&>td]:py-2" data-row data-id="${it.id}">
        <td>${idx + 1}</td>
        <td>${it.nombre}</td>
        <td class="text-right">${CLP.format(it.precio)}</td>
        <td class="text-center">
            <div class="inline-flex items-center gap-2">
            <button data-act="dec" class="border rounded px-2 py-1" title="Quitar 1">−</button>
            <span>${it.cantidad}</span>
            <button data-act="inc" class="border rounded px-2 py-1" title="Agregar 1">+</button>
            </div>
        </td>
            <td class="text-right">${CLP.format(it.precio * it.cantidad)}</td>
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

        // ---------- Buscador con sugerencias ----------
        // Devuelve una URL usable a partir de distintos nombres de campo
        function getImagen(p: any): string {
            const src = p.imagen || p.foto || p.img || p.imagen_url || p.url || "";
            return resolveImg(src);
        }

        // Normaliza rutas para Astro (sirve /public* desde "/")
        function resolveImg(src: string): string {
            if (!src) return "";
            if (src.startsWith("http")) return src;
            return "/" + src.replace(/^\/?public\//, "");
        }

        let sugerencias: CatalogoItem[] = [];
        let selIdx = -1;

        function buildSuggestions(q: string) {
            const qn = normaliza(q);
            if (!qn) return [];
            return INDEX
                .filter(p => p._n.includes(qn))
                .sort((a, b) => {
                    const ai = a._n.indexOf(qn), bi = b._n.indexOf(qn);
                    if ((ai === 0) !== (bi === 0)) return ai === 0 ? -1 : 1; // “empieza por” primero
                    return ai - bi; // más cercano al inicio
                })
                .slice(0, 8);
        }

        // ⬇️ ACTUALIZADA: ahora muestra miniatura + nombre resaltado + precio
        function renderSuggestions(q: string) {
            if (!sugList) return;
            const qn = normaliza(q);
            if (!qn || sugerencias.length === 0) {
                sugList.classList.add("hidden");
                sugList.innerHTML = "";
                selIdx = -1;
                return;
            }

            sugList.innerHTML = sugerencias.map((p: any, i) => {
                const img = getImagen(p); // usa imagen del producto si existe
                return `
        <li data-idx="${i}"
            class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 ${i === selIdx ? 'bg-gray-100' : ''}">
            ${img
            ? `<img src="${img}" alt="${p.nombre}" class="w-10 h-10 object-cover rounded-lg" />`
            : `<div class="w-10 h-10 bg-gray-200 rounded-lg"></div>`}
            <div class="min-w-0 grow">
            <div class="text-sm font-medium truncate">${highlight(p.nombre, qn)}</div>
            </div>
            <span class="text-xs text-gray-500 shrink-0">${CLP.format(p.precio_venta)}</span>
        </li>`;
            }).join("");

            sugList.classList.remove("hidden");
        }

        const onInput = debounce(() => {
            const q = inpBuscar.value.trim();
            sugerencias = buildSuggestions(q);
            selIdx = sugerencias.length ? 0 : -1;
            renderSuggestions(q);
            btnAgregar.disabled = sugerencias.length === 0;
        }, 120);

        inpBuscar.addEventListener("input", onInput);

        // teclado en input (↑/↓/Enter/Escape)
        inpBuscar.addEventListener("keydown", (e) => {
            if (!sugerencias.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); selIdx = (selIdx + 1) % sugerencias.length; renderSuggestions(inpBuscar.value.trim()); }
            else if (e.key === "ArrowUp") { e.preventDefault(); selIdx = (selIdx - 1 + sugerencias.length) % sugerencias.length; renderSuggestions(inpBuscar.value.trim()); }
            else if (e.key === "Enter") { e.preventDefault(); if (selIdx >= 0) addProduct(sugerencias[selIdx]); }
            else if (e.key === "Escape") { sugerencias = []; renderSuggestions(""); }
        });

        // click en sugerencia
        sugList?.addEventListener("click", (ev) => {
            const li = (ev.target as HTMLElement).closest("li");
            if (!li) return;
            const idx = Number(li.getAttribute("data-idx") || -1);
            if (idx >= 0 && sugerencias[idx]) addProduct(sugerencias[idx]);
        });

        // botón Agregar: usa selección (o primera)
        btnAgregar.addEventListener("click", () => {
            if (!sugerencias.length) return;
            addProduct(sugerencias[selIdx >= 0 ? selIdx : 0]);
        });

        function addProduct(prod: CatalogoItem) {
            const id = (prod as any).id ?? prod.nombre;
            const existing = cart.find(it => it.id === id);
            if (existing) existing.cantidad += 1;
            else cart.push({ id, nombre: prod.nombre, precio: Math.floor(Number(prod.precio_venta) || 0), cantidad: 1 });

            // limpiar UI de búsqueda
            inpBuscar.value = "";
            sugerencias = [];
            renderSuggestions("");
            btnAgregar.disabled = true;
            render();
        }

        // ---------- Eventos carrito ----------
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

        // ---------- Descuento ----------
        inpDesc.addEventListener("input", () => {
            const v = Number(inpDesc.value || 0);
            descuento = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
            render();
        });

        // primer render
        render();
    });
}
