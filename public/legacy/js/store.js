/**
 * Fluid Finance - State Management
 */

// Storage keys
const STORAGE_KEYS = {
    THEME: 'fluidfinance_theme',
    WATCHLIST: 'fluidfinance_watchlist',
    ALERTS: 'fluidfinance_alerts'
};

// Initial state
const initialState = {
    // UI State
    theme: 'system',
    currentScreen: 'gse-live',
    isLoading: false,
    error: null,

    // Stock Data
    stocks: [],
    stocksLastUpdated: null,
    selectedStock: null,

    // Watchlist
    watchlist: [],

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

    // No explicit choice means follow the device setting, and keep following it
    // for as long as the page is open.
    systemTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
    },

    loadTheme() {
        const savedTheme = getFromStorage(STORAGE_KEYS.THEME, null);
        this.setTheme(savedTheme || this.systemTheme());

        if (!savedTheme && window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
                if (!getFromStorage(STORAGE_KEYS.THEME, null)) {
                    this.setTheme(this.systemTheme());
                }
            });
        }
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

    getStockBySymbol(symbol) {
        return this.state.stocks.find(s => s.symbol === symbol);
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
        this.loadWatchlist();
        this.loadAlerts();
    },

    // ===== Reset =====
    reset() {
        removeFromStorage(STORAGE_KEYS.WATCHLIST);
        removeFromStorage(STORAGE_KEYS.ALERTS);

        this.setState({
            watchlist: [],
            alerts: []
        });
    }
};

// For module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store;
}
