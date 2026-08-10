import * as XLSX from "xlsx";
import { getStockPriceHistory, type StockPrice } from "./supabase";

export async function exportStockPricesToExcel(
  startDate: string,
  endDate: string,
  filename?: string
): Promise<void> {
  const data = await getStockPriceHistory(startDate, endDate);

  if (data.length === 0) {
    throw new Error("No data found for the selected date range");
  }

  // Transform data for Excel
  const rows = data.map((row) => ({
    Symbol: row.symbol,
    Price: row.price,
    "Trading Date": row.trading_date,
    "Recorded At": row.recorded_at ? new Date(row.recorded_at).toLocaleString() : "",
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 10 },  // Symbol
    { wch: 12 },  // Price
    { wch: 15 },  // Trading Date
    { wch: 20 },  // Recorded At
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Stock Prices");

  // Generate filename with date range
  const defaultFilename = `GSE_Stock_Prices_${startDate}_to_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename || defaultFilename);
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3); // Default to last 3 months

  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
}
