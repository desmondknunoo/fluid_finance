/**
 * Fluid Finance - Main Application
 */

// ===== Application Controller =====
const App = {
  // Refresh interval (30 seconds)
  REFRESH_INTERVAL: 30000,
  refreshTimer: null,

  // ===== Initialization =====
  async init() {
    console.log('[App] Initializing Fluid Finance...');

    // Initialize store
    Store.init();

    // GSE Live is the only screen this app serves.
    Store.setScreen('gse-live');

    // Honour ?view=table|grid|heatmap so the landing page can deep-link a view.
    this.applyViewFromQuery();

    // Setup event listeners
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupModals();

    // Load initial data
    await this.loadInitialData();

    // Start auto-refresh
    this.startAutoRefresh();

    // Subscribe to store changes
    Store.subscribe(() => this.onStateChange());

    console.log('[App] Initialization complete');
  },

  // Reads ?view= from the URL and preselects the matching GSE Live view mode.
  applyViewFromQuery() {
    const requested = new URLSearchParams(window.location.search).get('view');
    if (!['table', 'grid', 'heatmap'].includes(requested)) return;

    this._gseLiveViewMode = requested;
    this._viewFromQuery = true;
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === requested);
    });
  },

  // ===== Data Loading =====
  async loadInitialData() {
    try {
      Store.setLoading(true);
      Store.clearError();

      const stocks = await GSEAPI.getLiveStocks();
      Store.setStocks(stocks);

      // Render current screen
      this.renderCurrentScreen();

    } catch (error) {
      console.error('[App] Failed to load data:', error);
      Store.setError(error.message);
      this.showEmptyState();
    } finally {
      Store.setLoading(false);
    }
  },

  // ===== Auto Refresh =====
  startAutoRefresh() {
    this.refreshTimer = setInterval(async () => {
      try {
        const stocks = await GSEAPI.refreshData();
        Store.setStocks(stocks);
        this.renderCurrentScreen();
        this.updateLastUpdatedTime();
      } catch (error) {
        console.error('[App] Refresh failed:', error);
      }
    }, this.REFRESH_INTERVAL);
  },

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },

  updateLastUpdatedTime() {
    const el = document.getElementById('last-updated');
    if (el) {
      el.textContent = `Updated ${formatTime()}`;
    }
  },

  // ===== Navigation =====
  setupNavigation() {
    // Desktop sidebar nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.dataset.screen;
        if (screen) this.navigateTo(screen);
      });
    });

    // Mobile bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.dataset.screen;
        if (screen) this.navigateTo(screen);
      });
    });
  },

  navigateTo(screen) {
    Store.setScreen(screen);

    // Update nav active states
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screen);
    });

    // Show/hide screens
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('active', s.id === `screen-${screen}`);
    });

    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      headerTitle.textContent = 'GSE Live';
    }

    // Render screen content
    this.renderCurrentScreen();
  },

  // ===== Theme Toggle =====
  setupThemeToggle() {
    // Desktop sidebar toggle
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Mobile header toggle
    const mobileToggle = document.getElementById('mobile-theme-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Settings modal toggle
    const settingsToggle = document.getElementById('settings-theme-toggle');
    if (settingsToggle) {
      settingsToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Initialize theme icons based on current theme
    this.updateThemeUI();
  },

  toggleTheme() {
    Store.toggleTheme();
    this.updateThemeUI();
  },

  updateThemeUI() {
    const state = Store.getState();
    const isDark = state.theme === 'dark';

    // Update sidebar toggle
    const toggle = document.querySelector('#theme-toggle .toggle');
    const themeLabel = document.getElementById('theme-label');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');

    if (toggle) toggle.classList.toggle('active', isDark);
    if (themeLabel) themeLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    if (sunIcon) sunIcon.style.display = isDark ? 'none' : 'inline';
    if (moonIcon) moonIcon.style.display = isDark ? 'inline' : 'none';

    // Update mobile toggle
    const mobileSun = document.getElementById('mobile-theme-icon-sun');
    const mobileMoon = document.getElementById('mobile-theme-icon-moon');
    if (mobileSun) mobileSun.style.display = isDark ? 'none' : 'inline';
    if (mobileMoon) mobileMoon.style.display = isDark ? 'inline' : 'none';

    // Update settings toggle
    const settingsToggle = document.getElementById('settings-toggle');
    if (settingsToggle) settingsToggle.classList.toggle('active', isDark);
  },

  // ===== Modals =====
  setupModals() {
    // Close modal on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeModal(backdrop.parentElement.id);
        }
      });
    });

    // Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) this.closeModal(modal.id);
      });
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // ===== Logout Handler =====
  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      // Clear local storage
      localStorage.clear();
      // Close profile modal
      this.closeModal('profile-modal');
      // Show toast
      this.showToast('Logged out successfully', 'info');
      // Reload page after brief delay
      setTimeout(() => window.location.reload(), 1000);
    }
  },

  // ===== State Change Handler =====
  onStateChange() {
    // React to state changes if needed
  },

  // ===== Screen Rendering =====
  // GSE Live is the only screen; the app is information display only.
  renderCurrentScreen() {
    this.renderGSELive();
  },

  // ===== GSE Live Screen =====
  // View mode state
  _gseLiveViewMode: 'table',
  _gseLiveSortConfig: { key: 'symbol', direction: 'asc' },
  _gseLiveSearchTerm: '',
  _gseLiveInitialized: false,

  renderGSELive() {
    const state = Store.getState();

    // Setup event listeners once
    if (!this._gseLiveInitialized) {
      this.setupGSELiveListeners();
      this._gseLiveInitialized = true;
    }

    // Market status
    this.renderMarketStatus();

    // Stats grid
    this.renderLiveStats();

    // Update stock count
    this.updateStockCount();

    // Render current view
    this.renderGSELiveView();

    // Sidebar gainers/losers
    this.renderSidebarMovers();
  },

  setupGSELiveListeners() {
    // View mode toggle buttons
    document.querySelectorAll('#view-mode-toggle .view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._gseLiveViewMode = btn.dataset.view;

        // Update active states
        document.querySelectorAll('#view-mode-toggle .view-mode-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.view === this._gseLiveViewMode)
        );

        // Save preference
        localStorage.setItem('gse_view_mode', this._gseLiveViewMode);

        // Render the new view
        this.renderGSELiveView();
      });
    });

    // Restore saved view mode, unless ?view= already picked one for this visit
    const savedMode = localStorage.getItem('gse_view_mode');
    if (!this._viewFromQuery && savedMode && ['table', 'grid', 'heatmap'].includes(savedMode)) {
      this._gseLiveViewMode = savedMode;
      document.querySelectorAll('#view-mode-toggle .view-mode-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.view === savedMode)
      );
    }

    // Search input
    const searchInput = document.getElementById('stock-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._gseLiveSearchTerm = e.target.value.toLowerCase();
        this.renderGSELiveView();
        this.updateStockCount();
      });
    }

    // Table header sorting
    document.querySelectorAll('#stock-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (this._gseLiveSortConfig.key === key) {
          this._gseLiveSortConfig.direction =
            this._gseLiveSortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
          this._gseLiveSortConfig = { key, direction: 'asc' };
        }

        // Update sort indicators
        document.querySelectorAll('#stock-table th').forEach(h => {
          h.classList.toggle('sorted', h.dataset.sort === key);
          const indicator = h.querySelector('.sort-icon');
          if (indicator) {
            indicator.textContent = h.dataset.sort === key
              ? (this._gseLiveSortConfig.direction === 'asc' ? '↑' : '↓')
              : '↕';
          }
        });

        this.renderGSELiveView();
      });
    });

    // Heatmap interactions
    const heatmapCanvas = document.getElementById('heatmap-canvas');
    const tooltip = document.getElementById('heatmap-tooltip');

    if (heatmapCanvas && tooltip) {
      heatmapCanvas.addEventListener('mousemove', (e) => {
        const rect = heatmapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const stock = Charts.findRectAtPosition(heatmapCanvas, x, y);

        if (stock) {
          tooltip.innerHTML = `
                        <div class="font-bold">${stock.symbol}</div>
                        <div class="text-muted">${stock.name}</div>
                        <div class="text-mono">GHS ${stock.price.toFixed(2)}</div>
                        <div class="${stock.changePercent >= 0 ? 'text-success' : 'text-error'}">
                            ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                        </div>
                    `;
          tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
          tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
          tooltip.classList.add('visible');
        } else {
          tooltip.classList.remove('visible');
        }
      });

      heatmapCanvas.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });

      heatmapCanvas.addEventListener('click', (e) => {
        const rect = heatmapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const stock = Charts.findRectAtPosition(heatmapCanvas, x, y);
        if (stock) {
          this.showStockDetail(stock.symbol);
        }
      });
    }
  },

  getFilteredAndSortedStocks() {
    const state = Store.getState();
    let stocks = [...state.stocks];

    // Filter by search
    if (this._gseLiveSearchTerm) {
      stocks = stocks.filter(s =>
        s.symbol.toLowerCase().includes(this._gseLiveSearchTerm) ||
        (s.name && s.name.toLowerCase().includes(this._gseLiveSearchTerm))
      );
    }

    // Sort
    const { key, direction } = this._gseLiveSortConfig;
    stocks.sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle string vs number
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return stocks;
  },

  updateStockCount() {
    const stocks = this.getFilteredAndSortedStocks();
    const countEl = document.getElementById('stock-count');
    if (countEl) {
      countEl.textContent = `${stocks.length} stocks`;
    }
  },

  renderGSELiveView() {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(v => v.style.display = 'none');

    // Show current view
    const viewEl = document.getElementById(`view-${this._gseLiveViewMode}`);
    if (viewEl) {
      viewEl.style.display = 'block';
    }

    // Render content for current view
    switch (this._gseLiveViewMode) {
      case 'table':
        this.renderStockTableContent();
        break;
      case 'grid':
        this.renderStockGridContent();
        break;
      case 'heatmap':
        this.renderHeatmapContent();
        break;
    }
  },

  renderStockTableContent() {
    const container = document.getElementById('stock-table-body');
    if (!container) return;

    const stocks = this.getFilteredAndSortedStocks();

    if (stocks.length === 0) {
      container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted p-8">
                        ${this._gseLiveSearchTerm ? 'No stocks match your search' : 'No stock data available'}
                    </td>
                </tr>
            `;
      return;
    }

    container.innerHTML = stocks.map(stock => `
            <tr onclick="App.showStockDetail('${stock.symbol}')">
                <td class="symbol">${stock.symbol}</td>
                <td class="name">${stock.name || '-'}</td>
                <td class="price">GHS ${stock.price.toFixed(2)}</td>
                <td class="change ${stock.isPositive ? 'positive' : stock.isNegative ? 'negative' : ''}">
                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                </td>
                <td>
                    <span class="badge ${stock.isPositive ? 'badge-success' : stock.isNegative ? 'badge-error' : 'badge-neutral'}">
                        ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                    </span>
                </td>
                <td class="volume">${abbreviateNumber(stock.volume || 0)}</td>
            </tr>
        `).join('');
  },

  renderStockGridContent() {
    const container = document.getElementById('stock-grid');
    if (!container) return;

    const stocks = this.getFilteredAndSortedStocks();

    if (stocks.length === 0) {
      container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <p class="text-muted">${this._gseLiveSearchTerm ? 'No stocks match your search' : 'No stock data available'}</p>
                </div>
            `;
      return;
    }

    container.innerHTML = stocks.map(stock => `
            <div class="stock-grid-card" onclick="App.showStockDetail('${stock.symbol}')">
                <div class="header">
                    <div>
                        <div class="symbol">${stock.symbol}</div>
                        <div class="name">${stock.name || '-'}</div>
                    </div>
                    <span class="badge ${stock.isPositive ? 'badge-success' : stock.isNegative ? 'badge-error' : 'badge-neutral'}">
                        ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                    </span>
                </div>
                <div class="price">GHS ${stock.price.toFixed(2)}</div>
                <div class="change-row ${stock.isPositive ? 'text-success' : stock.isNegative ? 'text-error' : 'text-muted'}">
                    ${stock.change >= 0 ? '↑' : '↓'} ${Math.abs(stock.change).toFixed(2)}
                </div>
                <div class="footer">
                    <div>
                        <div class="label">Volume</div>
                        <div class="value">${abbreviateNumber(stock.volume || 0)}</div>
                    </div>
                </div>
            </div>
        `).join('');
  },

  renderHeatmapContent() {
    const canvas = document.getElementById('heatmap-canvas');
    if (!canvas) return;

    const stocks = this.getFilteredAndSortedStocks();

    // Draw treemap heatmap
    Charts.treemapHeatmap(canvas, stocks);
  },

  renderMarketStatus() {
    const container = document.getElementById('market-status');
    if (!container) return;

    // Determine if market is open (Mon-Fri, 10am-3pm GMT)
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    const isOpen = day >= 1 && day <= 5 && hour >= 10 && hour < 15;

    container.innerHTML = `
            <div class="card market-status-card">
                <div>
                    <div class="text-sm text-muted mb-1">Ghana Stock Exchange</div>
                    <div class="market-status ${isOpen ? 'open' : 'closed'}">
                        <span class="market-status-dot"></span>
                        ${isOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
                    </div>
                </div>
                <div>
                    <div class="text-sm text-muted mb-1">Trading Hours</div>
                    <div class="text-mono text-sm">10:00 AM - 3:00 PM GMT</div>
                </div>
                <div>
                    <div class="text-sm text-muted mb-1">Last Update</div>
                    <div class="text-mono font-semibold" id="last-updated">${formatTime()}</div>
                </div>
            </div>
        `;
  },

  renderLiveStats() {
    const state = Store.getState();
    const container = document.getElementById('live-stats');
    if (!container) return;

    const totalVolume = state.stocks.reduce((sum, s) => sum + (s.volume || 0), 0);
    const totalValue = state.stocks.reduce((sum, s) => sum + (s.price * (s.volume || 0)), 0);
    const gainers = state.stocks.filter(s => s.isPositive).length;
    const losers = state.stocks.filter(s => s.isNegative).length;
    const unchanged = state.stocks.length - gainers - losers;

    container.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Volume</div>
                <div class="stat-value">${abbreviateNumber(totalVolume)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Value</div>
                <div class="stat-value">${abbreviateNumber(totalValue)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Advancers</div>
                <div class="stat-value text-success">${gainers}</div>
             </div>
            <div class="stat-card">
                <div class="stat-label">Decliners</div>
                <div class="stat-value text-error">${losers}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Unchanged</div>
                <div class="stat-value">${unchanged}</div>
            </div>
        `;
  },

  renderSidebarMovers() {
    const state = Store.getState();

    // Top gainers
    const gainersContainer = document.getElementById('sidebar-gainers');
    if (gainersContainer) {
      const gainers = [...state.stocks]
        .filter(s => s.isPositive)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);

      gainersContainer.innerHTML = gainers.length > 0
        ? gainers.map(stock => this.createSidebarListItem(stock)).join('')
        : '<p class="text-muted text-center p-4" style="font-size: 12px;">No gainers today</p>';
    }

    // Top losers
    const losersContainer = document.getElementById('sidebar-losers');
    if (losersContainer) {
      const losers = [...state.stocks]
        .filter(s => s.isNegative)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5);

      losersContainer.innerHTML = losers.length > 0
        ? losers.map(stock => this.createSidebarListItem(stock)).join('')
        : '<p class="text-muted text-center p-4" style="font-size: 12px;">No losers today</p>';
    }
  },

  createSidebarListItem(stock) {
    const isPositive = stock.isPositive;
    return `
            <div class="sidebar-list-item" onclick="App.showStockDetail('${stock.symbol}')">
                <div>
                    <div class="symbol">${stock.symbol}</div>
                    <div class="name">${stock.name || ''}</div>
                </div>
                <div>
                    <div class="price">GHS ${stock.price.toFixed(2)}</div>
                    <div class="change ${isPositive ? 'text-success' : 'text-error'}">
                        ${isPositive ? '↑' : '↓'} ${Math.abs(stock.changePercent).toFixed(2)}%
                    </div>
                </div>
            </div>
        `;
  },

  // ===== Stock Detail Modal =====
  async showStockDetail(symbol) {
    const stock = Store.getStockBySymbol(symbol);
    if (!stock) return;

    // Load detailed info
    let details = null;
    try {
      details = await GSEAPI.getEquityDetails(symbol);
    } catch (e) {
      console.error('Failed to load stock details:', e);
    }

    const modal = document.getElementById('stock-detail-modal');
    const content = document.getElementById('stock-detail-content');

    if (content) {
      content.innerHTML = `
        <div class="flex items-center gap-4 mb-6">
          <div class="stock-logo avatar-lg" style="background: ${getStockColor(stock.symbol)}">
            ${getStockInitials(stock.symbol)}
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold">${stock.symbol}</h2>
            <p class="text-muted">${details?.company?.fullName || (stock.name !== stock.symbol ? stock.name : '')}</p>
          </div>
          <span class="badge badge-lg ${stock.isPositive ? 'badge-success' : 'badge-error'}">
            ${formatPercent(stock.changePercent)}
          </span>
        </div>
        
        <div class="text-4xl font-bold text-mono mb-2">GHS ${stock.price.toFixed(2)}</div>
        <div class="text-sm ${stock.isPositive ? 'text-success' : 'text-error'} mb-6">
          ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${formatPercent(stock.changePercent)})
        </div>
        
        <canvas id="stock-detail-chart" style="width: 100%; height: 200px;"></canvas>
        
        <div class="grid grid-2 gap-4 mt-6">
          <div class="stat-card">
            <div class="stat-label">Volume</div>
            <div class="stat-value">${abbreviateNumber(stock.volume || 0)}</div>
          </div>
          ${details ? `
            <div class="stat-card">
              <div class="stat-label">Market Cap</div>
              <div class="stat-value">${abbreviateNumber(details.marketCap || 0)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">EPS</div>
              <div class="stat-value">${details.eps?.toFixed(2) || 'N/A'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">DPS</div>
              <div class="stat-value">${details.dps?.toFixed(2) || 'N/A'}</div>
            </div>
          ` : ''}
        </div>
        
        ${details?.company ? `
          <div class="mt-6">
            <h4 class="font-bold mb-3">Company Info</h4>
            <div class="space-y-2 text-sm">
              ${details.company.sector ? `<p><span class="text-muted">Sector:</span> ${details.company.sector}</p>` : ''}
              ${details.company.industry ? `<p><span class="text-muted">Industry:</span> ${details.company.industry}</p>` : ''}
              ${details.company.website ? `<p><span class="text-muted">Website:</span> <a href="https://${details.company.website}" target="_blank">${details.company.website}</a></p>` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="flex gap-3 mt-6">
          <button class="btn btn-secondary flex-1" onclick="App.toggleWatchlist('${stock.symbol}')">
            ${Store.isInWatchlist(stock.symbol) ? '★ Remove from Watchlist' : '☆ Add to Watchlist'}
          </button>
        </div>
      `;
    }

    this.openModal('stock-detail-modal');

    // Draw chart after modal is visible
    setTimeout(() => {
      const canvas = document.getElementById('stock-detail-chart');
      if (canvas) {
        const demoData = Charts.generateDemoData(stock.price, 50, 0.03);
        Charts.priceChart(canvas, demoData);
      }
    }, 100);
  },

  toggleWatchlist(symbol) {
    if (Store.isInWatchlist(symbol)) {
      Store.removeFromWatchlist(symbol);
      this.showToast(`${symbol} removed from watchlist`, 'info');
    } else {
      Store.addToWatchlist(symbol);
      this.showToast(`${symbol} added to watchlist`, 'success');
    }

    // Update modal button text
    const btn = document.querySelector(`[onclick*="toggleWatchlist('${symbol}')"]`);
    if (btn) {
      btn.textContent = Store.isInWatchlist(symbol) ? '★ Remove from Watchlist' : '☆ Add to Watchlist';
    }
  },

  // ===== Toast Notifications =====
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in-right`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ===== Empty State =====
  showEmptyState() {
    const screens = ['screen-dashboard', 'screen-market', 'screen-gse-live'];
    screens.forEach(screenId => {
      const screen = document.getElementById(screenId);
      if (screen) {
        const content = screen.querySelector('.main-content');
        if (content) {
          content.innerHTML = `
            <div class="empty-state" style="min-height: 60vh;">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h4 class="empty-state-title">Unable to load data</h4>
              <p class="empty-state-description">Please check your internet connection and try again.</p>
              <button class="btn btn-primary mt-4" onclick="App.loadInitialData()">Retry</button>
            </div>
          `;
        }
      }
    });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
