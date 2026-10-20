import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { normaliseUsername, useAuth, type SignUpResult } from "@/lib/auth";
import { returnAfterAuth, type AuthMode } from "@/lib/navigation";
import { Notice, PrimaryButton, SecondaryButton, TextField } from "@/components/ui/form";

const COPY: Record<AuthMode, { title: string; lead: string }> = {
    login: { title: "Welcome back", lead: "Sign in to comment, join discussions and keep your profile." },
    register: { title: "Create your account", lead: "Free, and all you need to take part in the Fluid Finance community." },
    "reset-password": { title: "Reset your password", lead: "We will email you a link to choose a new one." },
};

const BENEFITS = ["Comment on research articles and market notes", "Start and join discussions in the forum", "A public profile for your market views"];

export default function AuthPage({ mode }: { mode: AuthMode }) {
    const { user, loading, signIn, signInWithGoogle, signUp, requestPasswordReset } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState<"reset-sent" | "registered" | null>(null);
    const [registration, setRegistration] = useState<SignUpResult | null>(null);
    const submitted = useRef(false);
    const recovery = false;

    useEffect(() => {
        document.title = `${COPY[mode].title} · Fluid Finance`;
        setError("");
        setDone(null);
        submitted.current = false;
    }, [mode]);

    // Already signed in and not changing a password: go back to where they came from.
    useEffect(() => {
        if (!submitted.current && !loading && user && !busy && !error && !recovery && done === null && mode !== "reset-password") returnAfterAuth();
    }, [loading, user, busy, error, recovery, done, mode]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (busy) return;
        submitted.current = true;
        setBusy(true);
        setError("");
        try {
            if (mode === "login") {
                await signIn(email, password);
                returnAfterAuth();
            } else if (mode === "register") {
                setRegistration(await signUp({ email, password, username, displayName }));
                setDone("registered");
            } else {
                await requestPasswordReset(email);
                setDone("reset-sent");
            }
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const google = async () => {
        if (busy) return;
        submitted.current = true;
        setBusy(true);
        setError("");
        try { await signInWithGoogle(); returnAfterAuth(); }
        catch (caught) { setError(caught instanceof Error ? caught.message : "Google sign-in is unavailable right now."); }
        finally { setBusy(false); }
    };

    const copy = COPY[mode];

    return (
        <main className="page-container news-page">
            {/* Same markup as PageIntro; kept inline so the auth test's module stubs still cover every import. */}
            <header className="news-page-intro news-page-intro--center">
                <div>
                    <p className="news-kicker">Fluid Finance community</p>
                    <h1>{recovery ? "Choose a new password" : copy.title}</h1>
                    <p>{copy.lead}</p>
                </div>
            </header>

            <div className="mx-auto max-w-md">
                {done === "reset-sent" ? (
                    <Done title="Email on its way" body="If an account exists for that address you will receive a password reset link shortly. The link opens a page to choose a new password, then brings you back here." link={{ href: "#/login", label: "Back to sign in" }} />
                ) : done === "registered" && registration ? (
                    <Done title="Account created" body={[
                        registration.verificationSent ? "Check your inbox for a verification link. Confirm your email before commenting or posting." : "Confirm your email before commenting or posting.",
                        ...registration.warnings,
                    ].join(" ")} link={{ href: "#/settings", label: "Open account settings" }} />
                ) : (
                    <form onSubmit={submit} className="news-form" noValidate>
                        {mode !== "reset-password" && (
                            <>
                                <SecondaryButton onClick={() => void google()} disabled={busy} className="w-full gap-3"><GoogleMark /> Continue with Google</SecondaryButton>
                                <div className="news-kicker w-full"><span className="h-px flex-1 bg-ink/[0.19]" aria-hidden="true" />or with email<span className="h-px flex-1 bg-ink/[0.19]" aria-hidden="true" /></div>
                            </>
                        )}
                        {mode === "register" && (
                            <>
                                <TextField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} autoComplete="name" required placeholder="How your name appears" />
                                <TextField label="Username" value={username} onChange={(event) => setUsername(normaliseUsername(event.target.value))} maxLength={24} autoComplete="username" required placeholder="e.g. ama_mensah" hint="Choose 3–24 letters, numbers or underscores. This becomes your profile link." />
                            </>
                        )}
                        {!recovery && <TextField label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required inputMode="email" />}
                        {mode !== "reset-password" || recovery ? (
                            <TextField label={recovery ? "New password" : "Password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} hint={mode === "login" ? undefined : "At least 8 characters."} />
                        ) : null}
                        {error && <Notice tone="error">{error}</Notice>}
                        <PrimaryButton type="submit" loading={busy} className="w-full">
                            {mode === "login" ? "Sign in" : mode === "register" ? "Create account" : recovery ? "Save new password" : "Send reset link"}
                            <ArrowRight size={16} aria-hidden="true" />
                        </PrimaryButton>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink/[0.68]">
                            {mode === "login" && (
                                <>
                                    <a href="#/register" className="font-bold text-fluid-cyan-ink hover:underline">Create an account</a>
                                    <a href="#/reset-password" className="hover:text-ink hover:underline">Forgot password?</a>
                                </>
                            )}
                            {mode === "register" && <span>Already a member? <a href="#/login" className="font-bold text-fluid-cyan-ink hover:underline">Sign in</a></span>}
                            {mode === "reset-password" && !recovery && <a href="#/login" className="hover:text-ink hover:underline">Back to sign in</a>}
                        </div>
                        {mode === "register" && (
                            <p className="news-byline">By creating an account you agree to the <a href="#/terms-of-service" className="underline hover:text-ink">Terms of Service</a> and <a href="#/privacy-policy" className="underline hover:text-ink">Privacy Policy</a>. Nothing on Fluid Finance is investment advice.</p>
                        )}
                    </form>
                )}

                <ul className="news-list news-list--rules mt-10 text-sm text-ink/[0.68]" aria-label="What membership includes">
                    {BENEFITS.map((item) => (
                        <li key={item} className="flex items-start gap-2.5"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-fluid-cyan-ink" aria-hidden="true" />{item}</li>
                    ))}
                </ul>
            </div>
        </main>
    );
}

/** Google's four-colour mark, inline so it needs no asset. */
export function GoogleMark({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
            <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
    );
}

function Done({ title, body, link }: { title: string; body: string; link: { href: string; label: string } }) {
    return (
        <div className="border-y border-ink/[0.19] py-10 text-center" role="status">
            <CheckCircle2 size={32} className="mx-auto text-fluid-green" aria-hidden="true" />
            <h2 className="news-headline mt-4 text-ink">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/[0.68]">{body}</p>
            <a href={link.href} className="news-button mt-6">{link.label} <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
    );
}
