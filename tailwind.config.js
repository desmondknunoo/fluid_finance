/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Page surface and the ink drawn on it — both flip with the theme.
                canvas: 'rgb(var(--canvas) / <alpha-value>)',
                ink: 'rgb(var(--ink) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
