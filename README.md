# AgentSentry — Autonomous AI Agent SLA & API Degradation Insurance Protocol

> **Hackathon Track:** Agentic Economy Infrastructure / Subjective Consensus / P2P Insurance  
> **Network:** GenLayer studionet (Chain ID: 61999)  
> **One-liner:** Decentralized insurance that auto-detects API outages on-chain and pays claims instantly — no oracle, no paperwork.

---

## 🧠 The Problem

In the autonomous AI economy, thousands of agents (trading bots, customer support agents, data pipeline processors) depend on external API endpoints 24/7. When these APIs go down — or worse, silently degrade (returning HTTP 200 but with garbage data) — consumers suffer financial losses with **no recourse**:

- **Traditional insurance** doesn't cover API outages — no objective evidence, weeks of manual claims
- **Solidity smart contracts** can't ping external endpoints without expensive centralized oracles
- **SLA violations** go undetected because monitoring is off-chain and subjective

## 💡 The Solution — Why GenLayer

AgentSentry is an **on-chain insurance protocol** where GenLayer's AI validators directly probe live API endpoints during claims adjudication:

1. **`gl.nondet.web.render`** fetches the target endpoint response **on-chain** — no oracle needed
2. **`gl.nondet.exec_prompt`** evaluates response quality (schema compliance, error codes, degradation signals)
3. **`gl.vm.run_nondet`** with semantic verdict comparison ensures validators agree on the **meaning** (INCIDENT_VERIFIED vs ENDPOINT_HEALTHY), not the exact wording

**Without GenLayer, this protocol is impossible.** Solidity cannot fetch external APIs or make subjective quality assessments. This is the core of AgentSentry.

---

## 🏗 Architecture

```
Consumer (MetaMask)
  │
  ├─ purchase_policy() ──► Lock coverage escrow + set SLA parameters
  ├─ file_outage_claim() ─► Stake anti-spam deposit + trigger investigation
  │
  └─ adjudicate_incident() ──► AI Validators:
       │                         ├─ gl.nondet.web.render(endpoint_url) → fetch live response
       │                         ├─ gl.nondet.exec_prompt(diagnostic_prompt) → evaluate quality
       │                         └─ gl.vm.run_nondet(leader_fn, validator_fn) → semantic consensus
       │
       ├─ INCIDENT_VERIFIED ──► Auto-payout coverage + return deposit to consumer
       └─ ENDPOINT_HEALTHY ──► Claim rejected, deposit forfeited to coverage pool
```

### Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `purchase_policy` | write.payable | Lock coverage escrow, register endpoint URL + schema invariants |
| `file_outage_claim` | write.payable | Stake anti-spam deposit, trigger incident investigation |
| `adjudicate_incident` | write | AI jury probes endpoint on-chain, reaches semantic consensus |
| `reclaim_expired_coverage` | write | Underwriter reclaims pool after policy expires |
| `get_policy` | view | JSON-serialized policy details |
| `get_policies_paginated` | view | Paginated policy listing |
| `get_stats` | view | Aggregate protocol statistics |

---

## 📁 Project Structure

```
AgentSentry/
├── contracts/
│   └── contract.py              # AgentSentry Intelligent Contract
├── tests/
│   ├── conftest.py              # gltest fixtures + sim_installMocks
│   └── test_agentsentry.py      # Pytest: purchase, claim, adjudicate, reclaim
├── frontend/
│   ├── package.json             # Vite + React 18 + TS + TailwindCSS + genlayer-js
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── config/genlayer.ts   # studionet client setup
│       ├── components/
│       │   ├── Navbar.tsx       # Wallet connect + balance
│       │   ├── StatsBar.tsx     # Protocol metrics
│       │   ├── PurchasePolicy.tsx
│       │   ├── PolicyCard.tsx
│       │   ├── FileClaimModal.tsx
│       │   └── DiagnosticInspectorModal.tsx
│       └── utils/helpers.ts
└── README.md
```

---

## 🚀 Deploy to studionet (Step-by-Step)

### Prerequisites
- MetaMask wallet with GEN balance on **studionet**
- Fund your wallet via [GenLayer Studio → Accounts panel](https://studio.genlayer.com)

### 1. Deploy Contract

1. Open [GenLayer Studio](https://studio.genlayer.com/contracts)
2. Create a new contract, paste the contents of `contracts/contract.py`
3. Deploy → wait for `Status: FINALIZED` AND `Result: SUCCESS`
4. Copy the deployed contract address

### 2. Run Frontend Locally

```bash
cd frontend
npm install
```

Create `.env` file:
```env
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Deploy Frontend (Vercel)

```bash
npm install -g vercel
cd frontend
vercel
```

Set environment variable `VITE_CONTRACT_ADDRESS` in Vercel dashboard.

---

## 🧪 Run Tests

```bash
pip install genlayer-test
cd tests
gltest --network studionet
```

Test scenarios covered:
- ✅ Policy purchase (happy path + zero value + invalid URL + empty schema)
- ✅ Outage claim filing (happy path + insufficient deposit + wrong caller + nonexistent policy)
- ✅ INCIDENT_VERIFIED → automatic payout to consumer
- ✅ ENDPOINT_HEALTHY → deposit forfeited to coverage pool
- ✅ Expired coverage reclamation
- ✅ Pagination and view functions

---

## 🔐 Consensus Design — Scoring Axis 2

The `adjudicate_incident` method uses `gl.vm.run_nondet(leader_fn, validator_fn)` where:

- **Leader** fetches the live endpoint via `gl.nondet.web.render`, then asks the LLM to evaluate response quality
- **Validator** runs the same probe independently and compares **ONLY the verdict** (`INCIDENT_VERIFIED` vs `ENDPOINT_HEALTHY`)
- Differences in the free-text `reason` field are **tolerated** — only the semantic decision matters

This is the pattern that distinguishes score 1 from score 4+ on the Contract Quality axis.

```python
def validator_fn(leader_res) -> bool:
    if not isinstance(leader_res, gl.vm.Return):
        return False
    leader = leader_res.calldata
    mine = leader_fn()
    # ✅ Compare VERDICT ONLY — semantic meaning
    return mine["verdict"] == leader["verdict"]
```

---

## 🌐 Live Demo

- **Live Application:** [https://agentsentry-eta.vercel.app](https://agentsentry-eta.vercel.app)
- **Contract Address (studionet):** `0x8C63E2ec5Df199024b82E4f289aEF645b93893Ee`
- **Explorer:** [View on GenLayer Studio Explorer](https://explorer-studio.genlayer.com/address/0x8C63E2ec5Df199024b82E4f289aEF645b93893Ee)
- **Chain ID:** `61999` (0xF1EF) - GenLayer studionet
- **RPC Endpoint:** `https://studio.genlayer.com/api`

---

## 📺 Video Demo

_[Record a walkthrough showing: wallet connect → purchase policy → file claim → AI adjudication with loading state → verdict + reason display]_

---

## ⚡ Why This CANNOT Exist Without GenLayer

1. **On-chain API probing** — `gl.nondet.web.render` fetches live endpoint responses during consensus. Solidity needs Chainlink/Band oracle feeds which don't cover arbitrary API health.
2. **Subjective quality assessment** — LLM evaluates if a response is "garbage" or "schema-violating". No deterministic oracle can make this judgment.
3. **Decentralized adjudication** — Multiple AI validators independently verify the outage, reaching consensus through semantic comparison. No single point of failure or bias.

---

*Built for GenLayer Builder Program — deployed on studionet via GenLayer Studio.*
