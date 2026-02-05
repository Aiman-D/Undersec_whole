/**
 * UnderSec - Label Manager
 * Manages automatic sensitivity label classification with retention logic
 */

import { classifyDomain } from '../shared/domains';
import { CATEGORY_TO_LABEL } from '../shared/domains';
import { LABEL_PRIORITY, LABEL_RETENTION_SECONDS, SensitivityLabel } from '../shared/constants';
import { nowUnix } from '../shared/utils';
import { setLabel } from './storage';

// ============================================================================
// STATE
// ============================================================================

interface LabelState {
    currentLabel: SensitivityLabel;
    lastHighLabel: SensitivityLabel | null;
    lastHighLabelTimestamp: number;
    lastUrl: string;
}

const labelState: LabelState = {
    currentLabel: 'unknown',
    lastHighLabel: null,
    lastHighLabelTimestamp: 0,
    lastUrl: '',
};

// ============================================================================
// AUTOMATIC LABEL DETECTION
// ============================================================================

/**
 * Updates the current label based on the URL the employee is visiting
 * Implements "sticky" label retention - keeps highest sensitivity label for 30s
 * 
 * This enables detecting risky patterns like:
 * 1. Employee visits Salesforce (confidential)
 * 2. Copies customer data
 * 3. Switches to ChatGPT (public)
 * 4. UnderSec still knows the source was confidential for 30s
 * 
 * @param url - The URL being visited
 */
export async function updateLabelFromDomain(url: string): Promise<void> {
    // Skip if same URL (avoid redundant updates)
    if (url === labelState.lastUrl) {
        return;
    }

    labelState.lastUrl = url;

    // Classify the domain
    const category = classifyDomain(url);
    const newLabel = CATEGORY_TO_LABEL[category] || 'unknown';

    const now = nowUnix();

    // Check if we should retain a higher sensitivity label -> DISABLED per user request
    /*
    if (
        labelState.lastHighLabel &&
        LABEL_PRIORITY[labelState.lastHighLabel] > LABEL_PRIORITY[newLabel] &&
        now - labelState.lastHighLabelTimestamp < LABEL_RETENTION_SECONDS
    ) {
        // Keep the higher label (employee recently visited sensitive site)
        console.log(
            `[UnderSec] Retaining higher label: ${labelState.lastHighLabel} ` +
            `(visited ${Math.floor(now - labelState.lastHighLabelTimestamp)}s ago)`
        );
        return;
    }
    */

    // Update to new label
    labelState.currentLabel = newLabel;

    // Track high-sensitivity labels for retention
    if (LABEL_PRIORITY[newLabel] >= LABEL_PRIORITY['internal']) {
        labelState.lastHighLabel = newLabel;
        labelState.lastHighLabelTimestamp = now;
    }

    // Persist to storage
    await setLabel(newLabel);

    console.log(`[UnderSec] Auto-classified ${category} → ${newLabel} (${url})`);
}

/**
 * Gets the current effective label
 */
export function getCurrentLabel(): SensitivityLabel {
    return labelState.currentLabel;
}

/**
 * Manually sets a label (for override scenarios)
 */
export async function setManualLabel(label: SensitivityLabel): Promise<void> {
    labelState.currentLabel = label;
    labelState.lastHighLabel = label;
    labelState.lastHighLabelTimestamp = nowUnix();
    await setLabel(label);
    console.log(`[UnderSec] Manual label set: ${label}`);
}

/**
 * Resets label retention (useful for testing)
 */
export function resetLabelRetention(): void {
    labelState.lastHighLabel = null;
    labelState.lastHighLabelTimestamp = 0;
    console.log('[UnderSec] Label retention reset');
}
