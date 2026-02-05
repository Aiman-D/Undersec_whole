\# UnderSec Extension - System Architecture



\## PHASE 1 — SYSTEM DESIGN



\### 1.1 Architecture Diagram (ASCII)



```

┌─────────────────────────────────────────────────────────────────────────────────┐

│                           UnderSec CHROME EXTENSION                             │

│                         Privacy-First Risk Awareness System                      │

└─────────────────────────────────────────────────────────────────────────────────┘



┌─────────────────────────────────────────────────────────────────────────────────┐

│                              BROWSER CONTEXT                                     │

│  ┌─────────────────────────────────────────────────────────────────────────┐   │

│  │                         SERVICE WORKER (Background)                       │   │

│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │

│  │  │ background.ts│  │  storage.ts  │  │    api.ts    │  │ windowMgr.ts│  │   │

│  │  │              │  │              │  │              │  │             │  │   │

│  │  │ • Event hub  │  │ • State CRUD │  │ • /score     │  │ • 5-min     │  │   │

│  │  │ • State      │  │ • Windows    │  │ • /ingest    │  │   rolling   │  │   │

│  │  │   machine    │  │   history    │  │ • Retry      │  │ • Counters  │  │   │

│  │  │ • Routing    │  │ • Settings   │  │   logic      │  │ • Flush     │  │   │

│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │   │

│  │         │                 │                 │                 │         │   │

│  │         └─────────────────┴─────────────────┴─────────────────┘         │   │

│  │                                   │                                     │   │

│  └───────────────────────────────────┼─────────────────────────────────────┘   │

│                                      │                                          │

│                         chrome.runtime.sendMessage()                            │

│                                      │                                          │

│  ┌───────────────────────────────────┼─────────────────────────────────────┐   │

│  │                         CONTENT SCRIPTS                                  │   │

│  │         ┌─────────────────────────┴─────────────────────────┐           │   │

│  │         │                                                   │           │   │

│  │  ┌──────▼──────┐  ┌──────────────┐  ┌──────────────┐       │           │   │

│  │  │pasteDetector│  │uploadDetector│  │domainTracker │       │           │   │

│  │  │             │  │              │  │              │       │           │   │

│  │  │ • paste     │  │ • file input │  │ • Navigation │       │           │   │

│  │  │   events    │  │ • drag/drop  │  │   events     │       │           │   │

│  │  │ • COUNT     │  │ • COUNT      │  │ • Classify   │       │           │   │

│  │  │   ONLY      │  │   ONLY       │  │   domain     │       │           │   │

│  │  └─────────────┘  └──────────────┘  └──────────────┘       │           │   │

│  │                                                             │           │   │

│  └─────────────────────────────────────────────────────────────┘           │   │

│                                                                             │   │

│  ┌─────────────────────────────────────────────────────────────────────┐   │   │

│  │                         INTERVENTION UI                              │   │   │

│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │   │

│  │  │  Banner.ts   │  │  Modal.ts    │  │  Block.ts    │               │   │   │

│  │  │              │  │              │  │              │               │   │   │

│  │  │ • warn       │  │ • ack\_req    │  │ • simulated  │               │   │   │

│  │  │ • dismissible│  │ • must click │  │   block      │               │   │   │

│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │   │

│  └─────────────────────────────────────────────────────────────────────┘   │   │

│                                                                             │   │

│  ┌─────────────────────────────────────────────────────────────────────┐   │   │

│  │                           POPUP UI                                   │   │   │

│  │  ┌──────────────────────────────────────────────────────────────┐   │   │   │

│  │  │ • Current Label Display                                       │   │   │   │

│  │  │ • Last Risk Score                                             │   │   │   │

│  │  │ • Risk Reasons Panel                                          │   │   │   │

│  │  │ • Pause Monitoring Toggle                                     │   │   │   │

│  │  │ • Privacy Transparency Statement                              │   │   │   │

│  │  │ • Label Selector (Public/Internal/Confidential)               │   │   │   │

│  │  └──────────────────────────────────────────────────────────────┘   │   │   │

│  └─────────────────────────────────────────────────────────────────────┘   │   │

└─────────────────────────────────────────────────────────────────────────────────┘



&nbsp;                                     │

&nbsp;                                     │ HTTPS

&nbsp;                                     ▼

┌─────────────────────────────────────────────────────────────────────────────────┐

│                              BACKEND API SERVER                                  │

│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐    │

│  │      POST /score             │  │         POST /ingest                  │    │

│  │                              │  │                                       │    │

│  │ Input:  Window JSON          │  │ Input:  Window JSON + Decision       │    │

│  │ Output: risk\_score,          │  │ Output: 200 OK                        │    │

│  │         recommended\_action,  │  │                                       │    │

│  │         reasons\[]            │  │ Purpose: Audit trail \& analytics     │    │

│  └──────────────────────────────┘  └──────────────────────────────────────┘    │

└─────────────────────────────────────────────────────────────────────────────────┘

```



