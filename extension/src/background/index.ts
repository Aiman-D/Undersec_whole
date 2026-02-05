/**
 * UnderSec - Background Service Worker
 * Main entry point for the extension's background process
 */

import {
  ExtensionMessage,
  RiskEventMessage,
  StateResponse,
  GenericResponse,
  RiskEvent,
} from '../shared/types';
import { WINDOW_ALARM_NAME, VERSION, DEFAULT_API_BASE_URL } from '../shared/constants';
import { nowUnix } from '../shared/utils';
import {
  getState,
  setState,
  setLabel,
  setPauseUntil,
  updateSettings,
  resetSessionStats,
} from './storage';
import {
  initializeWindowManager,
  processEvent,
  handleWindowAlarm,
  flushWindow,
} from './windowManager';
import { classifyDomain } from '../shared/domains';
import { DomainCategory } from '../shared/types';
import { updateLabelFromDomain } from './labelManager';

console.log(`[UnderSec Background] Starting v${VERSION}`);

// ============================================================================
// INITIALIZATION - Fix storage errors on first install
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[UnderSec] Extension installed/updated:', details.reason);

  // Initialize storage to prevent "undefined" errors
  const state = await getState();
  await setState(state); // This will create default state if missing

  // Migration: Ensure standard settings and local backend
  await updateSettings({ demo_mode: false, api_base_url: DEFAULT_API_BASE_URL });

  // Clear any existing alarms (legacy 10s timer)
  await chrome.alarms.clearAll();

  // Start window manager cycle
  await initializeWindowManager();

  if (details.reason === 'install') {
    console.log('[UnderSec] Fresh install - initializing defaults');
  } else if (details.reason === 'update') {
    console.log(`[UnderSec] Updated to version ${VERSION}`);
  }
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[UnderSec] Browser started');
  const { resetSessionStats } = await import('./storage');
  await resetSessionStats();
  // Clear any existing alarms from previous versions
  await chrome.alarms.clearAll();
  await initializeWindowManager();
});

// ============================================================================
// WINDOW ALARM HANDLER - Completes windows and saves to history
// ============================================================================

// Alarm listener removed to strictly enforce event-driven sessions


// ============================================================================
// AUTOMATIC LABEL DETECTION (Real-time Monitoring)
// ============================================================================

/**
 * Monitor tab navigation to automatically classify content sensitivity
 * This enables detecting employee context based on the domains they visit
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    await updateLabelFromDomain(tab.url);
  }
});

/**
 * Monitor active tab switches for immediate label updates
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Flush previous session
    await flushWindow();

    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.startsWith('http')) {
      await updateLabelFromDomain(tab.url);

      // Trigger start of new session
      const category = classifyDomain(tab.url);
      const event: RiskEvent = {
        type: 'DOMAIN_VISIT',
        ts: nowUnix(),
        domain_category: category,
        url: tab.url
      };
      await processEvent(event);
    }
  } catch (error) {
    // Tab may not be accessible, ignore
  }
});

// ============================================================================
// TAB CLOSURE HANDLING
// ============================================================================

/**
 * Flush window when a tab is closed to ensure accurate session end times
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  console.log('[UnderSec] Tab closed:', tabId);
  await flushWindow();
});

// ============================================================================

// Duplicate alarm listener removed

// ============================================================================
// WEB NAVIGATION (Domain Tracking)
// ============================================================================

chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only track main frame navigations
  if (details.frameId !== 0) {
    return;
  }

  // Ignore chrome:// and other internal URLs
  if (!details.url.startsWith('http')) {
    return;
  }

  const category = classifyDomain(details.url);

  const event: RiskEvent = {
    type: 'DOMAIN_VISIT',
    ts: nowUnix(),
    domain_category: category,
    url: details.url,
  };

  console.log(`[UnderSec] Domain visit: ${details.url} -> ${category}`);
  await processEvent(event);
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: StateResponse | GenericResponse) => void
  ) => {
    console.log('[UnderSec] Received message:', message.type);

    // Handle async operations
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.log('[UnderSec] Message handler error (swallowed):', error);
        sendResponse({ success: false, message: error.message });
      });

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<StateResponse | GenericResponse> {
  switch (message.type) {
    case 'RISK_EVENT': {
      const eventMsg = message as RiskEventMessage;
      await processEvent(eventMsg.event);
      return { success: true, message: 'Event processed' };
    }

    case 'GET_STATE': {
      const state = await getState();
      return { success: true, state };
    }

    case 'SET_LABEL_FROM_URL': {
      const { url } = message as any;
      await updateLabelFromDomain(url);
      return { success: true, message: 'Label updated' };
    }

    case 'SET_LABEL': {
      // Manual set label removed from UI, but keep internal handler if needed
      return { success: false, message: 'Feature disabled' };
    }



    case 'DISMISS_INTERVENTION':
    case 'ACK_INTERVENTION': {
      return { success: true, message: 'Intervention handled' };
    }

    case 'CLOSE_TAB': {
      // Close the tab that sent this message
      if (sender.tab?.id) {
        console.log('[UnderSec] Closing tab:', sender.tab.id);
        chrome.tabs.remove(sender.tab.id).catch(() => { });
      }
      return { success: true, message: 'Tab closed' };
    }

    case 'UPDATE_SETTINGS': {
      const updateMsg = message as any; // Cast as any to avoid type check till update builds
      await updateSettings(updateMsg.settings);
      return { success: true, message: 'Settings updated' };
    }

    default:
      return { success: false, message: 'Unknown message type' };
  }
}

function getDefaultCategoryForEvent(eventType: string): DomainCategory {
  switch (eventType) {
    case 'PUBLIC_AI_PASTE':
      return 'public_ai';
    case 'PERSONAL_CLOUD_UPLOAD_ATTEMPT':
      return 'personal_cloud';
    case 'RISKY_SHARE_UPLOAD_ATTEMPT':
      return 'risky_share';
    default:
      return 'unknown';
  }
}

// ============================================================================
// SERVICE WORKER KEEP-ALIVE
// ============================================================================

// Ensure service worker stays alive during critical operations
self.addEventListener('activate', (event) => {
  console.log('[UnderSec] Service worker activated');
});

console.log('[UnderSec] Service worker ready');

// Initialize for high-frequency session
(async () => {
  try {
    const { initializeWindowManager } = await import('./windowManager');
    const { updateSettings } = await import('./storage');
    const { WINDOW_DURATION_SECONDS } = await import('../shared/constants');

    // FORCE-SYNC: Removed to respect user settings (defaulting to event-driven)
    // await updateSettings({ window_duration_seconds: WINDOW_DURATION_SECONDS });

    await initializeWindowManager();
  } catch (e) {
    console.log('[UnderSec] Initialization log (not an error):', e);
  }
})();
