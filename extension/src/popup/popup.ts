/**
 * UnderSec - Popup Script
 * Handles popup UI interactions and state display
 */

import { ExtensionState, StateResponse } from '../shared/types';
import { VERSION } from '../shared/constants';
import { sanitizeHtml } from '../shared/security';

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  version: document.getElementById('version') as HTMLElement,
  statusIndicator: document.getElementById('status-indicator') as HTMLElement,
  statusText: document.getElementById('status-text') as HTMLElement,
  activeLabelBadge: document.getElementById('active-label-badge') as HTMLElement,
  riskScore: document.getElementById('risk-score') as HTMLElement,
  riskLabel: document.getElementById('risk-label') as HTMLElement,
  riskReasons: document.getElementById('risk-reasons') as HTMLElement,
  riskCard: document.getElementById('risk-card') as HTMLElement,
  statVisits: document.getElementById('stat-visits') as HTMLElement,
  statPastes: document.getElementById('stat-pastes') as HTMLElement,
  statUploads: document.getElementById('stat-uploads') as HTMLElement,
  windowTimer: document.getElementById('window-timer') as HTMLElement,
  themeToggle: document.getElementById('theme-toggle') as HTMLElement,
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Fallback state in case of errors
const DEFAULT_STATE: ExtensionState = {
  current_label: 'unknown',
  pause_until_ts: null,
  current_window: null,
  recent_windows: [],
  session_stats: { visits: 0, pastes: 0, uploads: 0 },
  last_score: null,
  settings: {
    tenant_id: 'default',
    user_id: 'user',
    api_base_url: '',
    demo_mode: false,
    window_duration_seconds: 10
  }
};

async function loadState(): Promise<void> {
  let stateToUse = DEFAULT_STATE;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' }) as StateResponse;
    if (response && response.success && response.state) {
      stateToUse = response.state;
      // Double check session_stats existence
      if (!stateToUse.session_stats) {
        stateToUse.session_stats = { visits: 0, pastes: 0, uploads: 0 };
      }
    }
  } catch (error) {
    console.log('Failed to load state (using default):', error);
  }

  updateUI(stateToUse);
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateUI(state: ExtensionState): void {
  // Version
  elements.version.textContent = `v${VERSION}`;

  // Status
  updateStatusIndicator(state);

  // Current label
  updateLabelBadge(state);

  // Risk score
  updateRiskDisplay(state);

  // Live stats
  updateLiveStats(state);
}

function updateLiveStats(state: ExtensionState): void {
  const stats = state.session_stats || { visits: 0, pastes: 0, uploads: 0 };

  // Initializing text only if no window
  if (!state.current_window) {
    elements.windowTimer.textContent = 'Ready';
  }

  // Update counts from session stats
  elements.statVisits.textContent = String(stats.visits || 0);
  elements.statPastes.textContent = String(stats.pastes || 0);
  elements.statUploads.textContent = String(stats.uploads || 0);

  // Update cooldown timer
  const now = Math.floor(Date.now() / 1000);
  const remaining = state.current_window ? Math.max(0, state.current_window.window_end_ts - now) : 0;
  elements.windowTimer.textContent = `Refreshes in ${remaining}s`;

  if (remaining <= 5) {
    elements.windowTimer.style.color = 'var(--color-confidential)';
    elements.windowTimer.style.fontWeight = 'bold';
  } else {
    elements.windowTimer.style.color = 'var(--text-tertiary)';
    elements.windowTimer.style.fontWeight = 'normal';
  }
}

function updateStatusIndicator(state: ExtensionState): void {
  const statusDot = elements.statusIndicator.querySelector('.status-dot') as HTMLElement;

  elements.statusIndicator.classList.remove('paused');
  statusDot.classList.remove('paused');
  elements.statusText.textContent = 'Monitoring Active';
}

function updateLabelBadge(state: ExtensionState): void {
  const label = state.current_label || 'unknown';
  const badge = elements.activeLabelBadge;
  const icon = badge.querySelector('.label-icon') as HTMLElement;
  const text = badge.querySelector('.label-text') as HTMLElement;

  // Reset classes
  badge.className = 'label-badge ' + label;

  // Update content based on label
  switch (label) {
    case 'confidential':
      icon.textContent = '🔒';
      text.textContent = 'Confidential';
      break;
    case 'internal':
      icon.textContent = '🏢';
      text.textContent = 'Internal';
      break;
    case 'public':
      icon.textContent = '🌐';
      text.textContent = 'Public';
      break;
    default:
      icon.textContent = '❓';
      text.textContent = 'Unknown';
  }
}

