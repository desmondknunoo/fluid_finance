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
                // Fluid palette — one saturated accent (cyan) + semantic status hues.
                fluid: {
                    panel: 'rgb(var(--panel) / <alpha-value>)',
                    'panel-soft': 'rgb(var(--panel-soft) / <alpha-value>)',
                    cyan: 'rgb(var(--cyan) / <alpha-value>)',
                    'cyan-ink': 'rgb(var(--cyan-ink) / <alpha-value>)',
                    'cyan-hover': 'rgb(var(--cyan-hover) / <alpha-value>)',
                    'action-ink': 'rgb(var(--action-ink) / <alpha-value>)',
                    green: 'rgb(var(--green) / <alpha-value>)',
                    amber: 'rgb(var(--amber) / <alpha-value>)',
                    rose: 'rgb(var(--rose) / <alpha-value>)',
                    teal: 'rgb(var(--teal) / <alpha-value>)',
                    violet: 'rgb(var(--violet) / <alpha-value>)',
                    muted: 'rgb(var(--muted-text) / <alpha-value>)',
                    faint: 'rgb(var(--faint-text) / <alpha-value>)',
                },
            },
            boxShadow: {
                // Cyan glow on primary actions.
                glow: '0 0 28px rgb(var(--glow) / 0.18)',
                'glow-lg': '0 0 40px rgb(var(--glow) / 0.28)',
                // Elevated panel shadow — softer on light, deeper on dark.
                panel: 'var(--panel-shadow)',
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
