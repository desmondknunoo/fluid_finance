import { useEffect, useState } from "react";
import { CalendarDays, MessageSquare, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatLongDate, formatRelative, getProfileByUsername, listMemberActivity, ROLE_LABELS, type ArticleComment, type ForumThread, type Profile } from "@/lib/community";
import { threadHref } from "@/lib/navigation";
import { Notice } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";
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

    if (error) return <main className="page-container news-page"><Notice tone="error" className="mt-8">{error}</Notice></main>;
    if (profile === undefined) return <main className="page-container news-page"><p className="news-loading">Loading profile…</p></main>;
    if (profile === null) {
        return (
            <main className="page-container news-page">
                <PageIntro eyebrow="Members" title={`No member called @${username}`} description={<>They may have changed their username. <a href="#/forum" className="text-fluid-cyan-ink underline">Browse the forum</a>.</>} />
            </main>
        );
    }

    const own = user?.id === profile.id;

    return (
        <main className="page-container news-page">
            <header className="border-b-[3px] border-ink pb-8 pt-6">
                <div className="news-columns news-columns--main">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <Avatar author={profile} size="xl" />
                        <div className="min-w-0 flex-1">
                            <p className="news-kicker">Member profile</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <h1 className="news-headline-lg text-ink">{profile.display_name}</h1>
                                <RolePill role={profile.role} />
                            </div>
                            <p className="mt-2 text-sm text-ink/[0.68]">@{profile.username}{profile.role !== "member" && ` · ${ROLE_LABELS[profile.role]}`}</p>
                            {profile.bio && <p className="news-standfirst mt-4">{profile.bio}</p>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <p className="news-byline inline-flex items-center gap-2"><CalendarDays size={13} aria-hidden="true" /> Member since <strong>{formatLongDate(profile.created_at)}</strong></p>
                        {own && <a href="#/settings" className="news-button-secondary news-button-secondary--sm self-start"><Settings size={14} aria-hidden="true" /> Edit profile</a>}
                    </div>
                </div>
            </header>

            <div className="news-columns news-columns--2 mt-10">
                <section aria-labelledby="threads-heading">
                    <h2 id="threads-heading" className="news-subhead">Discussions started</h2>
                    {!activity ? <p className="news-loading">Loading…</p> : activity.threads.length === 0 ? <p className="news-byline">No discussions yet.</p> : (
                        <ul className="news-list">
                            {activity.threads.map((thread) => (
                                <li key={thread.id}>
                                    <a href={threadHref(thread.id)} className="news-headline-sm block text-ink hover:underline underline-offset-4">{thread.title}</a>
                                    <p className="news-byline mt-1">{thread.category?.name} · {formatRelative(thread.created_at)} · {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section aria-labelledby="comments-heading">
                    <h2 id="comments-heading" className="news-subhead">Recent comments</h2>
                    {!activity ? <p className="news-loading">Loading…</p> : activity.comments.length === 0 ? <p className="news-byline">No comments yet.</p> : (
                        <ul className="news-list">
                            {activity.comments.map((comment) => (
                                <li key={comment.id}>
                                    <p className="line-clamp-3 text-sm leading-relaxed text-ink/[0.86]">{comment.body}</p>
                                    <p className="news-byline mt-1 inline-flex items-center gap-1.5"><MessageSquare size={12} aria-hidden="true" /> {formatRelative(comment.created_at)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}
