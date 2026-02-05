\# UnderSec Extension - File Structure



\## PHASE 2 — FILE TREE



```

extension/

├── manifest.json                    # Chrome MV3 manifest (entry point)

├── ARCHITECTURE.md                  # System design documentation

├── FILE\_TREE.md                     # This file

├── tsconfig.json                    # TypeScript configuration

├── package.json                     # Dependencies \& build scripts

├── webpack.config.js                # Bundler configuration

│

├── icons/                           # Extension icons

│   ├── icon16.png

│   ├── icon32.png

│   ├── icon48.png

│   └── icon128.png

│

├── dist/                            # Built extension (load this in Chrome)

│   ├── manifest.json

│   ├── background.js

│   ├── content/

│   │   ├── publicAi.js

│   │   ├── personalCloud.js

│   │   └── allUrls.js

│   ├── popup/

│   │   ├── popup.html

│   │   └── popup.js

│   ├── intervention/

│   │   └── intervention.js

│   └── icons/

│

└── src/                             # Source code

&nbsp;   │

&nbsp;   ├── shared/                      # Shared types \& utilities

&nbsp;   │   ├── types.ts                 # All TypeScript interfaces

&nbsp;   │   ├── constants.ts             # Configuration constants

&nbsp;   │   ├── domains.ts               # Domain classification logic

&nbsp;   │   └── utils.ts                 # Helper functions

&nbsp;   │

&nbsp;   ├── background/                  # Service Worker (MV3)

&nbsp;   │   ├── index.ts                 # Entry point, event routing

&nbsp;   │   ├── storage.ts               # chrome.storage.local wrapper

&nbsp;   │   ├── api.ts                   # REST API client (/score, /ingest)

&nbsp;   │   ├── windowManager.ts         # 5-minute rolling window engine

&nbsp;   │   └── interventionDispatcher.ts# Sends intervention commands

&nbsp;   │

&nbsp;   ├── content/                     # Content scripts (injected)

&nbsp;   │   ├── base.ts                  # Shared content script utilities

&nbsp;   │   ├── pasteDetector.ts         # Paste event counter

&nbsp;   │   ├── uploadDetector.ts        # File upload counter

&nbsp;   │   └── domainTracker.ts         # Domain visit tracking

&nbsp;   │

&nbsp;   ├── popup/                       # Popup UI

&nbsp;   │   ├── popup.html               # Popup HTML structure

&nbsp;   │   ├── popup.ts                 # Popup logic

&nbsp;   │   └── popup.css                # Popup styles

&nbsp;   │

&nbsp;   ├── intervention/                # Injected intervention UI

&nbsp;   │   ├── index.ts                 # Intervention entry point

&nbsp;   │   ├── banner.ts                # Warning banner component

&nbsp;   │   ├── modal.ts                 # Acknowledgment modal

&nbsp;   │   ├── block.ts                 # Simulated block overlay

&nbsp;   │   └── styles.ts                # Injected CSS-in-JS

&nbsp;   │

&nbsp;   └── demo/                        # Demo mode utilities

&nbsp;       ├── fakeEventEmitter.ts      # Simulates user activity

&nbsp;       └── mockApi.ts               # Local mock for /score \& /ingest

```



\## File Responsibilities



\### `/src/shared/`



| File | Purpose |

|------|---------|

| `types.ts` | All interfaces: Window, Event, ScoreResponse, Settings |

| `constants.ts` | WINDOW\_DURATION, API\_ENDPOINTS, VERSION |

| `domains.ts` | `classifyDomain(url)` with suffix matching |

| `utils.ts` | `nowUnix()`, `sanitize()`, `debounce()` |



\### `/src/background/`



| File | Purpose |

|------|---------|

| `index.ts` | Main orchestrator, receives messages, manages lifecycle |

| `storage.ts` | `get()`, `set()`, `getWindow()`, `saveWindow()` |

| `api.ts` | `postScore(window)`, `postIngest(window, decision)` |

| `windowManager.ts` | Rolling window state, counter updates, flush logic |

| `interventionDispatcher.ts` | Sends `SHOW\_INTERVENTION` to content scripts |



\### `/src/content/`



| File | Injected On | Detects |

|------|-------------|---------|

| `pasteDetector.ts` | public\_ai domains | paste → textarea/contenteditable |

| `uploadDetector.ts` | personal\_cloud domains | input\[type=file], drag-drop |

| `domainTracker.ts` | all\_urls | navigation events |



\### `/src/intervention/`



| File | When Used |

|------|-----------|

| `banner.ts` | `recommended\_action: "warn"` |

| `modal.ts` | `recommended\_action: "ack\_required"` |

| `block.ts` | `recommended\_action: "block\_simulated"` |



\### `/src/demo/`



| File | Purpose |

|------|---------|

| `fakeEventEmitter.ts` | Dispatches fake events for hackathon demo |

| `mockApi.ts` | Returns hardcoded scores without real backend |



\## Build Output



The `dist/` folder is what gets loaded into Chrome:

\- All TypeScript compiled to JavaScript

\- Bundled per entry point

\- Manifest and icons copied



