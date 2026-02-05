/**
 * UnderSec - Paste Detector
 * Counts paste events to text inputs on PUBLIC AI domains
 * 
 * PRIVACY: We NEVER read clipboard content - only count the event
 */

import { sendEvent, isTextInputTarget, setupInterventionListener, ensureInterventionStyles } from './base';

console.log('[UnderSec] Paste detector loaded on public AI domain');

// Inject styles for interventions
ensureInterventionStyles();

// Set up listener for interventions from background
setupInterventionListener();

// ============================================================================
// PASTE DETECTION
// ============================================================================

/**
 * Handles paste events on text input targets
 * We only count - never access clipboard data
 */
function handlePaste(event: ClipboardEvent): void {
  const target = event.target as Element;

  // Only track pastes to text inputs (textarea, contenteditable, role=textbox)
  if (!isTextInputTarget(target)) {
    return;
  }

  console.log('[UnderSec] Paste detected on text input (content NOT captured)');

  // Send count-only event to background
  // NOTE: We intentionally do NOT access event.clipboardData
  sendEvent('PUBLIC_AI_PASTE', 'public_ai');
}

// Listen for paste events on the entire document
// Using capture phase to ensure we see all paste events
document.addEventListener('paste', handlePaste, { capture: true });

// ============================================================================
// INTERVENTION HANDLING
// ============================================================================

// Intervention display is handled by allUrls.ts globally to avoid duplicates.
// We only import setupInterventionListener if we need specific local handling, 
// but since allUrls.ts covers it, we can skip it here.

// If we needed to handle specific AI site interventions that differ from global ones, 
// we would do it here, but for now we defer to the global handler.

console.log('[UnderSec] Paste detector ready (Interventions handled globally)');

console.log('[UnderSec] Paste detector ready');
