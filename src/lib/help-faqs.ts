/**
 * Help Center questions. Kept as data so the page and its FAQPage structured data
 * (src/lib/seo-routes.ts) always show the same text.
 */
export const HELP_FAQS: { question: string; answer: string }[] = [
    {
        question: "How do I open a stock account and start trading on the GSE?",
        answer: "To open an account, click on any stock symbol and select \"Open Account.\". You'll need to provide identification documents, proof of address, and complete a KYC verification. The process typically takes 24-48 hours."
    },
    {
        question: "What is the minimum amount required to start investing?",
        answer: "You can start trading with as little as GHS 100. Most GSE stocks have a minimum transaction amount of GHS 50 per trade."
    },
    {
        question: "How do I withdraw my money from the platform?",
        answer: "You can withdraw funds through the stock detail page or by contacting our support team. Withdrawals are processed within 24-48 hours to your registered bank account."
    },
    {
        question: "What information do I need to provide for account verification?",
        answer: "You'll need your Ghana Card, passport, a utility bill (not more than 3 months old), and proof of income. All documents are securely stored and encrypted."
    },
    {
        question: "How accurate is the market data?",
        answer: "Our data is sourced directly from the Ghana Stock Exchange and is updated in real-time with a 15-20 minute delay. We verify all data against multiple sources for accuracy."
    }
];
