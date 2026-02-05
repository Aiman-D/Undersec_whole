/**
 * UnderSec - Intervention UI Components
 * Injected into pages to show risk warnings and blocks
 */

import { RecommendedAction } from '../shared/types';
import { INTERVENTION_CONFIG } from '../shared/constants';

// ============================================================================
// STYLES
// ============================================================================

const INTERVENTION_STYLES = `
  .UnderSec-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    color: white;
    padding: 16px 24px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: UnderSec-slide-down 0.3s ease-out;
  }

  .UnderSec-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: UnderSec-fade-in 0.2s ease-out;
  }

  .UnderSec-modal {
    background: white;
    border-radius: 12px;
    padding: 32px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: UnderSec-scale-in 0.3s ease-out;
    pointer-events: auto;
  }

  .UnderSec-block-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(220, 53, 69, 0.95);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    animation: UnderSec-fade-in 0.3s ease-out;
  }

  .UnderSec-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    pointer-events: auto;
  }

  .UnderSec-btn-primary {
    background: #4CAF50;
    color: white;
  }

  .UnderSec-btn-secondary {
    background: #f0f0f0;
    color: #333;
  }

  .UnderSec-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  @keyframes UnderSec-slide-down {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }

  @keyframes UnderSec-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes UnderSec-scale-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

// ============================================================================
// STYLE INJECTION
// ============================================================================

export function injectStyles(): void {
  if (document.getElementById('UnderSec-intervention-styles')) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'UnderSec-intervention-styles';
  styleElement.textContent = INTERVENTION_STYLES;
  document.head.appendChild(styleElement);
}

// ============================================================================
// BANNER (warn)
// ============================================================================

export function showBanner(score: number, reasons: string[]): void {
  injectStyles();
  removeBanner();

  const banner = document.createElement('div');
  banner.id = 'UnderSec-banner';
  banner.className = 'UnderSec-banner';

  banner.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="font-size: 24px;">⚠️</span>
          <strong style="font-size: 18px;">Risk Alert</strong>
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 14px;">
            Score: ${Math.round(score * 100)}%
          </span>
        </div>
        <p style="margin: 0; font-size: 14px; opacity: 0.95; max-width: 600px;">
          ${reasons.slice(0, 2).map(r => escapeHtml(r)).join(' • ')}
        </p>
      </div>
      <div style="display: flex; gap: 12px; margin-left: 24px;">
        <button class="UnderSec-btn UnderSec-btn-secondary" id="UnderSec-banner-label">
          Change Label
        </button>
        <button class="UnderSec-btn UnderSec-btn-primary" id="UnderSec-banner-dismiss">
          Continue Anyway
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Event handlers
  document.getElementById('UnderSec-banner-dismiss')?.addEventListener('click', () => {
    removeBanner();
    notifyBackground('DISMISS_INTERVENTION');
  });

  document.getElementById('UnderSec-banner-label')?.addEventListener('click', () => {
    removeBanner();
    notifyBackground('DISMISS_INTERVENTION');
  });

  // Auto-dismiss
  setTimeout(() => {
    removeBanner();
  }, INTERVENTION_CONFIG.BANNER_TIMEOUT_MS);
}

export function removeBanner(): void {
  const banner = document.getElementById('UnderSec-banner');
  if (banner) {
    banner.remove();
  }
}

// ============================================================================
// MODAL (ack_required)
// ============================================================================

export function showModal(score: number, reasons: string[]): void {
  injectStyles();
  removeModal();

  const overlay = document.createElement('div');
  overlay.id = 'UnderSec-modal-overlay';
  overlay.className = 'UnderSec-modal-overlay';

  overlay.innerHTML = `
    <div class="UnderSec-modal">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🛡️</span>
      </div>
      <h2 style="margin: 0 0 16px 0; color: #dc3545; font-size: 22px; text-align: center;">
        Risk Acknowledgment Required
      </h2>
      <div style="background: #fff5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; color: #dc3545;">
          ${Math.round(score * 100)}%
        </span>
        <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Risk Score</p>
      </div>
      <div style="margin-bottom: 24px;">
        <p style="color: #666; font-size: 14px; margin-bottom: 12px;">
          The following concerns were identified:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #333;">
          ${reasons.map(r => `<li style="margin-bottom: 8px; line-height: 1.4;">${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
      <p style="color: #666; font-size: 13px; margin-bottom: 24px; text-align: center;">
        Please acknowledge that you understand the potential risks before continuing.
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="UnderSec-btn UnderSec-btn-secondary" id="UnderSec-modal-cancel" style="min-width: 120px;">
          Go Back
        </button>
        <button class="UnderSec-btn UnderSec-btn-primary" id="UnderSec-modal-ack" style="min-width: 180px; background: #dc3545;">
          I Understand the Risk
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event handlers - use direct onclick for reliability
  const cancelBtn = document.getElementById('UnderSec-modal-cancel');
  const ackBtn = document.getElementById('UnderSec-modal-ack');

  if (cancelBtn) {
    cancelBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[UnderSec] Cancel button clicked, score:', score);

      // If risk is High (>= 70%), close the tab
      if (score >= 0.7) {
        console.log('[UnderSec] High Risk (>=70%), closing tab');
        removeModal();
        notifyBackground('DISMISS_INTERVENTION');

        // Request background to close tab
        chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }).catch(() => {
          // Fallback 1: Script close
          try { window.close(); } catch (e) { }
          // Fallback 2: Navigate away
          window.location.href = 'about:blank';
        });
      } else {
        // Just go back in history
        removeModal();
        notifyBackground('DISMISS_INTERVENTION');
        if (window.history.length > 1) {
          window.history.back();
        }
      }
    };
  }

  if (ackBtn) {
    ackBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[UnderSec] Acknowledge button clicked');
      removeModal();
      notifyBackground('ACK_INTERVENTION');
    };
  }
}

export function removeModal(): void {
  const modal = document.getElementById('UnderSec-modal-overlay');
  if (modal) {
    console.log('[UnderSec] Removing modal');
    modal.remove();
  }
}

// ============================================================================
// BLOCK OVERLAY (block)
// ============================================================================

export function showBlockOverlay(score: number, reasons: string[]): void {
  injectStyles();
  removeBlockOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'UnderSec-block-overlay';
  overlay.className = 'UnderSec-block-overlay';

  overlay.innerHTML = `
    <div style="text-align: center; max-width: 500px; padding: 40px;">
      <div style="font-size: 80px; margin-bottom: 24px;">🚫</div>
      <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 600;">
        Action Blocked
      </h1>
      <div style="background: rgba(255,255,255,0.15); padding: 16px 32px; border-radius: 12px; margin-bottom: 24px; display: inline-block;">
        <span style="font-size: 42px; font-weight: bold;">${Math.round(score * 100)}%</span>
        <p style="margin: 4px 0 0 0; opacity: 0.8;">Risk Score</p>
      </div>
      <p style="font-size: 18px; opacity: 0.9; margin-bottom: 24px;">
        This action exceeds your organization's risk policy threshold.
      </p>
      <ul style="text-align: left; margin: 0 auto 32px auto; padding-left: 24px; max-width: 400px; font-size: 15px; line-height: 1.6;">
        ${reasons.map(r => `<li style="margin-bottom: 8px;">${escapeHtml(r)}</li>`).join('')}
      </ul>
      <div style="display: flex; gap: 16px; justify-content: center;">
        <button class="UnderSec-btn" id="UnderSec-block-close" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); min-width: 150px;">
          Close This Tab
        </button>
      </div>
      <p id="UnderSec-countdown" style="margin-top: 24px; font-size: 14px; opacity: 0.6;">
        Auto-closing in <span id="UnderSec-seconds">30</span> seconds...
      </p>
    </div>
  `;

  document.body.appendChild(overlay);

  // Countdown
  let seconds = 30;
  const countdownEl = document.getElementById('UnderSec-seconds');
  const interval = setInterval(() => {
    seconds--;
    if (countdownEl) {
      countdownEl.textContent = String(seconds);
    }
    if (seconds <= 0) {
      clearInterval(interval);
      removeBlockOverlay();
    }
  }, 1000);

  // Close tab button
  document.getElementById('UnderSec-block-close')?.addEventListener('click', () => {
    clearInterval(interval);
    notifyBackground('DISMISS_INTERVENTION');
    overlay.innerHTML = '<div style="font-size: 24px; color: white;">Please close this tab to continue safely.</div>';
  });
}

export function removeBlockOverlay(): void {
  const overlay = document.getElementById('UnderSec-block-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ============================================================================
// MAIN DISPATCHER
// ============================================================================

export function showIntervention(action: RecommendedAction, score: number, reasons: string[]): void {
  switch (action) {
    case 'warn':
      showBanner(score, reasons);
      break;
    case 'ack_required':
      showModal(score, reasons);
      break;
    case 'block':
      showBlockOverlay(score, reasons);
      break;
    case 'none':
    default:
      // No intervention needed
      break;
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

function notifyBackground(type: string): void {
  chrome.runtime.sendMessage({ type }).catch(() => {
    // Ignore errors if background is not ready
  });
}
