/**
 * UnderSec - Constants
 * Configuration values and defaults
 */

export const VERSION = '0.1.0';
export const POLICY_ID = 'policy_v1';

// ============================================================================
// TIMING
// ============================================================================

export const WINDOW_DURATION_SECONDS = 10; // 10 seconds for real-time feel
export const WINDOW_ALARM_NAME = 'undersec_window_flush';
export const MAX_RECENT_WINDOWS = 500;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
  SCORE: '/score',
  INGEST: '/ingest',
} as const;

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_TENANT_ID = 'demo_saloncorp';
export const DEFAULT_USER_ID = 'u123';


// ============================================================================
// BUSINESS HOURS (for off_hours_flag)
// ============================================================================

export const BUSINESS_HOURS = {
  START: 9, // 9 AM
  END: 17, // 5 PM
  DAYS: [1, 2, 3, 4, 5], // Monday - Friday
} as const;

// ============================================================================
// INTERVENTION DISPLAY
// ============================================================================

export const INTERVENTION_CONFIG = {
  BANNER_TIMEOUT_MS: 10000, // Auto-dismiss warning banner
  BLOCK_DURATION_MS: 30000,
  ANIMATION_DURATION_MS: 300,
} as const;


// ============================================================================
// AUTOMATIC LABEL CLASSIFICATION
// ============================================================================

export type SensitivityLabel = 'confidential' | 'internal' | 'public' | 'unknown';

// Label priority for retention logic (higher = more sensitive)
export const LABEL_PRIORITY: Record<SensitivityLabel, number> = {
  'confidential': 3,
  'internal': 2,
  'public': 1,
  'unknown': 0,
};

// Keep highest sensitivity label for this duration (seconds)
export const LABEL_RETENTION_SECONDS = 15;
