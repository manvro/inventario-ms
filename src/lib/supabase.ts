// src/lib/supabase.ts
import { createServerClient, createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";

// Mueve esto a .env en cuanto puedas
const SUPABASE_URL = "https://shgsefisqwviofquxoxr.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ3NlZmlzcXd2aW9mcXV4b3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MTUzMzEsImV4cCI6MjA3MjE5MTMzMX0.bou6Dn6RhRGdOXWr1IOIX33PkwpB_apIhUTie0d1aeg";

/**
 * Acepta:
 *  - getSupabaseServer(cookies)
 *  - getSupabaseServer({ cookies })
 */
export function getSupabaseServer(input: AstroCookies | { cookies: AstroCookies }) {
    // Normaliza: si vino { cookies }, usa esa; si vino directo, úsalo tal cual
    const jar: AstroCookies =
        typeof (input as any)?.get === "function" ? (input as AstroCookies) : (input as any).cookies;

    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            get: (name: string) => jar.get(name)?.value,
            set: (name: string, value: string, options?: CookieOptions) =>
                jar.set(name, value, { path: "/", sameSite: "lax", ...options }),
            remove: (name: string, options?: CookieOptions) =>
                jar.delete(name, { path: "/", ...options }),
        },
    });
}

// Cliente de navegador
export const supabaseBrowser = () => createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
