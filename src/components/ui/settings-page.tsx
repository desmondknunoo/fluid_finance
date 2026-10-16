import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, LogOut, Save } from "lucide-react";
import { normaliseUsername, useAuth } from "@/lib/auth";
import { ROLE_LABELS, updateOwnProfile } from "@/lib/community";
import { openLogin, profileHref } from "@/lib/navigation";
import { Notice, panelClass, PrimaryButton, SecondaryButton, TextArea, TextField } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/community/user-chip";

export default function SettingsPage() {
    const { user, profile, loading, signOut, refreshProfile, requestPasswordReset, resendVerification } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

    useEffect(() => { document.title = "Account settings · Fluid Finance"; }, []);
    useEffect(() => {
        if (!loading && !user) openLogin("#/settings");
    }, [loading, user]);
    useEffect(() => {
        if (!profile) return;
        setDisplayName(profile.display_name);
        setUsername(profile.username);
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
    }, [profile]);

    if (loading || !user) return <main className="page-container py-16 text-ink/50">Loading your account…</main>;

    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setMessage(null);
        try {
            await updateOwnProfile(user.id, { display_name: displayName, username, bio, avatar_url: avatarUrl });
            await refreshProfile();
            setMessage({ tone: "success", text: "Profile saved." });
        } catch (caught) {
            setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not save your profile." });
        } finally {
            setBusy(false);
        }
    };

    const sendReset = async () => {
        if (!user.email) return;
        setMessage(null);
        try {
            await requestPasswordReset(user.email);
            setMessage({ tone: "success", text: `Password reset link sent to ${user.email}.` });
        } catch (caught) {
            setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not send the reset link." });
        }
    };

    return (
        <main className="page-container py-10 sm:py-16">
            <div className="mx-auto max-w-3xl">
                <PageIntro
                    eyebrow="Account"
                    title="Your settings"
                    description="How you appear to other members, plus sign-in and appearance preferences."
                    action={profile && <a href={profileHref(profile.username)} className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-ink/[0.14] px-4 text-sm font-medium text-ink/80 hover:bg-ink/[0.05]">View public profile <ExternalLink size={15} aria-hidden="true" /></a>}
                />

                <form onSubmit={save} className={`${panelClass} p-6 sm:p-8`}>
                    <div className="flex items-center gap-4">
                        <Avatar author={{ display_name: displayName || "?", avatar_url: avatarUrl.startsWith("https://") ? avatarUrl : null }} size="xl" />
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-ink">{displayName || "Your name"}</p>
                            <p className="text-sm text-ink/50">@{username || "username"} · {profile ? ROLE_LABELS[profile.role] : "Member"}</p>
                        </div>
                    </div>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        <TextField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required />
                        <TextField label="Username" value={username} onChange={(event) => setUsername(normaliseUsername(event.target.value))} maxLength={24} required hint="Changes your profile link." />
                        <TextArea label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} className="sm:col-span-2" placeholder="A line about how you follow the markets." hint={`${bio.length}/280`} />
                        <TextField label="Avatar image link" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://…" className="sm:col-span-2" hint="A public https:// image link. Leave blank to use your initials." />
                    </div>
                    {message && <Notice tone={message.tone} className="mt-5">{message.text}</Notice>}
                    <div className="mt-6 flex justify-end">
                        <PrimaryButton type="submit" loading={busy}><Save size={16} aria-hidden="true" /> Save changes</PrimaryButton>
                    </div>
                </form>

                <section className={`${panelClass} mt-6 p-6 sm:p-8`} aria-labelledby="appearance-heading">
                    <h2 id="appearance-heading" className="text-lg font-semibold text-ink">Appearance</h2>
                    <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-sm text-ink/60">Colour scheme for this browser.</p>
                        <ThemeToggle />
                    </div>
                </section>

                <section className={`${panelClass} mt-6 p-6 sm:p-8`} aria-labelledby="signin-heading">
                    <h2 id="signin-heading" className="text-lg font-semibold text-ink">Sign-in</h2>
                    {!user.emailVerified && (
                        <Notice className="mt-4">Confirm your email address to comment and post. <button type="button" onClick={() => { void resendVerification().then(() => setMessage({ tone: "success", text: "Verification email sent." })).catch((caught) => setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not send the email." })); }} className="font-semibold underline">Resend the link</button></Notice>
                    )}
                    <dl className="mt-4 divide-y divide-ink/[0.06] text-sm">
                        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-ink/60">Email</dt><dd className="truncate font-medium text-ink">{user.email}{user.emailVerified ? "" : " · unverified"}</dd></div>
                        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-ink/60">Password</dt><dd><button type="button" onClick={() => void sendReset()} className="font-semibold text-fluid-cyan-ink hover:underline">Send reset link</button></dd></div>
                    </dl>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => { void signOut().then(() => { window.location.hash = "#/"; }); }}><LogOut size={16} aria-hidden="true" /> Sign out</SecondaryButton>
                    </div>
                </section>
            </div>
        </main>
    );
}
