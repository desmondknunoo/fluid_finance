import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://agzazndvqrencvgpovyh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnemF6bmR2cXJlbmN2Z3BvdnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzYzNzAsImV4cCI6MjEwMTk1MjM3MH0.r0Nrl0qzT8ekwyOzpsAUBwFBx1W0Px2Ztcb-u36F9fg";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface StockPrice {
  id?: string;
  symbol: string;
  price: number;
  recorded_at?: string;
  trading_date: string;
}

export async function saveStockPrices(prices: { symbol: string; price: number }[]): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const rows: StockPrice[] = prices.map((p) => ({
    symbol: p.symbol,
    price: p.price,
    trading_date: today,
  }));

  const { error } = await supabase
    .from("stock_prices")
    .upsert(rows, { onConflict: "symbol,trading_date" });

  if (error) {
    console.error("Error saving stock prices:", error);
    throw error;
  }
}

export async function getStockPriceHistory(
  startDate: string,
  endDate: string
): Promise<StockPrice[]> {
  const { data, error } = await supabase
    .from("stock_prices")
    .select("*")
    .gte("trading_date", startDate)
    .lte("trading_date", endDate)
    .order("trading_date", { ascending: true });

  if (error) {
    console.error("Error fetching stock prices:", error);
    throw error;
  }

  return data || [];
}