function updateRiskDisplay(state: ExtensionState): void {
  const lastScore = state.last_score;

  if (!lastScore) {
    // If no historic score but we have live activity, show a PREVIEW
    const currentStats = state.session_stats;
    if (currentStats && (currentStats.pastes > 0 || currentStats.uploads > 0)) {
      elements.riskScore.textContent = "~";
      elements.riskScore.className = 'risk-score high'; // Assume high risk for active pasting
      elements.riskLabel.textContent = 'Live Activity Detected';
      elements.riskReasons.innerHTML = `
         <ul class="live-preview">
           <li>⚠️ Live analysis in progress...</li>
           <li>${currentStats.pastes} paste events detected</li>
         </ul>
       `;
      return;
    }

    elements.riskScore.textContent = '--';
    elements.riskScore.className = 'risk-score';
    elements.riskLabel.textContent = 'No data yet';
    elements.riskReasons.innerHTML = '<p class="no-reasons">No recent activity detected</p>';
    return;
  }

  // Score display - robust handling for both 0-1 and 0-100 ranges
  let scoreVal = lastScore.risk_score;
  if (scoreVal > 1) scoreVal = scoreVal / 100;
  const scorePercent = Math.round(scoreVal * 100);
  elements.riskScore.textContent = `${scorePercent}%`;

  // Score color
  elements.riskScore.className = 'risk-score';
  if (scoreVal >= 0.7) {
    elements.riskScore.classList.add('high');
    elements.riskLabel.textContent = 'High Risk';
  } else if (scoreVal >= 0.4) {
    elements.riskScore.classList.add('medium');
    elements.riskLabel.textContent = 'Medium Risk';
  } else {
    elements.riskLabel.textContent = 'Low Risk';
  }

  // Reasons
  if (lastScore.reasons.length > 0) {
    elements.riskReasons.innerHTML = `
      <ul>
        ${lastScore.reasons.map((r: any) => `<li>${escapeHtml(typeof r === 'string' ? r : (r.message || JSON.stringify(r)))}</li>`).join('')}
      </ul>
    `;
  } else {
    elements.riskReasons.innerHTML = '<p class="no-reasons">No specific concerns</p>';
  }
}

// ============================================================================
// NAVIGATION
// ============================================================================

const settingsBtn = document.getElementById('settings-btn');
const adminBtn = document.getElementById('admin-btn');

if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/settings.html') });
  });
}

if (adminBtn) {
  adminBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/history.html') });
  });
}

// Secret admin access: Ctrl+Shift combination
// Just hold both keys - easier than Ctrl+Shift+9
document.addEventListener('keydown', (e) => {
  // Hold Ctrl+Shift together (no number needed!)
  if (e.ctrlKey && e.shiftKey && !e.key.match(/^[0-9]$/) && adminBtn) {
    adminBtn.style.display = 'block';
    // Auto-hide after 10 seconds if not clicked
    setTimeout(() => {
      if (adminBtn) adminBtn.style.display = 'none';
    }, 10000);
  }

  // Press Escape to hide admin button
  if (e.key === 'Escape' && adminBtn) {
    adminBtn.style.display = 'none';
  }
});

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function setupEventListeners(): void {
  // Settings link
  document.getElementById('settings')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'popup/settings.html' });
  });

  // Theme toggle
  elements.themeToggle?.addEventListener('click', toggleTheme);
}

function toggleTheme(): void {
  const isDark = document.body.classList.contains('dark-theme');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  chrome.storage.local.set({ theme_override: newTheme });
}

function applyTheme(theme: 'light' | 'dark' | 'auto'): void {
  document.body.classList.remove('light-theme', 'dark-theme');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

async function loadTheme(): Promise<void> {
  const data = await chrome.storage.local.get(['theme_override']);
  if (data.theme_override) {
    applyTheme(data.theme_override);
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  setupEventListeners();

  // Proactively refresh label for current tab when popup opens
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && tab.url.startsWith('http')) {
      await chrome.runtime.sendMessage({
        type: 'SET_LABEL_FROM_URL',
        url: tab.url
      });
    }
  } catch (e) {
    // Ignore
  }

  loadState();

  // Poll for state updates every second while popup is open
  setInterval(loadState, 1000);
});
