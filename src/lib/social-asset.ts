import { renderShareCard, type ShareCardInput } from "@/lib/share-card";
import { logoUrl } from "@/lib/logos";
import { FX_GROUPS, FX_PROVIDERS, type FxProviderGroup } from "@/lib/fx-providers";
import { FLUID_DESIGN_PRESETS as PRESETS } from "@/lib/fluid-design-presets";
import { drawStudioFooter } from "@/lib/weekly-trends-share-card";
import { formatFuelDate } from "@/lib/fuel-prices";

export type SocialAssetKind = "bond-market-update" | "policy-update" | "single-stock" | "today-movers" | "week-in-review" | "investor-brief" | "breaking-news" | "news" | "company-profile" | "just-in" | "company-portfolio" | "fx" | "commodities" | "crypto" | "indices" | "bonds" | "other" | "logo-footer" | "trending" | "treasury-bills";
export type JustInTemplate = "breaking" | "price-alert" | "company-update" | "market-note" | "economic-release";
export type SocialTheme = "neutral" | "photo" | "fluid-text-blue" | "fluid-text-green" | "blue" | "gold" | "emerald" | "custom";
export interface CompanyProfileContent {
    layout?: "classic" | "heritage-leadership";
    ticker?: string;
    managingDirectorPhoto?: string;
    boardChairmanPhoto?: string;
    milestones?: {year:string;event:string}[];
    services?: string[];
    logo?: string;
    heritageLabel?: string; heritage?: string; whatWeDo?: string; didYouKnow?: string;
    managingDirectorLabel?: string; managingDirector?: string; boardChairmanLabel?: string; boardChairman?: string;
    shareStructure?: string;
}
export const PROFILE_LIMITS = { heritageLabel: 26, heritage: 110, whatWeDo: 110, didYouKnow: 110, managingDirectorLabel: 26, managingDirector: 70, boardChairmanLabel: 26, boardChairman: 70, shareStructure: 110 } as const;
export const SOCIAL_ASSET_LIMITS = { title: 90, details: 240, symbol: 32, value: 24, change: 28, period: 40, facts: 180 } as const;

export interface CommodityItem { basis?: string; name: string; price: string; change: string; picture?: string; illustration?: "auto" | "none" | "oil" | "gas" | "corn" | "cocoa" | "gold" | "manganese" | "cashew" | "copper" | "coffee" | "wheat" }

export function defaultCommodityRows(category: "energy" | "agriculture" | "metals" = "energy"): CommodityItem[] {
    const names = {energy:["Crude Oil","Natural Gas","Brent Crude Oil","Natural Gas"],metals:["Gold","Manganese Ore","Gold","Copper"],agriculture:["Cocoa Beans","Cashew","Coffee","Wheat"]}[category];
    return names.map(name=>({name,price:"",change:""}));
}

export interface FxRateRow { group?: Exclude<FxProviderGroup,"all">; logo?: string; label: string; code?: string; buying: string; selling: string; buyingTrend?: "up" | "down"; sellingTrend?: "up" | "down" }
export function defaultFxRows(template: "bog" | "cedirates"): FxRateRow[] {
    return template === "bog" ? [{label:"US Dollar",code:"USD",buying:"",selling:""},{label:"Pound Sterling",code:"GBP",buying:"",selling:""},{label:"Euro",code:"EUR",buying:"",selling:""}] : FX_PROVIDERS.map(provider=>({...provider,buying:"",selling:""}));
}

export function groupedFxRows(input: SocialAssetInput): FxRateRow[] {
    return (input.fxRows ?? FX_PROVIDERS.map(provider=>({...provider,buying:"",selling:""}))).filter(row=>!input.fxGroup || input.fxGroup==="all" || (input.fxGroup==="bureaus-cards-crypto" ? ["forex-bureaus","cards","crypto"].includes(row.group || "") : row.group===input.fxGroup));
}
export function fxPageCount(input: SocialAssetInput): number { return Math.ceil(groupedFxRows(input).length/20); }

export interface InvestorMetric { label:string; value:string; note:string }
export interface InvestorBriefContent { metrics:InvestorMetric[]; watchPoints:string[]; bottomLine:string }
export function defaultInvestorBrief(): InvestorBriefContent { return {metrics:["Revenue","Net profit","Valuation","Total debt","Capacity / outlook"].map(label=>({label,value:"",note:""})),watchPoints:["","","",""],bottomLine:""}; }

export interface WeekReviewRow { logo?:string; name:string; price:string; change:string }
function weekReviewLogo(row: WeekReviewRow): string | null { const ticker=row.name.match(/\(([A-Za-z0-9]+)\)\s*$/)?.[1] || row.name.trim();return row.logo || (ticker.toUpperCase()==="EGH"?"/gse/enterprise.jpeg":logoUrl(ticker.toUpperCase()==="KASAP"?"KASA":ticker)); }
export interface WeekReviewContent { direction:"gainers"|"losers"; startDate:string; rows:WeekReviewRow[] }
export function defaultWeekReview(): WeekReviewContent { return {direction:"gainers",startDate:"",rows:Array.from({length:5},()=>({name:"",price:"",change:""}))}; }
export interface BondUpdateContent { previousPeriod:string; previousYield:string; currentPeriod:string; currentYield:string; performanceNote:string; maturity:string; pricingGuidance:string; distribution:string; offerOpens:string; pricingStatus:string }
export const BOND_UPDATE_LIMITS={previousPeriod:24,previousYield:16,currentPeriod:24,currentYield:16,performanceNote:90,maturity:24,pricingGuidance:64,distribution:90,offerOpens:48,pricingStatus:64} as const;
export function defaultBondUpdate(): BondUpdateContent { return {previousPeriod:"",previousYield:"",currentPeriod:"",currentYield:"",performanceNote:"",maturity:"",pricingGuidance:"",distribution:"",offerOpens:"",pricingStatus:""}; }
export interface PolicyUpdateContent { implications:{title:string;details:string}[] }
export function defaultPolicyUpdate(): PolicyUpdateContent { return {implications:Array.from({length:3},()=>({title:"",details:""}))}; }
export interface TreasuryContent { previousRate:string; discountRate:string; issueDate:string }
export interface SocialAssetInput {
    treasury?: TreasuryContent;
    stockCard?: ShareCardInput;
    bondUpdate?: BondUpdateContent;
    policyUpdate?: PolicyUpdateContent;
    weekReview?: WeekReviewContent;
    investorBrief?: InvestorBriefContent;
    fxTemplate?: "bog" | "cedirates";
    fxRows?: FxRateRow[];
    fxGroup?: FxProviderGroup;
    fxPage?: number;
    fxObservedDate?: string;
    commodityCategory?: "energy" | "agriculture" | "metals";
    commodities?: CommodityItem[];
    kind: SocialAssetKind;
    template: JustInTemplate;
    title: string;
    symbol: string;
    value: string;
    change: string;
    date: string;
    details: string;
    source?: string;
    picture?: string;
    pictureX?: number;
    pictureY?: number;
    pictureFit?: "cover" | "contain";
    facts?: string;
    period?: string;
    profile?: CompanyProfileContent;
    theme?: SocialTheme;
    accentColor?: string;
    accentEndColor?: string;
    textColor?: string;
}

const W = 1080, H = 1350, M = 64, FOOTER_Y = H - 152;
const DISPLAY = "FluidStudioBody";
const BODY = "FluidStudioBody";
const TEMPLATE_LABELS: Record<JustInTemplate, string> = { breaking: "BREAKING", "price-alert": "PRICE ALERT", "company-update": "COMPANY UPDATE", "market-note": "MARKET NOTE", "economic-release": "ECONOMIC RELEASE" };
const LABELS: Record<SocialAssetKind, string> = { "bond-market-update":"BOND MARKET UPDATE", "policy-update":"POLICY UPDATE", "single-stock":"", "today-movers":"", "week-in-review":"", "investor-brief":"INVESTOR BRIEF", "breaking-news": "BREAKING", news: "NEWS UPDATE", "company-profile": "GSE PROFILE OF THE WEEK", "just-in": "JUST IN", "company-portfolio": "COMPANY PORTFOLIO", fx: "FX", commodities: "COMMODITIES", crypto: "CRYPTO", indices: "INDICES", bonds: "BONDS", other: "", "logo-footer": "", trending: "TRENDING", "treasury-bills": "TREASURY BILLS" };
const CATEGORY_BADGES: Record<string, { background: string; text: string }> = {
    "BOND MARKET UPDATE":{background:"#fcd34d",text:"#000000"}, "POLICY UPDATE":{background:"#fcd34d",text:"#000000"},
    "GSE PROFILE OF THE WEEK": {background:"#1685e5",text:"#ffffff"}, "INVESTOR BRIEF": {background:"#22d3ee",text:"#041426"}, BREAKING: {background:"#be123c",text:"#ffffff"}, "PRICE ALERT": {background:"#fcd34d",text:"#000000"},
    TRENDING: {background:"#7c3aed",text:"#ffffff"}, "NEWS UPDATE": {background:"#fcd34d",text:"#000000"},
    "COMPANY PORTFOLIO": {background:"#047857",text:"#ffffff"}, FX: {background:"#2dd4bf",text:"#041426"},
    CRYPTO: {background:"#fbbf24",text:"#041426"}, INDICES: {background:"#1685e5",text:"#ffffff"},
    BONDS: {background:"#315a85",text:"#ffffff"}, "TREASURY BILLS": {background:"#fcd34d",text:"#041426"},
};
let fontsReady: Promise<void> | undefined;

async function loadFonts(): Promise<void> {
    if (!fontsReady) fontsReady = Promise.all([
        new FontFace(BODY, 'url("/fonts/Poppins-Regular.ttf")', { weight: "400" }).load(),
        new FontFace(BODY, 'url("/fonts/Poppins-Medium.ttf")', { weight: "500" }).load(),
        new FontFace(BODY, 'url("/fonts/Poppins-Bold.ttf")', { weight: "700" }).load(),
        new FontFace(BODY, 'url("/fonts/Poppins-ExtraBold.ttf")', { weight: "800" }).load(),
    ]).then(fonts => { fonts.forEach(font => document.fonts.add(font)); }).catch(() => {
        fontsReady = undefined;
        throw new Error("The image fonts could not load. Check your connection and generate again.");
    });
    return fontsReady;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("A picture or the Fluid Finance logo could not load. Please try again."));
        image.src = src;
    });
}

function rgb(hex: string): number[] { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); }
function hex(values: number[]): string { return `#${values.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`; }
function luminance(color: string): number {
    const [r, g, b] = rgb(color).map(v => { const n = v / 255; return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; });
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a: string, b: string): number { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function readableAccent(color: string, background: string): string {
    const target = luminance(background) < 0.4 ? 255 : 0;
    let channels = rgb(color);
    for (let i = 0; i < 30 && contrast(hex(channels), background) < 4.5; i++) channels = channels.map(v => v + (target - v) * 0.12);
    return hex(channels);
}

/** Sample the photograph itself; no stock palette or external image service is involved. */
function photoAccent(photo: HTMLImageElement): string {
    const sample = document.createElement("canvas"); sample.width = sample.height = 48;
    const ctx = sample.getContext("2d");
    if (!ctx) return "#22d3ee";
    ctx.drawImage(photo, 0, 0, 48, 48);
    const pixels = ctx.getImageData(0, 0, 48, 48).data;
    const buckets = new Map<string, { color: number[]; count: number; saturation: number }>();
    for (let i = 0; i < pixels.length; i += 4) {
        const color = [pixels[i], pixels[i + 1], pixels[i + 2]], max = Math.max(...color), min = Math.min(...color);
        const saturation = max ? (max - min) / max : 0;
        if (max < 55 || min > 225 || saturation < 0.22 || pixels[i + 3] < 200) continue;
        const key = color.map(v => Math.floor(v / 32)).join(",");
        const bucket = buckets.get(key) ?? { color: [0, 0, 0], count: 0, saturation: 0 };
        bucket.color = bucket.color.map((v, n) => v + color[n]); bucket.count++; bucket.saturation += saturation;
        buckets.set(key, bucket);
    }
    const best = [...buckets.values()].sort((a, b) => b.saturation - a.saturation)[0];
    return best ? hex(best.color.map(v => v / best.count)) : "#22d3ee";
}

function palette(input: SocialAssetInput, photo?: HTMLImageElement): { accent: string; accentEnd: string; background: string; text: string } {
    const theme = input.theme ?? "photo";
    const background = PRESETS.backgroundBlue.base;
    const text = theme === "custom" ? input.textColor ?? "#ffffff" : "#ffffff";
    const choices = { neutral: "#ffffff", photo: photo ? photoAccent(photo) : "#22d3ee", blue: PRESETS.textBlue.start, "fluid-text-green": PRESETS.textBlue.start, "fluid-text-blue": PRESETS.textBlue.start, gold: "#fcd34d", emerald: "#34d399", custom: input.accentColor ?? "#22d3ee" };
    const ends = { neutral: text, photo: "#22d3ee", blue: PRESETS.textBlue.end, "fluid-text-green": PRESETS.textBlue.end, "fluid-text-blue": PRESETS.textBlue.end, gold: "#fb923c", emerald: "#a3e635", custom: input.accentEndColor ?? "#22d3ee" };
    return { accent: theme === "custom" ? choices[theme] : readableAccent(choices[theme], background), accentEnd: ends[theme], background, text };
}

function lines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
    const result: string[] = [];
    for (const paragraph of text.trim().split(/\n+/)) {
        let line = "";
        for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
            if (line && ctx.measureText(`${line} ${word}`).width > width) { result.push(line); line = ""; }
            for (const character of word) {
                if (line && ctx.measureText(line + character).width > width) { result.push(line); line = ""; }
                line += character;
            }
            line += " ";
        }
        if (line.trim()) result.push(line.trimEnd());
    }
    return result.map(line => line.trimEnd());
}