\### 1.2 Message Flow Diagram



```

┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐

│  User    │     │   Content    │     │   Service   │     │   Backend  │

│  Action  │     │   Script     │     │   Worker    │     │    API     │

└────┬─────┘     └──────┬───────┘     └──────┬──────┘     └─────┬──────┘

&nbsp;    │                  │                    │                  │

&nbsp;    │  Paste in        │                    │                  │

&nbsp;    │  ChatGPT         │                    │                  │

&nbsp;    │ ─────────────────>                    │                  │

&nbsp;    │                  │                    │                  │

&nbsp;    │                  │  EVENT:            │                  │

&nbsp;    │                  │  PUBLIC\_AI\_PASTE   │                  │

&nbsp;    │                  │  (count only)      │                  │

&nbsp;    │                  │ ───────────────────>                  │

&nbsp;    │                  │                    │                  │

&nbsp;    │                  │                    │  Update window   │

&nbsp;    │                  │                    │  counter         │

&nbsp;    │                  │                    │ ──────────────── │

&nbsp;    │                  │                    │                  │

&nbsp;    │                  │                    │                  │

═════╪══════════════════╪═════════ 5-MINUTE WINDOW END ════════╪══════════

&nbsp;    │                  │                    │                  │

&nbsp;    │                  │                    │  POST /score     │

&nbsp;    │                  │                    │ ─────────────────>

&nbsp;    │                  │                    │                  │

&nbsp;    │                  │                    │  { risk\_score:   │

&nbsp;    │                  │                    │    0.82,         │

&nbsp;    │                  │                    │    action: warn, │

&nbsp;    │                  │                    │    reasons: \[] } │

&nbsp;    │                  │                    │ <─────────────────

&nbsp;    │                  │                    │                  │

&nbsp;    │                  │                    │  POST /ingest    │

&nbsp;    │                  │                    │ ─────────────────>

&nbsp;    │                  │                    │                  │

&nbsp;    │                  │  INTERVENTION:     │                  │

&nbsp;    │                  │  Show banner       │                  │

&nbsp;    │                  │ <───────────────── │                  │

&nbsp;    │                  │                    │                  │

&nbsp;    │  See warning     │                    │                  │

&nbsp;    │  banner          │                    │                  │

&nbsp;    │ <─────────────────                    │                  │

&nbsp;    │                  │                    │                  │

```



\### 1.3 Security \& Privacy Design



\#### 1.3.1 Privacy-First Principles



