// src/pages/api/auth/logout.ts
export const prerender = false;

import type { APIRoute } from "astro";
import { getSupabaseServer } from "../../../lib/supabase";

// Permite cerrar sesión con POST (recomendado)
export const POST: APIRoute = async (ctx) => {
    const supabase = getSupabaseServer(ctx);
    try {
        await supabase.auth.signOut();
    } catch {
        // ignoramos errores de signOut para no bloquear el flujo
    }
    // 303: redirección tras POST
    return ctx.redirect("/login", 303);
};

// (Opcional) Soporte GET por si usas un <a href="/api/auth/logout">
export const GET: APIRoute = async (ctx) => {
    const supabase = getSupabaseServer(ctx);
    try {
        await supabase.auth.signOut();
    } catch { }
    return ctx.redirect("/login", 302);
};
