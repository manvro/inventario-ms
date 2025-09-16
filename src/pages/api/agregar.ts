// src/pages/api/agregar.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { getSupabaseServer } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
    const form = await request.formData();

    // Campos que tienes en el form
    const sku = String(form.get("sku") || "").trim();          // si no lo usas, puedes omitirlo
    const nombre = String(form.get("nombre") || "").trim();
    const descripcion = String(form.get("descripcion") || "").trim();
    const precio_compra = Number(form.get("precio_compra") || 0);
    const precio_venta = Number(form.get("precio_venta") || 0);
    const stock = Number(form.get("stock") || 0);
    const foto_url = String(form.get("imagen") || "");               // ← del input hidden que llenamos en el front

    if (!nombre || !descripcion) {
        return new Response("Nombre y descripción son obligatorios", { status: 400 });
    }

    const supabase = getSupabaseServer(cookies); // o getSupabaseServer({ cookies })

    // Inserta usando TUS columnas reales
    const { error } = await supabase.from("productos").insert({
        ...(sku ? { sku } : {}),
        nombre,
        descripcion,
        precio_compra,
        precio_venta,
        stock,
        foto_url,
        activo: true,         // opcional
        // creado_en: new Date().toISOString(),  // opcional, tu columna ya tiene default now() si lo definiste así
    });

    if (error) {
        console.error("Error insertando producto:", error);
        return new Response(error.message, { status: 500 });
    }

    return redirect("/agregar", 303);
};
