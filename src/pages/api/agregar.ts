    export const prerender = false; // ← NECESARIO PARA QUE FUNCIONE EL POST

    import type { APIRoute } from "astro";
    import fs from "fs/promises";
    import path from "path";

    const filePath = path.resolve("src/data/productos.json");

    export const POST: APIRoute = async ({ request, redirect }) => {
    const formData = await request.formData(); // Esto funcionará si el form es correcto

    const nuevo = {
        nombre: formData.get("nombre"),
        descripcion: formData.get("descripcion"),
        precio_compra: Number(formData.get("precio_compra")),
        precio_venta: Number(formData.get("precio_venta")),
        stock: Number(formData.get("stock")),
        imagen: formData.get("imagen") || "",
        creado: new Date().toISOString()
    };

    try {
        const data = await fs.readFile(filePath, "utf-8");
        const productos = JSON.parse(data);

        productos.push(nuevo);
        await fs.writeFile(filePath, JSON.stringify(productos, null, 2), "utf-8");

        return redirect("/");
    } catch (error) {
        console.error("Error guardando el producto:", error);
        return new Response("Error al guardar producto", { status: 500 });
    }
    };
