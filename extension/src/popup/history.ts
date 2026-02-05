/**
 * UnderSec - Activity Monitor
 * Modern card-based activity dashboard
 */

import { ExtensionState, StateResponse, AggregationWindow } from '../shared/types';
import { sanitizeHtml } from '../shared/security';

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  activityFeed: document.getElementById('activity-feed') as HTMLElement,
  avgRiskValue: document.querySelector('#avg-risk-card .stat-value') as HTMLElement,
  totalWindowsValue: document.querySelector('#total-windows-card .stat-value') as HTMLElement,
  totalEventsValue: document.querySelector('#total-events-card .stat-value') as HTMLElement,
  totalTimeValue: document.querySelector('#total-time-card .stat-value') as HTMLElement,
  lastUpdated: document.getElementById('last-updated') as HTMLElement,
  refreshBtn: document.getElementById('refresh-btn') as HTMLElement,
  exportBtn: document.getElementById('export-btn') as HTMLElement,
  exportCsvBtn: document.getElementById('export-csv-btn') as HTMLElement,
};

// ============================================================================
// STATE
// ============================================================================

let currentFilter = 'all';
let allWindows: AggregationWindow[] = [];

// ============================================================================
// UTILITIES
// ============================================================================

function formatTime(ts: number): string {
  if (!ts || ts <= 0) return '--:--';
  const date = new Date(ts * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDuration(startTs: number, endTs: number): string {
  const duration = endTs - startTs;
  if (duration < 60) return `${duration}s`;
  if (duration < 3600) return `${Math.round(duration / 60)}m`;
  return `${Math.floor(duration / 3600)}h ${Math.round((duration % 3600) / 60)}m`;
}

function formatRelativeTime(ts: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTotalTime(windows: AggregationWindow[]): string {
  if (windows.length === 0) return '--';
  const totalSeconds = windows.reduce((acc, win) => acc + (win.window_end_ts - win.window_start_ts), 0);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.round(totalSeconds / 60)}m`;
  return `${Math.floor(totalSeconds / 3600)}h ${Math.round((totalSeconds % 3600) / 60)}m`;
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadHistory(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' }) as StateResponse;
    if (response.success && response.state) {
      allWindows = response.state.recent_windows || [];

      // Merge current active window at the top for LIVE VIEW
      if (response.state.current_window && response.state.current_window.window_start_ts > 0) {
        const liveWin = response.state.current_window;
        // Ensure it has the latest score if available
        if (response.state.last_score) {
          liveWin.risk_score = response.state.last_score.risk_score;
          liveWin.recommended_action = response.state.last_score.recommended_action;
          liveWin.reasons = response.state.last_score.reasons;
        }
        // Mark as live for rendering
        (liveWin as any).is_live = true;
        allWindows = [liveWin, ...allWindows];
      }

      console.log('[UnderSec] History loaded:', allWindows.length, 'records');
      renderHistory(allWindows);
      updateSummary(allWindows);
      elements.lastUpdated.textContent = `Updated ${formatRelativeTime(Math.floor(Date.now() / 1000))}`;
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

// ============================================================================
// RENDERING
// ============================================================================

function renderHistory(windows: AggregationWindow[]): void {
  if (!windows || windows.length === 0) {
    elements.activityFeed.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No Activity Yet</h3>
        <p>Events will appear here as they occur</p>
      </div>
    `;
    return;
  }

  // Filter windows based on current filter
  let filteredWindows = windows;
  if (currentFilter !== 'all') {
    filteredWindows = windows.filter(win => {
      const score = win.risk_score ?? 0;
      switch (currentFilter) {
        case 'high':
          return score >= 0.7;
        case 'upload':
          return win.features.personal_cloud_upload_attempt_count > 0 || win.features.risky_share_upload_attempt_count > 0;
        case 'paste':
          return win.features.public_ai_paste_count > 0;
        default:
          return true;
      }
    });
  }

  if (filteredWindows.length === 0) {
    elements.activityFeed.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No Matching Events</h3>
        <p>Try changing the filter</p>
      </div>
    `;
    return;
  }

  elements.activityFeed.innerHTML = filteredWindows.map(win => {
    const score = win.risk_score ?? 0;
    const now = Math.floor(Date.now() / 1000);
    const isNew = (now - win.window_end_ts) < 60;
    const isHighRisk = score >= 0.7;

    // Determine event type and icon
    let eventIcon = '🌐';
    let eventTitle = 'Site Visit';
    let badgeClass = 'badge-visit';
    let badgeText = 'VISIT';

    if (win.features.public_ai_paste_count > 0) {
      eventIcon = '🤖';
      eventTitle = 'AI Tool Activity';
      badgeClass = 'badge-paste';
      badgeText = `${win.features.public_ai_paste_count} PASTE${win.features.public_ai_paste_count > 1 ? 'S' : ''}`;
    }

    if (win.features.personal_cloud_upload_attempt_count > 0) {
      eventIcon = '☁️';
      eventTitle = 'Cloud Upload';
      badgeClass = 'badge-upload';
      badgeText = 'UPLOAD';
    }

    if (win.features.risky_share_upload_attempt_count > 0) {
      eventIcon = '⚠️';
      eventTitle = 'Risky Transfer';
      badgeClass = 'badge-upload';
      badgeText = 'CRITICAL';
    }

    // Use domain or URL as title
    if (win.domain) {
      eventTitle = sanitizeHtml(win.domain);
    } else if (win.url) {
      try {
        eventTitle = new URL(win.url).hostname;
      } catch (e) {
        eventTitle = sanitizeHtml(win.url);
      }
    }

    // Risk level class
    let riskClass = 'low';
    if (score >= 0.7) riskClass = 'high';
    else if (score >= 0.4) riskClass = 'medium';

    // Action class
    const action = win.recommended_action || 'none';

    // Card classes
    const cardClasses = ['activity-card'];
    if (isNew) cardClasses.push('new');
    if (isHighRisk) cardClasses.push('high-risk');

    return `
      <div class="${cardClasses.join(' ')}">
        <div class="card-header">
          <div class="card-title">
            <span class="event-icon">${eventIcon}</span>
            <h3>${eventTitle}</h3>
            ${(win as any).is_live ? '<span class="badge badge-upload" style="background:#dc3545;animation:pulse 2s infinite;">LIVE</span>' : (isNew ? '<span class="badge badge-new">NEW</span>' : '')}
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="risk-score">
            <span class="risk-value ${riskClass}">${Math.round(score * 100)}%</span>
            <span class="risk-label">Risk</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-details">
            <div class="detail-item">
              <span class="detail-label">Session</span>
              <span class="detail-value">${formatTime(win.window_start_ts)} → ${formatTime(win.window_end_ts)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${formatDuration(win.window_start_ts, win.window_end_ts)}</span>
            </div>
            ${win.url ? `
            <div class="detail-item" style="flex-grow:1;min-width:0;max-width:250px;">
              <span class="detail-label">URL</span>
              <a href="${sanitizeHtml(win.url)}" target="_blank" class="detail-value" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--accent-blue);text-decoration:none;">
                ${sanitizeHtml(win.url)}
              </a>
            </div>
            ` : ''}
            <div class="detail-item">
              <span class="detail-label">Label</span>
              <span class="label-pill label-${sanitizeHtml(win.label)}">${sanitizeHtml(win.label)}</span>
            </div>
          </div>
          <span class="action-taken action-${action}">${action === 'none' ? '—' : action.replace('_', ' ')}</span>
        </div>
        ${win.reasons && win.reasons.length > 0 ? `
          <div class="card-reasons" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
            <span style="font-size: 12px; color: var(--accent-red);">⚠️ ${sanitizeHtml(typeof win.reasons[0] === 'string' ? win.reasons[0] : (win.reasons[0].message || JSON.stringify(win.reasons[0])))}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function updateSummary(windows: AggregationWindow[]): void {
  elements.totalWindowsValue.textContent = String(windows.length);
  elements.totalTimeValue.textContent = formatTotalTime(windows);

  // Calculate average risk
  if (windows.length > 0) {
    const sum = windows.reduce((acc, win) => acc + (win.risk_score || 0), 0);
    const avg = Math.round((sum / windows.length) * 100);
    elements.avgRiskValue.textContent = `${avg}%`;
  } else {
    elements.avgRiskValue.textContent = '0%';
  }

  // Count critical events
  const criticalEvents = windows.reduce((acc, win) => {
    return acc +
      win.features.public_ai_paste_count +
      win.features.personal_cloud_upload_attempt_count +
      win.features.risky_share_upload_attempt_count;
  }, 0);
  elements.totalEventsValue.textContent = String(criticalEvents);
}

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

function exportToCSV(): void {
  if (allWindows.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = ['Start Time', 'End Time', 'Duration', 'Label', 'Risk Score', 'AI Pastes', 'Cloud Uploads', 'Risky Shares', 'Action', 'Reasons'];
  const rows = allWindows.map(win => {
    let displayScore = win.risk_score || 0;
    if (displayScore > 1) displayScore = displayScore / 100;

    return [
      formatTime(win.window_start_ts),
      formatTime(win.window_end_ts),
      formatDuration(win.window_start_ts, win.window_end_ts),
      sanitizeHtml(win.label),
      Math.round(displayScore * 100) + '%',
      win.features.public_ai_paste_count,
      win.features.personal_cloud_upload_attempt_count,
      win.features.risky_share_upload_attempt_count,
      sanitizeHtml(win.recommended_action || 'none'),
      win.reasons ? win.reasons.map((r: any) => sanitizeHtml(typeof r === 'string' ? r : (r.message || ''))).join('; ') : ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `undersec_activity_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function setupEventListeners(): void {
  elements.refreshBtn?.addEventListener('click', loadHistory);
  elements.exportBtn?.addEventListener('click', exportToCSV);
  elements.exportCsvBtn?.addEventListener('click', exportToCSV);

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const filter = target.dataset.filter || 'all';

      // Update active state
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      target.classList.add('active');

      // Update filter and re-render
      currentFilter = filter;
      renderHistory(allWindows);
    });
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadHistory();

  // Auto-refresh every 5 seconds
  setInterval(loadHistory, 5000);
});
