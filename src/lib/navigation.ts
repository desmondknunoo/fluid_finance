/** Hash routing: the landing page lives at `#`, a ticker at `#/stock/MTNGH`. */

const STOCK_ROUTE = /^#\/stock\/([A-Za-z0-9._-]+)$/;

export function symbolFromHash(hash = window.location.hash): string | null {
    const match = hash.match(STOCK_ROUTE);
    return match ? match[1].toUpperCase() : null;
}

export function openStock(symbol: string): void {
    window.location.hash = `#/stock/${symbol.toUpperCase()}`;
}

export function closeStock(): void {
    window.location.hash = "#all-stocks";
}