/** Fit the complete copy. Never export clipped text or hide its ending behind an ellipsis. */
function fitText(ctx: CanvasRenderingContext2D, text: string, width: number, height: number, options: { display?: boolean; max: number; min: number; field: string; singleLine?: boolean; weight?: number }): { rows: string[]; size: number; step: number } {
    for (let size = options.max; size >= options.min; size -= 2) {
        ctx.letterSpacing = options.display && options.weight !== 700 ? "-2px" : "0px";
        ctx.font = options.display ? `${options.weight ?? 800} ${size}px ${DISPLAY}` : `${options.weight ?? 500} ${size}px ${BODY}`;
        const rows = lines(ctx, text, width), step = Math.ceil(size * (options.display ? 0.94 : 1.45));
        if ((!options.singleLine || rows.length === 1) && rows.length * step <= height) return { rows, size, step };
    }
    throw new Error(`Shorten the ${options.field} so it fits at a readable size. Nothing has been cut off.`);
}

/** Ignore stale quote fields when moving from a market format to an editorial format. */
export function socialAssetHasQuote(input: Pick<SocialAssetInput, "kind" | "template">): boolean {
    if (input.kind === "just-in") return input.template === "price-alert" || input.template === "economic-release";
    return !["breaking-news", "news", "trending", "company-profile", "today-movers", "single-stock", "policy-update", "bond-market-update", "week-in-review", "investor-brief", "commodities", "company-portfolio", "logo-footer"].includes(input.kind);
}

