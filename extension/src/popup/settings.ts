/**
 * UnderSec - Settings Page
 * Configuration for organization and monitoring
 */

import { StateResponse, ExtensionSettings, GenericResponse } from '../shared/types';

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
    tenantId: document.getElementById('tenant-id') as HTMLInputElement,
    userId: document.getElementById('user-id') as HTMLInputElement,
    apiUrl: document.getElementById('api-url') as HTMLInputElement,
    windowDuration: document.getElementById('window-duration') as HTMLInputElement,
    saveBtn: document.getElementById('save-btn') as HTMLButtonElement,
    saveStatus: document.getElementById('save-status') as HTMLElement,
};

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadSettings(): Promise<void> {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' }) as StateResponse;
        if (response.success && response.state) {
            const settings = response.state.settings;
            elements.tenantId.value = settings.tenant_id;
            elements.userId.value = settings.user_id;
            elements.apiUrl.value = settings.api_base_url;
            elements.windowDuration.value = String(settings.window_duration_seconds);
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// ============================================================================
// SAVE LOGIC
// ============================================================================

async function saveSettings(): Promise<void> {
    const settings: Partial<ExtensionSettings> = {
        tenant_id: elements.tenantId.value,
        user_id: elements.userId.value,
        api_base_url: elements.apiUrl.value,
        window_duration_seconds: parseInt(elements.windowDuration.value, 10),
    };

    try {
        // We'll add a SET_SETTINGS message type if needed, or use a generic update
        // For now, let's assume background/index.ts can handle state updates or we add it
        const response = await chrome.runtime.sendMessage({
            type: 'UPDATE_SETTINGS',
            settings
        }) as GenericResponse;

        if (response.success) {
            showSaveConfirmation();
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

function showSaveConfirmation(): void {
    elements.saveStatus.classList.remove('hidden');
    setTimeout(() => {
        elements.saveStatus.classList.add('hidden');
    }, 3000);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

elements.saveBtn.addEventListener('click', saveSettings);

document.addEventListener('DOMContentLoaded', loadSettings);
