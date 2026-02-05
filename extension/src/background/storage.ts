/**
 * UnderSec - Storage Manager
 * Chrome storage wrapper with type safety
 */

import {
  ExtensionState,
  ExtensionSettings,
  AggregationWindow,
  ScoreResponse,
  SensitivityLabel,
  WindowFeatures,
} from '../shared/types';
import {
  DEFAULT_TENANT_ID,
  DEFAULT_USER_ID,
  DEFAULT_API_BASE_URL,
  WINDOW_DURATION_SECONDS,
  MAX_RECENT_WINDOWS,
  VERSION,
  POLICY_ID,
} from '../shared/constants';
import { nowUnix, getWindowStart, isOffHours } from '../shared/utils';

// ============================================================================
// DEFAULT STATE
// ============================================================================

function createDefaultFeatures(): WindowFeatures {
  return {
    public_ai_paste_count: 0,
    personal_cloud_upload_attempt_count: 0,
    risky_share_upload_attempt_count: 0,
    unknown_domain_count: 0,
    approved_work_domain_count: 0,
    risky_domain_visit_count: 0,
    off_hours_flag: isOffHours() ? 1 : 0,
    new_device_flag: 0,
    new_geo_flag: 0,
  };
}

function createDefaultSettings(): ExtensionSettings {
  return {
    tenant_id: DEFAULT_TENANT_ID,
    user_id: DEFAULT_USER_ID,
    api_base_url: DEFAULT_API_BASE_URL,
    demo_mode: false, // Disabled for real-time enforcement
    window_duration_seconds: WINDOW_DURATION_SECONDS,
  };
}

function createDefaultState(): ExtensionState {
  return {
    current_label: 'unknown',
    pause_until_ts: null,
    current_window: null,
    recent_windows: [],
    session_stats: { visits: 0, pastes: 0, uploads: 0 },
    last_score: null,
    settings: createDefaultSettings(),
  };
}

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Gets the entire extension state from storage
 */
export async function getState(): Promise<ExtensionState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['UnderSec_state'], (result) => {
      if (result.UnderSec_state) {
        const state = result.UnderSec_state as ExtensionState;
        if (!state.session_stats) {
          state.session_stats = { visits: 0, pastes: 0, uploads: 0 };
        }
        if (!state.recent_windows) {
          state.recent_windows = [];
        }
        resolve(state);
      } else {
        resolve(createDefaultState());
      }
    });
  });
}

/**
 * Saves the entire extension state to storage
 */
export async function setState(state: ExtensionState): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ UnderSec_state: state }, () => {
      resolve();
    });
  });
}

/**
 * Gets or creates the current aggregation window
 */
export async function getCurrentWindow(): Promise<AggregationWindow> {
  const state = await getState();
  const windowDuration = state.settings.window_duration_seconds;
  const windowStart = getWindowStart(10); // Standardize start buckets but ignore duration
  // Duration is dynamic based on session length, so end_ts is placeholder until flush
  const windowEnd = 0;

  // If we have a current window and it's still valid, return it
  if (
    state.current_window &&
    state.current_window.window_start_ts === windowStart
  ) {
    return state.current_window;
  }

  // Create a new window
  const newWindow: AggregationWindow = {
    tenant_id: state.settings.tenant_id,
    user_id: state.settings.user_id,
    window_start_ts: windowStart,
    window_end_ts: windowEnd,
    label: state.current_label,
    features: createDefaultFeatures(),
    client_version: VERSION,
    policy_id: POLICY_ID,
  };

  // Re-verify off-hours on creation
  newWindow.features.off_hours_flag = isOffHours() ? 1 : 0;

  // Save the new window
  state.current_window = newWindow;
  await setState(state);

  return newWindow;
}

/**
 * Updates feature counters in the current window
 */
export async function incrementFeature(
  feature: keyof WindowFeatures,
  amount: number = 1
): Promise<void> {
  const state = await getState();
  const window = await getCurrentWindow();

  // Increment the feature
  if (typeof window.features[feature] === 'number') {
    (window.features[feature] as number) += amount;
  }

  state.current_window = window;
  await setState(state);
}

/**
 * Updates window metadata (URL, domain)
 */
export async function updateWindowMetadata(url: string): Promise<void> {
  const state = await getState();
  const window = await getCurrentWindow();

  // Simple domain extraction
  try {
    const urlObj = new URL(url);
    window.domain = urlObj.hostname;
    window.url = url;
  } catch (e) {
    // Invalid URL, ignore
  }

  state.current_window = window;
  await setState(state);
}

/**
 * Saves a completed window and rotates history
 */
export async function saveCompletedWindow(
  window: AggregationWindow,
  score: ScoreResponse
): Promise<void> {
  const state = await getState();

  // Attach score to window for history tracking
  const windowWithScore = {
    ...window,
    risk_score: score.risk_score,
    recommended_action: score.recommended_action,
    reasons: score.reasons
  };

  // Add to recent windows (FIFO)
  state.recent_windows.unshift(windowWithScore);
  if (state.recent_windows.length > MAX_RECENT_WINDOWS) {
    state.recent_windows = state.recent_windows.slice(0, MAX_RECENT_WINDOWS);
  }

  // Update last score
  state.last_score = score;

  // Clear current window (new one will be created on next event)
  state.current_window = null;

  await setState(state);
}

/**
 * Sets the current sensitivity label
 */
export async function setLabel(label: SensitivityLabel): Promise<void> {
  const state = await getState();
  state.current_label = label;

  // Also update the current window if it exists
  if (state.current_window) {
    state.current_window.label = label;
  }

  await setState(state);
}

/**
 * Sets the pause state
 */
export async function setPauseUntil(timestamp: number | null): Promise<void> {
  const state = await getState();
  state.pause_until_ts = timestamp;
  await setState(state);
}

/**
 * Checks if monitoring is currently paused
 */
export async function isPaused(): Promise<boolean> {
  const state = await getState();
  if (state.pause_until_ts === null) {
    return false;
  }
  if (nowUnix() >= state.pause_until_ts) {
    // Pause expired, clear it
    await setPauseUntil(null);
    return false;
  }
  return true;
}

/**
 * Updates extension settings
 */
export async function updateSettings(
  updates: Partial<ExtensionSettings>
): Promise<void> {
  const state = await getState();
  state.settings = { ...state.settings, ...updates };
  await setState(state);
}

/**
 * Clears all stored data (for debugging/reset)
 */
export async function clearAllData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['UnderSec_state'], () => {
      resolve();
    });
  });
}
/**
 * Resets the session stats (called on browser startup)
 */
export async function resetSessionStats(): Promise<void> {
  const state = await getState();
  state.session_stats = { visits: 0, pastes: 0, uploads: 0 };
  await setState(state);
  console.log('[UnderSec] Session stats reset');
}
