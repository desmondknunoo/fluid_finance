import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: { proxy: { "/market-api": { target: "https://api.fluidterra.com", changeOrigin: true, rewrite: (path) => path.replace(/^\/market-api/, "/api/v1/market") } } },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
