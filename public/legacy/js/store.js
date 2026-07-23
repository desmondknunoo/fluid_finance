/**
 * Fluid Finance - State Management
 */

// Storage keys
const STORAGE_KEYS = {
    THEME: 'fluidfinance_theme',
    PORTFOLIO: 'fluidfinance_portfolio',
    WATCHLIST: 'fluidfinance_watchlist',
    TRANSACTIONS: 'fluidfinance_transactions',
    ALERTS: 'fluidfinance_alerts'
};

// Initial state
const initialState = {
    // UI State
    theme: 'dark',
    currentScreen: 'dashboard',
    marketFilter: 'all', // all, gainers, losers, active, price-desc, price-asc
    isLoading: false,
    error: null,

    // Stock Data
    stocks: [],
    stocksLastUpdated: null,
    selectedStock: null,

    // Portfolio
    portfolio: {
        holdings: [],
        totalValue: 0,
        totalGainLoss: 0
    },

    // Watchlist
    watchlist: [],

    // Transactions
    transactions: [],

    // Alerts
    alerts: []
};

// Create store
const Store = {
    state: { ...initialState },
    listeners: new Set(),

    // Get state
    getState() {
        return this.state;
    },

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    },

    // Notify all listeners
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    },

    // Update state
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    },

    // ===== Theme Management =====
    setTheme(theme) {
        this.setState({ theme });
        saveToStorage(STORAGE_KEYS.THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    loadTheme() {
        const savedTheme = getFromStorage(STORAGE_KEYS.THEME, 'dark');
        this.setTheme(savedTheme);
    },

    // ===== Screen Navigation =====
    setScreen(screen) {
        this.setState({ currentScreen: screen });
    },

    // ===== Loading State =====
    setLoading(isLoading) {
        this.setState({ isLoading });
    },

    setError(error) {
        this.setState({ error });
    },

    clearError() {
        this.setState({ error: null });
    },

    // ===== Stocks =====
    setStocks(stocks) {
        this.setState({
            stocks,
            stocksLastUpdated: new Date()
        });
    },

    setSelectedStock(stock) {
        this.setState({ selectedStock: stock });
    },

    setMarketFilter(filter) {
        this.setState({ marketFilter: filter });
    },

    getStockBySymbol(symbol) {
        return this.state.stocks.find(s => s.symbol === symbol);
    },

    // ===== Portfolio Management =====
    loadPortfolio() {
        const holdings = getFromStorage(STORAGE_KEYS.PORTFOLIO, []);
        this.updatePortfolio(holdings);
    },

    updatePortfolio(holdings) {
        // Calculate totals
        let totalValue = 0;
        let totalGainLoss = 0;

        holdings.forEach(holding => {
            const currentStock = this.getStockBySymbol(holding.symbol);
            const currentPrice = currentStock ? currentStock.price : holding.averagePrice;
            const value = currentPrice * holding.shares;
            const cost = holding.averagePrice * holding.shares;

            holding.currentPrice = currentPrice;
            holding.currentValue = value;
            holding.gainLoss = value - cost;
            holding.gainLossPercent = cost > 0 ? ((value - cost) / cost) * 100 : 0;

            totalValue += value;
            totalGainLoss += holding.gainLoss;
        });

        this.setState({
            portfolio: {
                holdings,
                totalValue,
                totalGainLoss,
                gainLossPercent: totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0
            }
        });

        saveToStorage(STORAGE_KEYS.PORTFOLIO, holdings);
    },

    addHolding(symbol, shares, price) {
        const holdings = [...this.state.portfolio.holdings];
        const existingIndex = holdings.findIndex(h => h.symbol === symbol);

        if (existingIndex >= 0) {
            // Update existing holding (average cost)
            const existing = holdings[existingIndex];
            const totalShares = existing.shares + shares;
            const totalCost = (existing.shares * existing.averagePrice) + (shares * price);
            holdings[existingIndex] = {
                ...existing,
                shares: totalShares,
                averagePrice: totalCost / totalShares
            };
        } else {
            // Add new holding
            holdings.push({
                symbol,
                shares,
                averagePrice: price,
                addedAt: new Date().toISOString()
            });
        }

        this.updatePortfolio(holdings);

        // Record transaction
        this.addTransaction('BUY', symbol, shares, price);
    },

    removeHolding(symbol, shares, price) {
        const holdings = [...this.state.portfolio.holdings];
        const existingIndex = holdings.findIndex(h => h.symbol === symbol);

        if (existingIndex >= 0) {
            const existing = holdings[existingIndex];
            if (shares >= existing.shares) {
                // Remove entire holding
                holdings.splice(existingIndex, 1);
            } else {
                // Reduce shares
                holdings[existingIndex] = {
                    ...existing,
                    shares: existing.shares - shares
                };
            }

            this.updatePortfolio(holdings);

            // Record transaction
            this.addTransaction('SELL', symbol, shares, price);
        }
    },

    // ===== Watchlist =====
    loadWatchlist() {
        const watchlist = getFromStorage(STORAGE_KEYS.WATCHLIST, []);
        this.setState({ watchlist });
    },

    addToWatchlist(symbol) {
        if (!this.state.watchlist.includes(symbol)) {
            const watchlist = [...this.state.watchlist, symbol];
            this.setState({ watchlist });
            saveToStorage(STORAGE_KEYS.WATCHLIST, watchlist);
        }
    },

    removeFromWatchlist(symbol) {
        const watchlist = this.state.watchlist.filter(s => s !== symbol);
        this.setState({ watchlist });
        saveToStorage(STORAGE_KEYS.WATCHLIST, watchlist);
    },

    isInWatchlist(symbol) {
        return this.state.watchlist.includes(symbol);
    },

    getWatchlistStocks() {
        return this.state.stocks.filter(s => this.state.watchlist.includes(s.symbol));
    },

    // ===== Transactions =====
    loadTransactions() {
        const transactions = getFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
        this.setState({ transactions });
    },

    addTransaction(type, symbol, quantity, price) {
        const transaction = {
            id: Date.now().toString(),
            type,
            symbol,
            quantity,
            price,
            total: quantity * price,
            date: new Date().toISOString()
        };

        const transactions = [transaction, ...this.state.transactions].slice(0, 100);
        this.setState({ transactions });
        saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
    },

    // ===== Alerts =====
    loadAlerts() {
        const alerts = getFromStorage(STORAGE_KEYS.ALERTS, []);
        this.setState({ alerts });
    },

    addAlert(symbol, type, threshold) {
        const alert = {
            id: Date.now().toString(),
            symbol,
            type, // 'PRICE_ABOVE', 'PRICE_BELOW', 'CHANGE_PERCENT'
            threshold,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        const alerts = [...this.state.alerts, alert];
        this.setState({ alerts });
        saveToStorage(STORAGE_KEYS.ALERTS, alerts);
    },

    removeAlert(alertId) {
        const alerts = this.state.alerts.filter(a => a.id !== alertId);
        this.setState({ alerts });
        saveToStorage(STORAGE_KEYS.ALERTS, alerts);
    },

    // ===== Initialize =====
    init() {
        this.loadTheme();
        this.loadPortfolio();
        this.loadWatchlist();
        this.loadTransactions();
        this.loadAlerts();
    },

    // ===== Reset =====
    reset() {
        removeFromStorage(STORAGE_KEYS.PORTFOLIO);
        removeFromStorage(STORAGE_KEYS.WATCHLIST);
        removeFromStorage(STORAGE_KEYS.TRANSACTIONS);
        removeFromStorage(STORAGE_KEYS.ALERTS);

        this.setState({
            portfolio: { holdings: [], totalValue: 0, totalGainLoss: 0 },
            watchlist: [],
            transactions: [],
            alerts: []
        });
    }
};

// For module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store;
}
