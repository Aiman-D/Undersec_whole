/**
 * UnderSec - Domain Classification
 * Comprehensive domain categorization for risk assessment
 */

import { DomainCategory } from './types';
import { SensitivityLabel } from './constants';

// ============================================================================
// DOMAIN REGISTRY - Expanded with 11 Categories
// ============================================================================

interface DomainRegistry {
  [category: string]: string[];
}

const DOMAIN_REGISTRY: DomainRegistry = {
  // ===== HIGH RISK: Public AI Tools =====
  public_ai: [
    'chat.openai.com',
    'chatgpt.com',
    'claude.ai',
    'anthropic.com',
    'gemini.google.com',
    'bard.google.com',
    'copilot.microsoft.com',
    'bing.com/chat',
    'perplexity.ai',
    'poe.com',
    'you.com',
    'phind.com',
    'character.ai',
    'openrouter.ai',
  ],

  // ===== MEDIUM RISK: Personal Cloud Storage =====
  personal_cloud: [
    'drive.google.com',
    'dropbox.com',
    'www.dropbox.com',
    'onedrive.live.com',
    'box.com',
    'www.box.com',
    'icloud.com',
    'www.icloud.com',
    'mega.nz',
    'mediafire.com',
    'pcloud.com',
    '4shared.com',
  ],

  // ===== LOW RISK: Approved Work Tools =====
  approved_work: [
    // Replace with your company domain
    'yourcompany.com',

    // Collaboration
    'notion.so',
    'www.notion.so',
    'slack.com',
    'app.slack.com',
    'teams.microsoft.com',
    'zoom.us',
    'meet.google.com',

    // Productivity
    'jira.atlassian.com',
    'atlassian.net',
    'linear.app',
    'asana.com',
    'monday.com',
    'trello.com',
    'clickup.com',

    // Google Workspace
    'docs.google.com',
    'sheets.google.com',
    'slides.google.com',
    'calendar.google.com',

    // Microsoft Office
    'outlook.office.com',
    'office.com',
    'sharepoint.com',
  ],

  // ===== CRITICAL RISK: Risky File Sharing =====
  risky_share: [
    'pastebin.com',
    'wetransfer.com',
    'transfer.sh',
    'sendgb.com',
    'file.io',
    'anonfiles.com',
    'gofile.io',
    'zerobin.net',
    'sendanywhere.com',
    'justpaste.it',
    'privnote.com',
    'temp.sh',
  ],

  // ===== HIGH RISK: Code Repositories =====
  code_repos: [
    'github.com',
    'gist.github.com',
    'gitlab.com',
    'bitbucket.org',
    'sourceforge.net',
    'codeberg.org',
    'gitea.com',
    'huggingface.co',
  ],

  // ===== MEDIUM RISK: Email Platforms =====
  email_platforms: [
    'mail.google.com',
    'gmail.com',
    'outlook.live.com',
    'outlook.com',
    'proton.me',
    'protonmail.com',
    'tutanota.com',
    'zoho.com',
    'mail.zoho.com',
    'yahoo.com',
    'mail.yahoo.com',
    'aol.com',
  ],

  // ===== HIGH RISK: Social Media & Messaging =====
  social_media: [
    // Professional
    'linkedin.com',
    'www.linkedin.com',

    // Social Networks
    'twitter.com',
    'x.com',
    'facebook.com',
    'www.facebook.com',
    'instagram.com',
    'www.instagram.com',
    'threads.net',
    'tiktok.com',

    // Discussion Platforms
    'reddit.com',
    'www.reddit.com',
    'quora.com',
    'stackoverflow.com',
    'stackexchange.com',

    // Messaging
    'discord.com',
    'web.whatsapp.com',
    'telegram.org',
    'web.telegram.org',
    'signal.org',
    'messenger.com',
  ],

  // ===== MEDIUM RISK: Developer Tools & Sandboxes =====
  dev_tools: [
    'replit.com',
    'codesandbox.io',
    'stackblitz.com',
    'codepen.io',
    'jsfiddle.net',
    'glitch.com',
    'npmjs.com',
    'pypi.org',
    'packagist.org',
    'crates.io',
    'docker.com',
    'hub.docker.com',
  ],

  // ===== MEDIUM RISK: Job Portals & Recruitment =====
  job_portals: [
    'naukri.com',
    'indeed.com',
    'linkedin.com/jobs',
    'glassdoor.com',
    'monster.com',
    'cutshort.io',
    'angel.co',
    'wellfound.com',
    'hired.com',
    'instahyre.com',
    'foundit.in',
  ],

  // ===== CRITICAL RISK: Finance & Banking =====
  finance_services: [
    // Payment Processors
    'paypal.com',
    'stripe.com',
    'razorpay.com',
    'paytm.com',
    'phonepe.com',
    'googlepay.com',

    // Crypto
    'coinbase.com',
    'binance.com',
    'kraken.com',

    // Banking (US)
    'bankofamerica.com',
    'chase.com',
    'wellsfargo.com',
    'citibank.com',
    'capitalone.com',

    // Banking (India)
    'icicibank.com',
    'hdfcbank.com',
    'axisbank.com',
    'axis.bank.in',
    'omni.axis.bank.in',
    'retail.axisbank.co.in',
    'sbi.co.in',
    'onlinesbi.sbi',
    'kotak.com',
  ],

  // Legacy category for backward compatibility
  financial_banking: [
    'chase.com',
    'bankofamerica.com',
    'wellsfargo.com',
    'citibank.com',
    'hsbc.com',
    'barclays.co.uk',
    'etrade.com',
    'fidelity.com',
    'schwab.com',
    'robinhood.com',
    'zerodha.com',
    'icicibank.com',
    'hdfcbank.com',
    'axisbank.com',
    'axis.bank.in',
    'tradingview.com',
  ],

  // ===== CONFIDENTIAL: Work Systems =====
  work_systems: [
    // CRM Systems
    'salesforce.com',
    'my.salesforce.com',
    'lightning.force.com',
    'dynamics.microsoft.com',
    'zoho.com/crm',
    'hubspot.com',
    'pipedrive.com',

    // HR Systems
    'workday.com',
    'successfactors.com',
    'adp.com',
    'paychex.com',
    'bamboohr.com',
    'greenhouse.io',
    'lever.co',
    'indeed.com/hire',

    // Financial/ERP Systems
    'quickbooks.intuit.com',
    'xero.com',
    'netsuite.com',
    'sap.com',
    'oracle.com',
    'odoo.com',

    // Enterprise Tools
    'sharepoint.com',
    'apps.powerapps.com',
    'servicenow.com',
    'zendesk.com',
    'freshdesk.com',
  ],

  // ===== LOW RISK: Entertainment =====
  entertainment: [
    'youtube.com',
    'www.youtube.com',
    'netflix.com',
    'primevideo.com',
    'disneyplus.com',
    'hulu.com',
    'hotstar.com',
    'twitch.tv',
    'spotify.com',
    'soundcloud.com',
    'apple.com/tv',
  ],
};

