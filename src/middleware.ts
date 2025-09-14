// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { getSupabaseServer } from "./lib/supabase";

export const onRequest = defineMiddleware(async (ctx, next) => {
    const supabase = getSupabaseServer(ctx);
    const { data: { session } } = await supabase.auth.getSession();

    const path = ctx.url.pathname;
    const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
    const isPrivate =
        path.startsWith("/productos") ||
        path.startsWith("/ventas") ||
        path.startsWith("/panel");

    if (!session && isPrivate) {
        return ctx.redirect("/login");
    }

    if (session && isAuthPage) {
        return ctx.redirect("/");
    }

    return next();
});
