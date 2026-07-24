/**
 * Fluid Finance - company logo lookup
 *
 * Assets live in `public/gse/`, so each entry resolves to `/gse/<file>` at
 * runtime. Symbols with no artwork fall back to the initials tile.
 */

const LOGO_FILES: Record<string, string> = {
    AADS: "AADS.png",
    ACCESS: "ACCESS.png",
    ADB: "ADB.png",
    AGA: "anglogold.png",
    ALLGH: "ALLGH.png",
    ALW: "ALW.png",
    ASG: "ASG.png",
    BOPP: "BOPP.png",
    CAL: "CAL.png",
    CLYD: "CLYD.png",
    CMLT: "CMLT.jpeg",
    CPC: "CPC.jpeg",
    DASPHARMA: "DASPHARMA.jpeg",
    DIGICUT: "DIGICUT.png",
    EGH: "EGH.jpeg",
    EGL: "EGL.jpeg",
    ETI: "ETI.jpeg",
    FAB: "FAB.webp",
    FML: "FML.jpeg",
    GCB: "GCB.jpeg",
    GGBL: "GGBL.jpeg",
    GLD: "new-gold-issuer-ltd--600.png",
    GOIL: "GOIL.webp",
    HORDS: "HORDS.svg",
    IIL: "intravenous-infusions.png",
    KASA: "kasapreko.png",
    KBL: "KBL.png",
    MAC: "MAC.jpeg",
    MMH: "Meridian-Marshalls-Holdings.webp",
    MTNGH: "MTNGH.png",
    PBC: "PBC.jpeg",
    RBGH: "RBGH.jpeg",
    SAMBA: "SAMBA.svg",
    SCB: "SCB.png",
    SCBPREF: "SCB_PREF.svg",
    SIC: "SIC.jpeg",
    SOGEGH: "SOGEGH.jpeg",
    SWL: "SWL.png",
    TBL: "TBL.jpeg",
    TLW: "TLW.jpeg",
    TOTAL: "TOTAL.svg",
    UNIL: "UNIL.png",
    ZEN: "ZEN.png",
    // Additional logos from public/gse directory
    BENSO: "benso.jpeg",
    CAMELOT: "camelot.jpeg",
    CAMELOTGH: "camelot.jpeg",
    COCOA: "cocoaprocessingcompany.jpeg",
    DANNEX: "dannex.jpeg",
    EBG: "ecobank.jpeg",
    EGHL: "ecobank.jpeg",
    EGLG: "ecobank.jpeg",
    ETRAN: "enterprise.jpeg",
    FANMILK: "fanmilk.jpeg",
    GOILGH: "gh-goil-logo.webp",
    MEGA: "megaafricacapital.jpeg",
    MTNGH2: "mtn.png",
    PBCL: "producingbuyingcompany.jpeg",
    RBG: "republickbank.jpeg",
    SCBPREF2: "standardchartered.png",
    TOTALEN: "totalenergies.svg",
    TRUST: "trustbank.jpeg",
    TLW2: "tullow.jpeg",
    UNILEVER: "Unilever.png",
};

/** Public URL of a symbol's logo, or null when the exchange listing has none. */
export function logoUrl(symbol: string): string | null {
    const file = LOGO_FILES[symbol.toUpperCase()];
    return file ? `/gse/${encodeURIComponent(file)}` : null;
}

export function hasLogo(symbol: string): boolean {
    return symbol.toUpperCase() in LOGO_FILES;
}

/** Stable fallback hue per ticker, used by the initials tile. */
export function tickerHue(symbol: string): number {
    let h = 0;
    for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) % 360;
    return h;
}
