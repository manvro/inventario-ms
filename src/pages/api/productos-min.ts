import type { APIContext } from "astro";
import { getSupabaseServer } from "../../lib/supabase";

export async function GET(ctx: APIContext) {
    const supabase = getSupabaseServer(ctx);

    const { data, error } = await supabase
        .from("productos")
        .select("id, sku, nombre, precio_venta, stock, foto_url, activo")
        .eq("activo", true)
        .order("nombre", { ascending: true });

    if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ ok: true, data: data ?? [] }), {
        headers: { "Content-Type": "application/json" },
    });
}
