/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    /** Fluid backend base URL including `/api/v1`. */
    readonly VITE_API_BASE_URL?: string;
    /** Portal only: the public site, for links back to published content. */
    readonly VITE_PUBLIC_SITE_URL?: string;
}