```

┌─────────────────────────────────────────────────────────────────────┐

│                    WHAT WE COLLECT (COUNT-ONLY)                     │

├─────────────────────────────────────────────────────────────────────┤

│ ✓ Number of paste events to AI domains                             │

│ ✓ Number of file upload attempts to cloud services                 │

│ ✓ Number of domain visits by category                              │

│ ✓ Timestamps of actions (unix epoch)                               │

│ ✓ Domain category (NOT full URLs)                                  │

└─────────────────────────────────────────────────────────────────────┘



┌─────────────────────────────────────────────────────────────────────┐

│                    WHAT WE NEVER COLLECT                            │

├─────────────────────────────────────────────────────────────────────┤

│ ✗ Clipboard contents                                                │

│ ✗ Pasted text content                                               │

│ ✗ File names or metadata                                            │

│ ✗ File contents                                                     │

│ ✗ Full URLs or URL paths                                            │

│ ✗ Keystroke patterns                                                │

│ ✗ Screen captures                                                   │

│ ✗ Form field contents                                               │

│ ✗ Cookie data                                                       │

│ ✗ Browser history                                                   │

└─────────────────────────────────────────────────────────────────────┘

```



\#### 1.3.2 Data Flow Security



```

┌─────────────────────────────────────────────────────────────────────┐

│                       DATA MINIMIZATION                             │

├─────────────────────────────────────────────────────────────────────┤

│                                                                     │

│   User pastes:    "Company Q4 financials show 15% growth..."        │

│                            │                                        │

│                            ▼                                        │

│   Detector sees:  paste event fired on textarea                     │

│                            │                                        │

│                            ▼                                        │

│   We record:      { type: "PUBLIC\_AI\_PASTE", count: +1 }            │

│                                                                     │

│   Content sent:   NOTHING - clipboard never accessed                │

│                                                                     │

└─────────────────────────────────────────────────────────────────────┘

```



\#### 1.3.3 Threat Model



```

┌─────────────────────────────────────────────────────────────────────┐

│                    THREAT MITIGATION MATRIX                         │

├──────────────────────┬──────────────────────────────────────────────┤

│ Threat               │ Mitigation                                   │

├──────────────────────┼──────────────────────────────────────────────┤

│ Data exfiltration    │ No content ever captured or transmitted      │

├──────────────────────┼──────────────────────────────────────────────┤

│ Clipboard sniffing   │ ClipboardEvent.clipboardData never accessed  │

├──────────────────────┼──────────────────────────────────────────────┤

│ Keylogging           │ No keydown/keypress listeners                │

├──────────────────────┼──────────────────────────────────────────────┤

│ URL tracking         │ Only domain suffix matched, paths ignored    │

├──────────────────────┼──────────────────────────────────────────────┤

│ Man-in-middle        │ HTTPS only for API calls                     │

├──────────────────────┼──────────────────────────────────────────────┤

│ Local storage leak   │ chrome.storage.local (encrypted at rest)     │

├──────────────────────┼──────────────────────────────────────────────┤

│ XSS in intervention  │ No innerHTML, DOM API only with escaping     │

└──────────────────────┴──────────────────────────────────────────────┘

```



\#### 1.3.4 Permission Model (Minimal Required)



```json

{

&nbsp; "permissions": \[

&nbsp;   "storage",         // Local state persistence

&nbsp;   "alarms",          // 5-minute window scheduling

&nbsp;   "activeTab"        // Current tab domain classification

&nbsp; ],

&nbsp; "host\_permissions": \[

&nbsp;   "\*://chat.openai.com/\*",

&nbsp;   "\*://chatgpt.com/\*",

&nbsp;   "\*://claude.ai/\*",

&nbsp;   // ... only targeted domains, NOT <all\_urls>

&nbsp; ]

}

```



\### 1.4 State Machine



