import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
 * Firebase Authentication holds the identity (email + password or Google) in the dedicated
 * finance-fluidterra project, separate from the investor app. The Fluid backend maps each Firebase
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

export interface SignUpResult {
    verificationSent: boolean;
    warnings: string[];
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
    signUp: (input: { email: string; password: string; username: string; displayName: string }) => Promise<SignUpResult>;
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

    const profileRequest = useRef(0);

    const loadProfile = useCallback(async (expected: FirebaseUser | null) => {
        const request = ++profileRequest.current;
        const isCurrent = () => request === profileRequest.current && getFirebaseAuth().currentUser === expected;
        if (!expected) {
            if (!isCurrent()) return false;
            setProfile(null);
            setProfileError(null);
            return true;
        }
        try {
            const nextProfile = await getMyProfile();
            if (!isCurrent()) return false;
            setProfile(nextProfile);
            setProfileError(null);
        } catch (caught) {
            if (!isCurrent()) return false;
            setProfile(null);
            setProfileError(caught instanceof Error ? caught.message : "Could not load your profile.");
        }
        if (isCurrent()) setLoading(false);
        return true;
    }, []);

    useEffect(() => {
        if (!firebaseConfigured) return;
        const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (next) => {
            setUser(next ? toSessionUser(next) : null);
            setProfile(null);
            setProfileError(null);
            setLoading(true);
            void loadProfile(next).then((accepted) => { if (accepted) setLoading(false); });
        });
        return () => { ++profileRequest.current; unsubscribe(); };
    }, [loadProfile]);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        let current: FirebaseUser;
        try {
            current = (await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())).user;
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
        try {
            const profile = await getMyProfile();
            if (getFirebaseAuth().currentUser === current && !profile.avatar_url && current.photoURL?.startsWith("https://")) {
                await updateOwnProfile(profile.id, { display_name: profile.display_name, username: profile.username, bio: profile.bio ?? "", avatar_url: current.photoURL });
            }
        } catch {
            // Optional avatar setup must not turn a successful Google sign-in into a failure.
            // The profile read below reports any API outage through profileError.
        }
        if (getFirebaseAuth().currentUser === current) await loadProfile(current);
    }, [loadProfile]);

    const signUp = useCallback(async (input: { email: string; password: string; username: string; displayName: string }): Promise<SignUpResult> => {
        const problem = validateSignUp(input);
        if (problem) throw new Error(problem);
        let current: FirebaseUser;
        try {
            const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), input.email.trim(), input.password);
            current = credential.user;
        } catch (caught) {
            throw friendlyAuthError(caught);
        }
        // From here on the account exists. Report partial setup honestly and keep recovery available.
        const warnings: string[] = [];
        let verificationSent = false;
        try {
            await sendEmailVerification(current, { url: `${window.location.origin}/#/login` });
            verificationSent = true;
        } catch {
            warnings.push("Your account was created, but the verification email could not be sent. Resend it from Account settings.");
        }
        try {
            await updateFirebaseProfile(current, { displayName: input.displayName.trim() });
            await current.getIdToken(true);
            if (getFirebaseAuth().currentUser !== current) throw new Error("Session changed.");
            const created = await getMyProfile();
            if (getFirebaseAuth().currentUser !== current) throw new Error("Session changed.");
            try {
                await updateOwnProfile(created.id, { display_name: input.displayName.trim(), username: input.username, bio: "", avatar_url: "" });
            } catch (caught) {
                if (!(caught instanceof ApiError && caught.code === "USERNAME_TAKEN")) throw caught;
                warnings.push("That username was taken, so we kept a generated username. You can change it in Account settings.");
            }
        } catch {
            warnings.push("Your account was created, but profile setup could not finish. Open Account settings to retry.");
        }
        if (getFirebaseAuth().currentUser === current) {
            setUser(toSessionUser(current));
            await loadProfile(current);
        }
        return { verificationSent, warnings };
    }, [loadProfile]);

    const signOut = useCallback(async () => {
        ++profileRequest.current;
        if (firebaseConfigured) await firebaseSignOut(getFirebaseAuth());
        setUser(null);
        setProfile(null);
        setProfileError(null);
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
        const request = ++profileRequest.current;
        if (current) {
            await current.reload();
            await current.getIdToken(true);
            if (request !== profileRequest.current || getFirebaseAuth().currentUser !== current) return;
            setUser(toSessionUser(current));
        }
        await loadProfile(current);
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
