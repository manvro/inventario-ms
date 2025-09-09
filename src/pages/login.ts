// src/pages/login.ts
import type { APIRoute } from "astro"
import { supabase } from "../lib/supabase"

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData()
  const email = formData.get("email")?.toString() || ""
  const password = formData.get("password")?.toString() || ""

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

if (error || !data.session) {
  console.log("Login falló:", error?.message)
  return redirect("/login?error=1")
}

console.log("Login exitoso:", data.session.user.email)

  // Guardar el token de sesión en cookie (por ejemplo)
  cookies.set("sb-token", data.session.access_token, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })

  return redirect(`/?token=${data.session.access_token}`)

}
