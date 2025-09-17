import type { APIRoute } from "astro";
import { getSupabaseServer } from "../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
    try {
        const ct = ctx.request.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
            return new Response(JSON.stringify({ ok: false, error: "Content-Type debe ser application/json" }), { status: 415 });
        }

        const payload = await ctx.request.json();
        const {
            id,
            nombre,
            stock,
            precio_compra,
            precio_venta
        } = payload as Record<string, unknown>;

        if (!id || typeof id !== "string") {
            return new Response(JSON.stringify({ ok: false, error: "Falta id" }), { status: 400 });
        }

        const supabase = getSupabaseServer(ctx);

        const { data, error } = await supabase
            .from("productos")
            .update({
                nombre,
                stock,
                precio_compra,
                precio_venta
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true, producto: data }), { status: 200 });
    } catch (err: any) {
        console.error("[/api/productos/actualizar] ERROR:", err);
        return new Response(JSON.stringify({ ok: false, error: err?.message ?? "Error interno" }), { status: 500 });
    }
};