/**
 * Fluid Finance - Utility Functions
 */

// ===== Currency Formatting =====
function formatCurrency(amount, showSign = false) {
  const formatted = Math.abs(amount).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (showSign && amount !== 0) {
    return amount > 0 ? `+GHS ${formatted}` : `-GHS ${formatted}`;
  }

  return `GHS ${formatted}`;
}

// ===== Percentage Formatting =====
function formatPercent(value, showSign = true) {
  const formatted = Math.abs(value).toFixed(2);

  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}%` : `-${formatted}%`;
  }

  return `${formatted}%`;
}

// ===== Number Abbreviation =====
function abbreviateNumber(num) {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

// ===== Calculate Change Percentage =====
function calculateChangePercent(price, change) {
  const previousPrice = price - change;
  if (previousPrice === 0) return 0;
  return (change / previousPrice) * 100;
}

// ===== Get Change Type =====
function getChangeType(change) {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

// ===== Date/Time Formatting =====
function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-GH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(date = new Date()) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

// ===== Stock Symbol Helpers =====
function getStockInitials(name) {
  return name.substring(0, 2).toUpperCase();
}

function getStockColor(name) {
  return 'var(--bg-tertiary)';
}

// ===== DOM Helpers =====
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function createElement(tag, className, innerHTML) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

// ===== Local Storage Helpers =====
function getFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ===== Debounce =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== Throttle =====
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ===== Random Helpers =====
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ===== Array Helpers =====
function sortByKey(array, key, ascending = true) {
  return [...array].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    return ascending ? valA - valB : valB - valA;
  });
}

function groupByKey(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key] || 'Other';
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

// ===== Validation =====
function isValidNumber(value) {
  return !isNaN(value) && isFinite(value) && value >= 0;
}

function isValidQuantity(value) {
  return Number.isInteger(value) && value > 0;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatCurrency,
    formatPercent,
    abbreviateNumber,
    calculateChangePercent,
    getChangeType,
    formatTime,
    formatDate,
    formatDateTime,
    getRelativeTime,
    getStockInitials,
    getStockColor,
    $,
    $$,
    createElement,
    getFromStorage,
    saveToStorage,
    removeFromStorage,
    debounce,
    throttle
  };
}
