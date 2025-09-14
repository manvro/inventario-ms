import type { APIContext } from "astro";
import { getSupabaseServer } from "../../lib/supabase";

export async function GET(ctx: APIContext) {
    const supabase = getSupabaseServer(ctx);

    const { count, error } = await supabase
        .from("productos")
        .select("id", { count: "exact", head: true });

    if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ ok: true, productos: count ?? 0 }), {
        headers: { "Content-Type": "application/json" },
    });
}
