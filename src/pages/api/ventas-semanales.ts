import type { APIContext } from "astro";
import { getSupabaseServer } from "../../lib/supabase";

export async function POST(ctx: APIContext) {
    const supabase = getSupabaseServer(ctx);
    const body = await ctx.request.json();

    // Validación básica
    if (!body.detalles || !Array.isArray(body.detalles) || body.detalles.length === 0) {
        return new Response(JSON.stringify({ ok: false, error: "Detalles requeridos" }), { status: 400 });
    }

    // Inserta la venta semanal
    const { data: venta, error: errorVenta } = await supabase
        .from("ventas_semanales")
        .insert([{
            semana_inicio: body.semana_inicio,
            semana_fin: body.semana_fin,
            nota_general: body.nota_general ?? null,
            // Puedes agregar más campos si tu tabla los tiene
        }])
        .select()
        .single();

    if (errorVenta) {
        return new Response(JSON.stringify({ ok: false, error: errorVenta.message }), { status: 500 });
    }

    // Inserta los detalles
    const detalles = body.detalles.map((d: any) => ({
        venta_semanal_id: venta.id,
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        total_bruto: d.total_bruto,
        descuento_total: d.descuento_total,
        total_neto: d.total_neto,
        motivo_descuento: d.motivo_descuento ?? null,
        nota: d.nota ?? null,
    }));

    const { error: errorDetalle } = await supabase
        .from("ventas_semanales_detalle")
        .insert(detalles);

    if (errorDetalle) {
        return new Response(JSON.stringify({ ok: false, error: errorDetalle.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, venta_id: venta.id }), { status: 200 });
}