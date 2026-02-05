/**
 * UnderSec - Window Manager
 * Rolling 5-minute window aggregation engine
 */

import { RiskEvent, AggregationWindow, WindowFeatures, EventType } from '../shared/types';
import { WINDOW_ALARM_NAME } from '../shared/constants';
import {
  getState,
  setState,
  getCurrentWindow,
  incrementFeature,
  saveCompletedWindow,
  isPaused,
  updateWindowMetadata,
} from './storage';
import { postScore, postIngest } from './api';
import { nowUnix, getWindowStart } from '../shared/utils';

// ============================================================================
// EVENT → FEATURE MAPPING
// ============================================================================

const EVENT_TO_FEATURE: Record<EventType, keyof WindowFeatures | null> = {
  'PUBLIC_AI_PASTE': 'public_ai_paste_count',
  'PERSONAL_CLOUD_UPLOAD_ATTEMPT': 'personal_cloud_upload_attempt_count',
  'RISKY_SHARE_UPLOAD_ATTEMPT': 'risky_share_upload_attempt_count',
  'DOMAIN_VISIT': null, // Handled separately based on category
  'AI_FILE_UPLOAD': 'public_ai_paste_count', // Map to same counter as pastes
  'AI_LARGE_PASTE': 'public_ai_paste_count', // Map to same counter
  'AI_CODE_COPY': 'public_ai_paste_count', // Map to same counter  
  'AI_EXTENDED_SESSION': 'public_ai_paste_count', // Map to same counter
};

const DOMAIN_CATEGORY_TO_FEATURE: Record<string, keyof WindowFeatures> = {
  'unknown': 'unknown_domain_count',
  'approved_work': 'approved_work_domain_count',
  'work_systems': 'approved_work_domain_count',
  'risky_share': 'risky_domain_visit_count',
  'public_ai': 'risky_domain_visit_count', // Counting public AI visits as risky domain visits
  'personal_cloud': 'risky_domain_visit_count', // Counting cloud visits as risky domain visits
  'financial_banking': 'approved_work_domain_count',
  'entertainment': 'unknown_domain_count',
};

// ============================================================================
// WINDOW LIFECYCLE
// ============================================================================

/**
 * Initializes the window manager and sets up alarms
 */
export async function initializeWindowManager(): Promise<void> {
  const state = await getState();
  const windowDuration = state.settings.window_duration_seconds;

  // Ensure a window always exists proactively
  const currentWindow = await getCurrentWindow();

  const now = nowUnix();
  const windowEnd = currentWindow.window_end_ts;

  // Calculate when to fire the alarm (at current window end)
  let delayInMinutes = (windowEnd - now) / 60;

  if (delayInMinutes <= 0) delayInMinutes = 0.05; // ~3 seconds

  await chrome.alarms.clear(WINDOW_ALARM_NAME);
  // Periodic alarm removed in favor of event-driven flushing (Tab Close / Domain Change)
  /*
  await chrome.alarms.create(WINDOW_ALARM_NAME, {
    delayInMinutes,
    periodInMinutes: windowDuration / 60,
  });
  */

  console.log(`[UnderSec] Window manager initialized. Window ends in ${Math.round((windowEnd - now))}s.`);

  // Re-enable periodic alarm for LIVE SCORING (Interim assessments)
  await chrome.alarms.create(WINDOW_ALARM_NAME, {
    delayInMinutes: 0.1, // Start soon
    periodInMinutes: 0.1 // Every ~6 seconds
  });
}

/**
 * Processes an incoming event and updates the current window
 */
