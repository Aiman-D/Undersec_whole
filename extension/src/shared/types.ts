/**
 * UnderSec - Shared Type Definitions
 * Privacy-First Risk Awareness Extension
 */

// ============================================================================
// DOMAIN CLASSIFICATION
// ============================================================================

export type DomainCategory =
  | 'work_systems'
  | 'public_ai'
  | 'personal_cloud'
  | 'approved_work'
  | 'risky_share'
  | 'code_repos'
  | 'email_platforms'
  | 'social_media'
  | 'dev_tools'
  | 'job_portals'
  | 'finance_services'
  | 'financial_banking'
  | 'entertainment'
  | 'unknown';

// ============================================================================
// SENSITIVITY LABELS
// ============================================================================

export type SensitivityLabel = 'public' | 'internal' | 'confidential' | 'unknown';

// ============================================================================
// EVENTS (Content Script → Background)
// ============================================================================

export type EventType =
  | 'PUBLIC_AI_PASTE'
  | 'PERSONAL_CLOUD_UPLOAD_ATTEMPT'
  | 'RISKY_SHARE_UPLOAD_ATTEMPT'
  | 'DOMAIN_VISIT'
  | 'AI_FILE_UPLOAD'
  | 'AI_LARGE_PASTE'
  | 'AI_CODE_COPY'
  | 'AI_EXTENDED_SESSION';

export interface RiskEvent {
  type: EventType;
  ts: number; // Unix timestamp in seconds
  domain_category?: DomainCategory;
  url?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// WINDOW AGGREGATION
// ============================================================================

export interface WindowFeatures {
  public_ai_paste_count: number;
  personal_cloud_upload_attempt_count: number;
  risky_share_upload_attempt_count: number;
  unknown_domain_count: number;
  approved_work_domain_count: number;
  risky_domain_visit_count: number;
  off_hours_flag: 0 | 1;
  new_device_flag: 0 | 1;
  new_geo_flag: 0 | 1;
}

export interface AggregationWindow {
  tenant_id: string;
  user_id: string;
  window_start_ts: number;
  window_end_ts: number;
  label: SensitivityLabel;
  features: WindowFeatures;
  client_version: string;
  policy_id: string;
  risk_score?: number;
  recommended_action?: RecommendedAction;
  reasons?: any[];
  url?: string;
  domain?: string;
}

// ============================================================================
// API CONTRACTS
// ============================================================================

export type RecommendedAction = 'none' | 'warn' | 'ack_required' | 'block';

export interface ScoreResponse {
  risk_score: number;
  recommended_action: RecommendedAction;
  reasons: any[];
}

export interface IngestPayload {
  window: AggregationWindow;
  score_response: ScoreResponse;
  user_action?: 'dismissed' | 'acknowledged' | 'changed_label' | 'override';
}

// ============================================================================
// MESSAGES (Inter-component Communication)
// ============================================================================

export type MessageType =
  | 'RISK_EVENT'
  | 'GET_STATE'
  | 'SET_LABEL'
  | 'SHOW_INTERVENTION'
  | 'DISMISS_INTERVENTION'
  | 'ACK_INTERVENTION'
  | 'UPDATE_SETTINGS'
  | 'SET_LABEL_FROM_URL'
  | 'CLOSE_TAB';

export interface BaseMessage {
  type: MessageType;
}

export interface RiskEventMessage extends BaseMessage {
  type: 'RISK_EVENT';
  event: RiskEvent;
}

export interface GetStateMessage extends BaseMessage {
  type: 'GET_STATE';
}

export interface SetLabelMessage extends BaseMessage {
  type: 'SET_LABEL';
  label: SensitivityLabel;
}

export interface ShowInterventionMessage extends BaseMessage {
  type: 'SHOW_INTERVENTION';
  action: RecommendedAction;
  score: number;
  reasons: any[];
}

export interface DismissInterventionMessage extends BaseMessage {
  type: 'DISMISS_INTERVENTION';
}

export interface AckInterventionMessage extends BaseMessage {
  type: 'ACK_INTERVENTION';
}

export interface SetLabelFromUrlMessage extends BaseMessage {
  type: 'SET_LABEL_FROM_URL';
  url: string;
}

export interface CloseTabMessage extends BaseMessage {
  type: 'CLOSE_TAB';
}

export type ExtensionMessage =
  | RiskEventMessage
  | GetStateMessage
  | SetLabelMessage
  | ShowInterventionMessage
  | DismissInterventionMessage
  | AckInterventionMessage
  | UpdateSettingsMessage
  | SetLabelFromUrlMessage
  | CloseTabMessage;

export interface UpdateSettingsMessage extends BaseMessage {
  type: 'UPDATE_SETTINGS';
  settings: Partial<ExtensionSettings>;
}

// ============================================================================
// STORAGE STATE
// ============================================================================

export interface SessionStats {
  visits: number;
  pastes: number;
  uploads: number;
}

export interface ExtensionState {
  current_label: SensitivityLabel;
  pause_until_ts: number | null;
  current_window: AggregationWindow | null;
  recent_windows: AggregationWindow[];
  session_stats: SessionStats;
  last_score: ScoreResponse | null;
  settings: ExtensionSettings;
}

export interface ExtensionSettings {
  tenant_id: string;
  user_id: string;
  api_base_url: string;
  demo_mode: boolean;
  window_duration_seconds: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface StateResponse {
  success: boolean;
  state: ExtensionState;
}

export interface GenericResponse {
  success: boolean;
  message?: string;
}