// ============================================================================
// RISK LEVEL MAPPING
// ============================================================================

export const CATEGORY_RISK_LEVELS: Record<DomainCategory, string> = {
  'public_ai': 'high',
  'personal_cloud': 'medium',
  'approved_work': 'low',
  'risky_share': 'critical',
  'code_repos': 'high',
  'email_platforms': 'medium',
  'social_media': 'high',
  'dev_tools': 'medium',
  'job_portals': 'medium',
  'finance_services': 'critical',
  'financial_banking': 'critical',
  'work_systems': 'confidential',
  'entertainment': 'low',
  'unknown': 'dynamic',
};

// ============================================================================
// CATEGORY TO SENSITIVITY LABEL MAPPING
// ============================================================================

/**
 * Maps domain categories to sensitivity labels for automatic classification
 */
export const CATEGORY_TO_LABEL: Record<string, SensitivityLabel> = {
  // CONFIDENTIAL: Sensitive user data and work systems
  'work_systems': 'confidential',       // Enterprise systems
  'financial_banking': 'confidential',  // Banking
  'finance_services': 'confidential',   // Payment platforms
  'approved_work': 'confidential',      // Internal work
  'code_repos': 'confidential',         // Internal code

  // PUBLIC: Tracked but not flagged as risky
  'personal_cloud': 'public',           // Public Cloud (e.g. Drive, Dropbox)
  'email_platforms': 'public',          // Public email
  'public_ai': 'public',                // Public AI tools
  'risky_share': 'public',              // File sharing
  'social_media': 'public',             // Social platforms
  'dev_tools': 'public',                // Dev sandboxes
  'job_portals': 'public',              // Recruitment
  'entertainment': 'public',            // Streaming, video, learning (tracked, not risky)
  'unknown': 'unknown',                 // Unclassified
};

// ============================================================================
// CLASSIFICATION LOGIC
// ============================================================================

/**
 * Extracts hostname from a URL string
 */
function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    // If URL parsing fails, try to extract hostname manually
    const match = url.match(/^(?:https?:\/\/)?([^\/\?#]+)/i);
    return match ? match[1].toLowerCase() : '';
  }
}

/**
 * Checks if a hostname matches a domain pattern using suffix matching
 * Example: "app.slack.com" matches "slack.com"
 */
function matchesDomain(hostname: string, pattern: string): boolean {
  // Exact match
  if (hostname === pattern) {
    return true;
  }

  // Suffix match (hostname ends with .pattern)
  if (hostname.endsWith('.' + pattern)) {
    return true;
  }

  return false;
}

/**
 * Classifies a URL into a domain category
 * Uses longest match wins strategy for accuracy
 */
export function classifyDomain(url: string): DomainCategory {
  const hostname = extractHostname(url);

  if (!hostname) {
    return 'unknown';
  }

  let bestMatch: { category: DomainCategory; length: number } = {
    category: 'unknown',
    length: 0,
  };

  // Check each category
  for (const [category, domains] of Object.entries(DOMAIN_REGISTRY)) {
    for (const domain of domains) {
      if (matchesDomain(hostname, domain)) {
        // Longest match wins
        if (domain.length > bestMatch.length) {
          bestMatch = {
            category: category as DomainCategory,
            length: domain.length,
          };
        }
      }
    }
  }

  return bestMatch.category;
}

/**
 * Checks if a URL belongs to a specific category
 */
export function isCategory(url: string, category: DomainCategory): boolean {
  return classifyDomain(url) === category;
}

/**
 * Gets all domains for a specific category (useful for debugging)
 */
export function getDomainsForCategory(category: DomainCategory): string[] {
  return DOMAIN_REGISTRY[category] || [];
}

/**
 * Get risk level for a URL
 */
export function getRiskLevel(url: string): string {
  const category = classifyDomain(url);
  return CATEGORY_RISK_LEVELS[category] || 'unknown';
}

/**
 * Adds a custom domain to a category (runtime only, not persisted)
 */
export function addDomainToCategory(domain: string, category: DomainCategory): void {
  if (!DOMAIN_REGISTRY[category]) {
    DOMAIN_REGISTRY[category] = [];
  }
  if (!DOMAIN_REGISTRY[category].includes(domain)) {
    DOMAIN_REGISTRY[category].push(domain);
  }
}
