import { createServerClient, createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { APIContext } from "astro";

// 🔑 Claves directas (puedes moverlas a .env más adelante si quieres)
const SUPABASE_URL = "https://shgsefisqwviofquxoxr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ3NlZmlzcXd2aW9mcXV4b3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MTUzMzEsImV4cCI6MjA3MjE5MTMzMX0.bou6Dn6RhRGdOXWr1IOIX33PkwpB_apIhUTie0d1aeg";

// ---- Cliente para el servidor (endpoints, middleware) ----
export function getSupabaseServer(ctx: Pick<APIContext, "cookies">) {
    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            get: (name: string) => ctx.cookies.get(name)?.value,
            set: (name: string, value: string, options?: CookieOptions) =>
                ctx.cookies.set(name, value, { path: "/", sameSite: "lax", ...options }),
            remove: (name: string, options?: CookieOptions) =>
                ctx.cookies.delete(name, { path: "/", ...options }),
        },
    });
}

// ---- Cliente para el navegador (si luego quieres llamadas en la UI) ----
export const supabaseBrowser = () =>
    createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
