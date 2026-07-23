/**
 * Fluid Finance - GSE API Integration
 */

const API_BASE_URL = 'https://dev.kwayisi.org/apis/gse';

// Cache management
const cache = {
    data: new Map(),
    TTL: 60000, // 1 minute cache

    get(key) {
        const cached = this.data.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiry) {
            this.data.delete(key);
            return null;
        }

        return cached.data;
    },

    set(key, data) {
        this.data.set(key, {
            data,
            expiry: Date.now() + this.TTL
        });
    },

    clear() {
        this.data.clear();
    }
};

// API error class
class APIError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'APIError';
        this.status = status;
    }
}

// Fetch wrapper with error handling
async function fetchAPI(endpoint, useCache = true) {
    const cacheKey = endpoint;

    // Check cache first
    if (useCache) {
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log(`[API] Cache hit: ${endpoint}`);
            return cached;
        }
    }

    console.log(`[API] Fetching: ${endpoint}`);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new APIError(
                `API request failed: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();

        // Cache the response
        if (useCache) {
            cache.set(cacheKey, data);
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }

        // Network or other error
        throw new APIError('Network error. Please check your connection.', 0);
    }
}

// ===== API Methods =====

// Known GSE Company Names Mapping
const COMPANY_NAMES = {
    'ACCESS': 'Access Bank Ghana',
    'ADS': 'AdosTV',
    'AGA': 'AngloGold Ashanti',
    'ALW': 'Aluworks',
    'AYRTN': 'Ayrton Drug Man.',
    'BOPP': 'Benso Oil Palm Plantation',
    'CAL': 'CAL Bank',
    'CLYD': 'Clydebeest',
    'CMLT': 'Camelot Ghana',
    'CPC': 'Cocoa Processing Co.',
    'DASPHARMA': 'Daakye Trust',
    'DIGICUT': 'Digicut',
    'EGL': 'Enterprise Group',
    'EGH': 'Ecobank Ghana',
    'ETI': 'Ecobank Transnational',
    'FML': 'Fan Milk',
    'GCB': 'GCB Bank',
    'GGBL': 'Guinness Ghana Breweries',
    'GLD': 'NewGold',
    'GOIL': 'Ghana Oil Company',
    'GWEB': 'Golden Web',
    'HORDS': 'Hords',
    'IIL': 'Intravenous Infusions',
    'MAC': 'Mega African Capital',
    'MLC': 'Michelle',
    'MOGL': 'Mount Olive',
    'MTNGH': 'MTN Ghana',
    'PACK': 'Pack',
    'PBC': 'Produce Buying Company',
    'PZC': 'PZ Cussons Ghana',
    'SAMBA': 'Samba Foods',
    'SCB': 'Standard Chartered Bank',
    'SIC': 'SIC Insurance',
    'SOGEGH': 'Societe Generale Ghana',
    'SPL': 'Starwin Products',
    'SWL': 'Sam Woode',
    'TBL': 'Trust Bank Gambia',
    'TOTAL': 'TotalEnergies Marketing',
    'TRANSOL': 'Transol Solutions',
    'TST': 'Trust',
    'UNIL': 'Unilever Ghana'
};

/**
 * Get all live stock data
 * @returns {Promise<Array>} Array of stock objects
 */
async function getLiveStocks() {
    const data = await fetchAPI('/live');

    // Transform and enrich data
    return data.map(stock => ({
        symbol: stock.name, // API returns symbol in 'name' field
        name: COMPANY_NAMES[stock.name] || stock.name, // Use mapped name or fallback to symbol
        price: stock.price,
        change: stock.change,
        volume: stock.volume,
        changePercent: calculateStockChangePercent(stock.price, stock.change),
        isPositive: stock.change > 0,
        isNegative: stock.change < 0,
        isNeutral: stock.change === 0
    }));
}

/**
 * Get specific stock details
 * @param {string} symbol Stock symbol
 * @returns {Promise<Object>} Stock object
 */
async function getStockDetails(symbol) {
    const data = await fetchAPI(`/live/${symbol.toLowerCase()}`);

    return {
        symbol: data.name,
        name: data.name,
        price: data.price,
        change: data.change,
        volume: data.volume,
        changePercent: calculateStockChangePercent(data.price, data.change),
        isPositive: data.change > 0,
        isNegative: data.change < 0,
        isNeutral: data.change === 0
    };
}

/**
 * Get all equities summary
 * @returns {Promise<Array>} Array of equity objects
 */
async function getEquities() {
    const data = await fetchAPI('/equities');

    return data.map(equity => ({
        symbol: equity.name,
        name: equity.name,
        price: equity.price
    }));
}

/**
 * Get detailed equity information
 * @param {string} symbol Stock symbol
 * @returns {Promise<Object>} Detailed equity object
 */
async function getEquityDetails(symbol) {
    const data = await fetchAPI(`/equities/${symbol.toLowerCase()}`);

    return {
        symbol: data.name,
        name: data.name,
        price: data.price,
        marketCap: data.capital,
        eps: data.eps,
        dps: data.dps,
        shares: data.shares,
        company: data.company ? {
            fullName: data.company.name,
            sector: data.company.sector,
            industry: data.company.industry,
            address: data.company.address,
            email: data.company.email,
            phone: data.company.telephone,
            fax: data.company.facsimile,
            website: data.company.website,
            directors: data.company.directors || []
        } : null
    };
}

/**
 * Get top gainers
 * @param {number} limit Number of stocks to return
 * @returns {Promise<Array>} Array of top gaining stocks
 */
async function getTopGainers(limit = 5) {
    const stocks = await getLiveStocks();
    return stocks
        .filter(s => s.isPositive)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit);
}

/**
 * Get top losers
 * @param {number} limit Number of stocks to return
 * @returns {Promise<Array>} Array of top losing stocks
 */
async function getTopLosers(limit = 5) {
    const stocks = await getLiveStocks();
    return stocks
        .filter(s => s.isNegative)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, limit);
}

/**
 * Get market summary statistics
 * @returns {Promise<Object>} Market summary object
 */
async function getMarketSummary() {
    const stocks = await getLiveStocks();

    const totalVolume = stocks.reduce((sum, s) => sum + (s.volume || 0), 0);
    const totalValue = stocks.reduce((sum, s) => sum + (s.price * (s.volume || 0)), 0);
    const gainers = stocks.filter(s => s.isPositive).length;
    const losers = stocks.filter(s => s.isNegative).length;
    const unchanged = stocks.filter(s => s.isNeutral).length;

    return {
        totalStocks: stocks.length,
        totalVolume,
        totalValue,
        gainers,
        losers,
        unchanged,
        lastUpdated: new Date()
    };
}

/**
 * Get top performer by change percentage
 * @returns {Promise<Object|null>} Top performing stock
 */
async function getTopPerformer() {
    const stocks = await getLiveStocks();
    if (stocks.length === 0) return null;

    return stocks.reduce((top, stock) =>
        stock.changePercent > top.changePercent ? stock : top
    );
}

// Helper function
function calculateStockChangePercent(price, change) {
    const previousPrice = price - change;
    if (previousPrice <= 0) return 0;
    return (change / previousPrice) * 100;
}

// Refresh data (clear cache and fetch fresh data)
async function refreshData() {
    cache.clear();
    return getLiveStocks();
}

// Export API object
const GSEAPI = {
    getLiveStocks,
    getStockDetails,
    getEquities,
    getEquityDetails,
    getTopGainers,
    getTopLosers,
    getMarketSummary,
    getTopPerformer,
    refreshData,
    clearCache: () => cache.clear()
};

// For module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GSEAPI;
}
