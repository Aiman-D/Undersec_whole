/**
 * UnderSec - Fake Event Emitter
 * Simulates user activity for hackathon demo purposes
 */

import { EventType, RiskEvent, DomainCategory } from '../shared/types';
import { nowUnix } from '../shared/utils';

// ============================================================================
// DEMO SCENARIOS
// ============================================================================

export interface DemoScenario {
  name: string;
  description: string;
  events: Array<{
    type: EventType;
    category: DomainCategory;
    delayMs: number;
  }>;
  expectedOutcome: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    name: 'Low Risk Workflow',
    description: 'Normal work activity with approved tools',
    events: [
      { type: 'DOMAIN_VISIT', category: 'approved_work', delayMs: 0 },
      { type: 'DOMAIN_VISIT', category: 'approved_work', delayMs: 500 },
    ],
    expectedOutcome: 'No intervention (risk score < 40%)',
  },
  {
    name: 'Medium Risk - AI Paste',
    description: 'Pasting content to public AI with internal label',
    events: [
      { type: 'PUBLIC_AI_PASTE', category: 'public_ai', delayMs: 0 },
    ],
    expectedOutcome: 'Warning banner shown',
  },
  {
    name: 'High Risk - Confidential Leak',
    description: 'Multiple paste events with confidential label',
    events: [
      { type: 'PUBLIC_AI_PASTE', category: 'public_ai', delayMs: 0 },
      { type: 'PUBLIC_AI_PASTE', category: 'public_ai', delayMs: 300 },
      { type: 'PERSONAL_CLOUD_UPLOAD_ATTEMPT', category: 'personal_cloud', delayMs: 600 },
    ],
    expectedOutcome: 'Acknowledgment modal or block (depends on label)',
  },
  {
    name: 'Risky Share Upload',
    description: 'Uploading to risky file sharing sites',
    events: [
      { type: 'RISKY_SHARE_UPLOAD_ATTEMPT', category: 'risky_share', delayMs: 0 },
    ],
    expectedOutcome: 'Warning or acknowledgment required',
  },
];

// ============================================================================
// EVENT GENERATION
// ============================================================================

/**
 * Creates a fake risk event
 */
export function createFakeEvent(type: EventType, category: DomainCategory): RiskEvent {
  return {
    type,
    ts: nowUnix(),
    domain_category: category,
  };
}

/**
 * Emits a single fake event to the background
 */
export async function emitFakeEvent(type: EventType, category: DomainCategory): Promise<void> {
  const event = createFakeEvent(type, category);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'RISK_EVENT', event },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('[Demo] Event emitted:', type, response);
          resolve();
        }
      }
    );
  });
}

/**
 * Runs a demo scenario by emitting a sequence of events
 */
export async function runDemoScenario(scenario: DemoScenario): Promise<void> {
  console.log(`[Demo] Running scenario: ${scenario.name}`);
  console.log(`[Demo] Description: ${scenario.description}`);
  console.log(`[Demo] Expected: ${scenario.expectedOutcome}`);

  for (const eventConfig of scenario.events) {
    await new Promise(resolve => setTimeout(resolve, eventConfig.delayMs));
    await emitFakeEvent(eventConfig.type, eventConfig.category);
  }

  console.log('[Demo] Scenario complete.');
}

// ============================================================================
// QUICK TRIGGERS
// ============================================================================

export async function triggerLowRisk(): Promise<void> {
  await runDemoScenario(DEMO_SCENARIOS[0]);
}

export async function triggerMediumRisk(): Promise<void> {
  await runDemoScenario(DEMO_SCENARIOS[1]);
}

export async function triggerHighRisk(): Promise<void> {
  await runDemoScenario(DEMO_SCENARIOS[2]);
}

export async function triggerRiskyShare(): Promise<void> {
  await runDemoScenario(DEMO_SCENARIOS[3]);
}
