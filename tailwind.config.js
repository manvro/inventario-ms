    /** @type {import('tailwindcss').Config} */
    export default {
    content: [
        "./src/**/*.{astro,html,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
        colors: {
            primario: "#1E3BAA",
            secundario: "#FBBF24",
            fondo: "#F9FAFB",
        },
        fontFamily: {
            sans: ['"Inter"', "sans-serif"],
        },
        },
    },
    plugins: [],
    };
