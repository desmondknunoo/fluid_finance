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

  // Build pivoted rows
  const rows = symbols.map((symbol) => {
    const row: Record<string, string | number> = { Symbol: symbol };
    for (const date of dates) {
      const label = `Close of ${formatDateShort(date)} Price`;
      row[label] = lookup.get(symbol)?.get(date) ?? "";
    }
    return row;
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const cols = [{ wch: 12 }, ...dates.map(() => ({ wch: 20 }))];
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
