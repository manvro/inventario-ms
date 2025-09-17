// src/scripts/product-modal.ts
export const prerender = false; // ← habilita SSR para esta ruta (POST permitido)


const qs = <T extends Element>(sel: string, root: ParentNode = document) =>
    root.querySelector(sel) as T | null;
const must = <T>(el: T | null, msg: string): T => {
    if (el === null) throw new Error(msg);
    return el;
};

if (typeof window !== "undefined" && typeof document !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
        const grid = must<HTMLElement>(qs("#gridProductos"), "gridProductos no encontrado");
        const modal = must<HTMLDialogElement>(qs("#modalProducto"), "modalProducto no encontrado");
        const form = must<HTMLFormElement>(qs("#formProducto"), "formProducto no encontrado");
        const btnX = must<HTMLButtonElement>(qs("#btnCerrarModal"), "btnCerrarModal no encontrado");
        const btnC = must<HTMLButtonElement>(qs("#btnCerrarModal2"), "btnCerrarModal2 no encontrado");

        const mIndex = must<HTMLInputElement>(qs("#mIndex"), "mIndex no encontrado");
        const mOrigNom = must<HTMLInputElement>(qs("#mOriginalNombre"), "mOriginalNombre no encontrado");
        const mImagen = must<HTMLImageElement>(qs("#mImagen"), "mImagen no encontrado");
        const mNombre = must<HTMLInputElement>(qs("#mNombre"), "mNombre no encontrado");
        const mStock = must<HTMLInputElement>(qs("#mStock"), "mStock no encontrado");
        const mPC = must<HTMLInputElement>(qs("#mPrecioCompra"), "mPrecioCompra no encontrado");
        const mPV = must<HTMLInputElement>(qs("#mPrecioVenta"), "mPrecioVenta no encontrado");
        const mImgTxt = must<HTMLInputElement>(qs("#mImagenTxt"), "mImagenTxt no encontrado");
        const mId = must<HTMLInputElement>(qs("#mId"), "mId no encontrado");

        // Abrir con datos desde la card
        document.addEventListener("click", (ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            if (!target) return;

            const card = target.closest("[data-card]") as HTMLElement | null;
            if (!card || !grid.contains(card)) return;

            const idx = card.dataset.index ?? "0";
            const nombre = card.dataset.nombre ?? "";
            const origNom = card.dataset.originalNombre ?? card.getAttribute("data-original-nombre") ?? nombre;
            const stock = card.dataset.stock ?? "0";
            const pv = card.dataset.precioVenta ?? card.getAttribute("data-precio-venta") ?? "0";
            const pc = card.dataset.precioCompra ?? card.getAttribute("data-precio-compra") ?? "0";
            const imagen = card.dataset.imagen ?? "";

            const id = card.dataset.id ?? "";

            mIndex.value = idx;
            mOrigNom.value = origNom;       // 👈 clave estable para el backend
            mImagen.src = imagen; mImagen.alt = nombre;
            mNombre.value = nombre;
            mStock.value = stock;
            mPC.value = pc;
            mPV.value = pv;
            mImgTxt.value = imagen;
            mId.value = id;

            modal.showModal();
        });

        // Cerrar helpers
        const cerrar = () => { if (modal.open) modal.close(); };
        btnX.addEventListener("click", cerrar);
        btnC.addEventListener("click", cerrar);
        modal.addEventListener("click", (e: MouseEvent) => {
            const r = modal.getBoundingClientRect();
            const { clientX: x, clientY: y } = e;
            const inside = r.top <= y && y <= r.bottom && r.left <= x && x <= r.right;
            if (!inside) modal.close();
        });

        // Guardar → POST al endpoint y actualizar UI si ok
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                id: mId.value, // 👈 ahora envía el id
                nombre: mNombre.value,
                stock: Number(mStock.value || 0),
                precio_compra: Number(mPC.value || 0),
                precio_venta: Number(mPV.value || 0)
                // imagen ya no se envía porque no se actualiza
            };
            try {
                const res = await fetch("/api/productos/actualizar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();
                if (!res.ok || !data?.ok) throw new Error(data?.error ?? "No se pudo actualizar");

                // Actualiza la card en pantalla con la respuesta del servidor
                const idx = mIndex.value;
                const card = document.querySelector<HTMLElement>(`[data-card][data-index="${idx}"]`);
                if (card) {
                const p = data.producto as {
                    nombre: string; stock: number; precio_compra: number; precio_venta: number; imagen: string;
                };

                card.dataset.nombre = p.nombre;
                card.setAttribute("data-original-nombre", p.nombre);
                card.dataset.stock = String(p.stock);
                card.setAttribute("data-precio-compra", String(p.precio_compra));
                card.setAttribute("data-precio-venta", String(p.precio_venta));
                card.dataset.imagen = p.imagen;

                const stockTxt = card.querySelector<HTMLElement>("[data-stock-txt]");
                const pvTxt    = card.querySelector<HTMLElement>("[data-precio-venta-txt]");
                const imgEl    = card.querySelector<HTMLImageElement>("img");
                const h2       = card.querySelector<HTMLElement>("h2");

                if (stockTxt) stockTxt.textContent = String(p.stock);
                if (pvTxt)    pvTxt.textContent    = String(p.precio_venta);
                if (imgEl) { imgEl.src = p.imagen; imgEl.alt = p.nombre; }
                if (h2)    { h2.textContent = p.nombre; }
                }

                modal.close();
            } catch (err: any) {
                alert("Error al actualizar: " + (err?.message ?? err));
                console.error("Actualizar producto:", err);
            }
        });

        // Escape
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Escape" && modal.open) modal.close();
        });
    });
}
