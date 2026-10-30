import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ExternalLink, ImagePlus, LogOut, Save, Trash2 } from "lucide-react";
import { normaliseUsername, useAuth } from "@/lib/auth";
import { ROLE_LABELS, updateOwnProfile, uploadImage } from "@/lib/community";
import { navigate, openLogin, profileHref } from "@/lib/navigation";
import { Notice, PrimaryButton, SecondaryButton, TextArea, TextField } from "@/components/ui/form";
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
    const [photoBusy, setPhotoBusy] = useState(false);
    const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

    useEffect(() => {
        if (!loading && !user) openLogin("/settings");
    }, [loading, user]);
    useEffect(() => {
        if (!profile) return;
        setDisplayName(profile.display_name);
        setUsername(profile.username);
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
    }, [profile]);

    if (loading || !user) return <main className="page-container news-page"><p className="news-loading">Loading your account…</p></main>;

    // A new photo (from the gallery, camera or files) or its removal is saved straight away; no link to paste.
    const savePhoto = async (next: string, done: string) => {
        await updateOwnProfile(user.id, { display_name: displayName, username, bio, avatar_url: next });
        setAvatarUrl(next);
        await refreshProfile();
        setMessage({ tone: "success", text: done });
    };
    const onPickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setPhotoBusy(true);
        setMessage(null);
        try { await savePhoto(await uploadImage(file, "avatar"), "Profile photo updated."); }
        catch (caught) { setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not upload the photo." }); }
        finally { setPhotoBusy(false); }
    };
    const removePhoto = async () => {
        setPhotoBusy(true);
        setMessage(null);
        try { await savePhoto("", "Profile photo removed. Your initials show instead."); }
        catch (caught) { setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not remove the photo." }); }
        finally { setPhotoBusy(false); }
    };

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
        <main className="page-container news-page">
            <div className="mx-auto max-w-3xl">
                <PageIntro
                    eyebrow="Account"
                    title="Your settings"
                    action={profile && <a href={profileHref(profile.username)} className="news-button-quiet news-button-quiet--sm">View public profile <ExternalLink size={14} aria-hidden="true" /></a>}
                />

                <div>
                    <form onSubmit={save} className="news-section" aria-labelledby="profile-heading">
                        <header className="news-section-header">
                            <h2 id="profile-heading">Profile</h2>
                            <span>How you appear to other members</span>
                        </header>
                        <div className="mt-6 flex items-center gap-4">
                            <Avatar author={{ display_name: displayName || "?", avatar_url: avatarUrl.startsWith("https://") ? avatarUrl : null }} size="xl" />
                            <div className="min-w-0">
                                <p className="news-headline-sm truncate text-ink">{displayName || "Your name"}</p>
                                <p className="news-byline mt-1">@{username || "username"} · {profile ? ROLE_LABELS[profile.role] : "Member"}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <label className={`news-button-quiet news-button-quiet--sm cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[rgb(var(--cyan-ink))] ${photoBusy ? "pointer-events-none opacity-60" : ""}`}>
                                        <ImagePlus size={14} aria-hidden="true" />
                                        {photoBusy ? "Saving…" : "Change photo"}
                                        <input type="file" accept="image/*" className="sr-only" disabled={photoBusy} onChange={(event) => void onPickPhoto(event)} />
                                    </label>
                                    {avatarUrl && <button type="button" className="news-button-quiet news-button-quiet--sm" disabled={photoBusy} onClick={() => void removePhoto()}><Trash2 size={14} aria-hidden="true" /> Remove photo</button>}
                                </div>
                            </div>
                        </div>
                        <div className="news-form news-form--2 mt-8">
                            <TextField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required />
                            <TextField label="Username" value={username} onChange={(event) => setUsername(normaliseUsername(event.target.value))} maxLength={24} required hint="Changes your profile link." />
                            <TextArea label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} className="span-2" placeholder="A line about how you follow the markets." hint={`${bio.length}/280`} />
                        </div>
                        {message && <Notice tone={message.tone} className="mt-5">{message.text}</Notice>}
                        <div className="news-form-actions mt-6">
                            <PrimaryButton type="submit" loading={busy}><Save size={16} aria-hidden="true" /> Save changes</PrimaryButton>
                        </div>
                    </form>

                    <section className="news-section" aria-labelledby="appearance-heading">
                        <header className="news-section-header">
                            <h2 id="appearance-heading">Appearance</h2>
                        </header>
                        <div className="mt-6 flex items-center justify-between gap-4">
                            <p className="text-sm text-ink/[0.68]">Colour scheme for this browser.</p>
                            <ThemeToggle />
                        </div>
                    </section>

                    <section className="news-section" aria-labelledby="signin-heading">
                        <header className="news-section-header">
                            <h2 id="signin-heading">Sign-in</h2>
                        </header>
                        {!user.emailVerified && (
                            <Notice className="mt-6">Confirm your email address to comment and post. <button type="button" onClick={() => { void resendVerification().then(() => setMessage({ tone: "success", text: "Verification email sent." })).catch((caught) => setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "Could not send the email." })); }} className="font-semibold underline">Resend the link</button></Notice>
                        )}
                        <dl className="mt-6 text-sm">
                            <div className="flex items-center justify-between gap-4 border-b border-ink/[0.12] py-3"><dt className="news-label mb-0">Email</dt><dd className="truncate font-medium text-ink">{user.email}{user.emailVerified ? "" : " · unverified"}</dd></div>
                            <div className="flex items-center justify-between gap-4 border-b border-ink/[0.12] py-3"><dt className="news-label mb-0">Password</dt><dd><button type="button" onClick={() => void sendReset()} className="text-sm font-bold text-fluid-cyan-ink hover:underline">Send reset link</button></dd></div>
                        </dl>
                        <div className="news-form-actions mt-6">
                            <SecondaryButton onClick={() => { void signOut().then(() => { navigate("/"); }); }}><LogOut size={16} aria-hidden="true" /> Sign out</SecondaryButton>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
