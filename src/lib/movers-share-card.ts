import { renderSocialAsset } from "@/lib/social-asset";
/**
 * Fluid Finance - market movers share card
 *
 * A 4:5 image of the day's Top Gainers, Top Losers or Most Active stocks —
 * same visual language as the Week in Review card (brand logo, clean table,
 * footer strip with tagline + social handles).
 */

import { logoUrl } from "@/lib/logos";
import type { Stock } from "@/lib/gse";

export type MoverCategory = "gainers" | "losers" | "active";

export interface MoversCardInput {
    category: MoverCategory;
    stocks: Stock[]; // pre-sorted top 5
    theme?: "light" | "dark";
}

/**
 * Returns the date string for the card header and the full timestamp above the footer.
 *
 * - During market hours (Mon–Fri 10:00–15:00 GMT): today's date + live time
 * - Outside market hours: last trading day's date + 15:00
 */
function getShareDateAndTimestamp(now = new Date()): { date: string; timestamp: string } {
    const day = now.getUTCDay();
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const isWeekday = day !== 0 && day !== 6;
    const isDuringHours = isWeekday && minutes >= 10 * 60 && minutes < 15 * 60;

    const fmtDate = (d: Date) =>
        d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    const fmtTime = (d: Date) =>
        d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

    if (isDuringHours) {
        return { date: fmtDate(now), timestamp: `As of ${fmtDate(now)}, ${fmtTime(now)} GMT` };
    }

    // Market closed — find last trading day at 15:00
    const close = new Date(now);
    close.setUTCHours(15, 0, 0, 0);
    if (isWeekday && minutes >= 15 * 60) {
        // Mon–Fri after 15:00 → today's close
    } else {
        const daysBack = isWeekday ? 1 : day === 0 ? 2 : 1;
        close.setUTCDate(close.getUTCDate() - daysBack);
    }

    const date = fmtDate(close);
    return { date, timestamp: `As of ${date}, 15:00 GMT` };
}

/** Every public mover category uses the same approved renderer as Studio. */
export async function renderMoversCard(input: MoversCardInput): Promise<Blob> {
    const stamp=getShareDateAndTimestamp();
    const date=new Date(stamp.date+" 12:00:00 GMT").toISOString().slice(0,10);
    return renderSocialAsset({
        kind:"today-movers",template:"breaking",title:"Today's market movers",
        symbol:"",value:"",change:"",details:"",date,source:"Ghana Stock Exchange",theme:"fluid-text-blue",
        weekReview:{direction:input.category,startDate:date,rows:input.stocks.slice(0,5).map(stock=>({
            name:`${stock.company} (${stock.symbol})`,logo:logoUrl(stock.symbol)||undefined,
            price:stock.price.toFixed(2),change:stock.changePercent.toFixed(2),volume:stock.volume,
        }))},
    });
}
