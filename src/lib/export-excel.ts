import * as XLSX from "xlsx";
import { getStockPriceHistory } from "./supabase";

interface WeekGroup {
  label: string;
  dates: string[];
}

function getWeekGroups(dates: string[]): WeekGroup[] {
  const weeks: WeekGroup[] = [];
  let current: string[] = [];

  for (const d of dates) {
    const date = new Date(d + "T00:00:00Z");
    const day = date.getUTCDay();

    if (day === 1 && current.length > 0) {
      weeks.push({ label: formatWeekLabel(current), dates: current });
      current = [];
    }
    current.push(d);
  }

  if (current.length > 0) {
    weeks.push({ label: formatWeekLabel(current), dates: current });
  }

  return weeks;
}

function formatWeekLabel(dates: string[]): string {
  return `Week of ${formatDateShort(dates[0])} – ${formatDateShort(dates[dates.length - 1])}`;
}

export async function exportStockPricesToExcel(
  startDate: string,
  endDate: string,
  fridaysOnly: boolean = false,
  weeklyComparison: boolean = false,
  filename?: string
): Promise<void> {
  const data = await getStockPriceHistory(startDate, endDate);

  if (data.length === 0) {
    throw new Error("No data found for the selected date range");
  }

  const dates = [...new Set(data.map((r) => r.trading_date))].sort();
  const symbols = [...new Set(data.map((r) => r.symbol))].sort();

  const lookup = new Map<string, Map<string, number>>();
  for (const row of data) {
    if (!lookup.has(row.symbol)) lookup.set(row.symbol, new Map());
    lookup.get(row.symbol)!.set(row.trading_date, row.price);
  }

  const weeks = getWeekGroups(dates);

  if (weeklyComparison) {
    exportWeeklyComparison(symbols, weeks, lookup, startDate, endDate, filename);
    return;
  }

  // Standard export
  const columnHeaders: string[] = [];
  const columnInfo: { type: "date" | "avg" | "blank"; date?: string; weekDates?: string[] }[] = [];

  for (const week of weeks) {
    if (fridaysOnly) {
      columnHeaders.push(`Close of ${formatDateShort(week.dates[week.dates.length - 1])} Price`);
      columnInfo.push({ type: "avg", weekDates: week.dates });
    } else {
      for (const d of week.dates) {
        columnHeaders.push(`Close of ${formatDateShort(d)} Price`);
        columnInfo.push({ type: "date", date: d });
      }
      columnHeaders.push("Friday Close");
      columnInfo.push({ type: "avg", weekDates: week.dates });
    }

    columnHeaders.push("");
    columnInfo.push({ type: "blank" });
  }

  const rows = symbols.map((symbol) => {
    const row: Record<string, string | number> = { Symbol: symbol };
    const symbolData = lookup.get(symbol);

    for (let col = 0; col < columnHeaders.length; col++) {
      const header = columnHeaders[col];
      if (!header) continue;

      const info = columnInfo[col];

      if (info.type === "avg") {
        const fridayDate = info.weekDates![info.weekDates!.length - 1];
        const today = new Date().toISOString().split("T")[0];
        // Only show Friday close if Friday has passed
        if (fridayDate <= today) {
          const fridayPrice = symbolData?.get(fridayDate);
          row[header] = fridayPrice ?? "";
        } else {
          row[header] = "";
        }
      } else if (info.type === "date") {
        row[header] = symbolData?.get(info.date!) ?? "";
      }
    }

    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  const cols = [{ wch: 12 }, ...columnHeaders.map((h) => ({ wch: h === "" ? 3 : 22 }))];
  ws["!cols"] = cols;

  XLSX.utils.book_append_sheet(wb, ws, "Stock Prices");

  const defaultFilename = `GSE_Stock_Prices_${startDate}_to_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename || defaultFilename);
}

function exportWeeklyComparison(
  symbols: string[],
  weeks: WeekGroup[],
  lookup: Map<string, Map<string, number>>,
  startDate: string,
  endDate: string,
  filename?: string
) {
  if (weeks.length < 2) {
    throw new Error("Need at least 2 weeks of data for comparison");
  }

  const lastWeek = weeks[weeks.length - 2];
  const thisWeek = weeks[weeks.length - 1];

  const lastWeekLabel = formatDateShort(lastWeek.dates[lastWeek.dates.length - 1]);
  const thisWeekLabel = formatDateShort(thisWeek.dates[thisWeek.dates.length - 1]);

  const rows = symbols.map((symbol) => {
    const symbolData = lookup.get(symbol);
    const lastWeekClose = symbolData?.get(lastWeek.dates[lastWeek.dates.length - 1]);
    const thisWeekClose = symbolData?.get(thisWeek.dates[thisWeek.dates.length - 1]);

    let change = 0;
    let changePercent = 0;

    if (lastWeekClose !== undefined && thisWeekClose !== undefined) {
      change = thisWeekClose - lastWeekClose;
      changePercent = lastWeekClose > 0 ? (change / lastWeekClose) * 100 : 0;
    }

    return {
      Symbol: symbol,
      [`Last Week Close (${lastWeekLabel})`]: lastWeekClose ?? "",
      [`This Week Close (${thisWeekLabel})`]: thisWeekClose ?? "",
      "Change": change !== 0 ? Math.round(change * 100) / 100 : "",
      "Change %": changePercent !== 0 ? Math.round(changePercent * 100) / 100 : "",
    };
  });

  // Sort by Change % descending (gainers first)
  rows.sort((a, b) => {
    const aVal = typeof a["Change %"] === "number" ? a["Change %"] : -Infinity;
    const bVal = typeof b["Change %"] === "number" ? b["Change %"] : -Infinity;
    return bVal - aVal;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = [
    { wch: 12 },  // Symbol
    { wch: 22 },  // Last Week
    { wch: 22 },  // This Week
    { wch: 12 },  // Change
    { wch: 12 },  // Change %
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Weekly Comparison");

  const defaultFilename = `GSE_Weekly_Comparison_${lastWeekLabel}_vs_${thisWeekLabel}.xlsx`;
  XLSX.writeFile(wb, filename || defaultFilename);
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = String(date.getUTCFullYear()).slice(2);
  return `${day}/${month}/${year}`;
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);

  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
}
