/**
 * UnderSec - Risky Share Content Script
 * Injected on risky file sharing domains (Pastebin, WeTransfer, etc.)
 */

import { sendEvent, isFileInput, isTextInputTarget, setupInterventionListener, ensureInterventionStyles } from './base';

console.log('[UnderSec] Risky share detector loaded');

ensureInterventionStyles();
setupInterventionListener();

// Detect file uploads
function handleFileInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (isFileInput(target) && target.files && target.files.length > 0) {
    console.log('[UnderSec] Upload to risky share site detected');
    sendEvent('RISKY_SHARE_UPLOAD_ATTEMPT', 'risky_share');
  }
}

// Detect paste events (for pastebin-like sites)
function handlePaste(event: ClipboardEvent): void {
  const target = event.target as Element;
  if (isTextInputTarget(target)) {
    console.log('[UnderSec] Paste to risky share site detected');
    sendEvent('RISKY_SHARE_UPLOAD_ATTEMPT', 'risky_share');
  }
}

document.addEventListener('change', handleFileInput, { capture: true });
document.addEventListener('paste', handlePaste, { capture: true });

// Intervention handling is managed by allUrls.ts gloablly.
// Local handler removed to prevent duplicates.

console.log('[UnderSec] Risky share detector ready');
