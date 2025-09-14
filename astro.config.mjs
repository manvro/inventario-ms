// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",           // necesario para middleware + POST
  vite: {
    plugins: [tailwindcss()], // 👈 dentro de vite.plugins
  },
});
