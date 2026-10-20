/**
 * Help Center questions. Kept as data so the page and its FAQPage structured data
 * (src/lib/seo-routes.ts) always show the same text.
 *
 * Fluid Finance is a publication and education platform: it shows market data, research and
 * community discussion, and never executes trades or holds money. Trading happens in the separate
 * Fluid app. Every answer here must stay consistent with that and with the site footer.
 */
export const HELP_FAQS: { question: string; answer: string }[] = [
    {
        question: "What is Fluid Finance?",
        answer: "Fluid Finance is a financial publication and market education platform for Ghana. It brings together Ghana Stock Exchange prices and company pages, research from our team, fuel pump prices, cedi exchange rates and a community forum. It does not execute trades, hold client funds or act as a broker."
    },
    {
        question: "Can I buy or sell shares on Fluid Finance?",
        answer: "No. Fluid Finance shows prices and information only. The Buy button on a company page takes you to the Fluid app at app.fluidterra.com, a separate service where accounts, identity verification, funding and orders are handled."
    },
    {
        question: "How do I open an investment account?",
        answer: "Investment accounts are opened in the Fluid app, not on this site. Follow the sign-up and verification steps there. A free Fluid Finance account is a separate community account and cannot be used to trade."
    },
    {
        question: "What does a free Fluid Finance account let me do?",
        answer: "With a free account you can comment on research, start and reply to forum discussions, keep a public profile, follow companies on a watchlist and save articles to read offline. Sign up with your email or Google, and confirm your email address before you post."
    },
    {
        question: "Where does the market data come from, and how current is it?",
        answer: "Share prices come from the Ghana Stock Exchange's official market data and are refreshed throughout the trading session, but they may be delayed by 15 to 20 minutes. Daily closing prices are recorded by Fluid Finance, and some longer price charts include illustrative backfill, which each chart labels."
    },
    {
        question: "How are fuel prices and exchange rates collected?",
        answer: "Our operations team records pump prices by oil marketing company and publishes each dated report. Exchange rates on the currency page are indicative rates recorded by the same team. Prices at the pump, banks and forex bureaus can differ, so confirm with the provider before you pay or transact."
    },
    {
        question: "Is anything on Fluid Finance investment advice?",
        answer: "No. Research, market data and community posts are for information and education only. They are not recommendations to buy or sell. Investing carries risk of loss, so do your own research or speak to a licensed adviser."
    },
    {
        question: "How do I contact the Fluid Finance team?",
        answer: "Email info@fluidterra.com with questions about the site, your community account, our research or market data. For accounts, payments or orders, contact support in the Fluid app."
    }
];
