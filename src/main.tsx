import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/lib/auth'
import { interceptLinkClicks, normaliseLegacyUrl } from '@/lib/navigation'

// Old `/#/…` links (share cards, emails, the portal, bookmarks) become their paths before the first render.
normaliseLegacyUrl()
interceptLinkClicks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const register=()=>{void navigator.serviceWorker.register('/reading-sw.js').catch(()=>{/* online reading remains available */});};
    if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
}
