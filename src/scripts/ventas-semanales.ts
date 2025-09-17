// src/scripts/ventas-semanales.ts

type Producto = {
    id: string;
    nombre: string;
    precio_venta: number;
    sku?: string | null;
    foto_url?: string | null;
};

type CartItem = {
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    foto_url?: string | null; // 👈 agrega esto
};

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

let catalogo: Producto[] = [];
let cart: CartItem[] = [];
let descuento = 0;

function renderCarrito() {
    const tbody = document.getElementById("tbodyCarrito")!;
    tbody.innerHTML = "";
    let total = 0;
    let items = 0;
    for (const item of cart) {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        items += item.cantidad;
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${item.foto_url ? `<img src="${item.foto_url}" class="w-8 h-8 object-cover rounded" />` : ""}</td>
        <td>
            <div class="flex items-center gap-2">
            <span>${item.nombre}</span>
            </div>
        </td>
        <td class="text-right">${CLP.format(item.precio)}</td>
        <td class="text-center">
            <input type="number" min="1" value="${item.cantidad}" data-id="${item.id}" class="w-16 border rounded px-2 py-1 text-center inpCantidad" />
        </td>
        <td class="text-right">${CLP.format(subtotal)}</td>
        <td class="text-right hidden sm:table-cell">
            <button data-id="${item.id}" class="text-red-600 btnQuitar">Quitar</button>
        </td>
    `;
        tbody.appendChild(tr);
    }
    (document.getElementById("lblItems") as HTMLElement).textContent = String(items);
    (document.getElementById("lblBruto") as HTMLElement).textContent = CLP.format(total);
    const totalPagar = Math.max(0, total - descuento);
    (document.getElementById("lblTotal") as HTMLElement).textContent = CLP.format(totalPagar);

    // Eventos para quitar y cambiar cantidad
    tbody.querySelectorAll(".btnQuitar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = (e.currentTarget as HTMLElement).getAttribute("data-id")!;
            cart = cart.filter(it => it.id !== id);
            renderCarrito();
        });
    });
    tbody.querySelectorAll(".inpCantidad").forEach(inp => {
        inp.addEventListener("change", (e) => {
            const input = e.target as HTMLInputElement;
            const id = input.getAttribute("data-id")!;
            const cantidad = Math.max(1, Number(input.value));
            const item = cart.find(it => it.id === id);
            if (item) item.cantidad = cantidad;
            renderCarrito();
        });
    });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
    window.addEventListener("DOMContentLoaded", async () => {
        // 1. Cargar productos desde la API
        const res = await fetch("/api/productos-min");
        const { ok, data } = await res.json();
        catalogo = ok ? data : [];

        const inpBuscar = document.getElementById("buscarProducto") as HTMLInputElement;
        const btnAgregar = document.getElementById("btnAgregarBusqueda") as HTMLButtonElement;
        const sugerencias = document.getElementById("sugerencias") as HTMLUListElement;
        const datalist = document.getElementById("listaProductos") as HTMLDataListElement;
        const inpDesc = document.getElementById("inpDescuento") as HTMLInputElement;

        // Autocompletar datalist
        datalist.innerHTML = "";
        catalogo.forEach(prod => {
            const opt = document.createElement("option");
            opt.value = prod.nombre;
            datalist.appendChild(opt);
        });

        let seleccionado: Producto | null = null;

        inpBuscar.addEventListener("input", () => {
            const val = inpBuscar.value.trim().toLowerCase();
            sugerencias.innerHTML = "";
            if (!val) {
                sugerencias.classList.add("hidden");
                btnAgregar.disabled = true;
                seleccionado = null;
                return;
            }
            const sugeridos = catalogo.filter(p =>
                p.nombre.toLowerCase().includes(val) ||
                (p.sku ?? "").toLowerCase().includes(val)
            ).slice(0, 8);

            sugeridos.forEach(prod => {
                const li = document.createElement("li");
                li.className = "flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer";
                li.innerHTML = `
            ${prod.foto_url ? `<img src="${prod.foto_url}" class="w-8 h-8 object-cover rounded" />` : ""}
            <span>${prod.nombre}</span>
            <span class="ml-auto text-xs text-gray-500">${CLP.format(prod.precio_venta)}</span>
        `;
                li.addEventListener("click", () => {
                    inpBuscar.value = prod.nombre;
                    seleccionado = prod;
                    sugerencias.classList.add("hidden");
                    btnAgregar.disabled = false;
                });
                sugerencias.appendChild(li);
            });
            sugerencias.classList.toggle("hidden", sugeridos.length === 0);
            btnAgregar.disabled = true;
            seleccionado = null;
        });

        inpBuscar.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (seleccionado) btnAgregar.click();
            }
        });

        btnAgregar.addEventListener("click", () => {
            if (!seleccionado) return;
            // Evita duplicados
            if (cart.some(it => it.id === seleccionado!.id)) {
                alert("Ya está en el carrito");
                return;
            }
            cart.push({
                id: seleccionado.id,
                nombre: seleccionado.nombre,
                precio: seleccionado.precio_venta,
                cantidad: 1,
                foto_url: seleccionado.foto_url
            });
            renderCarrito();
            inpBuscar.value = "";
            btnAgregar.disabled = true;
            seleccionado = null;
        });

        // Descuento
        inpDesc.addEventListener("input", () => {
            descuento = Math.max(0, Number(inpDesc.value) || 0);
            renderCarrito();
        });

        // Confirmar venta
        const btnConfirmar = document.getElementById("btnConfirmarVenta") as HTMLButtonElement;
        const textareaObs = document.querySelector("textarea[placeholder^='Notas de la venta']") as HTMLTextAreaElement;
        const selMedioPago = document.getElementById("selMedioPago") as HTMLSelectElement;

        btnConfirmar?.addEventListener("click", async () => {
            if (!cart.length) {
                alert("Agrega al menos un producto al carrito.");
                return;
            }

            btnConfirmar.disabled = true;
            btnConfirmar.textContent = "Guardando...";

            // Calcula totales
            const bruto = cart.reduce((a, it) => a + it.precio * it.cantidad, 0);
            const neto = Math.max(0, bruto - descuento);

            // Prepara detalles
            const detalles = cart.map(it => ({
                producto_id: it.id,
                cantidad: it.cantidad,
                total_bruto: it.precio * it.cantidad,
                descuento_total: 0,
                total_neto: it.precio * it.cantidad,
                motivo_descuento: "",
                nota: ""
            }));

            // Prepara payload
            const payload = {
                semana_inicio: new Date().toISOString().slice(0, 10),
                semana_fin: new Date().toISOString().slice(0, 10),
                nota_general: textareaObs.value,
                detalles,
                total_bruto: bruto,
                descuento_total: descuento,
                total_neto: neto,
                medio_pago: selMedioPago.value
            };

            try {
                const res = await fetch("/api/ventas-semanales", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo guardar la venta");

                alert("¡Venta guardada con éxito!");
                cart = [];
                descuento = 0;
                textareaObs.value = "";
                inpDesc.value = "";
                renderCarrito();
            } catch (err: any) {
                alert("Error al guardar venta: " + (err?.message || err));
            } finally {
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = "Confirmar venta";
            }
        });

        // Render inicial
        renderCarrito();
    });
}
