/**
 * Standalone Verification Script for UnderSec Logic
 * Mimics src/shared/domains.ts exactly
 */

const DOMAIN_REGISTRY = {
    work_systems: [
        'salesforce.com', 'my.salesforce.com', 'lightning.force.com',
        'dynamics.microsoft.com', 'zoho.com', 'hubspot.com',
        'workday.com', 'successfactors.com', 'adp.com',
        'quickbooks.intuit.com', 'xero.com', 'netsuite.com', 'sap.com', 'oracle.com',
        'sharepoint.com', 'servicenow.com', 'zendesk.com'
    ],
    public_ai: [
        'chat.openai.com', 'chatgpt.com', 'claude.ai', 'gemini.google.com',
        'copilot.microsoft.com', 'perplexity.ai', 'bard.google.com', 'poe.com'
    ],
    personal_cloud: [
        'drive.google.com', 'dropbox.com', 'onedrive.live.com', 'box.com', 'icloud.com', 'mega.nz'
    ],
    approved_work: [
        'notion.so', 'slack.com', 'app.slack.com', 'jira.atlassian.com',
        'atlassian.net', 'github.com', 'gitlab.com', 'linear.app', 'asana.com', 'trello.com'
    ],
    risky_share: [
        'pastebin.com', 'wetransfer.com', 'sendanywhere.com', 'file.io'
    ],
    financial_banking: [
        'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
        'etrade.com', 'fidelity.com', 'schwab.com', 'robinhood.com', 'zerodha.com',
        'icicibank.com', 'hdfcbank.com', 'axisbank.com', 'axis.bank.in',
        'omni.axis.bank.in', 'retail.axisbank.co.in',
        'tradingview.com', 'nasdaq.com', 'nyse.com', 'bloomberg.com'
    ],
    entertainment: [
        'youtube.com', 'netflix.com', 'disneyplus.com', 'spotify.com', 'twitch.tv'
    ]
};

const CATEGORY_TO_LABEL = {
    'work_systems': 'confidential',
    'financial_banking': 'confidential',
    'approved_work': 'internal',
    'personal_cloud': 'public',
    'public_ai': 'public',
    'risky_share': 'public',
    'entertainment': 'public',
    'unknown': 'unknown'
};

function extractHostname(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.toLowerCase();
    } catch {
        const match = url.match(/^(?:https?:\/\/)?([^\/\?#]+)/i);
        return match ? match[1].toLowerCase() : '';
    }
}

function matchesDomain(hostname, pattern) {
    if (hostname === pattern) return true;
    if (hostname.endsWith('.' + pattern)) return true;
    return false;
}

function classifyDomain(url) {
    const hostname = extractHostname(url);
    if (!hostname) return 'unknown';

    let bestMatch = { category: 'unknown', length: 0 };

    for (const [category, domains] of Object.entries(DOMAIN_REGISTRY)) {
        for (const domain of domains) {
            if (matchesDomain(hostname, domain)) {
                if (domain.length > bestMatch.length) {
                    bestMatch = { category, length: domain.length };
                }
            }
        }
    }
    return bestMatch.category;
}

// ==========================================
// TEST EXECUTION
// ==========================================

const TEST_URLS = [
    'https://www.google.com/search?q=test',
    'https://chatgpt.com',
    'https://omni.axis.bank.in',
    'https://www.salesforce.com',
    'https://www.youtube.com'
];

console.log('\n🔍 Verifying Classification Logic...\n');

TEST_URLS.forEach(url => {
    const category = classifyDomain(url);
    const label = CATEGORY_TO_LABEL[category] || 'unknown';

    let icon = '❓';
    if (label === 'confidential') icon = '🔒';
    if (label === 'public') icon = '🌐';
    if (label === 'internal') icon = '🏢';

    console.log(`${icon} ${url}`);
    console.log(`   ► Category: ${category}`);
    console.log(`   ► Label:    ${label.toUpperCase()}`);
    console.log('------------------------------------------------');
});