```

┌─────────────────────────────────────────────────────────────────────┐

│                    WINDOW STATE MACHINE                             │

└─────────────────────────────────────────────────────────────────────┘



&nbsp;                        ┌───────────────┐

&nbsp;                        │    IDLE       │

&nbsp;                        │  (no window)  │

&nbsp;                        └───────┬───────┘

&nbsp;                                │

&nbsp;                   First event / Extension start

&nbsp;                                │

&nbsp;                                ▼

&nbsp;                        ┌───────────────┐

&nbsp;                   ┌───>│   ACTIVE      │<──────────────┐

&nbsp;                   │    │  (collecting) │               │

&nbsp;                   │    └───────┬───────┘               │

&nbsp;                   │            │                       │

&nbsp;                   │    5-min alarm fires               │

&nbsp;                   │            │                       │

&nbsp;                   │            ▼                       │

&nbsp;                   │    ┌───────────────┐               │

&nbsp;                   │    │   SCORING     │               │

&nbsp;                   │    │  (API call)   │               │

&nbsp;                   │    └───────┬───────┘               │

&nbsp;                   │            │                       │

&nbsp;                   │     API response                   │

&nbsp;                   │            │                       │

&nbsp;                   │            ▼                       │

&nbsp;                   │    ┌───────────────┐               │

&nbsp;                   │    │ INTERVENING   │               │

&nbsp;                   │    │ (if needed)   │               │

&nbsp;                   │    └───────┬───────┘               │

&nbsp;                   │            │                       │

&nbsp;                   │    Intervention complete           │

&nbsp;                   │    / user dismissed                │

&nbsp;                   │            │                       │

&nbsp;                   └────────────┘                       │

&nbsp;                                                       │

&nbsp;                        ┌───────────────┐              │

&nbsp;                        │    PAUSED     │──────────────┘

&nbsp;                        │  (user opt)   │  pause\_until\_ts expired

&nbsp;                        └───────────────┘

```



\### 1.5 Intervention Decision Tree



```

&nbsp;                             ┌─────────────────┐

&nbsp;                             │  Scorer returns │

&nbsp;                             │  risk\_score +   │

&nbsp;                             │  action         │

&nbsp;                             └────────┬────────┘

&nbsp;                                      │

&nbsp;             ┌────────────────────────┼────────────────────────┐

&nbsp;             │                        │                        │

&nbsp;             ▼                        ▼                        ▼

&nbsp;   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐

&nbsp;   │ action: "none"  │      │ action: "warn"  │      │action:"ack\_req" │

&nbsp;   └────────┬────────┘      └────────┬────────┘      └────────┬────────┘

&nbsp;            │                        │                        │

&nbsp;            ▼                        ▼                        ▼

&nbsp;   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐

&nbsp;   │   Do nothing    │      │  Show banner    │      │   Show modal    │

&nbsp;   │                 │      │  (dismissible)  │      │  (must click)   │

&nbsp;   └─────────────────┘      │                 │      │                 │

&nbsp;                            │  • Title        │      │  • Reasons      │

&nbsp;                            │  • Top 2        │      │  • "I understand│

&nbsp;                            │    reasons      │      │    the risk"    │

&nbsp;                            │  • Continue btn │      │    button       │

&nbsp;                            │  • Change label │      │                 │

&nbsp;                            └─────────────────┘      └─────────────────┘



&nbsp;                                                             │

&nbsp;             ┌───────────────────────────────────────────────┘

&nbsp;             ▼

&nbsp;   ┌─────────────────┐

&nbsp;   │action:"block\_   │

&nbsp;   │ simulated"      │

&nbsp;   └────────┬────────┘

&nbsp;            │

&nbsp;            ▼

&nbsp;   ┌─────────────────┐

&nbsp;   │ Show block      │

&nbsp;   │ overlay         │

&nbsp;   │                 │

&nbsp;   │ • Disable paste │

&nbsp;   │ • Disable upload│

&nbsp;   │ • 30s cooldown  │

&nbsp;   │ • Override code │

&nbsp;   │   (for demo)    │

&nbsp;   └─────────────────┘

```



---



\## Summary



This architecture ensures:



1\. \*\*Privacy by Design\*\*: Count-only telemetry, never content

2\. \*\*User Control\*\*: Pause, label selection, full transparency

3\. \*\*Just-in-Time Intervention\*\*: Non-blocking warnings, escalating responses

4\. \*\*Auditability\*\*: Every decision logged via /ingest

5\. \*\*Hackathon Ready\*\*: Clean separation, easy to demo



