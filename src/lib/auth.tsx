import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    updateProfile as updateFirebaseProfile,
    type User as FirebaseUser,
} from "firebase/auth";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { ApiError } from "@/lib/api";
import { getMyProfile, updateOwnProfile, type MemberRole, type Profile } from "@/lib/community";

/**
 * Fluid Finance - member session
 *
 * Firebase Authentication holds the identity (email + password or Google) in the same project as
 * the investor app, so a person has one Fluid account. The Fluid backend maps each Firebase
 * subject to an editorial profile that carries the public identity and the team role; both are
 * read once here and shared through context so pages never touch Firebase themselves.
 */

export const STAFF_ROLES: MemberRole[] = ["research", "social", "operations", "admin"];

export interface SessionUser {
    id: string;
    email: string | null;
    emailVerified: boolean;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthContextValue {
    user: SessionUser | null;
    profile: Profile | null;
    /** Why `profile` is null for a signed-in user: the API could not be reached or refused. */
    profileError: string | null;
    /** True until Firebase has restored (or ruled out) a stored session. */
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signUp: (input: { email: string; password: string; username: string; displayName: string }) => Promise<"signed-in">;
    signOut: () => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    resendVerification: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export function normaliseUsername(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

export function validateSignUp(input: { email: string; password: string; username: string; displayName: string }): string | null {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Enter a valid email address.";
    if (input.password.length < 8) return "Use a password of at least 8 characters.";
    if (!USERNAME_PATTERN.test(input.username)) return "Usernames are 3–24 lowercase letters, numbers or underscores.";
    if (!input.displayName.trim() || input.displayName.trim().length > 60) return "Enter a display name of up to 60 characters.";
    return null;
}

function friendlyAuthError(error: unknown): Error {
    if (error instanceof ApiError) return error;
    const code = (error as { code?: string })?.code ?? "";
    switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return new Error("That email and password do not match.");
        case "auth/email-already-in-use":
            return new Error("An account with this email already exists. Sign in instead.");
        case "auth/weak-password":
            return new Error("Use a password of at least 8 characters.");
        case "auth/too-many-requests":
            return new Error("Too many attempts. Wait a moment and try again.");
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
            return new Error("Google sign-in was cancelled.");
        case "auth/popup-blocked":
            return new Error("Your browser blocked the Google sign-in window. Allow pop-ups and try again.");
        case "auth/network-request-failed":
            return new Error("Could not reach the sign-in service. Check your connection.");
        default:
            return error instanceof Error && error.message ? new Error(error.message.replace(/^Firebase: /, "").replace(/ \(auth\/[^)]+\)\.?$/, "")) : new Error("Something went wrong. Please try again.");
    }
}

function toSessionUser(user: FirebaseUser): SessionUser {
    return { id: user.uid, email: user.email, emailVerified: user.emailVerified, displayName: user.displayName, photoURL: user.photoURL };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [loading, setLoading] = useState(firebaseConfigured);

    const loadProfile = useCallback(async (signedIn: boolean) => {
        if (!signedIn) {
            setProfile(null);
            setProfileError(null);
            return;
        }
        try {
            setProfile(await getMyProfile());
            setProfileError(null);
        } catch (caught) {
            // A failed profile read must not sign the person out; pages show the reason instead.
            setProfile(null);
            setProfileError(caught instanceof Error ? caught.message : "Could not load your profile.");
        }
    }, []);

    useEffect(() => {
        if (!firebaseConfigured) return;
        return onAuthStateChanged(getFirebaseAuth(), async (next) => {
            setUser(next ? toSessionUser(next) : null);
            await loadProfile(Boolean(next));
            setLoading(false);
        });
    }, [loadProfile]);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            const result = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
            // First Google sign-in: carry the Google photo over unless the member already chose one.
            const current = await getMyProfile();
            if (!current.avatar_url && result.user.photoURL?.startsWith("https://")) {
                await updateOwnProfile(current.id, { display_name: current.display_name, username: current.username, bio: current.bio ?? "", avatar_url: result.user.photoURL });
            }
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
    }, []);

    const signUp = useCallback(async (input: { email: string; password: string; username: string; displayName: string }) => {
        const problem = validateSignUp(input);
        if (problem) throw new Error(problem);
        try {
            const auth = getFirebaseAuth();
            const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
            await updateFirebaseProfile(credential.user, { displayName: input.displayName.trim() });
            await credential.user.getIdToken(true);
            // The API creates the profile on first contact; claim the chosen username and name now.
            const created = await getMyProfile();
            try {
                await updateOwnProfile(created.id, { display_name: input.displayName.trim(), username: input.username, bio: "", avatar_url: "" });
            } catch (caught) {
                // A taken username keeps the generated one rather than failing the whole sign-up.
                if (!(caught instanceof ApiError && caught.code === "USERNAME_TAKEN")) throw caught;
            }
            await sendEmailVerification(credential.user, { url: `${window.location.origin}/#/login` });
            return "signed-in" as const;
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
    }, []);

    const signOut = useCallback(async () => {
        if (firebaseConfigured) await firebaseSignOut(getFirebaseAuth());
        setProfile(null);
    }, []);

    const requestPasswordReset = useCallback(async (email: string) => {
        try {
            await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), { url: `${window.location.origin}/#/login` });
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
    }, []);

    const resendVerification = useCallback(async () => {
        const current = getFirebaseAuth().currentUser;
        if (!current) throw new Error("Sign in first.");
        try {
            await sendEmailVerification(current, { url: `${window.location.origin}/#/login` });
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        const current = getFirebaseAuth().currentUser;
        if (current) {
            await current.reload();
            setUser(toSessionUser(current));
        }
        await loadProfile(Boolean(current));
    }, [loadProfile]);

    const value = useMemo<AuthContextValue>(() => ({
        user, profile, profileError, loading, signIn, signInWithGoogle, signUp, signOut, requestPasswordReset, resendVerification, refreshProfile,
    }), [user, profile, profileError, loading, signIn, signInWithGoogle, signUp, signOut, requestPasswordReset, resendVerification, refreshProfile]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside an AuthProvider");
    return context;
}

export function isStaff(profile: Profile | null): boolean {
    return !!profile && STAFF_ROLES.includes(profile.role);
}
