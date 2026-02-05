/**
 * UnderSec - AI Site Monitor
 * Specialized surveillance for public AI tools to detect data exfiltration
 * Injected ONLY on ChatGPT, Gemini, Claude, etc.
 */

console.log('[UnderSec] AI Site Monitor activated');

// ============================================================================
// FILE UPLOAD DETECTION
// ============================================================================

/**
 * Monitors file input changes to detect document uploads to AI
 */
function monitorFileUploads(): void {
    document.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;

        if (target.type === 'file' && target.files && target.files.length > 0) {
            const file = target.files[0];

            chrome.runtime.sendMessage({
                type: 'RISK_EVENT',
                event: {
                    type: 'AI_FILE_UPLOAD',
                    ts: Math.floor(Date.now() / 1000),
                    url: window.location.href,
                    metadata: {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type || 'unknown'
                    }
                }
            }).catch(() => { });

            console.log('[UnderSec] 🚨 FILE UPLOAD DETECTED:', file.name);
        }
    }, true);
}

// ============================================================================
// LARGE PASTE DETECTION
// ============================================================================

/**
 * Detects large text pastes that might contain confidential data
 */
function monitorLargePastes(): void {
    document.addEventListener('paste', (e) => {
        try {
            const pastedText = e.clipboardData?.getData('text') || '';
            const pastedLength = pastedText.length;

            // Only flag if paste is substantial (>500 characters)
            if (pastedLength > 500) {
                chrome.runtime.sendMessage({
                    type: 'RISK_EVENT',
                    event: {
                        type: 'AI_LARGE_PASTE',
                        ts: Math.floor(Date.now() / 1000),
                        url: window.location.href,
                        metadata: {
                            charCount: pastedLength,
                            containsCode: /function|class|import|const|let|var/.test(pastedText)
                        }
                    }
                }).catch(() => { });

                console.log('[UnderSec] 🚨 LARGE PASTE DETECTED:', pastedLength, 'chars');
            }
        } catch (err) {
            // Clipboard access might fail in some contexts
        }
    }, true);
}

// ============================================================================
// CODE COPY DETECTION
// ============================================================================

/**
 * Detects when user copies AI-generated responses (potential IP extraction)
 */
function monitorCodeCopying(): void {
    document.addEventListener('copy', (e) => {
        try {
            const selectedText = window.getSelection()?.toString() || '';

            // Only flag substantial copies
            if (selectedText.length > 200) {
                const looksLikeCode = /function|class|import|const|def|public|private/.test(selectedText);

                chrome.runtime.sendMessage({
                    type: 'RISK_EVENT',
                    event: {
                        type: 'AI_CODE_COPY',
                        ts: Math.floor(Date.now() / 1000),
                        url: window.location.href,
                        metadata: {
                            charCount: selectedText.length,
                            looksLikeCode
                        }
                    }
                }).catch(() => { });

                console.log('[UnderSec] 🚨 CODE COPY DETECTED:', selectedText.length, 'chars');
            }
        } catch (err) {
            // Selection access might fail
        }
    }, true);
}

// ============================================================================
// EXTENDED SESSION DETECTION
// ============================================================================

let interactionCount = 0;
let lastInteractionTime = 0;

/**
 * Tracks prolonged AI tool usage (multiple queries in short time)
 */
function monitorExtendedSessions(): void {
    // Monitor form submissions (ChatGPT, Claude send buttons)
    document.addEventListener('submit', () => {
        const now = Math.floor(Date.now() / 1000);

        // Reset counter if more than 60s since last interaction
        if (now - lastInteractionTime > 60) {
            interactionCount = 0;
        }

        interactionCount++;
        lastInteractionTime = now;

        // Flag if user has made 3+ queries in <60s
        if (interactionCount >= 3) {
            chrome.runtime.sendMessage({
                type: 'RISK_EVENT',
                event: {
                    type: 'AI_EXTENDED_SESSION',
                    ts: now,
                    url: window.location.href,
                    metadata: {
                        interactionCount
                    }
                }
            }).catch(() => { });

            console.log('[UnderSec] 🚨 EXTENDED SESSION:', interactionCount, 'interactions');
            interactionCount = 0; // Reset to avoid spam
        }
    }, true);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

monitorFileUploads();
monitorLargePastes();
monitorCodeCopying();
monitorExtendedSessions();

console.log('[UnderSec] AI Site Monitor ready - tracking all interactions');
