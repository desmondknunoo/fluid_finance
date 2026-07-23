/**
 * Fluid Finance - Chart Components
 * Using Canvas API for lightweight chart rendering
 */

const Charts = {
    // Color palette
    colors: {
        primary: '#FFFFFF',
        primarySoft: 'rgba(255, 255, 255, 0.6)',
        success: '#10b981',
        error: '#fb7185',
        grid: 'rgba(255, 255, 255, 0.05)',
        gridLight: 'rgba(0, 0, 0, 0.05)',
        text: 'rgba(255, 255, 255, 0.6)',
        textLight: '#666666'
    },

    // Get theme-aware colors
    getColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            ...this.colors,
            grid: isDark ? this.colors.grid : this.colors.gridLight,
            text: isDark ? this.colors.text : this.colors.textLight
        };
    },

    /**
     * Draw a mini line chart (for cards)
     */
    miniLineChart(canvas, data, isPositive = true) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Set canvas size accounting for device pixel ratio
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = 2;

        if (data.length < 2) return;

        // Calculate min/max for scaling
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        // Calculate points
        const points = data.map((value, i) => ({
            x: padding + (i / (data.length - 1)) * (width - padding * 2),
            y: height - padding - ((value - min) / range) * (height - padding * 2)
        }));

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const color = isPositive ? this.colors.success : this.colors.error;
        gradient.addColorStop(0, `${color}40`);
        gradient.addColorStop(1, `${color}00`);

        ctx.beginPath();
        ctx.moveTo(points[0].x, height);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        // Smooth curve using bezier
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    },

    /**
     * Draw a full price chart with time axis
     */
    priceChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const colors = this.getColors();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 60, bottom: 30, left: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        if (data.length < 2) return;

        // Calculate min/max
        const prices = data.map(d => d.price);
        const min = Math.min(...prices) * 0.995;
        const max = Math.max(...prices) * 1.005;
        const range = max - min;

        // Calculate points
        const points = data.map((d, i) => ({
            x: padding.left + (i / (data.length - 1)) * chartWidth,
            y: padding.top + (1 - (d.price - min) / range) * chartHeight,
            price: d.price
        }));

        // Draw grid lines
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (i / 4) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Price labels
            const price = max - (i / 4) * range;
            ctx.fillStyle = colors.text;
            ctx.font = '11px JetBrains Mono';
            ctx.textAlign = 'left';
            ctx.fillText(price.toFixed(2), width - padding.right + 8, y + 4);
        }

        // Determine if overall positive or negative
        const isPositive = points[points.length - 1].price >= points[0].price;
        const lineColor = isPositive ? this.colors.success : this.colors.error;

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, `${lineColor}30`);
        gradient.addColorStop(1, `${lineColor}00`);

        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw current price dot
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();

        // Outer glow
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = `${lineColor}40`;
        ctx.fill();
    },

    /**
     * Draw a pie chart for portfolio allocation
     */
    pieChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        const innerRadius = radius * 0.6; // Donut chart

        if (data.length === 0) return;

        // Calculate total
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) return;

        // Color palette for sectors
        const colorPalette = [
            '#FFFFFF', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.4)',
            'rgba(255, 255, 255, 0.2)', '#D1D5DB', '#9CA3AF', '#4B5563'
        ];

        let startAngle = -Math.PI / 2; // Start from top

        data.forEach((segment, i) => {
            const sliceAngle = (segment.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            const color = colorPalette[i % colorPalette.length];

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Add slight gap between slices
            ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'light' ? '#F5F5F7' : '#0D0D0D';
            ctx.lineWidth = 2;
            ctx.stroke();

            startAngle = endAngle;
        });

        // Draw center text
        const colors = this.getColors();
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Portfolio', centerX, centerY - 8);
        ctx.font = '12px Inter';
        ctx.fillText('Allocation', centerX, centerY + 10);
    },

    /**
     * Draw order book depth chart
     */
    orderBookChart(canvas, bids, asks) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const colors = this.getColors();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const midX = width / 2;

        // Normalize data
        const maxBid = Math.max(...bids.map(b => b.volume), 1);
        const maxAsk = Math.max(...asks.map(a => a.volume), 1);
        const maxVolume = Math.max(maxBid, maxAsk);

        const barHeight = height / Math.max(bids.length, asks.length, 1);

        // Draw bids (left side, green)
        bids.forEach((bid, i) => {
            const barWidth = (bid.volume / maxVolume) * (midX - 10);
            const y = i * barHeight;

            // Bar
            ctx.fillStyle = `${this.colors.success}40`;
            ctx.fillRect(midX - barWidth - 5, y + 2, barWidth, barHeight - 4);

            // Price label
            ctx.fillStyle = this.colors.success;
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'right';
            ctx.fillText(bid.price.toFixed(2), midX - barWidth - 10, y + barHeight / 2 + 3);
        });

        // Draw asks (right side, red)
        asks.forEach((ask, i) => {
            const barWidth = (ask.volume / maxVolume) * (midX - 10);
            const y = i * barHeight;

            // Bar
            ctx.fillStyle = `${this.colors.error}40`;
            ctx.fillRect(midX + 5, y + 2, barWidth, barHeight - 4);

            // Price label
            ctx.fillStyle = this.colors.error;
            ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'left';
            ctx.fillText(ask.price.toFixed(2), midX + barWidth + 10, y + barHeight / 2 + 3);
        });

        // Center line
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(midX, 0);
        ctx.lineTo(midX, height);
        ctx.stroke();
    },

    /**
     * Generate random price data for demo charts
     */
    generateDemoData(basePrice, points = 30, volatility = 0.02) {
        const data = [];
        let price = basePrice;

        for (let i = 0; i < points; i++) {
            const change = (Math.random() - 0.48) * volatility * price;
            price = Math.max(0.01, price + change);
            data.push({ price, time: i });
        }

        return data;
    },

    /**
     * Generate demo order book data
     */
    generateOrderBook(currentPrice, levels = 5) {
        const bids = [];
        const asks = [];

        for (let i = 0; i < levels; i++) {
            bids.push({
                price: currentPrice - (i + 1) * 0.01,
                volume: Math.floor(Math.random() * 10000) + 1000
            });
            asks.push({
                price: currentPrice + (i + 1) * 0.01,
                volume: Math.floor(Math.random() * 10000) + 1000
            });
        }

        return { bids, asks };
    },

    /**
     * Get heatmap color based on percent change
     * Uses gradient from red (losses) through neutral to green (gains)
     */
    getHeatmapColor(changePercent) {
        // Clamp to -5% to +5% range for color intensity
        const clampedChange = Math.max(-5, Math.min(5, changePercent));
        const intensity = Math.abs(clampedChange) / 5;

        if (clampedChange === 0) {
            return '#4B5563'; // Neutral gray
        } else if (clampedChange > 0) {
            // Green gradient based on intensity
            if (intensity < 0.2) return '#22c55e';
            if (intensity < 0.4) return '#16a34a';
            if (intensity < 0.6) return '#15803d';
            if (intensity < 0.8) return '#166534';
            return '#14532d';
        } else {
            // Red gradient based on intensity
            if (intensity < 0.2) return '#ef4444';
            if (intensity < 0.4) return '#dc2626';
            if (intensity < 0.6) return '#b91c1c';
            if (intensity < 0.8) return '#991b1b';
            return '#7f1d1d';
        }
    },

    /**
     * Squarified treemap layout algorithm
     * Divides the available area into rectangles proportional to values
     */
    squarify(items, x, y, width, height) {
        if (items.length === 0) return [];

        const totalValue = items.reduce((sum, item) => sum + item.value, 0);
        if (totalValue === 0) return [];

        const rects = [];
        let remaining = [...items];
        let currentX = x;
        let currentY = y;
        let currentWidth = width;
        let currentHeight = height;

        while (remaining.length > 0) {
            // Split direction based on aspect ratio
            const horizontal = currentWidth >= currentHeight;

            // Find optimal row
            let row = [remaining[0]];
            let rowValue = remaining[0].value;
            let bestRatio = Infinity;

            for (let i = 1; i < remaining.length; i++) {
                const testRow = [...row, remaining[i]];
                const testValue = rowValue + remaining[i].value;

                // Calculate aspect ratios for this row configuration
                const rowArea = (testValue / totalValue) * currentWidth * currentHeight;
                const rowDimension = horizontal
                    ? rowArea / currentHeight
                    : rowArea / currentWidth;

                let worstRatio = 0;
                testRow.forEach(item => {
                    const itemArea = (item.value / testValue) * rowArea;
                    const itemDim = horizontal
                        ? itemArea / rowDimension
                        : itemArea / rowDimension;
                    const otherDim = itemArea / itemDim;
                    const ratio = Math.max(itemDim / otherDim, otherDim / itemDim);
                    worstRatio = Math.max(worstRatio, ratio);
                });

                if (worstRatio < bestRatio) {
                    bestRatio = worstRatio;
                    row = testRow;
                    rowValue = testValue;
                } else {
                    break;
                }
            }

            // Layout the row
            const rowFraction = rowValue / totalValue;
            const rowSize = horizontal
                ? rowFraction * currentWidth
                : rowFraction * currentHeight;

            let offset = 0;
            row.forEach(item => {
                const itemFraction = item.value / rowValue;
                const itemSize = horizontal
                    ? itemFraction * currentHeight
                    : itemFraction * currentWidth;

                const rect = horizontal ? {
                    x: currentX,
                    y: currentY + offset,
                    width: rowSize,
                    height: itemSize,
                    ...item
                } : {
                    x: currentX + offset,
                    y: currentY,
                    width: itemSize,
                    height: rowSize,
                    ...item
                };

                rects.push(rect);
                offset += itemSize;
            });

            // Update remaining area
            if (horizontal) {
                currentX += rowSize;
                currentWidth -= rowSize;
            } else {
                currentY += rowSize;
                currentHeight -= rowSize;
            }

            // Remove processed items
            remaining = remaining.slice(row.length);
        }

        return rects;
    },

    /**
     * Draw treemap heatmap visualization
     * Each cell sized by market cap, colored by % change
     */
    treemapHeatmap(canvas, stocks, options = {}) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Set canvas size
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        if (stocks.length === 0) {
            ctx.fillStyle = '#4B5563';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No stock data available', width / 2, height / 2);
            return [];
        }


        // Prepare data with balanced sizing
        // Use a more even distribution with slight variation based on % change magnitude
        const items = stocks.map(stock => {
            // Base value is equal for all stocks
            const baseValue = 100;
            // Add slight variation based on absolute % change (0-20% bonus)
            const changeBonus = Math.min(Math.abs(stock.changePercent || 0) * 4, 20);

            return {
                symbol: stock.symbol,
                name: stock.name,
                price: stock.price || 0,
                change: stock.change || 0,
                changePercent: stock.changePercent || 0,
                volume: stock.volume || 0,
                value: baseValue + changeBonus
            };
        }).sort((a, b) => b.changePercent - a.changePercent); // Sort by performance


        // Calculate layout
        const padding = 2;
        const rects = this.squarify(items, padding, padding, width - padding * 2, height - padding * 2);

        // Draw cells
        rects.forEach(rect => {
            const color = this.getHeatmapColor(rect.changePercent);

            // Fill
            ctx.fillStyle = color;
            ctx.fillRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);

            // Border
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);

            // Text (only if cell is big enough)
            if (rect.width > 45 && rect.height > 28) {
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const centerX = rect.x + rect.width / 2;
                const centerY = rect.y + rect.height / 2;

                // Symbol
                ctx.font = 'bold 11px Inter';
                ctx.fillText(rect.symbol, centerX, centerY - 7);

                // Change percent
                ctx.font = '9px JetBrains Mono';
                const changeText = (rect.changePercent >= 0 ? '+' : '') + rect.changePercent.toFixed(2) + '%';
                ctx.fillText(changeText, centerX, centerY + 8);
            } else if (rect.width > 25 && rect.height > 18) {
                // Just symbol for smaller cells
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(rect.symbol, rect.x + rect.width / 2, rect.y + rect.height / 2);
            }
        });

        // Store rects for hover/click detection
        canvas._treemapRects = rects;
        return rects;
    },

    /**
     * Find rect at position for hover/click handling
     */
    findRectAtPosition(canvas, x, y) {
        if (!canvas._treemapRects) return null;

        return canvas._treemapRects.find(rect =>
            x >= rect.x && x <= rect.x + rect.width &&
            y >= rect.y && y <= rect.y + rect.height
        );
    }
};

// For module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Charts;
}
