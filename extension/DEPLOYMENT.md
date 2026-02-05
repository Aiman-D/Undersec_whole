\# UnderSec - Deployment \& Demo Guide



\## PHASE 8 — DEPLOYMENT



\### 8.1 Building the Extension



```bash

\# Navigate to extension directory

cd extension



\# Install dependencies

npm install



\# Build the extension

npm run build



\# The dist/ folder now contains the loadable extension

```



\### 8.2 Loading in Chrome



1\. \*\*Open Chrome Extensions Page\*\*

&nbsp;  - Navigate to `chrome://extensions/`

&nbsp;  - Or: Menu → More Tools → Extensions



2\. \*\*Enable Developer Mode\*\*

&nbsp;  - Toggle "Developer mode" switch in the top-right corner



3\. \*\*Load the Extension\*\*

&nbsp;  - Click "Load unpacked"

&nbsp;  - Select the `extension/dist` folder

&nbsp;  - The UnderSec extension should now appear



4\. \*\*Pin the Extension\*\*

&nbsp;  - Click the puzzle piece icon in Chrome toolbar

&nbsp;  - Click the pin icon next to "UnderSec"



\### 8.3 Verifying Installation



1\. Click the UnderSec icon - popup should appear

2\. Check that "Monitoring Active" status is shown

3\. Try selecting different labels (Public/Internal/Confidential)

4\. Open Chrome DevTools → Console to see debug logs



---



\## Demo Script (2 Minutes)



\### Setup (30 seconds)

1\. Have the extension loaded and pinned

2\. Open ChatGPT (chat.openai.com) in a tab

3\. Open Google Drive (drive.google.com) in another tab

4\. Have the popup visible



\### Demo Flow



\#### Part 1: Show the Popup (20 seconds)

> "This is UnderSec - a privacy-first risk awareness extension. Notice we show the current data label and last risk score. The privacy badge shows we only collect counters, never content."



\#### Part 2: Set Confidential Label (10 seconds)

> "Let's set our work to Confidential - simulating handling sensitive data."



\*Click the Confidential button in the popup\*



\#### Part 3: Trigger Warning (30 seconds)

> "Now watch what happens when I paste to a public AI..."



\*Click "Simulate Paste" in the demo section\*



> "The extension detected a paste event, scored the risk, and showed this warning banner. Notice it explains WHY - 'Confidential label + public AI paste'. The user can continue or change their label."



\*Click "Continue Anyway"\*



\#### Part 4: Trigger High Risk (30 seconds)

> "Multiple risky actions escalate the response..."



\*Click "Simulate Paste" twice, then "Simulate Upload"\*



> "Now we see an acknowledgment modal. The user must explicitly accept the risk. This is the 'ack\_required' tier."



\*Click "I Understand the Risk"\*



\#### Part 5: Show Block (20 seconds)

> "For the highest risk scenarios, we can simulate a block..."



\*In the popup, ensure Confidential is selected, then trigger multiple events\*



> "This full-screen block shows what production enforcement would look like. There's a demo override, but in production this would require manager approval."



\### Closing (10 seconds)

> "Key points: Privacy-first design - we never read clipboard or file contents. Just-in-time interventions with clear explanations. Full transparency with the user."



---



\## Talking Points



\### For Judges



\#### 1. Privacy-First Architecture

\- "We deliberately chose NOT to read clipboard or file contents"

\- "Count-only telemetry gives us risk signals without privacy invasion"

\- "This design could pass GDPR/CCPA review"



\#### 2. Explainable AI/Decisions

\- "Every intervention shows exactly WHY it was triggered"

\- "Users aren't just blocked - they understand the risk factors"

\- "This builds trust and changes behavior long-term"



\#### 3. Graduated Response

\- "Low risk = no interruption, just logging"

\- "Medium risk = dismissible warning"

\- "High risk = required acknowledgment"

\- "Highest risk = simulated block with audit trail"



\#### 4. Enterprise-Ready Design

\- "Rolling 5-minute windows balance real-time with noise reduction"

\- "Tenant/user model supports multi-org deployment"

\- "Policy-based thresholds are configurable"



\### Technical Highlights



\- \*\*Manifest V3 Compliant\*\*: Uses service workers, not background pages

\- \*\*Type-Safe\*\*: Full TypeScript with strict mode

\- \*\*Modular\*\*: Clean separation between detection, scoring, and intervention

\- \*\*Testable\*\*: Demo mode enables full flow testing without real data



\### Potential Questions \& Answers



\*\*Q: How accurate is the risk scoring?\*\*

> "The demo uses heuristic scoring. In production, this would be a trained ML model using aggregated organizational data. The architecture supports swapping in any scoring backend."



\*\*Q: What about false positives?\*\*

> "The graduated response handles this - warnings are just awareness, not blocks. Users can continue and we learn from their choices."



\*\*Q: How does this scale?\*\*

> "Each client only sends aggregated 5-minute windows. The backend sees ~288 requests per user per day maximum. Scoring is stateless and horizontally scalable."



\*\*Q: Why not use the clipboard API to detect sensitive content?\*\*

> "That would require reading user data, which violates our privacy-first principle. Our approach proves you can achieve security awareness without surveillance."



---



\## Troubleshooting



\### Extension Not Loading

\- Ensure you're loading from `dist/` not `src/`

\- Check for TypeScript compilation errors in build output

\- Verify manifest.json is valid JSON



\### Content Scripts Not Injecting

\- Check that the URL matches patterns in manifest.json

\- Refresh the page after loading extension

\- Check for errors in page console



\### Popup Not Working

\- Check for errors in popup DevTools (right-click popup → Inspect)

\- Verify chrome.storage permissions are granted



\### Interventions Not Showing

\- Use demo buttons to trigger events

\- Check background service worker console (chrome://extensions → Inspect views: service worker)

\- Ensure monitoring isn't paused



---



\## Next Steps (Post-Hackathon)



1\. \*\*Real Scoring API\*\*: Replace mock with ML-based scorer

2\. \*\*Admin Dashboard\*\*: Policy configuration UI

3\. \*\*Audit Reporting\*\*: Compliance reports from /ingest data

4\. \*\*Browser Support\*\*: Firefox, Edge versions

5\. \*\*Native Integration\*\*: OS-level monitoring options



