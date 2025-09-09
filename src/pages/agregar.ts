    import type { APIRoute } from "astro"

    let productos: any[] = [] // temporal mientras no usamos Supabase

    export const POST: APIRoute = async ({ request, redirect }) => {
    const formData = await request.formData()

    const nuevo = {
        nombre: formData.get("nombre"),
        descripcion: formData.get("descripcion"),
        precio_compra: Number(formData.get("precio_compra")),
        precio_venta: Number(formData.get("precio_venta")),
        stock: Number(formData.get("stock")),
        imagen: formData.get("imagen") || "",
        creado: new Date().toISOString()
    }

    productos.push(nuevo)
    console.log("Producto agregado:", nuevo)

    return redirect("/")
    }
