/**
 * UnderSec - API Client
 * REST API communication for scoring and ingestion
 */

import { AggregationWindow, ScoreResponse, IngestPayload } from '../shared/types';
import { API_ENDPOINTS } from '../shared/constants';
import { retry, sleep } from '../shared/utils';
import { getState } from './storage';

// ============================================================================
// MOCK RESPONSES (Demo Mode)
// ============================================================================

function generateMockScore(window: AggregationWindow): ScoreResponse {
  const { features, label } = window;

  let riskScore = 0;
  const reasons: string[] = [];

  // Calculate risk based on features
  if (features.public_ai_paste_count > 0) {
    riskScore += 0.3;
    if (label === 'confidential') {
      riskScore += 0.3;
      reasons.push('Confidential label + public AI paste attempt detected');
    } else if (label === 'internal') {
      riskScore += 0.15;
      reasons.push('Internal content pasted to public AI service');
    }
  }

  if (features.personal_cloud_upload_attempt_count > 0) {
    riskScore += 0.2;
    if (label === 'confidential') {
      riskScore += 0.2;
      reasons.push('Upload to personal cloud with confidential label');
    }
    if (features.personal_cloud_upload_attempt_count > 2) {
      reasons.push('High upload frequency to personal cloud services');
    }
  }

  if (features.risky_share_upload_attempt_count > 0) {
    riskScore += 0.25;
    reasons.push('Activity on risky file sharing platform detected');
  }

  // CRITICAL: Heavy penalties for AI tool data exfiltration
  // Each AI paste/upload counted in public_ai_paste_count represents a potential leak
  if (features.public_ai_paste_count > 0) {
    // File uploads are the worst (0.4 per upload)
    // Large pastes are severe (0.3 per paste)
    // Code copies are concerning (0.2 per copy)
    // Extended sessions indicate prolonged data transfer (0.15)
    const aiRiskPenalty = features.public_ai_paste_count * 0.25; // Average penalty
    riskScore += aiRiskPenalty;

    if (features.public_ai_paste_count === 1) {
      reasons.push('Interaction with public AI tool detected');
    } else if (features.public_ai_paste_count >= 3) {
      reasons.push(`Multiple AI tool interactions (${features.public_ai_paste_count}) - potential data exfiltration`);
    } else {
      reasons.push('AI tool usage detected');
    }
  }

  if (features.risky_domain_visit_count > 0) {
    riskScore += 0.15;
    reasons.push('Visits to potentially risky domains');
  }

  if (features.off_hours_flag === 1) {
    riskScore += 0.1;
    if (riskScore > 0.3) {
      reasons.push('Activity occurring outside business hours');
    }
  }

  // Clamp risk score
  riskScore = Math.min(riskScore, 1.0);

  // Determine action
  let recommended_action: ScoreResponse['recommended_action'] = 'none';
  if (riskScore >= 0.7) {
    recommended_action = label === 'confidential' ? 'block' : 'ack_required';
  } else if (riskScore >= 0.4) {
    recommended_action = 'warn';
  }

  // Ensure we have at least one reason if there's risk
  if (reasons.length === 0 && riskScore > 0) {
    reasons.push('Behavioral pattern indicates elevated risk');
  }

  return {
    risk_score: Math.round(riskScore * 100) / 100,
    recommended_action,
    reasons: reasons.slice(0, 3), // Top 3 reasons
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Posts window data to scoring endpoint
 */
export async function postScore(window: AggregationWindow): Promise<ScoreResponse> {
  const state = await getState();

  // Demo mode: return mock response
  if (state.settings.demo_mode) {
    await sleep(500);
    return generateMockScore(window);
  }

  // Production: call real API
  const url = `${state.settings.api_base_url}${API_ENDPOINTS.SCORE}`;

  try {
    return await retry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(window),
      });

      if (!response.ok) {
        throw new Error(`Score API error: ${response.status}`);
      }

      return response.json() as Promise<ScoreResponse>;
    }, 2, 500); // Fewer retries, faster fallback
  } catch (error) {
    // Log error to console so user knows backend is unreachable
    console.error('[UnderSec] API Connection Failed:', error);

    // Anti-Gravity: Always provide an assessment, even if local
    const localScore = generateMockScore(window);
    return {
      ...localScore,
      reasons: [...localScore.reasons, 'Autonomous Assessment (Privacy Mode)']
    };
  }
}

/**
 * Posts window + decision to ingestion endpoint
 */
export async function postIngest(
  window: AggregationWindow,
  scoreResponse: ScoreResponse,
  userAction?: IngestPayload['user_action']
): Promise<void> {
  const state = await getState();

  const payload: IngestPayload = {
    window,
    score_response: scoreResponse,
    user_action: userAction,
  };

  // Demo mode: just log
  if (state.settings.demo_mode) {
    console.log('[UnderSec] Ingest (demo):', payload);
    return;
  }

  // Production: call real API
  const url = `${state.settings.api_base_url}${API_ENDPOINTS.INGEST}`;

  try {
    await retry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Ingest API error: ${response.status}`);
      }
    }, 1, 500); // Only retry once for telemetry
  } catch (error) {
    // Telemetry is non-critical, silence it to keep dashboard clean
  }
}
