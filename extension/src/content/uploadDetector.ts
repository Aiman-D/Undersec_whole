/**
 * UnderSec - Upload Detector
 * Counts file upload attempts on PERSONAL CLOUD domains
 * 
 * PRIVACY: We NEVER read file names, sizes, or contents - only count attempts
 */

import { sendEvent, isFileInput, isDropZone, setupInterventionListener, ensureInterventionStyles } from './base';

console.log('[UnderSec] Upload detector loaded on personal cloud domain');

// Inject styles for interventions
ensureInterventionStyles();

// Set up listener for interventions from background
setupInterventionListener();

// ============================================================================
// FILE INPUT DETECTION
// ============================================================================

/**
 * Handles file input change events
 * We only count - never access file information
 */
function handleFileInputChange(event: Event): void {
  const target = event.target as HTMLInputElement;

  if (!isFileInput(target)) {
    return;
  }

  // Check if files were actually selected (without reading them)
  if (target.files && target.files.length > 0) {
    console.log('[UnderSec] File upload attempt detected (file info NOT captured)');
    sendEvent('PERSONAL_CLOUD_UPLOAD_ATTEMPT', 'personal_cloud');
  }
}

// Listen for file input changes
document.addEventListener('change', handleFileInputChange, { capture: true });

// ============================================================================
// DRAG & DROP DETECTION
// ============================================================================

let dropEventCounted = false;

/**
 * Handles drop events for file uploads
 * We only count - never access dropped file information
 */
function handleDrop(event: DragEvent): void {
  // Prevent duplicate counting for the same drop
  if (dropEventCounted) {
    return;
  }

  const target = event.target as Element;

  // Check if this looks like a file drop zone or has files
  const hasFiles = event.dataTransfer?.types?.includes('Files');
  const isDropTarget = isDropZone(target) || hasFiles;

  if (isDropTarget && hasFiles) {
    console.log('[UnderSec] File drop detected (file info NOT captured)');
    sendEvent('PERSONAL_CLOUD_UPLOAD_ATTEMPT', 'personal_cloud');

    // Prevent duplicate counting
    dropEventCounted = true;
    setTimeout(() => {
      dropEventCounted = false;
    }, 1000);
  }
}

/**
 * Handles dragover to identify potential drop zones
 */
function handleDragOver(event: DragEvent): void {
  // We just observe, don't interfere with the default behavior
}

// Listen for drag & drop events
document.addEventListener('drop', handleDrop, { capture: true });
document.addEventListener('dragover', handleDragOver, { capture: true });

// ============================================================================
// MUTATION OBSERVER FOR DYNAMIC FILE INPUTS
// ============================================================================

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLInputElement && node.type === 'file') {
        // Attach listener directly to dynamic inputs
        node.addEventListener('change', handleFileInputChange);
        console.log('[UnderSec] Dynamic file input detected and listener attached');
      }
      // Also check children if a container was added
      if (node instanceof Element) {
        const fileInputs = node.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          input.addEventListener('change', handleFileInputChange);
          console.log('[UnderSec] Nested file input detected');
        });
      }
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// ============================================================================
// INTERVENTION HANDLING
// ============================================================================

// Intervention display is handled by allUrls.ts globally to avoid duplicates.
// We only import setupInterventionListener if we need specific local handling, 
// but since allUrls.ts covers it, we can skip it here.

console.log('[UnderSec] Upload detector ready (Interventions handled globally)');

console.log('[UnderSec] Upload detector ready');
