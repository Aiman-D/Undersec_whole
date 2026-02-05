# UnderSec Extension



\## 🛡️ Privacy-First Risk Awareness Browser Extension



A Chrome Extension built with Manifest V3 that observes privacy-safe interaction signals, aggregates them into rolling windows, and provides just-in-time risk interventions.



\## Features



\- \*\*Privacy-First\*\*: Count-only telemetry - never reads clipboard, file contents, or keystrokes

\- \*\*Rolling Windows\*\*: 5-minute aggregation windows for balanced real-time awareness

\- \*\*Graduated Interventions\*\*: warn → acknowledge → block escalation

\- \*\*User Transparency\*\*: Full visibility into what's being tracked and why

\- \*\*Demo Mode\*\*: Built-in event simulation for testing and demos



\## Quick Start



```bash

\# Install dependencies

cd extension

npm install



\# Build

npm run build



\# Load in Chrome:

\# 1. Go to chrome://extensions

\# 2. Enable "Developer mode"

\# 3. Click "Load unpacked"

\# 4. Select the extension/dist folder

```



\## Architecture



```

┌─────────────────────────────────────────────────────┐

│                 SERVICE WORKER                       │

│   background.ts → storage.ts → api.ts               │

│   windowManager.ts (5-min rolling aggregation)      │

└──────────────────────┬──────────────────────────────┘

&nbsp;                      │

&nbsp;          chrome.runtime.sendMessage

&nbsp;                      │

┌──────────────────────┴──────────────────────────────┐

│              CONTENT SCRIPTS                         │

│   pasteDetector.ts   uploadDetector.ts              │

│   domainTracker.ts   (COUNT ONLY - NO CONTENT)      │

└─────────────────────────────────────────────────────┘

```



\## What We Track (Count Only)



| Signal | Detection Method | Privacy |

|--------|-----------------|---------|

| AI Pastes | paste event on textarea | ❌ No content read |

| Cloud Uploads | file input change | ❌ No file info read |

| Domain Visits | webNavigation API | ❌ Only category, not URL path |



\## Intervention Tiers



| Risk Level | Action | User Experience |

|------------|--------|-----------------|

| Low (<40%) | `none` | Silent logging |

| Medium (40-70%) | `warn` | Dismissible banner |

| High (70-90%) | `ack\_required` | Modal requiring acknowledgment |

| Critical (>90%) | `block\_simulated` | Full-screen block (demo) |



\## File Structure



```

extension/

├── manifest.json           # MV3 manifest

├── src/

│   ├── background/         # Service worker

│   ├── content/            # Injected scripts

│   ├── popup/              # Extension popup UI

│   ├── intervention/       # Banner/modal/block UI

│   ├── shared/             # Types, constants, utils

│   └── demo/               # Demo event emitters

└── dist/                   # Built extension

```



\## Documentation



\- \[ARCHITECTURE.md](./ARCHITECTURE.md) - System design \& diagrams

\- \[FILE\_TREE.md](./FILE\_TREE.md) - Complete file structure

\- \[DEPLOYMENT.md](./DEPLOYMENT.md) - Build \& demo instructions



\## Tech Stack



\- Chrome Extension (Manifest V3)

\- TypeScript (strict mode)

\- Webpack (bundling)

\- chrome.storage.local (state)

\- chrome.alarms (window timing)



\## Privacy Guarantees



✅ \*\*What We Collect\*\*

\- Count of paste events

\- Count of upload attempts  

\- Domain category visited

\- Timestamps



❌ \*\*What We Never Collect\*\*

\- Clipboard contents

\- File names or metadata

\- URL paths (only domain category)

\- Keystroke data

\- Screen content



\## License



MIT - Built for hackathon demonstration purposes



