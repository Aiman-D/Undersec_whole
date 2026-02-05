/**
 * UnderSec - Mock API
 * Local mock for /score and /ingest endpoints (hackathon demo)
 */

import { AggregationWindow, ScoreResponse, RecommendedAction } from '../shared/types';

// ============================================================================
// MOCK SCORING LOGIC
// ============================================================================

/**
 * Generates a mock risk score based on window features
 * This simulates what a real ML-based scoring API would return
 */
export function mockScore(window: AggregationWindow): ScoreResponse {
  const { features, label } = window;

  let riskScore = 0;
  const reasons: string[] = [];

  // -------------------------------------------------------------------------
  // FACTOR 1: Public AI Paste Activity
  // -------------------------------------------------------------------------
  if (features.public_ai_paste_count > 0) {
    const basePasteRisk = 0.25;
    riskScore += basePasteRisk;

    // Escalate based on label
    if (label === 'confidential') {
      riskScore += 0.35;
      reasons.push('⚠️ Paste to public AI detected with CONFIDENTIAL label');
    } else if (label === 'internal') {
      riskScore += 0.15;
      reasons.push('Paste to public AI detected with Internal label');
    } else {
      reasons.push('Content pasted to public AI service');
    }

    // Multiple pastes increase risk
    if (features.public_ai_paste_count > 2) {
      riskScore += 0.1;
      reasons.push(`High paste frequency: ${features.public_ai_paste_count} events`);
    }
  }

  // -------------------------------------------------------------------------
  // FACTOR 2: Personal Cloud Upload Activity
  // -------------------------------------------------------------------------
  if (features.personal_cloud_upload_attempt_count > 0) {
    const baseUploadRisk = 0.2;
    riskScore += baseUploadRisk;

    if (label === 'confidential') {
      riskScore += 0.25;
      reasons.push('⚠️ Upload to personal cloud with CONFIDENTIAL label');
    } else if (label === 'internal') {
      riskScore += 0.1;
      reasons.push('Upload to personal cloud with Internal label');
    }

    if (features.personal_cloud_upload_attempt_count > 1) {
      reasons.push(`Multiple upload attempts: ${features.personal_cloud_upload_attempt_count}`);
    }
  }

  // -------------------------------------------------------------------------
  // FACTOR 3: Risky Share Platform Activity
  // -------------------------------------------------------------------------
  if (features.risky_share_upload_attempt_count > 0) {
    riskScore += 0.3;
    reasons.push('⚠️ Activity on risky file sharing platform');

    if (label === 'confidential' || label === 'internal') {
      riskScore += 0.2;
      reasons.push('Sensitive content on untrusted sharing platform');
    }
  }

  // -------------------------------------------------------------------------
  // FACTOR 4: Domain Visit Patterns
  // -------------------------------------------------------------------------
  if (features.risky_domain_visit_count > 0) {
    riskScore += 0.1 * Math.min(features.risky_domain_visit_count, 3);
    if (features.risky_domain_visit_count > 2) {
      reasons.push('Multiple visits to high-risk domains');
    }
  }

  // -------------------------------------------------------------------------
  // FACTOR 5: Context Modifiers
  // -------------------------------------------------------------------------
  if (features.off_hours_flag === 1) {
    // Only add to score if there's already some risk
    if (riskScore > 0.2) {
      riskScore += 0.1;
      reasons.push('Activity occurring outside business hours');
    }
  }

  if (features.new_device_flag === 1) {
    riskScore += 0.05;
  }

  if (features.new_geo_flag === 1) {
    riskScore += 0.05;
  }

  // -------------------------------------------------------------------------
  // NORMALIZE & DETERMINE ACTION
  // -------------------------------------------------------------------------

  // Clamp risk score to [0, 1]
  riskScore = Math.max(0, Math.min(1, riskScore));

  // Round to 2 decimal places
  riskScore = Math.round(riskScore * 100) / 100;

  // Determine recommended action based on thresholds
  let recommended_action: RecommendedAction = 'none';

  if (riskScore >= 0.7) {
    // High risk: block for confidential, ack for others
    recommended_action = label === 'confidential' ? 'block' : 'ack_required';
  } else if (riskScore >= 0.4) {
    recommended_action = 'warn';
  }

  // Ensure we have at least one reason if there's any risk
  if (reasons.length === 0 && riskScore > 0) {
    reasons.push('Behavioral pattern indicates slightly elevated risk');
  }

  // Limit to top 3 most relevant reasons
  const topReasons = reasons.slice(0, 3);

  return {
    risk_score: riskScore,
    recommended_action,
    reasons: topReasons,
  };
}

// ============================================================================
// MOCK INGEST
// ============================================================================

/**
 * Mocks the /ingest endpoint (just logs for demo)
 */
export function mockIngest(
  window: AggregationWindow,
  score: ScoreResponse,
  userAction?: string
): void {
  console.log('[MockAPI] Ingest received:', {
    window_id: `${window.window_start_ts}-${window.window_end_ts}`,
    tenant: window.tenant_id,
    user: window.user_id,
    label: window.label,
    risk_score: score.risk_score,
    action: score.recommended_action,
    user_response: userAction || 'none',
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// API WRAPPER
// ============================================================================

/**
 * Simulates API call delay for realism
 */
export async function mockApiCall<T>(
  fn: () => T,
  delayMs: number = 500
): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return fn();
}
