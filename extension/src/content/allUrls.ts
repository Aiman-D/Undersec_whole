/**
 * UnderSec - All URLs Content Script
 * Minimal tracking injected on all URLs
 * Only handles intervention display, actual domain tracking is in background
 */

import { setupInterventionListener, ensureInterventionStyles } from './base';

console.log('[UnderSec] All URLs script loaded');

// Inject styles and set up intervention listener
ensureInterventionStyles();
setupInterventionListener();

// ============================================================================
// BEHAVIORAL TRACKING (Anti-Gravity)
// ============================================================================

/**
 * Capture paste events broadly to detect potential data movement
 */
document.addEventListener('paste', (e) => {
  // We only send the event type and URL; we NEVER read the clipboard content
  chrome.runtime.sendMessage({
    type: 'RISK_EVENT',
    event: {
      type: 'PUBLIC_AI_PASTE', // Broadly category as AI paste for risk assessment if on AI domain
      ts: Math.floor(Date.now() / 1000),
      url: window.location.href
    }
  }).catch(() => { });
}, { capture: true });

/**
 * Capture form submissions broadly to detect potential uploads/data transfers
 */
// ============================================================================
// GLOBAL UPLOAD DETECTION (User-requested "Anywhere" monitoring)
// ============================================================================

function handleGlobalFileUpload(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target && target.type === 'file' && target.files && target.files.length > 0) {
    console.log('[UnderSec] Global file upload detected');
    chrome.runtime.sendMessage({
      type: 'RISK_EVENT',
      event: {
        type: 'PERSONAL_CLOUD_UPLOAD_ATTEMPT', // Counting as upload attempt
        ts: Math.floor(Date.now() / 1000),
        url: window.location.href
      }
    }).catch(() => { });
  }
}

// Watch for direct input changes
document.addEventListener('change', handleGlobalFileUpload, { capture: true });

// Watch for dynamic file inputs being added
const uploadObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLInputElement && node.type === 'file') {
        node.addEventListener('change', handleGlobalFileUpload);
      }
      if (node instanceof Element) {
        const fileInputs = node.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          input.addEventListener('change', handleGlobalFileUpload);
        });
      }
    }
  }
});

uploadObserver.observe(document.body, { childList: true, subtree: true });

// Capture form submissions
document.addEventListener('submit', (e) => {
  chrome.runtime.sendMessage({
    type: 'RISK_EVENT',
    event: {
      type: 'PERSONAL_CLOUD_UPLOAD_ATTEMPT', // Fallback for submit-based uploads
      ts: Math.floor(Date.now() / 1000),
      url: window.location.href
    }
  }).catch(() => { });
}, { capture: true });

// Listen for intervention events
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_INTERVENTION') {
    const { action, score, reasons } = message;

    // Dispatch event for the Dashboard Web App to consume
    window.dispatchEvent(new CustomEvent('TrustUpdate', {
      detail: { score, action, reasons }
    }));

    if (action === 'warn') {
      showWarningBanner(score, reasons);
    } else if (action === 'ack_required') {
      showAcknowledgmentModal(score, reasons);
    } else if (action === 'block') {
      showBlockOverlay(score, reasons);
    }
  }
});

/*
document.addEventListener('UnderSec-intervention', ((event: CustomEvent) => {
  // Legacy handler - keeping if needed for internal routing
}) as EventListener);
*/

