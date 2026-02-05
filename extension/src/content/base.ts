/**
 * UnderSec - Content Script Base
 * Shared utilities for all content scripts
 */

import { RiskEvent, EventType, DomainCategory, ShowInterventionMessage } from '../shared/types';
import { nowUnix } from '../shared/utils';

/**
 * Sends an event to the background service worker
 */
export function sendEvent(type: EventType, domain_category: DomainCategory): void {
  const event: RiskEvent = {
    type,
    ts: nowUnix(),
    domain_category,
    url: window.location.href,
  };

  chrome.runtime.sendMessage({ type: 'RISK_EVENT', event }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[UnderSec] Send error:', chrome.runtime.lastError.message);
    } else {
      console.log('[UnderSec] Event sent:', type);
    }
  });
}

/**
 * Checks if an element is a valid text input target
 */
export function isTextInputTarget(element: Element | null): boolean {
  if (!element) return false;

  // Check for textarea
  if (element.tagName === 'TEXTAREA') {
    return true;
  }

  // Check for contenteditable
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check for role="textbox"
  if (element.getAttribute('role') === 'textbox') {
    return true;
  }

  // Check for input[type="text"]
  if (element.tagName === 'INPUT') {
    const inputType = (element as HTMLInputElement).type?.toLowerCase();
    return inputType === 'text' || inputType === 'search' || !inputType;
  }

  return false;
}

/**
 * Checks if an element is a file upload input
 */
export function isFileInput(element: Element | null): boolean {
  if (!element) return false;

  if (element.tagName === 'INPUT') {
    return (element as HTMLInputElement).type?.toLowerCase() === 'file';
  }

  return false;
}

/**
 * Checks if an element is a drop zone for files
 */
export function isDropZone(element: Element | null): boolean {
  if (!element) return false;

  // Check for common drop zone patterns
  const classNames = element.className?.toLowerCase() || '';
  const id = element.id?.toLowerCase() || '';

  const dropZonePatterns = [
    'drop',
    'upload',
    'dropzone',
    'drag',
    'file-area',
    'drop-area',
  ];

  return dropZonePatterns.some(
    (pattern) => classNames.includes(pattern) || id.includes(pattern)
  );
}

/**
 * Sets up intervention listener for the content script
 */
export function setupInterventionListener(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_INTERVENTION') {
      const interventionMsg = message as ShowInterventionMessage;
      showIntervention(
        interventionMsg.action,
        interventionMsg.score,
        interventionMsg.reasons
      );
      sendResponse({ success: true });
    }
    return true;
  });
}

/**
 * Shows intervention UI based on action type
 */
function showIntervention(
  action: string,
  score: number,
  reasons: string[]
): void {
  // Import and call the appropriate intervention UI
  // This will be handled by the intervention module
  const event = new CustomEvent('UnderSec-intervention', {
    detail: { action, score, reasons },
  });
  document.dispatchEvent(event);
}

/**
 * Injects intervention styles if not already present
 */
export function ensureInterventionStyles(): void {
  if (document.getElementById('UnderSec-styles')) {
    return;
  }

  const styles = document.createElement('style');
  styles.id = 'UnderSec-styles';
  styles.textContent = `
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
  document.head.appendChild(styles);
}
