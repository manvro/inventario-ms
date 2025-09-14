export const prerender = false;

import type { APIRoute } from "astro";
import { getSupabaseServer } from "../../../lib/supabase";

export const POST: APIRoute = async (ctx) => {
    const form = await ctx.request.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const supabase = getSupabaseServer(ctx);

    // Intentar iniciar sesión con email y password
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error("Error login:", error.message);
        return ctx.redirect("/login?error=1", 302);
    }

    // Redirige al panel principal
    return ctx.redirect("/", 302);
};
