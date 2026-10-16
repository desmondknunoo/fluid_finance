import { useEffect, useState, type FormEvent } from "react";
import {
    ArrowDownToLine,
    ArrowUpRight,
    BarChart3,
    ChevronDown,
    FileText,
    ImagePlus,
    LayoutDashboard,
    Menu,
    MessageCircle,
    Newspaper,
    Shield,
    Sparkles,
    Users,
    X,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
    renderSocialAsset,
    type JustInTemplate,
    type SocialAssetInput,
    type SocialAssetKind,
} from "@/lib/social-asset";
import "./team-portal.css";

type Workspace = "overview" | "studio" | "research" | "community" | "admin";

interface GeneratorOption {
    id: SocialAssetKind | "stocks" | "week-in-review" | "fuel";
    title: string;
    description: string;
    group: string;
}

const GENERATORS: GeneratorOption[] = [
    { id: "stocks", title: "Stocks", description: "Open the existing GSE stock pages and share flow.", group: "Equities" },
    { id: "week-in-review", title: "Week in review", description: "Open the existing weekly market and share flow.", group: "Equities" },
    { id: "just-in", title: "Just in", description: "Create a breaking finance update.", group: "Editorial" },
    { id: "company-portfolio", title: "Company portfolio", description: "Showcase a selected basket of companies.", group: "Equities" },
    { id: "fx", title: "FX", description: "Build a foreign-exchange market card.", group: "Markets" },
    { id: "commodities", title: "Commodities", description: "Share a commodity price snapshot.", group: "Markets" },
    { id: "crypto", title: "Crypto", description: "Create a digital-asset update.", group: "Markets" },
    { id: "indices", title: "Indices", description: "Share an index level or movement.", group: "Markets" },
    { id: "bonds", title: "Bonds", description: "Create a fixed-income market card.", group: "Markets" },
    { id: "other", title: "Other instruments", description: "A flexible card for additional markets.", group: "Markets" },
    { id: "fuel", title: "Fuel prices", description: "Enter Ghana fuel prices and prepare report images.", group: "Data entry" },
];

const WORKSPACES: { id: Workspace; title: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", title: "Team overview", icon: LayoutDashboard },
    { id: "studio", title: "Social studio", icon: ImagePlus },
    { id: "research", title: "Research desk", icon: FileText },
    { id: "community", title: "Community", icon: MessageCircle },
    { id: "admin", title: "Administration", icon: Shield },
];

const TEMPLATE_OPTIONS: { id: JustInTemplate; label: string; note: string }[] = [
    { id: "breaking", label: "Breaking", note: "Urgent market headline" },
    { id: "price-alert", label: "Price alert", note: "A notable instrument move" },
    { id: "company-update", label: "Company update", note: "News about a listed business" },
    { id: "market-note", label: "Market note", note: "A quick analyst observation" },
    { id: "economic-release", label: "Economic release", note: "A new data point or report" },
];

const INITIAL_DRAFT: SocialAssetInput = {
    kind: "just-in",
    template: "breaking",
    title: "",
    symbol: "",
    value: "",
    change: "",
    date: new Date().toISOString().slice(0, 10),
    details: "",
};

function kindTitle(kind: SocialAssetKind): string {
    return GENERATORS.find((generator) => generator.id === kind)?.title ?? "Market image";
}

function WorkspacePlaceholder({ workspace }: { workspace: Exclude<Workspace, "overview" | "studio"> }) {
    const isCommunity = workspace === "community";
    const isResearch = workspace === "research";
    const title = isCommunity ? "Community management" : isResearch ? "Research desk" : "Administration";
    const description = isCommunity
        ? "A home for member accounts, blog conversations, forum spaces and moderation queues."
        : isResearch
            ? "A shared publishing workspace for research notes, editorial drafts and market explainers."
            : "A central place for team access, workspace roles and community settings.";
    const Icon = isCommunity ? Users : isResearch ? Newspaper : Shield;
    const items = isCommunity
        ? ["Member directory", "Forum discussions", "Reported content"]
        : isResearch
            ? ["Research articles", "Editorial calendar", "Published insights"]
            : ["Team roles", "Access policies", "Workspace settings"];

    return (
        <section className="portal-empty">
            <div className="portal-empty-icon"><Icon size={23} /></div>
            <p className="portal-section-label">PLANNED WORKSPACE</p>
            <h1>{title}</h1>
            <p className="portal-empty-copy">{description}</p>
            <div className="portal-roadmap">
                {items.map((item) => <div className="portal-roadmap-row" key={item}><span>{item}</span><span>Next phase</span></div>)}
            </div>
            <p className="portal-preview-note">
                This workspace preview is not connected to sign-in, publishing or moderation yet.
            </p>
        </section>
    );
}