export async function processEvent(event: RiskEvent): Promise<void> {
  const state = await getState();
  let window = state.current_window;

  // 1. Session Logic: If URL changes, flush previous window immediately
  if (event.url && window && window.domain) {
    try {
      const newDomain = new URL(event.url).hostname;
      if (newDomain !== window.domain) {
        console.log(`[UnderSec] Domain changed (${window.domain} -> ${newDomain}). Flushing window.`);
        await flushWindow();
        // getCurrentWindow() called within flush or next step will create a new one
        window = await getCurrentWindow();
        await updateWindowMetadata(event.url);
      }
    } catch (e) {
      // Ignore URL parse errors
    }
  }

  // Ensure metadata is set if missing (e.g. first event in new window)
  if (event.url) {
    await updateWindowMetadata(event.url);
  }

  // Refetch window in case it was flushed or updated
  window = await getCurrentWindow();

  // 2. Map event to feature
  const feature = EVENT_TO_FEATURE[event.type];

  if (feature) {
    await incrementFeature(feature);

    // Update session stats
    const updatedState = await getState();
    if (feature.includes('paste')) updatedState.session_stats.pastes++;
    if (feature.includes('upload')) updatedState.session_stats.uploads++;
    await setState(updatedState);

    console.log(`[UnderSec] Incremented ${feature}`);

    // Trigger immediate interim score update for responsiveness
    await assessActiveWindow();
  } else if (event.type === 'DOMAIN_VISIT') {
    // Handle domain visits by category
    if (!event.domain_category) {
      return;
    }

    const domainFeature = DOMAIN_CATEGORY_TO_FEATURE[event.domain_category];

    // Update session stats for all visits
    const updatedState = await getState();
    updatedState.session_stats.visits++;
    await setState(updatedState);

    if (domainFeature) {
      await incrementFeature(domainFeature);
      console.log(`[UnderSec] Incremented ${domainFeature} for ${event.domain_category} visit`);
    }
  }
}

/**
 * Performs an interim risk assessment without closing the window
 * Updates state.last_score so UI shows live risk
 */
export async function assessActiveWindow(): Promise<void> {
  const state = await getState();
  const window = state.current_window;

  if (!window) return;

  try {
    // update end time for current duration calc
    window.window_end_ts = nowUnix();

    // Get interim score
    const score = await postScore(window);

    // Update state with this live score
    state.last_score = score;
    // Update window with latest score too (optional, but good for tracking)
    window.risk_score = score.risk_score;
    window.recommended_action = score.recommended_action;
    window.reasons = score.reasons;

    state.current_window = window;
    await setState(state);

    // Check for intervention based on live score
    if (score.recommended_action !== 'none') {
      await triggerIntervention(score);
    }

  } catch (error) {
    console.log('[UnderSec] Interim assessment failed:', error);
  }
}

async function triggerIntervention(score: any) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    try {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'SHOW_INTERVENTION',
        action: score.recommended_action,
        score: score.risk_score,
        reasons: score.reasons,
      });
    } catch (error) {
      // Tab might not be ready
    }
  }
}

/**
 * Flushes the current window and triggers scoring
 */
export async function flushWindow(): Promise<{
  window: AggregationWindow;
  score: ReturnType<typeof postScore> extends Promise<infer T> ? T : never;
} | null> {
  const state = await getState();

  // Set accurate end time for session
  if (state.current_window) {
    state.current_window.window_end_ts = nowUnix();
  }

  const window = state.current_window;

  if (!window) {
    console.log('[UnderSec] No active window to flush');
    return null;
  }

  console.log('[UnderSec] Flushing window:', window);
  console.log('[UnderSec] Session Duration:', window.window_end_ts - window.window_start_ts, 'seconds');

  try {
    // Get risk score
    const score = await postScore(window);
    console.log('[UnderSec] Score response:', score);

    // Save to history
    await saveCompletedWindow(window, score);

    // Ingest for audit
    await postIngest(window, score);

    return { window, score };
  } catch (error) {
    console.log('[UnderSec] Flush handled (slight delay):', error);
    return null;
  }
}

/**
 * Handles the window alarm firing
 */
export async function handleWindowAlarm(): Promise<void> {
  // Instead of flushing (closing), we just assess risk
  // This gives the "Live Updating" feel without breaking sessions
  console.log('[UnderSec] Live risk assessment alarm fired');
  await assessActiveWindow();
}
