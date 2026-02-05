# UnderSec - Privacy-First Risk Awareness Chrome Extension



A hackathon-grade, enterprise-ready Chrome Extension (Manifest V3) for privacy-first behavioral risk awareness.



\## Project StatusUnderSec: Privacy-First Behavioral Risk AwarenessA "Clientless" Security Layer for the Modern Workspace.UnderSec is a lightweight Chrome Extension (Manifest V3) that provides enterprise-grade data protection and User and Entity Behavior Analytics (UEBA) without the need for high-cost VPNs or company-managed hardware. It is specifically designed for high-workload environments where employees must use AI tools safely on personal or unmanaged devices. The "Bridge" AdvantageCost-Efficient Security: Eliminates the need for expensive VPN licenses and corporate laptop shipping for interns or remote contractors.Productivity-First: Unlike rigid firewalls, UnderSec uses Risk-Adaptive Protection to allow high AI usage while only intervening when data exfiltration patterns are detected.Privacy-by-Design: Operates on a "Metadata-Only" model, ensuring personal browsing remains private while work-related data movement is secured. Key Features1. Intelligent Risk DetectionGenerative AI Guardrails: Tracks public_ai_paste_count to detect potential intellectual property leaks into public LLMs.Cloud Exfiltration Tracking: Monitors personal_cloud_upload_attempt_count to prevent unauthorized data movement to personal storage.Anomaly Context: Detects new_geo_flag and off_hours_flag to identify compromised accounts or high-risk "flight risk" behaviors.2. Multi-Tiered Intervention SystemAwareness (Warn): Real-time "coaching" banners that educate users on safe data handling.Governance (Ack Required): Just-in-time modals requiring users to confirm they are following company protocol before proceeding with high-volume tasks.Simulated Enforcement (Block): Demonstrates how automated "self-healing" workflows can stop a high-risk event in its tracks.🛠️ Tech Stack & ArchitectureCore: TypeScript, Manifest V3, Webpack 5.Storage: chrome.storage.local for zero-latency local state management.Validation: Pydantic-ready JSON schema for backend integration.Plaintextextension/
├── src/
│   ├── background/      # UEBA logic & State management
│   ├── content/         # Risk event listeners (Paste/Upload)
│   ├── intervention/    # Adaptive UI Components (Banners/Modals)
│   └── demo/            # Automated risk-simulation scripts

 ->Privacy CommitmentsWe Track (Event Metadata)We NEVER Track (Private Content)Paste/Upload FrequenciesClipboard Text or File ContentDomain Categories (e.g., "AI Tool")Full URL Paths or Search HistoryRisk-Related TimestampsKeystroke Data or Video Feeds Build & RunBashcd extension
npm install
npm run build
Open Chrome and navigate to chrome://extensions.Enable Developer Mode.Click Load unpacked and select the extension/dist folder.



\- \*\*Project Type\*\*: Chrome Extension (Manifest V3) + TypeScript

\- \*\*Build System\*\*: Webpack 5

\- \*\*UI Framework\*\*: Vanilla TypeScript with CSS

\- \*\*Storage\*\*: chrome.storage.local



\## Key Features



\### Privacy-First Design

\- \*\*Count-only telemetry\*\* - Never reads clipboard content, file data, or keystrokes

\- \*\*Domain categorization\*\* - Only tracks domain category, not full URLs

\- \*\*User transparency\*\* - Full visibility into what's tracked and why



\### Risk Detection

\- \*\*Paste detection\*\* on public AI platforms (ChatGPT, Claude, etc.)

\- \*\*Upload detection\*\* on personal cloud services (Drive, Dropbox)

\- \*\*Domain tracking\*\* with category classification



\### Intervention System

\- \*\*warn\*\*: Dismissible banner for medium risk

\- \*\*ack\_required\*\*: Modal requiring user acknowledgment

\- \*\*block\_simulated\*\*: Full-screen block for highest risk (demo mode)



\## Architecture



```

extension/

├── src/

│   ├── background/      # Service worker (event routing, state, API)

│   ├── content/         # Content scripts (paste/upload detection)

│   ├── popup/           # Extension popup UI

│   ├── intervention/    # Banner/modal/block components

│   ├── shared/          # Types, constants, utilities

│   └── demo/            # Demo mode utilities

├── dist/                # Built extension (load this in Chrome)

└── manifest.json        # MV3 manifest

```



\## Build \& Run



```bash

cd extension

npm install

npm run build

```



Then load `extension/dist` in Chrome (chrome://extensions → Load unpacked)



\## Documentation



\- `extension/ARCHITECTURE.md` - System design diagrams

\- `extension/FILE\_TREE.md` - Complete file structure

\- `extension/DEPLOYMENT.md` - Demo script \& talking points



\## Privacy Guarantees



| What We Collect | What We Never Collect |

|-----------------|----------------------|

| Event counts | Clipboard content |

| Domain category | File names/metadata |

| Timestamps | URL paths |

| | Keystroke data |



