import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createThread, listForumCategories, type ForumCategory } from "@/lib/community";
import { forumCategoryHref, newThreadHref, openLogin, openThread } from "@/lib/navigation";
import { Notice, PrimaryButton, SelectField, TextArea, TextField } from "@/components/ui/form";
import { PageIntro } from "@/components/ui/page-intro";

export default function NewThreadPage({ categorySlug }: { categorySlug: string | null }) {
    const { user, loading } = useAuth();
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [categoryId, setCategoryId] = useState("");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!loading && !user) openLogin(newThreadHref(categorySlug));
    }, [loading, user, categorySlug]);
    useEffect(() => {
        listForumCategories().then((list) => {
            setCategories(list);
            setCategoryId((current) => current || list.find((item) => item.slug === categorySlug)?.id || list[0]?.id || "");
        }).catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load categories."));
    }, [categorySlug]);

    if (loading || !user) return <main className="page-container news-page"><p className="news-loading">Loading…</p></main>;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const thread = await createThread({ categoryId, authorId: user.id, title, body });
            openThread(thread.id);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not start the discussion.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="page-container news-page">
            <div className="mx-auto max-w-3xl">
                <PageIntro
                    eyebrow="Community"
                    title="Start a discussion"
                    description="Ask a question or share a view. Posts are public; keep them factual and avoid personal financial details."
                    action={<a href={forumCategoryHref(categorySlug)} className="news-button-quiet news-button-quiet--sm"><ArrowLeft size={14} aria-hidden="true" /> Back to the forum</a>}
                />
                <form onSubmit={submit} className="news-form">
                    <SelectField label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
                        {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </SelectField>
                    <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required placeholder="A clear, specific title" hint={`${title.length}/160`} />
                    <TextArea label="Opening post" value={body} onChange={(event) => setBody(event.target.value)} maxLength={10000} rows={8} required placeholder="Give context, numbers and sources where you can. **bold**, *italic* and [links](https://…) are supported." hint={`${body.length.toLocaleString()}/10,000`} />
                    {error && <Notice tone="error">{error}</Notice>}
                    <div className="news-form-actions">
                        <PrimaryButton type="submit" loading={busy} disabled={!title.trim() || !body.trim() || !categoryId}><Send size={15} aria-hidden="true" /> Post discussion</PrimaryButton>
                    </div>
                </form>
            </div>
        </main>
    );
}