export function validateSocialAsset(input: SocialAssetInput): void {
    if(input.kind==="single-stock"){
        const stock=input.stockCard;
        if(!stock || !stock.symbol.trim() || !stock.company.trim() || ![stock.price,stock.change,stock.changePercent,stock.periodPercent].every(Number.isFinite) || stock.price<=0 || !["1W","1M","3M","6M","YTD","1Y","ALL"].includes(stock.range) || stock.points.length<2 || stock.points.some(point=>!Number.isFinite(point.t)||!Number.isFinite(point.close)||point.close<=0)) throw new Error("Load a stock and a valid history series before generating.");
        return;
    }
    if(input.kind==="treasury-bills" && input.treasury){
        const treasury=input.treasury;
        if([treasury.previousRate,treasury.discountRate].some(rate=>!/^\d+(\.\d{1,6})?%?$/.test(rate) || rate.length>16))throw new Error("Enter the previous interest rate and current discount rate as percentages.");
        if(!/^\d{4}-\d{2}-\d{2}$/.test(treasury.issueDate) || !Number.isFinite(Date.parse(treasury.issueDate+"T12:00:00Z")) || new Date(treasury.issueDate+"T12:00:00Z").toISOString().slice(0,10)!==treasury.issueDate)throw new Error("Choose a valid treasury-bill issue date.");
    }
    if(input.kind==="bond-market-update"){
        const bond=input.bondUpdate;if(!bond)throw new Error("Complete the bond market update fields.");
        for(const [key,limit] of Object.entries(BOND_UPDATE_LIMITS)){const value=bond[key as keyof BondUpdateContent];if(!value?.trim() || value.length>limit)throw new Error(`Complete the bond ${key} within ${limit} characters.`);}
    }
    if(input.kind==="policy-update"){
        const policy=input.policyUpdate;
        if(!policy || policy.implications.length!==3 || policy.implications.some(point=>!point.title.trim()||point.title.length>28||!point.details.trim()||point.details.length>100)) throw new Error("Complete three policy implications: titles up to 28 and details up to 100 characters.");
    }
    if (input.kind === "logo-footer") {
        if (!input.picture) throw new Error("Upload your already designed image first.");
        return;
    }
    if (input.kind === "commodities" && input.commodities) {
        if (![1,2,4].includes(input.commodities.length)) throw new Error("Use one or two legacy cards, or four cards for Local and International.");
        for (const row of input.commodities) {
            if (!row.name.trim() || !row.price.trim()) throw new Error("Enter a name and price with units for each commodity.");
            if (row.name.length > 36 || row.price.length > 28 || row.change.length > 24) throw new Error("Keep commodity names within 36, prices within 28 and changes within 24 characters.");
        }
    }
    if (input.kind === "fx" && input.fxTemplate) {
        const rows = input.fxRows ?? [];
        if (input.fxTemplate === "bog" ? rows.length !== 3 : rows.length < 1 || rows.length > 60) throw new Error("Use three BoG currency rows, or one to sixty provider rows.");
        if(input.fxTemplate==="cedirates" && (!fxPageCount(input) || !Number.isInteger(input.fxPage ?? 0) || (input.fxPage ?? 0)<0 || (input.fxPage ?? 0)>=fxPageCount(input))) throw new Error("Add a provider to this group and choose an available flyer page.");
        for (const row of rows) {
            if(!row.label.trim() || row.label.length > 28) throw new Error("Enter a provider or currency name within 28 characters.");
            if(input.fxTemplate === "bog" && (!row.buying || !row.selling)) throw new Error("Enter both buying and selling rates for every BoG currency.");
            for(const rate of [row.buying,row.selling]) if(rate && (!/^\d+(\.\d{1,6})?$/.test(rate) || Number(rate)<=0)) throw new Error("Enter positive FX rates with up to six decimal places; leave unavailable provider quotes blank.");
        }
        if(input.fxObservedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(input.fxObservedDate) || !Number.isFinite(Date.parse(input.fxObservedDate+"T12:00:00Z")) || new Date(input.fxObservedDate+"T12:00:00Z").toISOString().slice(0,10)!==input.fxObservedDate)) throw new Error("Choose a valid FX observation date.");
    }
    if (!input.title.trim()) throw new Error("Enter a title for the image.");
    for (const [field, limit] of Object.entries(SOCIAL_ASSET_LIMITS)) {
        const value = input[field as keyof typeof SOCIAL_ASSET_LIMITS] ?? "";
        if (value.length > limit) throw new Error(`Shorten the ${field} to ${limit} characters or fewer.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(Date.parse(`${input.date}T12:00:00Z`)) || new Date(`${input.date}T12:00:00Z`).toISOString().slice(0, 10) !== input.date) throw new Error("Choose a valid image date.");
    const facts = (input.facts ?? "").split("\n").filter(v => v.trim());
    if (facts.length > 3) throw new Error("Use at most three key figures to keep the image clear.");
    for (const fact of facts) {
        const pair = fact.split("|").map(v => v.trim());
        if (pair.length !== 2 || !pair[0] || !pair[1] || pair[0].length > 30 || pair[1].length > 24) throw new Error("Write each figure as Label | Value (label up to 30 characters, value up to 24).");
    }
    if(input.kind==="week-in-review" || input.kind==="today-movers"){
        const week=input.weekReview;
        if(!week || (week.rows.length<1 || week.rows.length>5) || !["gainers","losers"].includes(week.direction)) throw new Error("Complete one to five rows for Top Gainers or Top Losers.");
        if(input.kind!=="today-movers" && (!/^\d{4}-\d{2}-\d{2}$/.test(week.startDate) || !Number.isFinite(Date.parse(week.startDate+"T12:00:00Z")) || new Date(week.startDate+"T12:00:00Z").toISOString().slice(0,10)!==week.startDate || week.startDate>input.date)) throw new Error("Choose a valid week start on or before the end date.");
        for(const row of week.rows){if(!row.name.trim() || row.name.length>80 || !/^\d+(\.\d{1,2})?$/.test(row.price) || Number(row.price)<=0 || row.price.length>12 || !/^[+−-]?\d+(\.\d{1,2})?%?$/.test(row.change) || row.change.length>10) throw new Error("Each weekly row needs a name (80 characters), positive price and numeric percentage change.");
            if(!weekReviewLogo(row)) throw new Error("Add a company logo or a recognised GSE ticker in parentheses for every weekly row.");
            if(week.direction==="gainers" && /^[-−]/.test(row.change) && Number(row.change.replace("−","-").replace("%",""))!==0 || week.direction==="losers" && Number(row.change.replace("−","-").replace("%",""))>0) throw new Error("Use positive changes for gainers and negative changes for losers.");}
    }
    if(input.kind==="investor-brief"){
        const brief=input.investorBrief;
        if(!brief || brief.metrics.length!==5 || brief.watchPoints.length!==4) throw new Error("Complete five investor metrics and four watch points.");
        for(const metric of brief.metrics) if(!metric.label.trim() || !metric.value.trim() || metric.label.length>32 || metric.value.length>22 || metric.note.length>70) throw new Error("Investor metrics need a label (32 characters), value (22) and optional note (70).");
        if(brief.watchPoints.some(point=>!point.trim() || point.length>48)) throw new Error("Complete four watch points, each within 48 characters.");
        if(!brief.bottomLine.trim() || brief.bottomLine.length>160) throw new Error("Add a bottom line within 160 characters.");
        if(input.details.length>140) throw new Error("Keep the investor introduction within 140 characters.");
    }
    if (input.kind === "company-profile") {
        const profile = input.profile ?? {};
        if(profile.ticker && (!/^[A-Za-z0-9.-]{1,12}$/.test(profile.ticker)))throw new Error("Use a company ticker within 12 letters, numbers, dots or dashes.");
        if (input.details.length > 100) throw new Error("Keep the company introduction within 100 characters; use the profile sections for detail.");
        for (const [field, limit] of Object.entries(PROFILE_LIMITS)) if ((profile[field as keyof CompanyProfileContent] ?? "").length > limit) throw new Error(`Keep the profile ${field} within ${limit} characters.`);
        for (const field of [ "didYouKnow", "shareStructure", "managingDirector", "boardChairman"] as const) if (!profile[field]?.trim()) throw new Error("Complete all six company profile sections before generating.");
        if(profile.layout==="heritage-leadership"){
            if(!profile.milestones || profile.milestones.length!==4 || profile.milestones.some(point=>!point.year.trim()||point.year.length>12||!point.event.trim()||point.event.length>70)) throw new Error("Complete four heritage milestones, with years up to 12 and descriptions up to 70 characters.");
            if(!profile.services || profile.services.length!==6 || profile.services.some(service=>!service.trim()||service.length>36)) throw new Error("Complete six services, each within 36 characters.");
        }else if(!profile.heritage?.trim() || !profile.whatWeDo?.trim())throw new Error("Complete all six company profile sections before generating.");
        const shares = (profile.shareStructure ?? "").split("\n").filter(v => v.trim());
        if (shares.length > 2) throw new Error("Use at most two share-structure figures to keep the full profile readable.");
        for (const row of shares) if (row.split("|").length !== 2 || row.split("|").some(v => !v.trim()) || row.split("|")[0].trim().length > 30 || row.split("|")[1].trim().length > 28) throw new Error("Write each share figure as Label | Value (label up to 30 characters, value up to 28).");
    }
    if (input.kind === "company-portfolio" && input.details.trim().split(/\n+/).length > 6) throw new Error("Use at most six portfolio entries.");
    if (input.theme === "custom") {
        const colors = [input.accentColor ?? "#22d3ee", "#020e25", input.textColor ?? "#ffffff", input.accentEndColor ?? "#22d3ee"];
        if (colors.some(color => !/^#[0-9a-f]{6}$/i.test(color))) throw new Error("Choose valid six-digit theme colours.");
        if (contrast(colors[0], colors[1]) < 4.5 || contrast(colors[2], colors[1]) < 4.5 || contrast(colors[3], colors[1]) < 4.5) throw new Error("Choose text and background colours with stronger contrast.");
    }
}

function drawBackdrop(ctx: CanvasRenderingContext2D, input: SocialAssetInput, photo: HTMLImageElement | undefined, background: string): void {
    ctx.fillStyle = background; ctx.fillRect(0, 0, W, FOOTER_Y);
    if (!photo) return;
    // One natural photograph, softly blended from the right into the copy area.
    const x = 0, width = W;
    const scale = (input.pictureFit === "contain" ? Math.min : Math.max)(width / photo.naturalWidth, FOOTER_Y / photo.naturalHeight);
    const iw = photo.naturalWidth * scale, ih = photo.naturalHeight * scale;
    const px = Math.min(100, Math.max(0, input.pictureX ?? 50)) / 100;
    const py = Math.min(100, Math.max(0, input.pictureY ?? 20)) / 100;
    ctx.save(); ctx.beginPath(); ctx.rect(x, 0, width, FOOTER_Y); ctx.clip();
    ctx.drawImage(photo, x + (width - iw) * px, (FOOTER_Y - ih) * py, iw, ih); ctx.restore();
    const horizontal = ctx.createLinearGradient(0, 0, W, 0);
    horizontal.addColorStop(0, background); horizontal.addColorStop(0.22, `${background}f0`); horizontal.addColorStop(0.5, `${background}a8`); horizontal.addColorStop(0.75, `${PRESETS.backgroundBlue.blue}55`); horizontal.addColorStop(1, `${PRESETS.backgroundBlue.blue}28`);
    ctx.fillStyle = horizontal; ctx.fillRect(0, 0, W, FOOTER_Y);
    const bottom = ctx.createLinearGradient(0, 450, 0, FOOTER_Y);
    bottom.addColorStop(0, `${background}00`); bottom.addColorStop(0.55, `${background}30`); bottom.addColorStop(1, `${PRESETS.backgroundBlue.blue}99`);
    ctx.fillStyle = bottom; ctx.fillRect(0, 450, W, FOOTER_Y - 450);
    // Keep the brand legible even on a bright sky or a white photograph.
    const top = ctx.createLinearGradient(0, 0, 0, 190);
    top.addColorStop(0, `${background}df`); top.addColorStop(1, `${background}00`);
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, 190);
}

function drawFacts(ctx: CanvasRenderingContext2D, text: string, color: { accent: string; text: string }): void {
    const facts = text.split("\n").filter(v => v.trim()).map(v => v.split("|").map(s => s.trim()));
    if (!facts.length) return;
    const y = 994, width = (W - M * 2) / facts.length;
    ctx.strokeStyle = color.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(M, y - 24); ctx.lineTo(W - M, y - 24); ctx.stroke();
    facts.forEach(([label, value], index) => {
        const x = M + index * width + (index ? 24 : 0), available = width - 36;
        ctx.textBaseline = "top";
        const valueText = fitText(ctx, value, available, 70, { display: true, max: 54, min: 30, field: "key figure", singleLine: true });
        ctx.fillStyle = color.accent; ctx.fillText(valueText.rows[0], x, y);
        const labelText = fitText(ctx, label, available, 70, { max: 24, min: 20, field: "figure label" });
        ctx.fillStyle = color.text;
        labelText.rows.forEach((row, n) => ctx.fillText(row, x, y + 68 + n * labelText.step));
        if (index) { ctx.strokeStyle = `${color.text}55`; ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x - 20, y + 120); ctx.stroke(); }
    });
}

/** Match the Pump Report's word-width gradient, with theme-specific endpoints. */
function titleInk(ctx: CanvasRenderingContext2D, row: string, input: SocialAssetInput, color: { accent: string; accentEnd: string; text: string }, emphasized: boolean): string | CanvasGradient {
    if (!emphasized || input.theme === "neutral") return color.text;
    const gradient = ctx.createLinearGradient(M, 0, M + ctx.measureText(row).width, 0);
    gradient.addColorStop(0, input.kind === "company-portfolio" ? PRESETS.textBlue.start : color.accent);
    gradient.addColorStop(1, input.kind === "company-portfolio" ? PRESETS.textBlue.end : color.accentEnd);
    return gradient;
}

async function drawCompanyProfile(ctx: CanvasRenderingContext2D, input: SocialAssetInput): Promise<void> {
    const content = input.profile ?? {};
    ctx.textBaseline = "top";
    ctx.textAlign="left";ctx.letterSpacing="0px";
    const panel=ctx.createLinearGradient(M,286,1016,488);panel.addColorStop(0,"#082548");panel.addColorStop(1,"#12466b");ctx.fillStyle=panel;ctx.beginPath();ctx.roundRect(M,286,952,202,20);ctx.fill();ctx.strokeStyle="#1685e588";ctx.lineWidth=1;ctx.stroke();
    const profileLogo=content.logo && /\/(SCB|standardchartered)\.png$/i.test(content.logo)?"/gse/standard-chartered-white.svg":content.logo;
    const companyLogo=profileLogo ? await loadImage(profileLogo) : null;
    if(companyLogo){const scale=Math.min(174/companyLogo.naturalWidth,156/companyLogo.naturalHeight),w=companyLogo.naturalWidth*scale,h=companyLogo.naturalHeight*scale;ctx.drawImage(companyLogo,86+(174-w)/2,309+(156-h)/2,w,h);ctx.strokeStyle="#ffffff55";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(282,312);ctx.lineTo(282,462);ctx.stroke();}
    const companyX=companyLogo?308:88;
    const heading=fitText(ctx,input.title,1016-companyX-24,content.ticker?124:156,{display:true,weight:700,max:50,min:30,field:"company name"});ctx.fillStyle="#ffffff";
    const nameTop=286+(202-heading.rows.length*heading.step-(content.ticker?48:0))/2;
    heading.rows.forEach((row,index)=>ctx.fillText(row,companyX,nameTop+index*heading.step));
    ctx.letterSpacing="0px";
    if(content.ticker){ctx.font=`700 23px ${BODY}`;const tickerWidth=ctx.measureText(content.ticker.toUpperCase()).width+28,tickerY=nameTop+heading.rows.length*heading.step+10;ctx.fillStyle="#062455";ctx.strokeStyle="#1685e5";ctx.beginPath();ctx.roundRect(companyX,tickerY,tickerWidth,36,10);ctx.fill();ctx.stroke();ctx.fillStyle="#67e8f9";ctx.textBaseline="middle";ctx.fillText(content.ticker.toUpperCase(),companyX+14,tickerY+18);ctx.textBaseline="top";}
    if(content.layout==="heritage-leadership"){await drawHeritageProfile(ctx,input);return;}
    const heritage = content.heritageLabel || "Our heritage", md = content.managingDirectorLabel || "Managing director", chair = content.boardChairmanLabel || "Board chairman";
    const sections: [string, string][] = [[heritage, content.heritage || ""], ["What we do", content.whatWeDo || ""], [md, content.managingDirector || ""], [chair, content.boardChairman || ""], ["Share structure", (content.shareStructure || "").replaceAll("|", " · ")], ["Did you know?", content.didYouKnow || ""]];
    const gap=22,width=(W-M*2-gap)/2,rowTops=[510,734,904],rowHeights=[204,150,204];
    sections.forEach(([label,value],index)=>{
        const row=Math.floor(index/2),x=M+(index%2)*(width+gap),y=rowTops[row],height=rowHeights[row],textX=x+110,textWidth=width-128;
        ctx.fillStyle="#03172cd9";ctx.strokeStyle="#1685e588";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,height,18);ctx.fill();ctx.stroke();
        drawProfileSectionIcon(ctx,index,x+54,y+54);
        const labelText=fitText(ctx,label.toUpperCase(),textWidth,52,{display:true,weight:700,max:22,min:18,field:"profile heading"});const labelGradient=ctx.createLinearGradient(textX,0,textX+Math.max(...labelText.rows.map(line=>ctx.measureText(line).width)),0);labelGradient.addColorStop(0,PRESETS.textBlue.start);labelGradient.addColorStop(1,PRESETS.textBlue.end);ctx.fillStyle=labelGradient;labelText.rows.forEach((line,n)=>ctx.fillText(line,textX,y+24+n*labelText.step));
        const underlineY=y+28+labelText.rows.length*labelText.step;ctx.fillStyle="#22d3ee";ctx.beginPath();ctx.roundRect(textX,underlineY,34,4,2);ctx.fill();
        const bodyY=underlineY+20,body=fitText(ctx,value,textWidth,y+height-bodyY-14,{max:24,min:18,field:`profile section “${label}”`});ctx.fillStyle="#ffffff";body.rows.forEach((line,n)=>ctx.fillText(line,textX,bodyY+n*body.step));
    });
}

function drawProfileSectionIcon(ctx: CanvasRenderingContext2D,index:number,x:number,y:number): void {
    ctx.save();const background=ctx.createLinearGradient(x-34,y-34,x+34,y+34);background.addColorStop(0,"#12466b");background.addColorStop(1,"#062455");ctx.fillStyle=background;ctx.strokeStyle="#22d3ee";ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,34,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle="#67e8f9";ctx.fillStyle="#67e8f9";ctx.lineWidth=3;ctx.lineCap="round";
    if(index===0){ctx.beginPath();ctx.moveTo(x-18,y-8);ctx.lineTo(x,y-20);ctx.lineTo(x+18,y-8);ctx.closePath();ctx.stroke();for(const dx of [-12,0,12]){ctx.beginPath();ctx.moveTo(x+dx,y-3);ctx.lineTo(x+dx,y+15);ctx.stroke();}ctx.beginPath();ctx.moveTo(x-19,y+20);ctx.lineTo(x+19,y+20);ctx.stroke();}
    else if(index===1){ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();for(let n=0;n<8;n++){const a=n*Math.PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*16,y+Math.sin(a)*16);ctx.lineTo(x+Math.cos(a)*21,y+Math.sin(a)*21);ctx.stroke();}}
    else if(index===2 || index===3){const people=index===2?[0]:[-13,13];people.forEach(dx=>{ctx.beginPath();ctx.arc(x+dx,y-10,7,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.roundRect(x+dx-11,y+1,22,19,7);ctx.fill();});}
    else if(index===4){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-20);ctx.arc(x,y,20,-Math.PI/2,0);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(x-5,y-14);ctx.arc(x-4,y+4,18,-Math.PI/2,Math.PI*1.5);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(x,y-5,13,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-6,y+9);ctx.lineTo(x-6,y+19);ctx.lineTo(x+6,y+19);ctx.lineTo(x+6,y+9);ctx.moveTo(x-5,y+24);ctx.lineTo(x+5,y+24);ctx.stroke();}
    ctx.restore();
}

async function drawHeritageProfile(ctx: CanvasRenderingContext2D,input: SocialAssetInput): Promise<void> {
    const content=input.profile!;
    const portraits=await Promise.all([content.managingDirectorPhoto,content.boardChairmanPhoto].map(url=>url?loadImage(url):Promise.resolve(null)));
    const card=(x:number,y:number,width:number,height:number)=>{ctx.fillStyle="#03172cd9";ctx.strokeStyle="#22d3ee66";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,height,18);ctx.fill();ctx.stroke();};
    const label=(text:string,x:number,y:number,width:number)=>{ctx.textBaseline="top";ctx.textAlign="left";const title=fitText(ctx,text.toUpperCase(),width,54,{display:true,weight:700,max:22,min:18,field:"profile heading"});const gradient=ctx.createLinearGradient(x,0,x+Math.max(...title.rows.map(row=>ctx.measureText(row).width)),0);gradient.addColorStop(0,PRESETS.textBlue.start);gradient.addColorStop(1,PRESETS.textBlue.end);ctx.fillStyle=gradient;title.rows.forEach((row,n)=>ctx.fillText(row,x,y+n*title.step));ctx.letterSpacing="0px";};
    card(64,516,304,398);label(content.heritageLabel||"Our heritage",80,532,272);
    content.milestones!.forEach((point,index)=>{const y=580+index*78;ctx.strokeStyle="#22d3ee66";ctx.lineWidth=1;if(index<3){ctx.beginPath();ctx.moveTo(91,y+12);ctx.lineTo(91,y+88);ctx.stroke();}ctx.fillStyle="#22d3ee";ctx.beginPath();ctx.arc(91,y+7,5,0,Math.PI*2);ctx.fill();
        const year=fitText(ctx,point.year,72,54,{display:true,weight:700,max:19,min:15,field:"milestone year"});ctx.fillStyle="#22d3ee";year.rows.forEach((row,n)=>ctx.fillText(row,106,y-4+n*year.step));const event=fitText(ctx,point.event,166,70,{max:17,min:14,field:"heritage milestone"});ctx.fillStyle="#ffffff";event.rows.forEach((row,n)=>ctx.fillText(row,188,y-4+n*event.step));});
    card(388,516,286,398);label("What we do",404,532,254);
    content.services!.forEach((service,index)=>{const y=580+index*51;ctx.strokeStyle="#ffffff33";ctx.beginPath();ctx.moveTo(404,y+39);ctx.lineTo(658,y+39);ctx.stroke();ctx.fillStyle="#22d3ee";ctx.fillRect(406,y+9,5,5);const text=fitText(ctx,service,228,48,{max:20,min:16,field:"service"});ctx.fillStyle="#ffffff";text.rows.forEach((row,n)=>ctx.fillText(row,424,y+n*text.step));});
    [[content.managingDirectorLabel||"Managing director",content.managingDirector,516],[content.boardChairmanLabel||"Board chairman",content.boardChairman,724]].forEach(([heading,value,top],index)=>{const y=Number(top);card(694,y,322,190);label(String(heading),710,y+16,290);const portrait=portraits[index];
        const x=portrait?802:710,width=portrait?198:290;if(portrait){ctx.save();ctx.beginPath();ctx.arc(750,y+116,40,0,Math.PI*2);ctx.clip();const scale=Math.max(80/portrait.naturalWidth,80/portrait.naturalHeight),w=portrait.naturalWidth*scale,h=portrait.naturalHeight*scale;ctx.drawImage(portrait,710+(80-w)/2,y+76+(80-h)/2,w,h);ctx.restore();}
        const name=fitText(ctx,String(value),width,110,{display:true,weight:700,max:26,min:18,field:"leadership name"});ctx.fillStyle="#ffffff";name.rows.forEach((row,n)=>ctx.fillText(row,x,y+68+n*name.step));});
    card(64,934,450,174);label("Share structure",80,950,418);
    const shares=content.shareStructure!.split("\n").filter(row=>row.trim());shares.forEach((row,index)=>{const [key,value]=row.split("|").map(part=>part.trim()),x=80+index*215;const text=fitText(ctx,key,198,50,{max:17,min:14,field:"share label"});ctx.fillStyle="#cbd5e1";text.rows.forEach((line,n)=>ctx.fillText(line,x,990+n*text.step));const amount=fitText(ctx,value,198,62,{display:true,weight:700,max:28,min:18,field:"share amount"});ctx.fillStyle="#22d3ee";amount.rows.forEach((line,n)=>ctx.fillText(line,x,1036+n*amount.step));});
    card(536,934,480,174);label("Did you know?",552,950,448);const fact=fitText(ctx,content.didYouKnow!,448,112,{max:24,min:20,field:"profile fact"});ctx.fillStyle="#ffffff";fact.rows.forEach((row,n)=>ctx.fillText(row,552,988+n*fact.step));
}

async function drawWeekReview(ctx: CanvasRenderingContext2D, input: SocialAssetInput): Promise<void> {
    const daily=input.kind==="today-movers";
    const week=input.weekReview!,gainers=week.direction==="gainers",accent=gainers?"#80d44b":"#fb476b";
    const logos=await Promise.all(week.rows.map(row=>loadImage(weekReviewLogo(row)!)));
    ctx.textAlign="center";ctx.textBaseline="top";ctx.letterSpacing="-2px";ctx.font=`800 94px ${DISPLAY}`;ctx.fillStyle="#ffffff";ctx.fillText(daily?"TODAY’S":"WEEK IN REVIEW",540,216);
    const headingGradient=ctx.createLinearGradient(290,0,790,0);headingGradient.addColorStop(0,gainers?PRESETS.textBlue.start:"#ff697f");headingGradient.addColorStop(1,gainers?PRESETS.textBlue.end:"#db123b");ctx.fillStyle=headingGradient;ctx.fillText(gainers?"TOP GAINERS":"TOP LOSERS",540,304);ctx.letterSpacing="0px";
    const format=(date:string)=>new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));
    const period=daily?format(input.date):`${format(week.startDate)} – ${format(input.date)}`;ctx.font=`500 23px ${BODY}`;const periodWidth=ctx.measureText(period).width+48;ctx.fillStyle="#03172c99";ctx.strokeStyle="#22d3ee77";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(540-periodWidth/2,402,periodWidth,44,22);ctx.fill();ctx.stroke();ctx.fillStyle="#ffffff";ctx.textBaseline="middle";ctx.fillText(period,540,424);
    const top=522,headerY=466,rowH=112,bottom=522+week.rows.length*112,edges=[64,624,804,1016];
    ctx.fillStyle="#03172c8c";ctx.beginPath();ctx.roundRect(M,headerY,952,bottom-headerY,18);ctx.fill();ctx.save();ctx.clip();week.rows.forEach((_,n)=>{ctx.fillStyle=n%2===0?"#020e2566":"#06245533";ctx.fillRect(M,top+n*rowH,952,rowH);});ctx.restore();ctx.strokeStyle="#ffffff";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(M,headerY,952,bottom-headerY,18);ctx.stroke();ctx.beginPath();for(const x of edges.slice(1,-1)){ctx.moveTo(x,headerY);ctx.lineTo(x,bottom);}for(let n=0;n<week.rows.length;n++){ctx.moveTo(M,top+n*rowH);ctx.lineTo(1016,top+n*rowH);}ctx.stroke();
    ctx.font=`700 24px ${BODY}`;ctx.fillStyle="#ffffff";ctx.textAlign="left";ctx.fillText("Company",86,494);ctx.textAlign="center";ctx.font=`700 24px ${BODY}`;ctx.fillText("Price (GHS)",714,494);ctx.fillText(daily?"Day change":"Weekly change",910,494);
    week.rows.forEach((row,n)=>{
        const center=top+n*rowH+rowH/2,logo=logos[n],scale=Math.min(44/logo.naturalWidth,44/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;
        ctx.fillStyle="#ffffff";ctx.beginPath();ctx.roundRect(82,center-26,52,52,7);ctx.fill();ctx.drawImage(logo,86+(44-w)/2,center-22+(44-h)/2,w,h);
        const identity=row.name.match(/^(.*?)\s*\(([A-Za-z0-9]+)\)\s*$/),company=identity?.[1] || row.name,ticker=identity?.[2]?.toUpperCase();
        ctx.textBaseline="top";const name=fitText(ctx,company,452,ticker?66:92,{display:true,weight:700,max:26,min:20,field:"weekly company"});
        const nameHeight=name.rows.length*name.step,identityHeight=nameHeight+(ticker?32:0),nameY=center-identityHeight/2;
        ctx.textAlign="left";ctx.fillStyle="#ffffff";name.rows.forEach((line,i)=>ctx.fillText(line,150,nameY+i*name.step));ctx.letterSpacing="0px";
        if(ticker){ctx.font=`700 16px ${BODY}`;const chipWidth=ctx.measureText(ticker).width+18,chipY=nameY+nameHeight+8;ctx.fillStyle="#ffffff20";ctx.beginPath();ctx.roundRect(150,chipY,chipWidth,24,4);ctx.fill();ctx.fillStyle="#cbd5e1";ctx.textBaseline="middle";ctx.fillText(ticker,159,chipY+12);}

        const price=fitText(ctx,`₵${Number(row.price).toFixed(2)}`,156,48,{display:true,weight:700,max:34,min:24,singleLine:true,field:"weekly price"});ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#ffffff";ctx.fillText(price.rows[0],714,center);
        ctx.font=`700 32px ${BODY}`;ctx.letterSpacing="0px";const change=`${Math.abs(Number(row.change.replace("−","-").replace("%","")))}%`,groupWidth=ctx.measureText(change).width+27,start=910-groupWidth/2;
        ctx.fillStyle=accent;const negative=!gainers;ctx.beginPath();ctx.moveTo(start,center+(negative?-5:5));ctx.lineTo(start+13,center+(negative?-5:5));ctx.lineTo(start+6.5,center+(negative?5:-5));ctx.closePath();ctx.fill();ctx.textAlign="left";ctx.fillText(change,start+27,center);
    });ctx.textAlign="left";
}

function drawPriceAlert(ctx: CanvasRenderingContext2D,input: SocialAssetInput,color:{accent:string;accentEnd:string;background:string;text:string}): void {
    ctx.textAlign="left";ctx.textBaseline="top";
    const title=fitText(ctx,input.title.toUpperCase(),900,252,{display:true,max:84,min:48,field:"price-alert headline"});title.rows.forEach((row,n)=>{ctx.fillStyle=titleInk(ctx,row,input,color,n===title.rows.length-1);ctx.fillText(row,M,278+n*title.step);});ctx.letterSpacing="0px";
    ctx.font=`700 28px ${BODY}`;ctx.fillStyle="#ffffff";ctx.fillText(input.symbol.toUpperCase(),M,556);
    ctx.fillStyle="#03172ca6";ctx.strokeStyle="#fcd34d99";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(M,602,740,326,22);ctx.fill();ctx.stroke();
    const parts=input.value.trim().match(/^((?:[A-Z]{0,3}[$₵€£])?[\d,.]+)\s*(.*)$/),amount=parts?.[1] || input.value || "—",unit=parts?.[2] || "";
    const price=fitText(ctx,amount,692,132,{display:true,weight:700,max:116,min:64,singleLine:true,field:"alert price"});ctx.fillStyle="#fcd34d";ctx.fillText(price.rows[0],M+24,622);
    if(unit){const units=fitText(ctx,unit,692,78,{display:true,weight:700,max:56,min:36,singleLine:true,field:"price unit"});ctx.fillStyle="#ffffff";ctx.fillText(units.rows[0],M+24,756);}
    ctx.strokeStyle="#9fb6cc77";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M+24,844);ctx.lineTo(M+716,844);ctx.stroke();
    const negative=/^[-−]/.test(input.change),positive=/^\+/.test(input.change),changeInk=negative?"#ff7391":positive?"#a3ff83":"#cbd5e1";
    const change=fitText(ctx,input.change || "—",220,42,{display:true,weight:700,max:32,min:22,singleLine:true,field:"alert change"}),chipWidth=ctx.measureText(change.rows[0]).width+56;
    ctx.fillStyle=negative?"#391522":positive?"#043621":"#142438";ctx.beginPath();ctx.roundRect(M+24,864,chipWidth,48,12);ctx.fill();ctx.fillStyle=changeInk;const ay=888;ctx.beginPath();ctx.moveTo(M+38,ay+(negative?-7:7));ctx.lineTo(M+54,ay+(negative?-7:7));ctx.lineTo(M+46,ay+(negative?7:-7));ctx.closePath();ctx.fill();ctx.textBaseline="middle";ctx.fillText(change.rows[0],M+66,888);ctx.textBaseline="top";
    if(input.period){const quote=fitText(ctx,input.period,692-chipWidth-26,50,{max:22,min:18,field:"quote time"});ctx.fillStyle="#ffffff";quote.rows.forEach((row,n)=>ctx.fillText(row,M+chipWidth+48,872+n*quote.step));}
    if(input.details){ctx.fillStyle="#06245588";ctx.strokeStyle="#22d3ee66";ctx.beginPath();ctx.roundRect(M,954,952,142,18);ctx.fill();ctx.stroke();const body=fitText(ctx,input.details,900,112,{max:27,min:22,field:"price context"});ctx.fillStyle="#ffffff";body.rows.forEach((row,n)=>ctx.fillText(row,M+26,970+n*body.step));}
}
function drawTreasuryBill(ctx: CanvasRenderingContext2D,input: SocialAssetInput,color:{accent:string;accentEnd:string;background:string;text:string}): void {
    ctx.textAlign="left";ctx.textBaseline="top";const title=fitText(ctx,input.title.toUpperCase(),952,252,{display:true,max:88,min:48,field:"treasury headline"});title.rows.forEach((row,n)=>{ctx.fillStyle=titleInk(ctx,row,input,color,n===title.rows.length-1);ctx.fillText(row,M,278+n*title.step);});ctx.letterSpacing="0px";
    ctx.fillStyle="#06245599";ctx.strokeStyle="#1685e5";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(M,584,844,326,24);ctx.fill();ctx.stroke();
    const label=fitText(ctx,(input.symbol.toUpperCase() || "TREASURY BILL")+(/INTEREST RATE/i.test(input.symbol)?"":" · INTEREST RATE"),792,56,{display:true,weight:700,max:27,min:20,field:"bill tenor"});ctx.fillStyle="#ffffff";ctx.fillText(label.rows[0],M+28,610);
    const rate=fitText(ctx,input.value || "—",792,144,{display:true,weight:700,max:122,min:72,singleLine:true,field:"treasury interest rate"});ctx.fillStyle="#ffffff";ctx.fillText(rate.rows[0],M+28,662);
    ctx.font=`700 38px ${BODY}`;ctx.fillStyle=PRESETS.textBlue.start;ctx.fillText(input.change,M+28,808);
    ctx.strokeStyle="#9fb6cc66";ctx.beginPath();ctx.moveTo(M+28,860);ctx.lineTo(M+816,860);ctx.stroke();ctx.font=`500 24px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText(input.treasury?`Issue date: ${formatFuelDate(input.treasury.issueDate)}`:input.period || "",M+28,874);
    if(input.treasury){[["PREVIOUS INTEREST RATE",input.treasury.previousRate,64],["CURRENT DISCOUNT RATE",input.treasury.discountRate,551]].forEach(([label,value,x])=>{ctx.fillStyle="#03172cb3";ctx.strokeStyle="#ffffff55";ctx.beginPath();ctx.roundRect(Number(x),944,465,142,16);ctx.fill();ctx.stroke();ctx.font=`700 18px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText(String(label),Number(x)+20,962);const text=fitText(ctx,String(value).endsWith("%")?String(value):`${value}%`,425,80,{display:true,weight:700,max:44,min:30,singleLine:true,field:"comparison rate"});ctx.fillStyle="#ffffff";ctx.fillText(text.rows[0],Number(x)+20,1002);});ctx.font=`400 17px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText("Interest and discount rates are different measures.",M,1098);
    }else if(input.details){const note=fitText(ctx,input.details,912,140,{max:26,min:22,field:"treasury context"});ctx.fillStyle="#ffffff";note.rows.forEach((row,n)=>ctx.fillText(row,M+20,950+n*note.step));}
}

function drawUpdateLead(ctx: CanvasRenderingContext2D,input: SocialAssetInput,color:{accent:string;accentEnd:string;background:string;text:string},bodyY:number): void {
    ctx.textBaseline="top";ctx.textAlign="left";
    const title=fitText(ctx,input.title.toUpperCase(),720,bodyY-298,{display:true,max:70,min:42,field:"update headline"});title.rows.forEach((row,n)=>{ctx.fillStyle=titleInk(ctx,row,input,color,n===title.rows.length-1);ctx.fillText(row,M,278+n*title.step);});ctx.letterSpacing="0px";
    if(input.details){const body=fitText(ctx,input.details,900,input.kind==="policy-update"?178:104,{max:24,min:20,field:"update summary"});ctx.fillStyle="#e2e8f0";body.rows.forEach((row,n)=>ctx.fillText(row,M,bodyY+n*body.step));}
}
function drawPolicyUpdate(ctx: CanvasRenderingContext2D,input: SocialAssetInput,color:{accent:string;accentEnd:string;background:string;text:string}): void {
    drawUpdateLead(ctx,input,color,610);
    ctx.font=`700 27px ${BODY}`;ctx.fillStyle="#ffffff";ctx.fillText("KEY IMPLICATIONS",M,824);
    input.policyUpdate!.implications.forEach((point,index)=>{const x=M+index*325,y=872;ctx.fillStyle="#03172c8c";ctx.beginPath();ctx.roundRect(x,y,302,224,16);ctx.fill();ctx.strokeStyle="#ffffff55";ctx.lineWidth=1;ctx.stroke();
        const title=fitText(ctx,point.title,270,58,{display:true,weight:700,max:24,min:20,field:"implication title"});ctx.fillStyle=color.accent;title.rows.forEach((row,n)=>ctx.fillText(row,x+16,y+14+n*title.step));
        const body=fitText(ctx,point.details,270,130,{max:22,min:18,field:"policy implication"});ctx.fillStyle="#ffffff";body.rows.forEach((row,n)=>ctx.fillText(row,x+16,y+80+n*body.step));});
}
function drawBondUpdate(ctx: CanvasRenderingContext2D,input: SocialAssetInput,color:{accent:string;accentEnd:string;background:string;text:string}): void {
    drawUpdateLead(ctx,input,color,548);const bond=input.bondUpdate!;
    ctx.textBaseline="top";ctx.textAlign="left";
    const panel=(x:number,w:number)=>{const wash=ctx.createLinearGradient(x,676,x+w,956);wash.addColorStop(0,"#092945ed");wash.addColorStop(1,"#03172cb3");ctx.fillStyle=wash;ctx.beginPath();ctx.roundRect(x,676,w,280,20);ctx.fill();ctx.strokeStyle="#62b8ef77";ctx.lineWidth=1.2;ctx.stroke();};panel(64,452);panel(536,480);
    ctx.font=`700 21px ${BODY}`;ctx.fillStyle="#67e8f9";ctx.fillText("YIELD COMPARISON",86,694);
    [[bond.previousPeriod,bond.previousYield,86],[bond.currentPeriod,bond.currentYield,322]].forEach(([period,value,x])=>{ctx.font=`500 18px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText(String(period),Number(x),738);const rate=fitText(ctx,String(value),174,72,{display:true,weight:700,max:52,min:28,singleLine:true,field:"bond yield"});ctx.fillStyle="#ffffff";ctx.fillText(rate.rows[0],Number(x),768);});
    const previous=parseFloat(bond.previousYield),current=parseFloat(bond.currentYield),down=Number.isFinite(previous)&&Number.isFinite(current)&&current<previous;
    ctx.strokeStyle="#22d3ee";ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(272,down?778:816);ctx.lineTo(300,down?816:778);ctx.lineTo(300,down?800:794);ctx.moveTo(300,down?816:778);ctx.lineTo(284,down?816:778);ctx.stroke();ctx.lineCap="butt";
    ctx.fillStyle="#1685e54d";ctx.beginPath();ctx.roundRect(86,840,408,8,4);ctx.fill();ctx.fillStyle="#22d3ee";ctx.beginPath();ctx.roundRect(86,840,408*Math.min(1,Math.max(0.05,Number.isFinite(current/previous)?current/previous:0.5)),8,4);ctx.fill();
    const note=fitText(ctx,bond.performanceNote,408,68,{max:20,min:16,weight:400,field:"yield comparison note"});ctx.fillStyle="#e2e8f0";note.rows.forEach((row,n)=>ctx.fillText(row,86,872+n*note.step));
    ctx.font=`700 21px ${BODY}`;ctx.fillStyle="#fcd34d";ctx.fillText("NEW BOND OFFER",558,694);ctx.font=`500 17px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText("MATURITY",558,744);
    const maturity=fitText(ctx,bond.maturity,280,66,{weight:700,max:58,min:28,singleLine:true,field:"maturity"});ctx.fillStyle="#fcd34d";ctx.fillText(maturity.rows[0],710,728);
    [["PRICING GUIDANCE",bond.pricingGuidance,810],["DISTRIBUTION",bond.distribution,880]].forEach(([label,value,y])=>{const yy=Number(y);ctx.strokeStyle="#ffffff33";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(558,yy-14);ctx.lineTo(994,yy-14);ctx.stroke();const key=fitText(ctx,String(label),144,52,{max:16,min:14,field:"bond label"});ctx.fillStyle="#94a3b8";key.rows.forEach((row,n)=>ctx.fillText(row,558,yy+n*key.step));const text=fitText(ctx,String(value),274,62,{max:20,min:16,weight:400,field:"bond offer detail"});ctx.fillStyle="#ffffff";text.rows.forEach((row,n)=>ctx.fillText(row,720,yy+n*text.step));});
    ctx.fillStyle="#062455dd";ctx.beginPath();ctx.roundRect(64,976,952,126,18);ctx.fill();ctx.strokeStyle="#fcd34d88";ctx.stroke();
    // Calendar icon anchors the launch date without competing with its text.
    ctx.strokeStyle="#fcd34d";ctx.lineWidth=2.5;ctx.beginPath();ctx.roundRect(86,1016,42,42,5);ctx.moveTo(86,1028);ctx.lineTo(128,1028);ctx.moveTo(97,1010);ctx.lineTo(97,1021);ctx.moveTo(117,1010);ctx.lineTo(117,1021);ctx.stroke();
    [["OFFER OPENS",bond.offerOpens,148,400],["PRICING STATUS",bond.pricingStatus,600,390]].forEach(([label,value,x,width])=>{ctx.font=`700 17px ${BODY}`;ctx.fillStyle="#fcd34d";ctx.fillText(String(label),Number(x),994);const text=fitText(ctx,String(value),Number(width),72,{max:24,min:18,field:"bond launch detail"});ctx.fillStyle="#ffffff";text.rows.forEach((row,n)=>ctx.fillText(row,Number(x),1024+n*text.step));});
    ctx.strokeStyle="#ffffff33";ctx.beginPath();ctx.moveTo(574,998);ctx.lineTo(574,1080);ctx.stroke();
}

function drawInvestorBrief(ctx: CanvasRenderingContext2D, input: SocialAssetInput, color: { accent:string; accentEnd:string; background:string; text:string }): void {
    const brief=input.investorBrief!;
    ctx.textBaseline="top";ctx.textAlign="left";
    const title=fitText(ctx,input.title.toUpperCase(),700,152,{display:true,max:80,min:42,field:"investor headline"});
    title.rows.forEach((row,index)=>{ctx.fillStyle=titleInk(ctx,row,input,color,index===title.rows.length-1);ctx.fillText(row,M,278+index*title.step);});ctx.letterSpacing="0px";
    if(input.details.trim()){const intro=fitText(ctx,input.details,952,66,{max:24,min:20,field:"investor introduction"});ctx.fillStyle="#e2e8f0";intro.rows.forEach((row,index)=>ctx.fillText(row,M,438+index*intro.step));}
    brief.metrics.forEach((metric,index)=>{
        const first=index<3,width=first?302:465,x=M+(first?index*325:(index-3)*487),y=first?526:700;
        ctx.fillStyle="#03172c8c";ctx.fillRect(x,y,width,154);
        if(index!==0 && index!==3){ctx.strokeStyle="#9fb6cc66";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-11,y);ctx.lineTo(x-11,y+154);ctx.stroke();}
        const label=fitText(ctx,metric.label.toUpperCase(),width-24,40,{display:true,weight:700,max:18,min:14,field:"metric label"});ctx.fillStyle="#22d3ee";label.rows.forEach((line,n)=>ctx.fillText(line,x+12,y+10+n*label.step));
        const value=fitText(ctx,metric.value,width-24,58,{display:true,weight:700,max:44,min:26,singleLine:true,field:"metric value"});ctx.fillStyle="#ffffff";ctx.fillText(value.rows[0],x+12,y+53);
        if(metric.note){const note=fitText(ctx,metric.note,width-24,52,{max:18,min:14,field:"metric note"});ctx.fillStyle="#cbd5e1";note.rows.forEach((line,n)=>ctx.fillText(line,x+12,y+100+n*note.step));}
    });
    ctx.strokeStyle="#9fb6cc66";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,876);ctx.lineTo(1016,876);ctx.stroke();
    ctx.fillStyle="#ffffff";ctx.font=`700 23px ${BODY}`;ctx.fillText("WHAT INVESTORS SHOULD WATCH",M,892);
    brief.watchPoints.forEach((point,index)=>{const x=M+index*244;const text=fitText(ctx,point,218,64,{max:19,min:16,field:"watch point"});ctx.fillStyle="#e2e8f0";text.rows.forEach((line,n)=>ctx.fillText(line,x,932+n*text.step));if(index){ctx.strokeStyle="#9fb6cc66";ctx.beginPath();ctx.moveTo(x-12,932);ctx.lineTo(x-12,990);ctx.stroke();}});
    ctx.fillStyle="#03172cb3";ctx.beginPath();ctx.roundRect(M,1010,952,92,12);ctx.fill();ctx.strokeStyle="#22d3ee66";ctx.stroke();
    ctx.font=`700 19px ${BODY}`;ctx.fillStyle="#22d3ee";ctx.fillText("THE BOTTOM LINE",M+16,1026);
    const bottom=fitText(ctx,brief.bottomLine,700,70,{max:20,min:16,field:"bottom line"});ctx.fillStyle="#ffffff";bottom.rows.forEach((line,n)=>ctx.fillText(line,300,1022+n*bottom.step));
}

async function drawCommodities(ctx: CanvasRenderingContext2D, input: SocialAssetInput): Promise<void> {
    const category = input.commodityCategory ?? "energy";
    const accent = {energy: "#22d3ee", agriculture: "#a3e635", metals: "#fcd34d"}[category];
    ctx.textBaseline = "top";
    ctx.letterSpacing = "-2px"; ctx.font = `800 94px ${DISPLAY}`; ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff"; ctx.fillText("COMMODITIES", W / 2, 216);
    const titleWidth = ctx.measureText("MARKET SNAPSHOT").width;
    const gradient = ctx.createLinearGradient((W - titleWidth) / 2, 0, (W + titleWidth) / 2, 0); gradient.addColorStop(0,PRESETS.textBlue.start); gradient.addColorStop(1,PRESETS.textBlue.end);
    ctx.fillStyle = gradient; ctx.fillText("MARKET SNAPSHOT", W / 2, 304);
    ctx.letterSpacing = "0px"; ctx.textAlign = "left";
    const categoryLabel = {energy:"ENERGY",agriculture:"AGRICULTURE",metals:"PRECIOUS METALS"}[category];
    ctx.font = `700 31.25px ${BODY}`; ctx.letterSpacing = "2.5px";
    const categoryWidth = ctx.measureText(categoryLabel).width + 80;
    const categoryBackground = ctx.createLinearGradient((W-categoryWidth)/2, 413, (W+categoryWidth)/2, 485.5);
    const categoryShades = { energy: ["#03262d", "#075867"], agriculture: ["#102c18", "#315d25"], metals: ["#302209", "#755315"] }[category];
    categoryBackground.addColorStop(0, categoryShades[0]);
    categoryBackground.addColorStop(1, categoryShades[1]);
    ctx.fillStyle = categoryBackground; ctx.beginPath(); ctx.roundRect((W-categoryWidth)/2, 413, categoryWidth, 72.5, 30); ctx.fill();
    ctx.strokeStyle = `${accent}66`; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(categoryLabel, W/2, 449.25);
    ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.letterSpacing = "0px";
    const rows = input.commodities ?? [{name:input.symbol || input.title,price:input.value,change:input.change}];
    const pictures = await Promise.all(rows.map(row => {
        const item = row as CommodityItem;
        const matched = /manganese/i.test(row.name) ? "manganese" : /cashew/i.test(row.name) ? "cashew" : /copper/i.test(row.name) ? "copper" : /coffee/i.test(row.name) ? "coffee" : /wheat/i.test(row.name) ? "wheat" : /gold/i.test(row.name) ? "gold" : /cocoa/i.test(row.name) ? "cocoa" : /corn|maize/i.test(row.name) ? "corn" : /gas/i.test(row.name) ? "gas" : /crude|brent|oil/i.test(row.name) ? "oil" : undefined;
        const illustration = item.illustration === "none" ? undefined : item.illustration && item.illustration !== "auto" ? item.illustration : matched;
        const source = item.picture || (illustration ? `/studio/commodities/${illustration}.png` : undefined);
        return source ? loadImage(source) : Promise.resolve(undefined);
    }));
    if (rows.length === 4) {
        const shades = categoryShades;
        for (let col=0;col<2;col++) {
            const left=col===0?M:552, header=ctx.createLinearGradient(left,510,left+464,552);
            header.addColorStop(0,shades[0]);header.addColorStop(1,shades[1]);
            ctx.fillStyle=header;ctx.beginPath();ctx.roundRect(left,510,464,42,16);ctx.fill();ctx.strokeStyle=`${accent}99`;ctx.lineWidth=1;ctx.stroke();
            const iconX=left+(col===0?135:80), cy=531;
            if(col===0){
                ctx.fillStyle="#ce1126";ctx.fillRect(iconX,cy-12,32,8);ctx.fillStyle="#fcd116";ctx.fillRect(iconX,cy-4,32,8);ctx.fillStyle="#006b3f";ctx.fillRect(iconX,cy+4,32,8);
                ctx.fillStyle="#000000";ctx.beginPath();for(let point=0;point<10;point++){const angle=-Math.PI/2+point*Math.PI/5,radius=point%2?2.2:5.5;const sx=iconX+16+Math.cos(angle)*radius,sy=cy+Math.sin(angle)*radius;if(point===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy);}ctx.closePath();ctx.fill();
            }else{
                ctx.strokeStyle="#ffffff";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(iconX+14,cy,13,0,Math.PI*2);ctx.moveTo(iconX+1,cy);ctx.lineTo(iconX+27,cy);ctx.moveTo(iconX+14,cy-13);ctx.lineTo(iconX+14,cy+13);ctx.ellipse(iconX+14,cy,6,13,0,0,Math.PI*2);ctx.stroke();
            }
            ctx.strokeStyle="#ffffff66";ctx.beginPath();ctx.moveTo(iconX+43,cy-12);ctx.lineTo(iconX+43,cy+12);ctx.stroke();
            ctx.textBaseline="middle";ctx.textAlign="left";ctx.font=`700 23px ${BODY}`;ctx.fillStyle="#ffffff";ctx.fillText(col===0?"LOCAL":"INTERNATIONAL",iconX+59,cy);
        }
        ctx.textBaseline="top";
        rows.forEach((row,index)=>{
            const x=index<2?M:552,y=566+(index%2)*268,width=464,height=244;
            const card=ctx.createLinearGradient(x,y,x+width,y+height);card.addColorStop(0,"#041d31");card.addColorStop(0.65,"#04162b");card.addColorStop(1,"#071329");
            ctx.fillStyle=card;ctx.beginPath();ctx.roundRect(x,y,width,height,32);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();
            const picture=pictures[index],textX=x+(picture?176:24),textWidth=width-(textX-x)-22;
            if(picture){const scale=Math.min(148/picture.naturalWidth,190/picture.naturalHeight),w=picture.naturalWidth*scale,h=picture.naturalHeight*scale;ctx.drawImage(picture,x+16+(148-w)/2,y+(height-h)/2,w,h);}
            const name=fitText(ctx,row.name,textWidth,64,{max:28,min:20,field:"commodity name"});ctx.fillStyle="#ffffff";name.rows.forEach((line,n)=>ctx.fillText(line,textX,y+15+n*name.step));
            const parts=row.price.trim().match(/^([\d,]+(?:\.\d+)?|[—–-])\s*(.*)$/),amount=parts?.[1]??row.price,unit=parts?.[2]??"";
            let size=40,unitSize=19,amountWidth=0;
            for(;size>=22;size-=2){unitSize=Math.round(size*0.46);ctx.font=`700 ${size}px ${BODY}`;amountWidth=ctx.measureText(amount).width;ctx.font=`400 ${unitSize}px ${BODY}`;if(amountWidth+(unit?8+ctx.measureText(unit).width:0)<=textWidth)break;}
            if(size<22)throw new Error("Shorten the commodity price and unit to fit its card.");
            ctx.textBaseline="alphabetic";ctx.font=`700 ${size}px ${BODY}`;ctx.fillStyle="#ffffff";ctx.fillText(amount,textX,y+110);if(unit){ctx.font=`400 ${unitSize}px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText(unit,textX+amountWidth+8,y+110);}ctx.textBaseline="top";
            const positive=/^\s*\+/.test(row.change),negative=/^\s*[-−]/.test(row.change),changeColor=positive?"#a3ff83":negative?"#ff7391":"#cbd5e1",changeBg=positive?"#043621":negative?"#391522":"#142438";
            const change=fitText(ctx,row.change||"—",textWidth-58,34,{max:23,min:16,field:"commodity change",singleLine:true});
            const changeTextX=textX+(positive||negative?46:16);
            const badgeWidth=Math.min(textWidth,ctx.measureText(change.rows[0]).width+(positive||negative?62:32));
            ctx.fillStyle=changeBg;ctx.beginPath();ctx.roundRect(textX,y+126,badgeWidth,42,13);ctx.fill();ctx.strokeStyle=positive?"#16a868":negative?"#d63d66":"#53667d";ctx.lineWidth=1;ctx.stroke();
            if(positive||negative){const ay=y+147;ctx.fillStyle=changeColor;ctx.beginPath();ctx.moveTo(textX+16,ay+(negative?-7:7));ctx.lineTo(textX+34,ay+(negative?-7:7));ctx.lineTo(textX+25,ay+(negative?7:-7));ctx.closePath();ctx.fill();}
            ctx.fillStyle=changeColor;ctx.textBaseline="middle";ctx.fillText(change.rows[0],changeTextX,y+147);ctx.textBaseline="top";
            ctx.strokeStyle="#a5b8cc66";ctx.beginPath();ctx.moveTo(textX,y+184);ctx.lineTo(x+width-22,y+184);ctx.stroke();
            if(row.basis){ctx.strokeStyle="#b7cbe0";ctx.lineWidth=1.2;
                if(index>=2){ctx.beginPath();ctx.arc(textX+8,y+205,7,0,Math.PI*2);ctx.moveTo(textX+8,y+200);ctx.lineTo(textX+8,y+205);ctx.lineTo(textX+12,y+208);ctx.stroke();}
                else{ctx.fillStyle="#b7cbe0";ctx.fillRect(textX,y+206,4,6);ctx.fillRect(textX+6,y+202,4,10);ctx.fillRect(textX+12,y+197,4,15);}
                const basis=fitText(ctx,row.basis,textWidth-27,36,{max:14,min:11,field:"price basis"});
                ctx.fillStyle="#cbd5e1";ctx.textBaseline="alphabetic";
                basis.rows.forEach((line,n)=>{const metrics=ctx.measureText(line);const ascent=metrics.actualBoundingBoxAscent ?? basis.size*0.75,descent=metrics.actualBoundingBoxDescent ?? basis.size*0.2;ctx.fillText(line,textX+25,y+207+n*basis.step+(ascent-descent)/2);});
                ctx.textBaseline="top";
            }
        });
        return;
    }
    rows.forEach((row,index)=>{
        const y = rows.length === 1 ? 634 : 542 + index * 276;
        ctx.fillStyle = "#09182e"; ctx.beginPath(); ctx.roundRect(M,y,952,238,44); ctx.fill(); ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();
        const picture=pictures[index]; const x=picture ? 338 : 96; const width=1016-x-32;
        if(picture){const scale=Math.min(210/picture.naturalWidth,202/picture.naturalHeight);const w=picture.naturalWidth*scale,h=picture.naturalHeight*scale;ctx.drawImage(picture,90+(210-w)/2,y+(238-h)/2,w,h);}
        const name=fitText(ctx,row.name,width,64,{max:40,min:32.5,field:"commodity name",singleLine:true});ctx.fillStyle="#ffffff";ctx.fillText(name.rows[0],x,y+24);
        const price=fitText(ctx,row.price,width,80,{display:true,max:60,min:32,field:"commodity price",singleLine:true,weight:700});ctx.fillText(price.rows[0],x,y+88);
        ctx.letterSpacing="0px";ctx.font=`500 28px ${BODY}`;ctx.fillStyle=/^\s*[-−]/.test(row.change)?"#fb7185":/^\s*\+/.test(row.change)?"#a3e635":"#e2e8f0";ctx.fillText(row.change,x,y+182);
    });
}

function drawFxDirectionBadge(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, country: "us" | "gh", label: string): void {
    ctx.save();
    const x=centerX-124;
    const flagX=x+18, flagY=centerY-15, size=30;
    ctx.save();ctx.beginPath();ctx.arc(flagX+15,centerY,15,0,Math.PI*2);ctx.clip();
    if(country==="us"){
        ctx.fillStyle="#ffffff";ctx.fillRect(flagX,flagY,size,size);
        ctx.fillStyle="#e31d3b";for(let n=0;n<13;n+=2)ctx.fillRect(flagX,flagY+n*size/13,size,size/13);
        ctx.fillStyle="#17417e";ctx.fillRect(flagX,flagY,14,17);
        ctx.fillStyle="#ffffff";for(let row=0;row<5;row++)for(let col=0;col<4;col++){ctx.beginPath();ctx.arc(flagX+2+col*3,flagY+2+row*3,0.65,0,Math.PI*2);ctx.fill();}
    }else{
        ["#ce1126","#fcd116","#006b3f"].forEach((color,n)=>{ctx.fillStyle=color;ctx.fillRect(flagX,flagY+n*10,size,10);});
        ctx.fillStyle="#000000";ctx.beginPath();for(let n=0;n<10;n++){const angle=-Math.PI/2+n*Math.PI/5,r=n%2===0?6:2.5;const px=flagX+15+Math.cos(angle)*r,py=centerY+Math.sin(angle)*r;if(n===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
    }
    ctx.restore();ctx.textAlign="left";ctx.textBaseline="middle";ctx.font=`500 20px ${BODY}`;ctx.letterSpacing="0px";ctx.fillStyle="#ffffff";ctx.fillText(label,x+62,centerY+1);
    ctx.restore();
}

function drawBogCurrencyFlag(ctx: CanvasRenderingContext2D, x: number, y: number, code: string): void {
    ctx.save();ctx.translate(x-34,y-34);ctx.scale(68/44,68/44);ctx.beginPath();ctx.arc(22,22,22,0,Math.PI*2);ctx.clip();
    if(code==="GBP"){
        ctx.fillStyle="#153b75";ctx.fillRect(0,0,44,44);
        for(const [color,width] of [["#ffffff",10],["#ce1126",4]] as const){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(44,44);ctx.moveTo(44,0);ctx.lineTo(0,44);ctx.stroke();}
        ctx.fillStyle="#ffffff";ctx.fillRect(15,0,14,44);ctx.fillRect(0,15,44,14);ctx.fillStyle="#ce1126";ctx.fillRect(18,0,8,44);ctx.fillRect(0,18,44,8);
    }else if(code==="EUR"){
        ctx.fillStyle="#1249a4";ctx.fillRect(0,0,44,44);ctx.fillStyle="#ffdc00";
        for(let n=0;n<12;n++){const angle=n*Math.PI/6,cx=22+Math.sin(angle)*13,cy=22-Math.cos(angle)*13;ctx.beginPath();for(let point=0;point<10;point++){const a=-Math.PI/2+point*Math.PI/5,r=point%2===0?2:0.85;const px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;if(point===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();}
    }else{
        ctx.fillStyle="#ffffff";ctx.fillRect(0,0,44,44);ctx.fillStyle="#e31d3b";for(let n=0;n<13;n+=2)ctx.fillRect(0,n*44/13,44,44/13);
        ctx.fillStyle="#17417e";ctx.fillRect(0,0,21,24);ctx.fillStyle="#ffffff";
        for(let row=0;row<6;row++)for(let col=0;col<5;col++){ctx.beginPath();ctx.arc(2+col*4,2+row*4,0.8,0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
}

async function drawProviderTable(ctx: CanvasRenderingContext2D,input:SocialAssetInput):Promise<void>{
    const page=input.fxPage??0,rows=groupedFxRows(input).slice(page*20,page*20+20),logos=await Promise.all(rows.map(row=>row.logo?loadImage(row.logo):Promise.resolve(null)));
    ctx.textAlign="left";ctx.textBaseline="top";ctx.letterSpacing="-2px";ctx.font=`800 94px ${BODY}`;ctx.fillStyle="#ffffff";ctx.fillText("EXCHANGE ",M,278);const hx=M+ctx.measureText("EXCHANGE ").width;const gradient=ctx.createLinearGradient(hx,0,1016,0);gradient.addColorStop(0,PRESETS.textBlue.start);gradient.addColorStop(1,PRESETS.textBlue.end);ctx.fillStyle=gradient;ctx.fillText("RATES",hx,278);ctx.letterSpacing="0px";
    const columns=rows.length>10?2:1,width=952/columns,headerY=390,top=446,rowH=64;
    for(let col=0;col<columns;col++){
        const items=rows.slice(col*10,col*10+10),x=M+col*width,bottom=top+items.length*rowH,companyWidth=columns===2?230:400,rateWidth=(width-companyWidth)/2;
        ctx.fillStyle="#03172c8c";ctx.beginPath();ctx.roundRect(x,headerY,width,bottom-headerY,16);ctx.fill();ctx.save();ctx.clip();items.forEach((_,n)=>{ctx.fillStyle=n%2===0?"#020e2566":"#06245533";ctx.fillRect(x,top+n*rowH,width,rowH);});ctx.restore();ctx.strokeStyle="#ffffff99";ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(x,headerY,width,bottom-headerY,16);ctx.stroke();ctx.beginPath();for(const split of [x+companyWidth,x+companyWidth+rateWidth]){ctx.moveTo(split,headerY);ctx.lineTo(split,bottom);}for(let n=0;n<items.length;n++){ctx.moveTo(x,top+n*rowH);ctx.lineTo(x+width,top+n*rowH);}ctx.stroke();
        ctx.textBaseline="middle";ctx.font=`700 ${columns===2?18:24}px ${BODY}`;ctx.fillStyle="#ffffff";ctx.textAlign="left";ctx.fillText("Bank / Provider",x+14,418);ctx.textAlign="center";ctx.fillText("USD → GHS",x+companyWidth+rateWidth/2,418);ctx.fillText("GHS → USD",x+companyWidth+rateWidth*1.5,418);
        items.forEach((row,n)=>{const y=top+n*rowH,logo=logos[col*10+n];ctx.textAlign="left";if(logo){ctx.fillStyle="#ffffff";ctx.beginPath();ctx.roundRect(x+10,y+13,38,38,6);ctx.fill();const scale=Math.min(32/logo.naturalWidth,32/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;ctx.drawImage(logo,x+13+(32-w)/2,y+16+(32-h)/2,w,h);}const tx=x+(logo?58:14);const name=fitText(ctx,row.label,companyWidth-(tx-x)-10,58,{max:columns===2?21:26,min:16,weight:700,field:"provider name"});ctx.textBaseline="top";ctx.fillStyle="#ffffff";name.rows.forEach((line,i)=>ctx.fillText(line,tx,y+(rowH-name.rows.length*name.step)/2+i*name.step));for(const [value,cx] of [[row.buying,x+companyWidth+rateWidth/2],[row.selling,x+companyWidth+rateWidth*1.5]] as const){const rate=fitText(ctx,value||"—",rateWidth-12,48,{max:26,min:18,singleLine:true,weight:700,field:"provider rate"});ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(rate.rows[0],cx,y+32);} });
    }
    if(fxPageCount(input)>1){ctx.textAlign="right";ctx.textBaseline="top";ctx.font=`400 18px ${BODY}`;ctx.fillStyle="#ffffff";ctx.fillText(`Page ${page+1} of ${fxPageCount(input)}`,1016,1094);}ctx.textAlign="left";
}

async function drawFxTable(ctx: CanvasRenderingContext2D, input: SocialAssetInput): Promise<void> {
    if(input.fxTemplate!=="bog"){await drawProviderTable(ctx,input);return;}
    const bog=input.fxTemplate==="bog", page=input.fxPage ?? 0;
    const rows=bog ? input.fxRows ?? [] : groupedFxRows(input).slice(page*10,page*10+10);
    const logos=await Promise.all(rows.map(row=>row.logo ? loadImage(row.logo) : Promise.resolve(null)));
    ctx.textAlign="left";ctx.textBaseline="top";ctx.letterSpacing="-2px";ctx.font=`800 94px ${BODY}`;ctx.fillStyle="#ffffff";ctx.fillText("EXCHANGE ",M,278);const headingX=M+ctx.measureText("EXCHANGE ").width;const blue=ctx.createLinearGradient(headingX,0,1016,0);blue.addColorStop(0,PRESETS.textBlue.start);blue.addColorStop(1,PRESETS.textBlue.end);ctx.fillStyle=blue;ctx.fillText("RATES",headingX,278);
    ctx.letterSpacing="0px";
    const headerY=378, headerH=60, top=headerY+headerH, rowH=bog?158:64;
    const left=M, right=1016, split1=464, split2=740, bottom=top+rows.length*rowH;
    ctx.fillStyle="#03172c8c";ctx.beginPath();ctx.roundRect(left,headerY,right-left,bottom-headerY,18);ctx.fill();
    ctx.save();ctx.beginPath();ctx.roundRect(left,headerY,right-left,bottom-headerY,18);ctx.clip();
    rows.forEach((_,index)=>{ctx.fillStyle=index%2===0?"#020e2566":"#06245533";ctx.fillRect(left,top+index*rowH,right-left,rowH);});
    ctx.restore();
    ctx.strokeStyle="#ffffff";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(left,headerY,right-left,bottom-headerY,18);ctx.stroke();
    ctx.beginPath();
    for(const x of [split1,split2]){ctx.moveTo(x,headerY);ctx.lineTo(x,bottom);}
    for(let n=0;n<rows.length;n++){const y=top+n*rowH;ctx.moveTo(left,y);ctx.lineTo(right,y);}
    ctx.stroke();
    ctx.textBaseline="middle";ctx.font=`700 22px ${BODY}`;ctx.fillStyle="#ffffff";
    ctx.textAlign="left";
    const groupName=bog?"CURRENCY":FX_GROUPS.find(g=>g.id===(input.fxGroup || "all"))?.label || "All";
    const groupText=fitText(ctx,groupName,360,45,{display:bog, max:bog?30:22,min:bog?26:18,singleLine:true,weight:700,field:"FX group"});
    ctx.textBaseline="middle";ctx.fillText(groupText.rows[0],left+22,headerY+headerH/2);
    if(bog){
        ctx.font=`700 30px ${BODY}`;ctx.textAlign="center";ctx.fillStyle="#ffffff";
        ctx.fillText("BUYING",602,headerY+headerH/2);ctx.fillText("SELLING",878,headerY+headerH/2);
    }else{
        drawFxDirectionBadge(ctx,602,headerY+headerH/2,"us","USD → GHS");
        drawFxDirectionBadge(ctx,878,headerY+headerH/2,"gh","GHS → USD");
    }
    rows.forEach((row,index)=>{
        const y=top+index*rowH, center=y+rowH/2;
        if(bog){
            drawBogCurrencyFlag(ctx,M+58,center,row.code || "USD");
            ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillStyle="#ffffff";ctx.font=`700 40px ${BODY}`;
            const symbol=({USD:"$",GBP:"£",EUR:"€"} as Record<string,string>)[row.code || ""] || "";
            ctx.fillText(`${symbol}  ${row.code || ""}`,M+110,center-24);
            const currencyName=fitText(ctx,row.label,266,54,{max:28,min:20,singleLine:true,field:"currency name"});ctx.font=`400 ${currencyName.size}px ${BODY}`;ctx.fillStyle="#ffffff";ctx.textBaseline="middle";ctx.fillText(currencyName.rows[0],M+110,center+28);
            for(const [rate,middle] of [[row.buying,602],[row.selling,878]] as const){
                ctx.font=`700 42px ${BODY}`;const rateWidth=ctx.measureText(rate).width;ctx.font=`400 28px ${BODY}`;const prefixWidth=ctx.measureText("GHS").width,start=middle-(prefixWidth+12+rateWidth)/2;
                ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillStyle="#ffffff";ctx.fillText("GHS",start,center+2);ctx.font=`700 42px ${BODY}`;ctx.fillText(rate,start+prefixWidth+12,center);
            }
            return;
        }
        const logo=logos[index];ctx.textAlign="left";
        if(logo){ctx.fillStyle="#ffffff";ctx.beginPath();ctx.roundRect(M+14,y+10,44,44,6);ctx.fill();const scale=Math.min(38/logo.naturalWidth,38/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;ctx.drawImage(logo,M+17+(38-w)/2,y+13+(38-h)/2,w,h);}
        const name=fitText(ctx,row.label,300,50,{max:24,min:19,singleLine:true,field:"FX provider",weight:700});
        ctx.fillStyle="#ffffff";ctx.textBaseline="middle";ctx.fillText(name.rows[0],logo?140:M+22,center);
        ctx.textAlign="center";ctx.font=`700 28px ${BODY}`;
        ctx.fillStyle="#ffffff";ctx.fillText(row.buying||"—",602,center);
        ctx.fillStyle="#ffffff";ctx.fillText(row.selling||"—",878,center);
    });
    if(!bog && fxPageCount(input)>1){ctx.textAlign="right";ctx.fillStyle="#ffffff";ctx.font=`400 19px ${BODY}`;ctx.textBaseline="alphabetic";ctx.fillText(`Page ${page+1} of ${fxPageCount(input)}`,1016,bottom+32);}
    ctx.textAlign="left";
}

export function validateArtworkDimensions(width: number, height: number): void {
    if (width <= 0 || height <= 0 || width * 5 !== height * 4) throw new Error(`Logo & Footer requires a 4:5 image, such as 1080 × 1350. Your image is ${width} × ${height}. Choose a 4:5 image and try again.`);
}

function drawBondNotice(ctx: CanvasRenderingContext2D,input:SocialAssetInput):void{
    ctx.textAlign="left";ctx.textBaseline="top";
    const headline=input.title.toUpperCase().replace(/^GHANA ADMITS A NEW GOVERNMENT SECURITY$/,"GHANA ADMITS\nA NEW GOVERNMENT\nSECURITY");
    const title=fitText(ctx,headline,952,300,{display:true,weight:800,max:86,min:56,field:"bond headline"});
    title.rows.forEach((row,n)=>{ctx.fillStyle="#ffffff";if(n===title.rows.length-1){const blue=ctx.createLinearGradient(M,0,M+ctx.measureText(row).width,0);blue.addColorStop(0,PRESETS.textBlue.start);blue.addColorStop(1,PRESETS.textBlue.end);ctx.fillStyle=blue;}ctx.fillText(row,M,278+n*title.step);});ctx.letterSpacing="0px";
    ctx.fillStyle="#b9c9de";ctx.font=`700 30px ${BODY}`;ctx.fillText(input.symbol.toUpperCase(),M,584);ctx.fillStyle="#ffffff";ctx.font=`400 30px ${BODY}`;ctx.fillText(input.period || "",M,634);
    ctx.fillStyle="#9fb6cc";ctx.fillRect(M,700,42,2);
    if(input.details.trim()){const body=fitText(ctx,input.details,900,280,{max:34,min:28,weight:400,field:"bond notice"});ctx.fillStyle="#ffffff";body.rows.forEach((row,n)=>ctx.fillText(row,M,748+n*body.step));}
    ctx.fillStyle="#1685e5";ctx.fillRect(M,1096,96,5);
}

function drawIndices(ctx: CanvasRenderingContext2D, input: SocialAssetInput, color: ReturnType<typeof palette>): void {
    ctx.textAlign="left";ctx.textBaseline="top";
    const title=fitText(ctx,input.title.toUpperCase(),952,230,{display:true,weight:800,max:86,min:54,field:"indices title"});
    title.rows.forEach((row,n)=>{
        let x=M;const y=278+n*title.step;
        for(const word of row.split(/(DECLINE)/)){
            ctx.fillStyle="#ffffff";
            if(input.kind==="crypto" && n===title.rows.length-1){const blue=ctx.createLinearGradient(M,0,1016,0);blue.addColorStop(0,PRESETS.textBlue.start);blue.addColorStop(1,PRESETS.textBlue.end);ctx.fillStyle=blue;}
            if(word==="DECLINE"){const red=ctx.createLinearGradient(x,y,x+ctx.measureText(word).width,y+title.size);red.addColorStop(0,"#ff697f");red.addColorStop(1,"#db123b");ctx.fillStyle=red;}
            ctx.fillText(word,x,y);x+=ctx.measureText(word).width;
        }
    });
    ctx.letterSpacing="0px";ctx.font=`500 28px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText(input.symbol.toUpperCase(),M,482);
    const priceParts=input.kind==="crypto"?input.value.match(/^([\d,.]+)\s*(.*)$/):null;
    const value=fitText(ctx,priceParts?.[1] || input.value || "—",priceParts?.[2]?740:952,164,{display:true,weight:800,max:144,min:80,singleLine:true,field:"index level"});ctx.fillStyle="#ffffff";ctx.fillText(value.rows[0],M,526);const amountWidth=ctx.measureText(value.rows[0]).width;ctx.letterSpacing="0px";
    if(priceParts?.[2]){ctx.font=`700 72px ${BODY}`;ctx.fillText(priceParts[2],M+amountWidth+20,584);}
    if(input.change.trim()){
        const negative=/^[-−]/.test(input.change.trim()),ink=negative?"#fb7185":"#00dda1";
        ctx.font=`700 44px ${BODY}`;const width=ctx.measureText(input.change).width+94;ctx.fillStyle=negative?"#511b2bbf":"#0b4938bf";ctx.beginPath();ctx.roundRect(M,684,width,72,18);ctx.fill();ctx.fillStyle=ink;
        ctx.beginPath();ctx.moveTo(M+28,negative?708:736);ctx.lineTo(M+62,negative?708:736);ctx.lineTo(M+45,negative?738:706);ctx.closePath();ctx.fill();ctx.fillText(input.change,M+80,692);
    }
    ctx.font=`400 28px ${BODY}`;ctx.fillStyle="#cbd5e1";ctx.fillText(input.period || "",M,778);
    ctx.fillStyle="#a5b8cc33";ctx.fillRect(M,848,952,2);ctx.fillStyle="#1685e5";ctx.fillRect(M,848,80,4);
    if(input.details.trim()){const body=fitText(ctx,input.details,900,220,{max:32,min:26,field:"indices details"});ctx.fillStyle=color.text;body.rows.forEach((row,n)=>ctx.fillText(row,M+12,892+n*body.step));}
}

function drawLogoCorner(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const wash = ctx.createLinearGradient(32, 20, 340, 190);
    wash.addColorStop(0, `${PRESETS.footerBlue.color}b0`);
    wash.addColorStop(0.5, `${PRESETS.backgroundBlue.base}60`);
    wash.addColorStop(1, `${PRESETS.backgroundBlue.base}00`);
    ctx.fillStyle = wash; ctx.fillRect(32, 20, 308, 170);
    ctx.restore();
}

export async function renderSocialAsset(input: SocialAssetInput): Promise<Blob> {
    validateSocialAsset(input);
    await loadFonts();
    if(input.kind==="single-stock")return renderShareCard({...input.stockCard!,theme:"dark"});
    const [logo, photo] = await Promise.all([loadImage("/logo/studio-approved.png"), input.picture ? loadImage(input.picture) : input.kind === "today-movers" ? loadImage("/studio/backgrounds/daily-generated.png") : ["bond-market-update","policy-update","indices","treasury-bills","company-portfolio","company-profile","crypto","bonds"].includes(input.kind) ? loadImage(`/studio/backgrounds/${({"bond-market-update":"bond","policy-update":"policy","indices":"indices","treasury-bills":"treasury","company-portfolio":"portfolio","company-profile":"profile","crypto":"crypto","bonds":"bonds-notice"} as Record<string,string>)[input.kind]}-generated.png`) : input.kind === "week-in-review" ? loadImage("/studio/backgrounds/week-generated.png") : input.kind === "fx" ? loadImage("/studio/backgrounds/fx-generated.png") : Promise.resolve(undefined)]);
    const canvas = document.createElement("canvas"); canvas.width = W;
    if (input.kind === "logo-footer" && photo) {
        validateArtworkDimensions(photo.naturalWidth, photo.naturalHeight);
        const imageHeight = Math.round(W * photo.naturalHeight / photo.naturalWidth);
        if (imageHeight > 8192) throw new Error("Choose artwork with a shorter aspect ratio for this export.");
        canvas.height = H;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser could not prepare the image.");
        context.drawImage(photo, 0, 0, W, imageHeight);
        drawLogoCorner(context);
        context.drawImage(logo, 798, 862, 1704, 826, M, 44, 230, 230 * 826 / 1704);
        drawStudioFooter(context, canvas.height);
        return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("The image could not be exported. Try again.")), "image/png"));
    }
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not prepare the image.");
    const color = palette(input, photo);
    drawBackdrop(ctx, input, input.kind === "commodities" ? undefined : photo, color.background);
    const logoWidth = 230;
    // Original supplied artwork; ignore only its transparent outer margins.
    drawLogoCorner(ctx);
    ctx.drawImage(logo, 798, 862, 1704, 826, M, 44, logoWidth, logoWidth * 826 / 1704);
    ctx.textBaseline = "alphabetic";
    const template = input.kind === "breaking-news" ? "breaking" : input.template || "breaking";
    const category = input.kind === "just-in" ? TEMPLATE_LABELS[template] : LABELS[input.kind];
    ctx.fillStyle = color.accent; ctx.font = `700 30px ${BODY}`; ctx.letterSpacing = "2px";
    const badge = CATEGORY_BADGES[category];
    const headerY = badge ? 246 : 218;
    if (input.kind === "commodities") {
        // This format has its own two-line title and category bar.
    } else if (badge) {
        // Urgency must remain readable independently of the sampled photo accent.
        const badgeWidth = ctx.measureText(category).width + 40;
        ctx.fillStyle = badge.background; if(category==="GSE PROFILE OF THE WEEK"){const blue=ctx.createLinearGradient(M,0,M+badgeWidth,0);blue.addColorStop(0,"#087fe8");blue.addColorStop(1,"#164dbe");ctx.fillStyle=blue;} ctx.beginPath();ctx.roundRect(M,headerY-37.5,badgeWidth,55,12);ctx.fill();
        ctx.fillStyle = badge.text; ctx.fillText(category, M + 20, headerY);
    } else if (input.kind === "company-profile") {
        // Series heading is drawn above the company identity panel.
    } else if (category) ctx.fillText(category, M, headerY);
    ctx.letterSpacing = "0px";


    if (input.kind === "fx" && input.fxTemplate) {
        await drawFxTable(ctx, input);
    } else if (input.kind === "just-in" && input.template === "price-alert") {
        drawPriceAlert(ctx,input,color);
    } else if (input.kind === "bonds") {
        drawBondNotice(ctx,input);
    } else if (input.kind === "indices" || input.kind === "crypto") {
        drawIndices(ctx,input,color);
    } else if (input.kind === "treasury-bills") {
        drawTreasuryBill(ctx,input,color);
    } else if (input.kind === "bond-market-update") {
        drawBondUpdate(ctx,input,color);
    } else if (input.kind === "policy-update") {
        drawPolicyUpdate(ctx,input,color);
    } else if (input.kind === "week-in-review" || input.kind === "today-movers") {
        await drawWeekReview(ctx,input);
    } else if (input.kind === "investor-brief") {
        drawInvestorBrief(ctx,input,color);
    } else if (input.kind === "commodities") {
        await drawCommodities(ctx, input);
    } else if (input.kind === "company-profile") {
        await drawCompanyProfile(ctx, input);
    } else {
    const hasQuote = socialAssetHasQuote(input);
    const quote = hasQuote && !!input.value.trim();
    const facts = input.kind !== "company-portfolio" && !!input.facts?.trim();
    const contentBottom = facts ? 940 : 1102;
    ctx.textBaseline = "top";
    const title = fitText(ctx, input.title.trim().toUpperCase(), photo ? 730 : W - M * 2, quote ? (facts ? 204 : 255) : 460, { display: true, max: quote ? (facts ? 64 : 80) : 104, min: quote ? 54 : 64, field: "title" });
    title.rows.forEach((row, n) => {
        ctx.fillStyle = titleInk(ctx, row, input, color, n === title.rows.length - 1);
        ctx.fillText(row, M, 278 + n * title.step);
    });
    ctx.letterSpacing = "0px";
    let y = 278 + title.rows.length * title.step + 28;
    if (hasQuote && input.symbol.trim()) {
        ctx.fillStyle = color.text; ctx.font = `700 26px ${BODY}`;
        ctx.fillText(input.symbol.trim().toUpperCase(), M, y); y += 46;
    }
    if (quote) {
        const value = fitText(ctx, input.value.trim(), W - M * 2, 170, { display: true, max: facts ? 100 : 148, min: 64, field: "value", singleLine: true });
        ctx.fillStyle = color.accent; ctx.fillText(value.rows[0], M, y); y += value.step + 14;
    }
    if (hasQuote && input.change.trim()) {
        ctx.fillStyle = color.accent; ctx.font = `700 32px ${BODY}`; ctx.fillText(input.change.trim(), M, y); y += 54;
    }
    if (hasQuote && input.period?.trim()) {
        ctx.fillStyle = color.text; ctx.font = `500 25px ${BODY}`; ctx.fillText(input.period.trim(), M, y); y += 48;
    }
    if (input.details.trim()) {
        y += 18;
        const body = fitText(ctx, input.details, photo ? 790 : W - M * 2, contentBottom - y, { max: 34, min: 30, field: "details" });
        ctx.fillStyle = color.text;
        body.rows.forEach((row, n) => ctx.fillText(row, M, y + n * body.step));
    }
    if (facts) drawFacts(ctx, input.facts!, color);
    }
    if (input.source?.trim()) {
        let source = input.source.trim();
        try { source = new URL(source).hostname.replace(/^www\./, ""); } catch { /* A publisher name is also accepted. */ }
        const sourceText = fitText(ctx, `Source: ${source}`, 580, 58, { max: 22, min: 18, field: "source" });
        ctx.fillStyle = color.text; ctx.textBaseline = "top";
        sourceText.rows.forEach((row, n) => ctx.fillText(row, M, 1130 + n * sourceText.step));
    }
    ctx.textBaseline = "top"; ctx.textAlign = "right"; ctx.fillStyle = color.text; ctx.font = `500 22px ${BODY}`;
    ctx.fillText(formatFuelDate(input.date), W - M, 1130); ctx.textAlign = "left";
    drawStudioFooter(ctx, H);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("The image could not be exported. Try again.")), "image/png"));
}
