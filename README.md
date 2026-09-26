# AgentSentry — Autonomous Point-in-Time API SLA & Degradation Insurance Protocol

> **Hackathon Track:** Agentic Economy Infrastructure / Subjective Consensus / P2P Insurance  
> **Network:** GenLayer studionet (Chain ID: `61999` / `0xF22F`)  
> **Deployed Contract:** [`0x3339bFB2b7E345F4aB4476Ab68BB542690b627d4`](https://explorer-studio.genlayer.com/address/0x3339bFB2b7E345F4aB4476Ab68BB542690b627d4)  
> **Live App:** [https://agentsentry-eta.vercel.app](https://agentsentry-eta.vercel.app)  
> **One-liner:** Autonomous API SLA & uptime insurance protocol for AI agents, adjudicated on-chain via GenLayer consensus.

---

## 🧠 The Problem

In the autonomous AI economy, thousands of agents (trading bots, customer support agents, multi-agent pipelines) depend on external API endpoints 24/7. When these APIs go down — or silently degrade (returning HTTP 200 with malformed schema or empty fallback responses) — autonomous agents lose capital and mission progress with **no automated recourse**:

- **Traditional insurance** doesn't cover API degradation — no objective evidence, manual paperwork.
- **Solidity smart contracts** cannot ping external endpoints without centralized oracles.
- **Off-chain telemetry claims** are non-binding and prone to dispute.

## 💡 The Solution — Point-in-Time SLA Health Verification

AgentSentry implements an **autonomous, zero-oracle point-in-time SLA insurance court**:
1. **Underwriting Escrow**: Liquidity providers stake capital to underwrite uptime guarantees for specific endpoints and earn yield.
2. **On-Demand Web Probes**: When an incident claim or health audit is triggered, GenLayer validator nodes natively execute `gl.nondet.web.render` HTTP probes across diverse geographies to verify endpoint responsiveness.
3. **Decentralized LLM Consensus**: Validators run on-chain LLM consensus (`gl.vm.run_nondet`) to evaluate semantic health, error bodies, latency, and schema compliance.
4. **Instant Payout & Triage**:
   - **Confirmed Outage (`INCIDENT_VERIFIED`)**: Instant payout of full coverage + deposit refund to consumer.
   - **Healthy Endpoint (`ENDPOINT_HEALTHY`)**: Claim rejected; anti-spam deposit forfeited to underwriter pool.
   - **Probe or Model Failure (`INCONCLUSIVE`)**: Underwriter collateral is **100% protected**; claimant deposit is preserved for refund or retry.

---

## 🛡️ Robust Security & Game-Theoretic Safeguards

Based on steward feedback and rigorous verification:
1. **Valid Elapsed-Time Mechanism**: Replaces counter-based timing with real Unix epoch timestamps (`_get_current_timestamp()` derived from transaction context `gl.message_raw["datetime"]` and WASI environment). Expiry and 24h stalled-claim recovery enforce genuine elapsed time.
2. **Inconclusive Failure Triage (NO Auto-Payout)**: If web probing fails (network drop, DNS timeout) or LLM output fails to parse, the contract enters `CLAIM_INCONCLUSIVE` (status 5). Underwriter funds are **never drained** on ambiguous errors. Claimants can safely withdraw their anti-spam deposit via `withdraw_inconclusive_deposit`.
3. **Contract-Recorded Observations**: Active policies persistently record verified point-in-time health checks (`last_observation_timestamp`, `last_observation_status_code`, `last_observation_latency_ms`, `last_observation_verdict`, `last_observation_reason`, `observation_count`) directly in contract storage via `record_health_check`.

---

## 🏗 Architecture & Contract Methods

```
Underwriter (Funder)                Consumer (Beneficiary)
        │                                     │
        ├─ purchase_policy()                  │
        │  (Locks coverage escrow,            │
        │   sets target URL & schema,         │
        │   duration in seconds)              │
        │                                     ├─ file_outage_claim()
        │                                     │  (Stakes 5% anti-spam deposit)
        │                                     │
        └─────────────────┬───────────────────┘
                          │
            adjudicate_incident() (AI Validators)
                          │
          ├─ gl.nondet.web.render(endpoint_url)
          ├─ gl.nondet.exec_prompt(rubric_prompt)
          └─ gl.vm.run_nondet(leader_fn, validator_fn)
                          │
       ┌──────────────────┼────────────────────────┐
       ▼                  ▼                        ▼
INCIDENT_VERIFIED   ENDPOINT_HEALTHY         INCONCLUSIVE (5)
(HTTP 5xx / schema) (HTTP 200 compliant)     (Probe / Model Fail)
  │                   │                        │
  ▼                   ▼                        ▼
Full Coverage Payout  Anti-spam deposit        Underwriter Safe.
+ Deposit Refunded    absorbed into pool       Deposit preserved /
to Consumer           (Underwriter protected)  Claimant can withdraw
```

### Smart Contract Methods (`contracts/contract.py`)

| Method | Type | Description |
|---|---|---|
| `purchase_policy` | write.payable | Underwriter locks insurance coverage escrow; sets duration in seconds |
| `file_outage_claim` | write.payable | Consumer stakes 5% anti-spam deposit to trigger point-in-time adjudication |
| `adjudicate_incident` | write | AI Jury probes endpoint on-chain, reaches LLM consensus on verdict |
| `withdraw_inconclusive_deposit` | write | Claimant recovers anti-spam deposit if probe/model triage was inconclusive |
| `record_health_check` | write | Records verifiable point-in-time SLA health audit observation on-chain |
| `reclaim_expired_coverage` | write | Underwriter reclaims capital after expiration or after 24h stalled claim |
| `get_policy` | view | JSON representation of policy, timestamps, and contract observations |
| `get_policies_paginated` | view | Paginated list of policies for dashboard |
| `get_stats` | view | Aggregate protocol metrics (locked coverage, settled claims) |

---

## 🧪 Comprehensive Test Suite (`tests/test_agentsentry.py`)

All 11 integration tests run directly on GenVM via `gltest` (`direct_vm` & `direct_deploy`) with 100% pass rate:

```bash
pytest tests/test_agentsentry.py -v
```

```text
tests/test_agentsentry.py::TestPolicyTimingAndExpiry::test_purchase_policy_sets_unix_timestamps PASSED [  9%]
tests/test_agentsentry.py::TestPolicyTimingAndExpiry::test_underwriter_cannot_reclaim_before_expiry PASSED [ 18%]
tests/test_agentsentry.py::TestPolicyTimingAndExpiry::test_underwriter_reclaims_after_real_time_expiry PASSED [ 27%]
tests/test_agentsentry.py::TestStalledClaimTiming::test_stalled_claim_prevents_premature_reclaim PASSED [ 36%]
tests/test_agentsentry.py::TestStalledClaimTiming::test_stalled_claim_recovers_after_24h_timeout PASSED [ 45%]
tests/test_agentsentry.py::TestFailureCasesInconclusive::test_probe_failure_enters_inconclusive_no_payout PASSED [ 54%]
tests/test_agentsentry.py::TestFailureCasesInconclusive::test_model_failure_enters_inconclusive_no_payout PASSED [ 63%]
tests/test_agentsentry.py::TestHappyPaths::test_incident_verified_triggers_payout PASSED [ 72%]
tests/test_agentsentry.py::TestHappyPaths::test_endpoint_healthy_forfeits_anti_spam_deposit PASSED [ 81%]
tests/test_agentsentry.py::TestContractRecordedObservations::test_record_health_check_persists_observation PASSED [ 90%]
tests/test_agentsentry.py::TestViewsAndPagination::test_pagination_and_counts PASSED [100%]

============================= 11 passed in 1.84s ==============================
```

---

## 🌐 On-Chain Deployment & Verification

- **Network:** GenLayer Studionet
- **Chain ID:** `61999` (`0xF22F`)
- **RPC Endpoint:** `https://studio.genlayer.com/api`
- **Contract Address:** [`0x3339bFB2b7E345F4aB4476Ab68BB542690b627d4`](https://explorer-studio.genlayer.com/address/0x3339bFB2b7E345F4aB4476Ab68BB542690b627d4)
- **Deployment Transaction:** `0xb8b423842cf755bfcce7d9f6f55d9515b76d32211dd2fd771a090f43a20938ac` (Status: ACCEPTED, 5/5 Validators Agreed)
- **Live Tested Policies:**
  - `sentry-1`: Live `httpbin.org/status/503` endpoint probe triggered on-chain. Correctly entered `CLAIM_INCONCLUSIVE` (`INCONCLUSIVE_PROBE_FAILED`) without draining underwriter collateral.
  - `sentry-2`: Live ACTIVE policy funded with 0.05 GEN coverage for user testing (`0x52C5E913Fc54d00cbA5Df3312268bf66035661F8`).

---

## 🚀 How to Run Locally

### 1. Run Tests
```bash
pytest tests/test_agentsentry.py -v
```

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Build Production Bundle
```bash
cd frontend
npm run build
```
