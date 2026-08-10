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

    // Start a new week on Monday
    if (day === 1 && current.length > 0) {
      weeks.push({ label: formatWeekLabel(current), dates: current });
      current = [];
    }
    current.push(d);
  }

  // Push the last group
  if (current.length > 0) {
    weeks.push({ label: formatWeekLabel(current), dates: current });
  }

  return weeks;
}

function formatWeekLabel(dates: string[]): string {
  const first = new Date(dates[0] + "T00:00:00Z");
  const last = new Date(dates[dates.length - 1] + "T00:00:00Z");
  return `Week of ${formatDateShort(dates[0])} – ${formatDateShort(dates[dates.length - 1])}`;
}

export async function exportStockPricesToExcel(
  startDate: string,
  endDate: string,
  fridaysOnly: boolean = false,
  filename?: string
): Promise<void> {
  const data = await getStockPriceHistory(startDate, endDate);

  if (data.length === 0) {
    throw new Error("No data found for the selected date range");
  }

  const dates = [...new Set(data.map((r) => r.trading_date))].sort();
  const symbols = [...new Set(data.map((r) => r.symbol))].sort();

  // Build lookup: symbol -> date -> price
  const lookup = new Map<string, Map<string, number>>();
  for (const row of data) {
    if (!lookup.has(row.symbol)) lookup.set(row.symbol, new Map());
    lookup.get(row.symbol)!.set(row.trading_date, row.price);
  }

  // Group dates into weeks (Mon-Fri)
  const weeks = getWeekGroups(dates);

  // Build column headers
  const columnHeaders: string[] = [];
  const columnInfo: { type: "date" | "avg" | "blank"; date?: string; weekDates?: string[] }[] = [];

  for (const week of weeks) {
    if (fridaysOnly) {
      // Only show Friday Close column
      columnHeaders.push(`Close of ${formatDateShort(week.dates[week.dates.length - 1])} Price`);
      columnInfo.push({ type: "avg", weekDates: week.dates });
    } else {
      // Show all daily columns + Friday Close
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

  // Build pivoted rows
  const rows = symbols.map((symbol) => {
    const row: Record<string, string | number> = { Symbol: symbol };
    const symbolData = lookup.get(symbol);

    for (let col = 0; col < columnHeaders.length; col++) {
      const header = columnHeaders[col];
      if (!header) continue;

      const info = columnInfo[col];

      if (info.type === "avg") {
        // Use Friday close price (last day of the week)
        const fridayDate = info.weekDates![info.weekDates!.length - 1];
        const fridayPrice = symbolData?.get(fridayDate);
        row[header] = fridayPrice ?? "";
      } else if (info.type === "date") {
        row[header] = symbolData?.get(info.date!) ?? "";
      }
    }

    return row;
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  const cols = [{ wch: 12 }, ...columnHeaders.map((h) => ({ wch: h === "" ? 3 : 22 }))];
  ws["!cols"] = cols;

  XLSX.utils.book_append_sheet(wb, ws, "Stock Prices");

  const defaultFilename = `GSE_Stock_Prices_${startDate}_to_${endDate}.xlsx`;
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