function TeamPortalPage() {
    const [workspace, setWorkspace] = useState<Workspace>("overview");
    const [selected, setSelected] = useState<SocialAssetKind>("just-in");
    const [draft, setDraft] = useState<SocialAssetInput>(INITIAL_DRAFT);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [error, setError] = useState("");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        const previousTitle = document.title;
        document.title = "Team Portal · Fluid Finance";
        const robots = document.createElement("meta");
        robots.name = "robots";
        robots.content = "noindex, nofollow";
        document.head.appendChild(robots);
        return () => {
            document.title = previousTitle;
            robots.remove();
        };
    }, []);

    useEffect(() => {
        if (!previewUrl) return;
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const updateDraft = (field: keyof SocialAssetInput, value: string) => {
        setDraft((current) => ({ ...current, [field]: value }));
        setError("");
    };

    const selectGenerator = (kind: GeneratorOption["id"]) => {
        if (kind === "stocks") {
            window.location.hash = "#/gse-live";
            return;
        }
        if (kind === "week-in-review") {
            window.location.hash = "#/market-trends";
            return;
        }
        if (kind === "fuel") {
            window.location.hash = "#/fuel-prices";
            return;
        }
        setSelected(kind);
        setDraft((current) => ({ ...current, kind }));
        setWorkspace("studio");
        setMobileNavOpen(false);
    };

    const generate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isRendering) return;
        setIsRendering(true);
        setError("");
        try {
            const blob = await renderSocialAsset(draft);
            setPreviewUrl((previous) => {
                if (previous) URL.revokeObjectURL(previous);
                return URL.createObjectURL(blob);
            });
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "The image could not be prepared. Try again.");
        } finally {
            setIsRendering(false);
        }
    };

    const download = () => {
        if (!previewUrl) return;
        const link = document.createElement("a");
        link.href = previewUrl;
        link.download = `${selected}-fluid-finance-${draft.date || "image"}.png`;
        link.click();
    };

    const handleWorkspaceChange = (next: Workspace) => {
        setWorkspace(next);
        setMobileNavOpen(false);
    };

    const justIn = selected === "just-in";
    const portfolio = selected === "company-portfolio";
    const hasQuote = ["fx", "commodities", "crypto", "indices", "bonds", "other"].includes(selected);
    const sectionTitle = workspace === "overview"
        ? "Good morning, team"
        : workspace === "studio" ? "Social studio" : WORKSPACES.find((item) => item.id === workspace)?.title ?? "Team portal";
    const activeTitle = WORKSPACES.find((item) => item.id === workspace)?.title;

    return (
        <div className="team-portal">
            <aside className={`portal-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
                <div className="portal-brand">
                    <a href="#/" aria-label="Fluid Finance home"><BrandLogo className="h-10 w-auto" /></a>
                    <button className="portal-mobile-close" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={20} /></button>
                </div>
                <div className="portal-workspace-picker">
                    <span className="portal-workspace-mark">F</span>
                    <span><strong>Fluid Finance</strong><small>Team workspace</small></span>
                    <ChevronDown size={15} />
                </div>
                <p className="portal-nav-label">WORKSPACE</p>
                <nav className="portal-nav" aria-label="Team workspace">
                    {WORKSPACES.map(({ id, title, icon: Icon }) => (
                        <button
                            type="button"
                            key={id}
                            onClick={() => handleWorkspaceChange(id)}
                            className={workspace === id ? "is-active" : ""}
                            aria-current={workspace === id ? "page" : undefined}
                        >
                            <Icon size={18} strokeWidth={1.8} /><span>{title}</span>
                            {id === "studio" && <span className="portal-nav-dot" />}
                        </button>
                    ))}
                </nav>
                <div className="portal-sidebar-footer">
                    <div className="portal-access-warning"><Shield size={16} /><span>Preview workspace<br /><strong>Staff access not connected</strong></span></div>
                    <a href="#/"><ArrowUpRight size={15} /> Back to Fluid Finance</a>
                </div>
            </aside>
            {mobileNavOpen && <button className="portal-mobile-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

            <main className="portal-main">
                <header className="portal-topbar">
                    <button className="portal-mobile-menu" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
                    <div className="portal-breadcrumb"><span>Workspace</span><span>/</span><strong>{activeTitle}</strong></div>
                    <div className="portal-topbar-actions"><span className="portal-status"><span /> Preview</span><span className="portal-avatar" aria-label="Team workspace">FF</span></div>
                </header>

                <div className="portal-content">
                    <div className="portal-page-heading">
                        <div>
                            <h1>{sectionTitle}</h1>
                            <p>{workspace === "studio" ? "Create on-brand finance visuals from the data you enter." : "One home for research, social publishing and community care."}</p>
                        </div>
                        {workspace === "overview" && <button type="button" className="portal-primary-action" onClick={() => handleWorkspaceChange("studio")}><Sparkles size={16} /> Open social studio</button>}
                    </div>

                    {workspace === "overview" && (
                        <>
                            <div className="portal-preview-banner"><Shield size={17} /><p>This portal is a working UI preview. Sign-in, publishing permissions and shared team data are not connected yet.</p></div>
                            <section className="portal-overview">
                                <div className="portal-overview-main">
                                    <p className="portal-section-label">START CREATING</p>
                                    <h2>Market updates, ready to share.</h2>
                                    <p>Your original Stock and Week in Review share flows stay in place. New formats follow the same Fluid image layout and footer.</p>
                                    <button type="button" className="portal-primary-action" onClick={() => handleWorkspaceChange("studio")}><ImagePlus size={16} /> Create an image</button>
                                </div>
                                <div className="portal-overview-art" aria-hidden="true"><div className="portal-art-orbit" /><div className="portal-art-candle candle-one" /><div className="portal-art-candle candle-two" /><div className="portal-art-candle candle-three" /><div className="portal-art-candle candle-four" /><div className="portal-art-caption">FLUID / MARKET STUDIO</div></div>
                            </section>
                            <div className="portal-section-heading"><div><h2>Choose a starting point</h2><p>Fuel reporting and share-card generators in one place.</p></div><button type="button" onClick={() => handleWorkspaceChange("studio")}>View all <ArrowUpRight size={15} /></button></div>
                            <div className="portal-generator-grid">
                                {GENERATORS.map((generator) => {
                                    const Icon = generator.id === "fuel" ? BarChart3 : generator.id === "just-in" || generator.id === "week-in-review" ? Newspaper : generator.id === "company-portfolio" || generator.id === "stocks" ? Users : ImagePlus;
                                    return <button type="button" className="portal-generator-tile" key={generator.id} onClick={() => selectGenerator(generator.id)}>
                                        <span className="portal-generator-icon"><Icon size={19} /></span><span className="portal-generator-copy"><strong>{generator.title}</strong><small>{generator.description}</small></span><ArrowUpRight size={16} className="portal-tile-arrow" />
                                    </button>;
                                })}
                            </div>
                            <div className="portal-section-heading portal-team-heading"><div><h2>Other teams</h2><p>Spaces for the people behind the market updates.</p></div></div>
                            <div className="portal-team-links">
                                <button type="button" onClick={() => handleWorkspaceChange("research")}><FileText size={18} /><span><strong>Research desk</strong><small>Articles and editorial planning</small></span><ArrowUpRight size={16} /></button>
                                <button type="button" onClick={() => handleWorkspaceChange("community")}><MessageCircle size={18} /><span><strong>Community</strong><small>Discussions and moderation</small></span><ArrowUpRight size={16} /></button>
                                <button type="button" onClick={() => handleWorkspaceChange("admin")}><Shield size={18} /><span><strong>Administration</strong><small>Roles and workspace settings</small></span><ArrowUpRight size={16} /></button>
                            </div>
                        </>
                    )}

                    {workspace === "studio" && (
                        <div className="portal-studio">
                            <aside className="portal-generator-list">
                                <div className="portal-generator-list-heading"><span>IMAGE FORMATS</span><span>{GENERATORS.length - 1}</span></div>
                                {GENERATORS.filter((generator) => generator.id !== "fuel").map((generator) => (
                                    <button type="button" key={generator.id} className={`${selected === generator.id ? "is-selected" : ""} ${generator.id === "stocks" || generator.id === "week-in-review" ? "uses-existing-share" : ""}`} onClick={() => selectGenerator(generator.id)}>
                                        <span>{generator.title}</span>{generator.id === "just-in" ? <small>5</small> : (generator.id === "stocks" || generator.id === "week-in-review") ? <small>OPEN</small> : null}
                                    </button>
                                ))}
                                <a className="portal-fuel-link" href="#/fuel-prices"><BarChart3 size={16} /><span><strong>Fuel price report</strong><small>Enter Ghana pump prices</small></span><ArrowUpRight size={14} /></a>
                            </aside>

                            <div className="portal-studio-body">
                                <div className="portal-studio-heading"><div><h2>{kindTitle(selected)}</h2><p>Enter the copy and market figures you want on the share image.</p></div><span className="portal-manual-tag">MANUAL DATA</span></div>
                                {justIn && <div className="portal-template-select"><p>Choose a Just In template</p><div>{TEMPLATE_OPTIONS.map((template) => <button type="button" className={draft.template === template.id ? "is-selected" : ""} onClick={() => updateDraft("template", template.id)} key={template.id}><strong>{template.label}</strong><small>{template.note}</small></button>)}</div></div>}
                                <form className="portal-editor" onSubmit={generate}>
                                    <label className="portal-field portal-field-full"><span>{justIn ? "News headline" : portfolio ? "Portfolio title" : "Image headline"}</span><input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} maxLength={120} placeholder={justIn ? "Enter the key update" : portfolio ? "e.g. Ghana's leading financials" : "What should this image say?"} required /></label>
                                    {hasQuote && <label className="portal-field"><span>Instrument / ticker</span><input value={draft.symbol} onChange={(event) => updateDraft("symbol", event.target.value)} maxLength={24} placeholder={selected === "fx" ? "e.g. USD/GHS" : selected === "commodities" ? "e.g. Gold" : selected === "crypto" ? "e.g. BTC/USD" : "Enter a name"} /></label>}
                                    {hasQuote && <label className="portal-field"><span>Market level / price</span><input value={draft.value} onChange={(event) => updateDraft("value", event.target.value)} maxLength={28} placeholder={selected === "fx" ? "e.g. 12.45 GHS" : "Enter a value"} /></label>}
                                    {hasQuote && <label className="portal-field"><span>Change</span><input value={draft.change} onChange={(event) => updateDraft("change", event.target.value)} maxLength={28} placeholder="e.g. +2.4% today" /></label>}
                                    <label className="portal-field"><span>As of</span><input type="date" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} required /></label>
                                    <label className="portal-field portal-field-full"><span>{justIn ? "Supporting details" : portfolio ? "Portfolio holdings" : "Context / note"} <small>{portfolio ? "One holding per line, e.g. MTNGH · +2.4%" : "Optional"}</small></span><textarea value={draft.details} onChange={(event) => updateDraft("details", event.target.value)} rows={4} maxLength={600} placeholder={portfolio ? "MTNGH · +2.4%\nGCB · +1.1%\n..." : justIn ? "Add a source, figure or a line of context" : "Add a short note for the image"} /></label>
                                    {error && <p className="portal-form-error" role="alert">{error}</p>}
                                    <div className="portal-form-actions"><p>Images are generated in this browser. Confirm entered data before sharing.</p><button type="submit" className="portal-primary-action" disabled={isRendering}>{isRendering ? <><span className="portal-spinner" /> Preparing image</> : <><Sparkles size={16} /> Generate image</>}</button></div>
                                </form>

                                <section className="portal-preview-section" aria-live="polite">
                                    <div className="portal-preview-heading"><div><h3>Preview</h3><p>1080 × 1350 · PNG</p></div>{previewUrl && <button type="button" onClick={download} className="portal-download-button"><ArrowDownToLine size={16} /> Download PNG</button>}</div>
                                    <div className={`portal-image-stage ${previewUrl ? "has-preview" : ""}`}>{previewUrl ? <img src={previewUrl} alt={`Generated ${kindTitle(selected)} finance image`} /> : <div><span><ImagePlus size={21} /></span><strong>Your preview will appear here</strong><small>Complete the fields and generate your image.</small></div>}</div>
                                </section>
                            </div>
                        </div>
                    )}

                    {workspace !== "overview" && workspace !== "studio" && <WorkspacePlaceholder workspace={workspace} />}
                </div>
            </main>
        </div>
    );
}

export default TeamPortalPage;
