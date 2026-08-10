import * as XLSX from "xlsx";
import { getStockPriceHistory } from "./supabase";

export async function exportStockPricesToExcel(
  startDate: string,
  endDate: string,
  filename?: string
): Promise<void> {
  const data = await getStockPriceHistory(startDate, endDate);

  if (data.length === 0) {
    throw new Error("No data found for the selected date range");
  }

  // Get sorted unique dates and symbols
  const dates = [...new Set(data.map((r) => r.trading_date))].sort();
  const symbols = [...new Set(data.map((r) => r.symbol))].sort();

  // Build lookup: symbol -> date -> price
  const lookup = new Map<string, Map<string, number>>();
  for (const row of data) {
    if (!lookup.has(row.symbol)) lookup.set(row.symbol, new Map());
    lookup.get(row.symbol)!.set(row.trading_date, row.price);
  }

  // Build column headers with weekly avg and blank separators
  const columnHeaders: string[] = [];
  const columnDates: (string | null)[] = []; // null = avg column, "blank" = separator

  for (let i = 0; i < dates.length; i++) {
    columnHeaders.push(`Close of ${formatDateShort(dates[i])} Price`);
    columnDates.push(dates[i]);

    // After every 5th day, add weekly avg + blank column
    if ((i + 1) % 5 === 0) {
      columnHeaders.push("Weekly Average");
      columnDates.push(null); // marks avg column

      columnHeaders.push("");
      columnDates.push("blank" as any); // marks blank separator
    }
  }

  // Build pivoted rows
  const rows = symbols.map((symbol) => {
    const row: Record<string, string | number> = { Symbol: symbol };
    const symbolData = lookup.get(symbol);

    for (let col = 0; col < columnHeaders.length; col++) {
      const header = columnHeaders[col];
      if (!header) continue; // blank separator column

      const dateKey = columnDates[col];

      if (dateKey === null) {
        // Weekly average column
        const weekStart = col - 5;
        let sum = 0;
        let count = 0;
        for (let j = weekStart; j < col; j++) {
          const d = columnDates[j] as string;
          const val = symbolData?.get(d);
          if (val !== undefined) {
            sum += val;
            count++;
          }
        }
        row[header] = count > 0 ? Math.round((sum / count) * 100) / 100 : "";
      } else if (dateKey === "blank") {
        // Skip blank separator
        continue;
      } else {
        // Regular date column
        row[header] = symbolData?.get(dateKey) ?? "";
      }
    }

    return row;
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
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