function showWarningBanner(score: number, reasons: string[]): void {
  const existing = document.getElementById('UnderSec-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'UnderSec-banner';
  banner.className = 'UnderSec-banner';
  banner.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong style="font-size: 16px;">⚠️ Risk Alert (Score: ${Math.round(score * 100)}%)</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
          ${reasons.slice(0, 2).join(' • ')}
        </p>
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="UnderSec-btn UnderSec-btn-secondary" id="UnderSec-change-label">
          Change Label
        </button>
        <button class="UnderSec-btn UnderSec-btn-primary" id="UnderSec-dismiss">
          Continue Anyway
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('UnderSec-dismiss')?.addEventListener('click', () => {
    banner.remove();
    chrome.runtime.sendMessage({ type: 'DISMISS_INTERVENTION' }).catch(() => { });
  });

  document.getElementById('UnderSec-change-label')?.addEventListener('click', () => {
    banner.remove();
    chrome.runtime.sendMessage({ type: 'DISMISS_INTERVENTION' }).catch(() => { });
  });

  setTimeout(() => {
    const el = document.getElementById('UnderSec-banner');
    if (el) el.remove();
  }, 10000);
}

function showAcknowledgmentModal(score: number, reasons: string[]): void {
  // Remove any existing modal first
  const existing = document.getElementById('UnderSec-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'UnderSec-modal-overlay';
  overlay.className = 'UnderSec-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'UnderSec-modal';

  // Create content
  modal.innerHTML = `
    <h2 style="margin: 0 0 16px 0; color: #dc3545; font-size: 20px;">
      🛡️ Risk Acknowledgment Required
    </h2>
    <p style="color: #666; margin-bottom: 16px;">
      Risk Score: <strong style="color: #dc3545;">${Math.round(score * 100)}%</strong>
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #333;">
      ${reasons.map((r: string) => `<li style="margin-bottom: 8px;">${r}</li>`).join('')}
    </ul>
  `;

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';

  // Create Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'UnderSec-btn UnderSec-btn-secondary';
  cancelBtn.textContent = 'Go Back';
  cancelBtn.style.cssText = 'pointer-events: auto; cursor: pointer;';
  cancelBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[UnderSec] Cancel clicked');
    overlay.remove();
    chrome.runtime.sendMessage({ type: 'DISMISS_INTERVENTION' }).catch(() => { });
  });

  // Create Acknowledge button
  const ackBtn = document.createElement('button');
  ackBtn.className = 'UnderSec-btn UnderSec-btn-primary';
  ackBtn.textContent = 'I Understand the Risk';
  ackBtn.style.cssText = 'pointer-events: auto; cursor: pointer; background: #dc3545;';
  ackBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[UnderSec] Acknowledge clicked');
    overlay.remove();
    chrome.runtime.sendMessage({ type: 'ACK_INTERVENTION' }).catch(() => { });
  });

  // Assemble
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(ackBtn);
  modal.appendChild(buttonContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  console.log('[UnderSec] Modal displayed with buttons');
}

function showBlockOverlay(score: number, reasons: string[]): void {
  // Remove any existing overlay first
  const existing = document.getElementById('UnderSec-block-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'UnderSec-block-overlay';
  overlay.className = 'UnderSec-block-overlay';
  overlay.innerHTML = `
    <div style="text-align: center; max-width: 500px;">
      <div style="font-size: 64px; margin-bottom: 24px;">🚫</div>
      <h1 style="margin: 0 0 16px 0; font-size: 28px;">Action Blocked</h1>
      <p style="font-size: 18px; opacity: 0.9; margin-bottom: 24px;">
        Risk Score: ${Math.round(score * 100)}%
      </p>
      <ul style="text-align: left; margin: 0 0 32px 0; padding-left: 24px;">
        ${reasons.map((r: string) => `<li style="margin-bottom: 8px;">${r}</li>`).join('')}
      </ul>
      <button class="UnderSec-btn" id="UnderSec-close-tab" 
        style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); pointer-events: auto; cursor: pointer;">
        Close This Tab
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Use setTimeout to ensure DOM is fully rendered before binding events
  setTimeout(() => {
    const closeBtn = document.getElementById('UnderSec-close-tab');
    if (closeBtn) {
      closeBtn.onclick = () => {
        console.log('[UnderSec] Close tab clicked');
        chrome.runtime.sendMessage({ type: 'DISMISS_INTERVENTION' }).catch(() => { });
        overlay.innerHTML = '<div style="font-size: 24px; color: white;">Please close this tab to continue safely.</div>';
      };
    }
  }, 50);

  setTimeout(() => {
    const el = document.getElementById('UnderSec-block-overlay');
    if (el) el.remove();
  }, 30000);
}

console.log('[UnderSec] All URLs script ready');
