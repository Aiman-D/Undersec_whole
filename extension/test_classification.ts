/**
 * UnderSec - Classification Logic Verifier
 * Run this with `npx ts-node test_classification.ts`
 */

import { classifyDomain } from './src/shared/domains';
import { CATEGORY_TO_LABEL } from './src/shared/domains';

const TEST_CASES = [
    'https://www.google.com/search?q=undersec',
    'https://mail.google.com',
    'https://chatgpt.com',
    'https://gemini.google.com',
    'https://omni.axis.bank.in/dashboard',
    'https://retail.axisbank.co.in',
    'https://www.salesforce.com',
    'https://app.slack.com',
    'https://www.youtube.com',
    'https://unknown-site.com'
];

console.log('--- Domain Classification Test ---\n');

TEST_CASES.forEach(url => {
    const category = classifyDomain(url);
    const label = CATEGORY_TO_LABEL[category] || 'unknown';

    let icon = '❓';
    if (label === 'confidential') icon = '🔒';
    if (label === 'public') icon = '🌐';
    if (label === 'internal') icon = '🏢';

    console.log(`${icon} ${url}`);
    console.log(`   Category: ${category}`);
    console.log(`   Label:    ${label.toUpperCase()}`);
    console.log('-----------------------------------');
});
