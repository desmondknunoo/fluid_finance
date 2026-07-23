import { useEffect, useState } from "react"
import LandingPage from "@/components/ui/saa-s-template"
import { StockDetail } from "@/components/stock/stock-detail"
import { closeStock, symbolFromHash } from "@/lib/navigation"

function App() {
  const [symbol, setSymbol] = useState<string | null>(() => symbolFromHash())

  useEffect(() => {
    const sync = () => setSymbol(symbolFromHash())
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  if (symbol) {
    return <StockDetail symbol={symbol} onBack={closeStock} />
  }

  return <LandingPage />
}

export default App
