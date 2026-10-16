import { useEffect, useState } from "react";
import { CalendarDays, MessageSquare, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatLongDate, formatRelative, getProfileByUsername, listMemberActivity, ROLE_LABELS, type ArticleComment, type ForumThread, type Profile } from "@/lib/community";
import { threadHref } from "@/lib/navigation";
import { Notice, panelClass } from "@/components/ui/form";
import { Avatar, RolePill } from "@/components/community/user-chip";

export default function ProfilePage({ username }: { username: string }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
    const [activity, setActivity] = useState<{ threads: ForumThread[]; comments: ArticleComment[] } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setProfile(undefined);
        setActivity(null);
        setError("");
        getProfileByUsername(username)
            .then(async (found) => {
                if (cancelled) return;
                setProfile(found);
                document.title = found ? `${found.display_name} (@${found.username}) · Fluid Finance` : "Member not found · Fluid Finance";
                if (found) setActivity(await listMemberActivity(found.username));
            })
            .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load this profile."); });
        return () => { cancelled = true; };
    }, [username]);

    if (error) return <main className="page-container py-16"><Notice tone="error">{error}</Notice></main>;
    if (profile === undefined) return <main className="page-container py-16 text-ink/50">Loading profile…</main>;
    if (profile === null) {
        return (
            <main className="page-container py-16 text-center">
                <h1 className="text-3xl font-bold text-ink font-poppins">No member called @{username}</h1>
                <p className="mt-3 text-ink/60">They may have changed their username. <a href="#/forum" className="text-fluid-cyan-ink underline">Browse the forum</a>.</p>
            </main>
        );
    }

    const own = user?.id === profile.id;

    return (
        <main className="page-container py-10 sm:py-16">
            <div className="mx-auto max-w-4xl">
                <section className={`${panelClass} flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8`}>
                    <Avatar author={profile} size="xl" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-ink font-poppins">{profile.display_name}</h1>
                            <RolePill role={profile.role} />
                        </div>
                        <p className="mt-1 text-ink/50">@{profile.username}{profile.role !== "member" && ` · ${ROLE_LABELS[profile.role]}`}</p>
                        {profile.bio && <p className="mt-4 max-w-xl leading-relaxed text-ink/80">{profile.bio}</p>}
                        <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink/50"><CalendarDays size={15} aria-hidden="true" /> Member since {formatLongDate(profile.created_at)}</p>
                    </div>
                    {own && <a href="#/settings" className="inline-flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-xl border border-ink/[0.14] px-4 text-sm font-medium text-ink/80 hover:bg-ink/[0.05]"><Settings size={15} aria-hidden="true" /> Edit profile</a>}
                </section>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <section className={`${panelClass} p-6`} aria-labelledby="threads-heading">
                        <h2 id="threads-heading" className="text-lg font-semibold text-ink">Discussions started</h2>
                        {!activity ? <p className="mt-4 text-sm text-ink/50">Loading…</p> : activity.threads.length === 0 ? <p className="mt-4 text-sm text-ink/50">No discussions yet.</p> : (
                            <ul className="mt-4 divide-y divide-ink/[0.06]">
                                {activity.threads.map((thread) => (
                                    <li key={thread.id} className="py-3">
                                        <a href={threadHref(thread.id)} className="block font-medium text-ink hover:text-fluid-cyan-ink">{thread.title}</a>
                                        <p className="mt-1 text-xs text-ink/40">{thread.category?.name} · {formatRelative(thread.created_at)} · {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                    <section className={`${panelClass} p-6`} aria-labelledby="comments-heading">
                        <h2 id="comments-heading" className="text-lg font-semibold text-ink">Recent comments</h2>
                        {!activity ? <p className="mt-4 text-sm text-ink/50">Loading…</p> : activity.comments.length === 0 ? <p className="mt-4 text-sm text-ink/50">No comments yet.</p> : (
                            <ul className="mt-4 divide-y divide-ink/[0.06]">
                                {activity.comments.map((comment) => (
                                    <li key={comment.id} className="py-3">
                                        <p className="line-clamp-3 text-sm text-ink/80">{comment.body}</p>
                                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink/40"><MessageSquare size={12} aria-hidden="true" /> {formatRelative(comment.created_at)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
