import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";

/**
 * Fluid Finance - Firebase
 *
 * The public site and the portal share one Firebase project of their own (owned by the Fluid
 * Finance Google account), separate from the investor app's `app-fluidterra` project: a Fluid
 * Finance member is not an investor-app user and the two must never sign in to each other. The
 * project is named only by build-time `VITE_FIREBASE_*` variables, which are public configuration
 * and grant no privileged access.
 */

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const FIREBASE_PROJECT_ID: string = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "";
export const firebaseConfigured = Boolean(apiKey && FIREBASE_PROJECT_ID);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
    if (!firebaseConfigured) throw new Error("Sign-in is not configured for this build. Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.");
    if (!app) {
        app = getApps()[0] ?? initializeApp({
            apiKey,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
            projectId: FIREBASE_PROJECT_ID,
        });
    }
    if (!auth) {
        auth = getAuth(app);
        void setPersistence(auth, browserLocalPersistence).catch(() => { /* falls back to in-memory */ });
    }
    return auth;
}

/** The signed-in person's ID token, refreshed by the SDK as needed; null when signed out. */
export async function authToken(force = false): Promise<string | null> {
    if (!firebaseConfigured) return null;
    const user = getFirebaseAuth().currentUser;
    return user ? user.getIdToken(force) : null;
}
