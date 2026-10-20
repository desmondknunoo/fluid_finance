import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Long-lived vendor chunks, so an app release does not invalidate React or Firebase in the cache. */
function vendorChunk(id: string): string | undefined {
    if (!id.includes("node_modules")) return undefined
    if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react"
    if (/[\\/]node_modules[\\/](firebase|@firebase)[\\/]/.test(id)) return "firebase"
    if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "motion"
    if (/[\\/]node_modules[\\/]xlsx[\\/]/.test(id)) return "xlsx"
    // One small icon chunk instead of a request per icon shared between routes.
    if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return "icons"
    return undefined
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: { proxy: { "/market-api": { target: "https://api.fluidterra.com", changeOrigin: true, rewrite: (path) => path.replace(/^\/market-api/, "/api/v1/market") } } },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: { manualChunks: vendorChunk },
        },
    },
})
