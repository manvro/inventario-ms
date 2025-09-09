export const prerender = false;

import type { APIRoute } from "astro";
import { readFile, writeFile } from "node:fs/promises";

const DATA_URL = new URL("../../../data/productos.json", import.meta.url);

type Producto = {
    nombre: string;
    stock: number;
    precio_compra: number;
    precio_venta: number;
    imagen: string;
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const ct = request.headers.get("content-type") || "";

        if (!ct.includes("application/json")) {
            return json({ ok: false, error: "Content-Type debe ser application/json" }, 415);
        }

        let payloadText = await request.text();
        if (!payloadText) {
            return json({ ok: false, error: "Body vacío" }, 400);
        }

        let payload;
        try {
            payload = JSON.parse(payloadText);
        } catch {
            return json({ ok: false, error: "JSON inválido" }, 400);
        }

        const {
            original_nombre,
            nombre = "",
            stock = 0,
            precio_compra = 0,
            precio_venta = 0,
            imagen = "",
        } = payload as Record<string, unknown>;

        if (!original_nombre || typeof original_nombre !== "string") {
            return json({ ok: false, error: "Falta original_nombre" }, 400);
        }

        const raw = await readFile(DATA_URL, "utf-8");
        const productos: Producto[] = JSON.parse(raw);

        const idx = productos.findIndex(
            (p) => (p.nombre ?? "").trim() === (original_nombre as string).trim()
        );
        if (idx === -1) return json({ ok: false, error: "Producto no encontrado" }, 404);

        const updated: Producto = {
            ...productos[idx],
            nombre: (nombre as string) || productos[idx].nombre,
            stock: Number.isFinite(stock) ? (stock as number) : 0,
            precio_compra: Number.isFinite(precio_compra) ? (precio_compra as number) : 0,
            precio_venta: Number.isFinite(precio_venta) ? (precio_venta as number) : 0,
            imagen: (imagen as string) || productos[idx].imagen,
        };

        productos[idx] = updated;

        await writeFile(DATA_URL, JSON.stringify(productos, null, 2), "utf-8");

        return json({ ok: true, producto: updated }, 200);
    } catch (err: any) {
        console.error("[/api/productos/actualizar] ERROR:", err);
        return json({ ok: false, error: err?.message ?? "Error interno" }, 500);
    }
};
