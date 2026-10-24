export type FxProviderGroup = "bureaus-cards-crypto" | "all" | "banks" | "forex-bureaus" | "cards" | "remittances" | "crypto" | "fintechs";
export const FX_GROUPS: {id:FxProviderGroup;label:string}[] = [{id:"all",label:"All"},{id:"bureaus-cards-crypto",label:"Bureaus / Cards / Crypto"},{id:"banks",label:"Banks"},{id:"forex-bureaus",label:"Forex Bureaus"},{id:"cards",label:"Cards"},{id:"remittances",label:"Remittances"},{id:"crypto",label:"Crypto Exchanges"},{id:"fintechs",label:"Fintechs"}];
export const FX_PROVIDERS: {label:string;group:Exclude<FxProviderGroup,"all">;logo:string}[] = [
    {
        "label": "Zenith Bank",
        "group": "banks",
        "logo": "/studio/fx/zenithbank.webp"
    },
    {
        "label": "WorldRemit",
        "group": "remittances",
        "logo": "/studio/fx/worldremit.webp"
    },
    {
        "label": "Wise",
        "group": "remittances",
        "logo": "/studio/fx/wise.webp"
    },
    {
        "label": "Western Union",
        "group": "remittances",
        "logo": "/studio/fx/westernunion.webp"
    },
    {
        "label": "Visa",
        "group": "cards",
        "logo": "/studio/fx/visa.webp"
    },
    {
        "label": "UMB",
        "group": "banks",
        "logo": "/studio/fx/umb.webp"
    },
    {
        "label": "UBA",
        "group": "banks",
        "logo": "/studio/fx/uba.webp"
    },
    {
        "label": "Taptap Send",
        "group": "remittances",
        "logo": "/studio/fx/taptapsend.webp"
    },
    {
        "label": "Standard Chartered",
        "group": "banks",
        "logo": "/studio/fx/standardchartered.webp"
    },
    {
        "label": "Stanbic Bank",
        "group": "banks",
        "logo": "/studio/fx/stanbicbank.webp"
    },
    {
        "label": "Societe Generale",
        "group": "banks",
        "logo": "/studio/fx/societegenerale.webp"
    },
    {
        "label": "Sendwave",
        "group": "remittances",
        "logo": "/studio/fx/sendwave.webp"
    },
    {
        "label": "Republic",
        "group": "banks",
        "logo": "/studio/fx/republic.webp"
    },
    {
        "label": "Remitly",
        "group": "remittances",
        "logo": "/studio/fx/remitly.webp"
    },
    {
        "label": "Prudential",
        "group": "banks",
        "logo": "/studio/fx/prudential.webp"
    },
    {
        "label": "OmniBSIC",
        "group": "banks",
        "logo": "/studio/fx/omnibsic.webp"
    },
    {
        "label": "GTBank",
        "group": "banks",
        "logo": "/studio/fx/gtbank.webp"
    },
    {
        "label": "GCB",
        "group": "banks",
        "logo": "/studio/fx/gcbbank.webp"
    },
    {
        "label": "NIB",
        "group": "banks",
        "logo": "/studio/fx/nib.webp"
    },
    {
        "label": "Mastercard",
        "group": "cards",
        "logo": "/studio/fx/mastercard.webp"
    },
    {
        "label": "LemFi",
        "group": "remittances",
        "logo": "/studio/fx/lemfi.webp"
    },
    {
        "label": "KuCoin P2P",
        "group": "crypto",
        "logo": "/studio/fx/kucoinp2p.webp"
    },
    {
        "label": "First National",
        "group": "banks",
        "logo": "/studio/fx/firstnational.webp"
    },
    {
        "label": "FBN",
        "group": "banks",
        "logo": "/studio/fx/fbn.webp"
    },
    {
        "label": "First Atlantic",
        "group": "banks",
        "logo": "/studio/fx/firstatlantic.webp"
    },
    {
        "label": "CBG",
        "group": "banks",
        "logo": "/studio/fx/cbg.webp"
    },
    {
        "label": "Bank of Ghana",
        "group": "banks",
        "logo": "/studio/fx/bankofghana.webp"
    },
    {
        "label": "Bank of Africa",
        "group": "banks",
        "logo": "/studio/fx/bankofafrica.webp"
    },
    {
        "label": "ADB",
        "group": "banks",
        "logo": "/studio/fx/adb.webp"
    },
    {
        "label": "Access Bank",
        "group": "banks",
        "logo": "/studio/fx/accessbank.webp"
    },
    {
        "label": "Absa",
        "group": "banks",
        "logo": "/studio/fx/absa.webp"
    },
    {
        "label": "Binance P2P",
        "group": "crypto",
        "logo": "/studio/fx/binancep2p.webp"
    },
    {
        "label": "CalBank",
        "group": "banks",
        "logo": "/studio/fx/calbank.webp"
    },
    {
        "label": "Ecobank",
        "group": "banks",
        "logo": "/studio/fx/ecobank.webp"
    },
    {
        "label": "Fidelity",
        "group": "banks",
        "logo": "/studio/fx/fidelity.webp"
    },
    {
        "label": "Mybitstore",
        "group": "crypto",
        "logo": "/studio/fx/mybitstore.webp"
    },
    {
        "label": "Aboki",
        "group": "forex-bureaus",
        "logo": "/studio/fx/aboki.webp"
    },
    {
        "label": "Dawula",
        "group": "forex-bureaus",
        "logo": "/studio/fx/cedirates-dawula-logo.webp"
    },
    {
        "label": "City BDC",
        "group": "forex-bureaus",
        "logo": "/studio/fx/cedirates-city-bureau-logo.webp"
    }
];
