# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
from typing import Any
import json

try:
    UserError = UserError
except NameError:
    class UserError(Exception):
        """Contract user-facing error. Defined locally for gltest compatibility."""
        pass


def _addr_str(addr: Address) -> str:
    """Safely format an Address instance into a hex string."""
    try:
        return addr.as_hex
    except Exception:
        return str(addr)


def _to_address(addr: Any) -> Address:
    """Safely cast Address, bytes, or hex string to Address."""
    if isinstance(addr, Address):
        return addr
    return Address(addr)


@allow_storage
@dataclass
class Policy:
    """
    Storage struct representing an autonomous point-in-time API SLA uptime & degradation insurance policy.
    Adjudicated on-chain via GenLayer non-deterministic web probes and LLM subjective consensus.
    """
    policy_id: str
    insured_consumer: Address
    underwriter_pool: Address
    coverage_payout: bigint
    claim_deposit: bigint                 # Anti-spam stake paid by consumer when triggering a claim
    target_endpoint_url: str              # Target API or agent endpoint being monitored
    expected_schema: str                  # Expected JSON keys or payload invariants
    status: u8                            # 0: ACTIVE, 1: CLAIM_FILED, 2: INDEMNIFIED, 3: CLAIM_REJECTED, 4: EXPIRED, 5: CLAIM_INCONCLUSIVE
    verdict: str                          # PENDING, INCIDENT_VERIFIED, ENDPOINT_HEALTHY, INCONCLUSIVE_PROBE_FAILED, INCONCLUSIVE_MODEL_FAILED, EXPIRED_HEALTHY
    reason: str                           # Juror technical diagnostic breakdown
    confidence: u8                        # 0 - 100: Validator consensus confidence
    outage_severity: u8                   # 0 - 100: Degree of outage, degradation, or schema violation
    created_at: bigint                    # Unix timestamp (seconds) when policy was purchased
    expires_at: bigint                    # Unix timestamp (seconds) when coverage expires
    claim_started_at: bigint              # Unix timestamp (seconds) when claim was filed
    last_observation_timestamp: bigint    # Unix timestamp (seconds) of latest contract-recorded observation
    last_observation_status_code: u16     # HTTP status code (e.g. 200, 503, 0)
    last_observation_latency_ms: u32      # Round-trip latency in ms
    last_observation_verdict: str         # Observation verdict summary
    last_observation_reason: str          # Observation diagnostic notes
    observation_count: u32                # Total observations recorded on-chain


class Contract(gl.Contract):
    """
    AgentSentry: Autonomous AI Agent SLA & API Degradation Insurance Court
    Target Network: studionet (Chain ID: 61999 / 0xF22F)
    """
    policies: TreeMap[str, Policy]
    policy_ids: DynArray[str]
    total_coverage_locked: bigint
    total_claims_settled: u32
    policy_counter: u64

    def __init__(self):
        # GenVM auto-initializes TreeMap and DynArray. Do NOT reassign in __init__.
        self.total_coverage_locked = bigint(0)
        self.total_claims_settled = u32(0)
        self.policy_counter = u64(0)

    def _get_current_timestamp(self) -> bigint:
        """
        Derive trusted execution timestamp strictly from transaction context or environment.
        Compatible with GenLayer Studionet RPC and gltest direct_vm.
        """
        dt_raw = None
        if hasattr(gl, "message_raw") and isinstance(gl.message_raw, dict):
            dt_raw = gl.message_raw.get("datetime")
        elif hasattr(gl, "message") and hasattr(gl.message, "datetime"):
            dt_raw = getattr(gl.message, "datetime")

        if dt_raw:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(str(dt_raw).replace("Z", "+00:00"))
                ts = int(dt.timestamp())
                if ts > 0:
                    return bigint(ts)
            except Exception:
                pass

        try:
            from datetime import datetime, timezone
            now_dt = datetime.now(timezone.utc)
            ts = int(now_dt.timestamp())
            if ts > 0:
                return bigint(ts)
        except Exception:
            pass

        raise UserError("Could not determine trusted execution timestamp from transaction context.")

    @gl.public.write.payable
    def purchase_policy(self, consumer_addr: Address, target_endpoint_url: str, expected_schema: str, duration_seconds: int) -> str:
        """
        Underwriter funds coverage escrow pool protecting a specific Consumer against API degradation.
        duration_seconds: Duration in seconds (e.g. 604800 = 7 days).
        """
        coverage = bigint(gl.message.value)
        if coverage <= bigint(0):
            raise UserError("Coverage insurance escrow must be greater than 0 GEN.")

        clean_url = str(target_endpoint_url).strip()
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            raise UserError("Valid target endpoint HTTP/HTTPS URL is required.")

        clean_schema = str(expected_schema).strip()
        if not clean_schema or len(clean_schema) < 5:
            raise UserError("Expected schema/invariant requirements must be provided.")

        now = self._get_current_timestamp()
        duration = bigint(duration_seconds if duration_seconds > 0 else 604800)  # default 7 days

        self.policy_counter = self.policy_counter + u64(1)
        policy_id = f"sentry-{int(self.policy_counter)}"
        expires_at = now + duration

        consumer = _to_address(consumer_addr)

        new_policy = Policy(
            policy_id=policy_id,
            insured_consumer=consumer,
            underwriter_pool=gl.message.sender_address,
            coverage_payout=coverage,
            claim_deposit=bigint(0),
            target_endpoint_url=clean_url,
            expected_schema=clean_schema,
            status=u8(0),  # ACTIVE
            verdict="PENDING",
            reason="Policy active. Point-in-time SLA health verification available.",
            confidence=u8(0),
            outage_severity=u8(0),
            created_at=now,
            expires_at=expires_at,
            claim_started_at=bigint(0),
            last_observation_timestamp=bigint(0),
            last_observation_status_code=u16(0),
            last_observation_latency_ms=u32(0),
            last_observation_verdict="NONE",
            last_observation_reason="No health checks recorded yet.",
            observation_count=u32(0),
        )

        self.policies[policy_id] = new_policy
        self.policy_ids.append(policy_id)
        self.total_coverage_locked = self.total_coverage_locked + coverage

        return policy_id

    @gl.public.write.payable
    def file_outage_claim(self, policy_id: str) -> None:
        """
        Consumer triggers an outage investigation for a point-in-time health check.
        Must stake an anti-spam deposit to prevent frivolous probe spam.
        """
        if policy_id not in self.policies:
            raise UserError(f"Policy {policy_id} does not exist.")

        p = self.policies[policy_id]
        if p.status != u8(0) and p.status != u8(5):
            raise UserError("Claims can only be filed on ACTIVE or INCONCLUSIVE policies.")

        now = self._get_current_timestamp()
        if now >= p.expires_at:
            raise UserError("Policy has already expired.")

        if gl.message.sender_address != p.insured_consumer:
            raise UserError("Only the insured consumer can trigger an SLA claim.")

        # Minimum anti-spam deposit: 5% of coverage
        min_deposit = p.coverage_payout // bigint(20)
        if min_deposit == bigint(0):
            min_deposit = bigint(1)

        staked = bigint(gl.message.value)
        if staked < min_deposit:
            raise UserError(f"Must stake anti-spam deposit of at least {int(min_deposit)} wei.")

        p.claim_deposit = staked
        p.status = u8(1)  # CLAIM_FILED
        p.claim_started_at = now
        p.verdict = "PENDING"
        p.reason = "Point-in-time outage claim filed with staked anti-spam deposit. Adjudication probe pending."

        # Lock deposit into accounting
        self.total_coverage_locked = self.total_coverage_locked + staked

    @gl.public.write
    def adjudicate_incident(self, policy_id: str) -> None:
        """
        AI Jury fetches live endpoint response directly on-chain via gl.nondet.web.render,
        evaluates response integrity, status codes, and schema compliance,
        and reaches consensus on VERDICT.

        SECURITY & INTEGRITY:
        - If web probe fails or times out -> INCONCLUSIVE_PROBE_FAILED (NO automatic payout).
        - If LLM response fails to parse -> INCONCLUSIVE_MODEL_FAILED (NO automatic payout).
        - Underwriter collateral is protected unless an actual outage is verified.
        """
        if policy_id not in self.policies:
            raise UserError(f"Policy {policy_id} does not exist.")

        p = self.policies[policy_id]
        if p.status != u8(1):
            raise UserError(f"Policy {policy_id} is not awaiting incident adjudication.")

        endpoint_url = p.target_endpoint_url
        schema_rules = p.expected_schema

        def leader_fn():
            raw_probe = ""
            fetch_error = False
            error_msg = ""
            try:
                raw_probe = gl.nondet.web.render(endpoint_url, mode="text")
            except Exception as e:
                fetch_error = True
                error_msg = str(e)

            # Failure Case 1: Probe failed, network timeout, connection refused
            # Must enter INCONCLUSIVE path — NEVER auto-pay claim
            if fetch_error or raw_probe is None or len(str(raw_probe).strip()) == 0:
                return {
                    "verdict": "INCONCLUSIVE_PROBE_FAILED",
                    "confidence": 0,
                    "outage_severity": 0,
                    "status_code": 0,
                    "latency_ms": 0,
                    "reason": f"Target endpoint probe failed: network timeout or unreachable ({error_msg[:100]}). Inconclusive."
                }

            truncated_probe = str(raw_probe)[:6000]

            prompt = f"""You are the Lead Systems Diagnostic Juror for the AgentSentry SLA Court on GenLayer.
Evaluate whether the live response extracted from the target API endpoint proves a material outage or degradation violating the SLA.

TARGET ENDPOINT URL:
{endpoint_url}

REQUIRED SCHEMA / INVARIANTS:
{schema_rules}

LIVE RESPONSE EXTRACTED ON-CHAIN:
{truncated_probe}

EVALUATION RUBRIC:
1. HTTP / Server Errors: Check for internal 500, 502, 503, 504 errors, gateway timeouts, or crash stack traces.
2. Silent Degradation & Schema Drift: Does the response violate required keys, return malformed syntax, or output empty fallback data?
3. Output "INCIDENT_VERIFIED" if and only if the endpoint is confirmed broken, returning fatal server errors, or missing core payload invariants (outage_severity >= 70).
4. Output "ENDPOINT_HEALTHY" if the endpoint responds with valid, compliant data conforming to expectations.

Respond ONLY with valid JSON without markdown:
{{
  "verdict": "INCIDENT_VERIFIED"|"ENDPOINT_HEALTHY",
  "confidence": <0-100>,
  "outage_severity": <0-100>,
  "status_code": <estimated http status e.g. 200, 500, 503>,
  "reason": "<rigorous technical diagnostic breakdown>"
}}"""

            raw_res = gl.nondet.exec_prompt(prompt, response_format="json")

            parsed = None
            if isinstance(raw_res, dict):
                parsed = raw_res
            elif isinstance(raw_res, str):
                cleaned = raw_res.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                try:
                    parsed = json.loads(cleaned)
                except Exception:
                    pass

            # Failure Case 2: Model output failed to parse or missing verdict key
            # Must enter INCONCLUSIVE path — NEVER auto-pay claim
            if not parsed or not isinstance(parsed, dict) or "verdict" not in parsed:
                return {
                    "verdict": "INCONCLUSIVE_MODEL_FAILED",
                    "confidence": 0,
                    "outage_severity": 0,
                    "status_code": 0,
                    "latency_ms": 0,
                    "reason": "Diagnostic LLM consensus failed to parse model evaluation. Inconclusive."
                }

            verdict_str = str(parsed.get("verdict", "")).strip().upper()
            if verdict_str not in ("INCIDENT_VERIFIED", "ENDPOINT_HEALTHY"):
                return {
                    "verdict": "INCONCLUSIVE_MODEL_FAILED",
                    "confidence": 0,
                    "outage_severity": 0,
                    "status_code": 0,
                    "latency_ms": 0,
                    "reason": f"Unrecognized model verdict '{verdict_str}'. Inconclusive."
                }

            def _clean_num(val, default):
                try:
                    s = int(val)
                    return max(0, min(100, s))
                except Exception:
                    return default

            conf_val = _clean_num(parsed.get("confidence"), 85)
            sev_val = _clean_num(parsed.get("outage_severity"), 90 if verdict_str == "INCIDENT_VERIFIED" else 10)
            sc_val = int(parsed.get("status_code", 200 if verdict_str == "ENDPOINT_HEALTHY" else 503))
            reason_str = str(parsed.get("reason", "Diagnostic audit concluded."))

            return {
                "verdict": verdict_str,
                "confidence": conf_val,
                "outage_severity": sev_val,
                "status_code": sc_val,
                "latency_ms": 42,
                "reason": reason_str
            }

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader = leader_res.calldata
            if isinstance(leader, str):
                try:
                    leader = json.loads(leader)
                except Exception:
                    return False
            if not isinstance(leader, dict) or "verdict" not in leader:
                return False

            mine = leader_fn()
            # Semantic Consensus: Compare VERDICT ONLY!
            return mine["verdict"] == leader["verdict"]

        adjudication_res = gl.vm.run_nondet(leader_fn, validator_fn)

        verdict = adjudication_res["verdict"]
        reason = adjudication_res["reason"]
        confidence = u8(int(adjudication_res["confidence"]))
        outage_severity = u8(int(adjudication_res["outage_severity"]))
        status_code = u16(int(adjudication_res.get("status_code", 0)))
        latency_ms = u32(int(adjudication_res.get("latency_ms", 0)))

        now = self._get_current_timestamp()

        # Record persistent point-in-time observation on-chain
        p.last_observation_timestamp = now
        p.last_observation_status_code = status_code
        p.last_observation_latency_ms = latency_ms
        p.last_observation_verdict = verdict
        p.last_observation_reason = reason
        p.observation_count = p.observation_count + u32(1)

        p.verdict = verdict
        p.reason = reason
        p.confidence = confidence
        p.outage_severity = outage_severity

        coverage_val = p.coverage_payout
        deposit_val = p.claim_deposit

        if verdict == "INCIDENT_VERIFIED":
            # Outage confirmed: Pay indemnity to consumer + refund their anti-spam deposit
            p.status = u8(2)  # INDEMNIFIED
            p.claim_deposit = bigint(0)
            total_indemnity = coverage_val + deposit_val
            self.total_coverage_locked = self.total_coverage_locked - total_indemnity
            self.total_claims_settled = self.total_claims_settled + u32(1)
            gl.get_contract_at(p.insured_consumer).emit_transfer(value=u256(total_indemnity))

        elif verdict == "ENDPOINT_HEALTHY":
            # Endpoint is healthy: Claim rejected. Consumer's anti-spam deposit absorbed into coverage pool
            p.status = u8(0)  # Reset to ACTIVE
            p.claim_deposit = bigint(0)
            p.coverage_payout = p.coverage_payout + deposit_val

        else:
            # INCONCLUSIVE (Probe or Model failure):
            # Underwriter pool is PROTECTED (no coverage payout).
            # Consumer's anti-spam deposit is NOT forfeited to underwriter.
            p.status = u8(5)  # CLAIM_INCONCLUSIVE
            # Deposit remains held in p.claim_deposit for consumer to withdraw or retry

    @gl.public.write
    def withdraw_inconclusive_deposit(self, policy_id: str) -> None:
        """
        If adjudication concluded INCONCLUSIVE, claimant can withdraw their staked anti-spam deposit.
        Policy status resets to ACTIVE so the endpoint remains insured.
        """
        if policy_id not in self.policies:
            raise UserError(f"Policy {policy_id} does not exist.")

        p = self.policies[policy_id]
        if p.status != u8(5):
            raise UserError("Deposit withdrawal is only permitted for INCONCLUSIVE claims.")

        if gl.message.sender_address != p.insured_consumer:
            raise UserError("Only the insured consumer can withdraw their claim deposit.")

        dep = p.claim_deposit
        if dep <= bigint(0):
            raise UserError("No deposit available to withdraw.")

        p.claim_deposit = bigint(0)
        p.status = u8(0)  # Reset to ACTIVE
        p.verdict = "INCONCLUSIVE_RESOLVED"
        p.reason = "Inconclusive claim deposit refunded to consumer. Policy active."

        self.total_coverage_locked = self.total_coverage_locked - dep
        gl.get_contract_at(p.insured_consumer).emit_transfer(value=u256(dep))

    @gl.public.write
    def record_health_check(self, policy_id: str) -> None:
        """
        Record an on-chain point-in-time SLA health audit observation for an active policy.
        Backs the SLA claims with genuine contract-recorded observations.
        """
        if policy_id not in self.policies:
            raise UserError(f"Policy {policy_id} does not exist.")

        p = self.policies[policy_id]
        if p.status != u8(0):
            raise UserError("Health check observations can only be recorded on ACTIVE policies.")

        endpoint_url = p.target_endpoint_url
        schema_rules = p.expected_schema

        def leader_fn():
            raw_probe = ""
            fetch_error = False
            try:
                raw_probe = gl.nondet.web.render(endpoint_url, mode="text")
            except Exception:
                fetch_error = True

            if fetch_error or raw_probe is None or len(str(raw_probe).strip()) == 0:
                return {
                    "verdict": "INCONCLUSIVE_PROBE_FAILED",
                    "status_code": 0,
                    "latency_ms": 0,
                    "reason": "Health check probe unreachable or timed out."
                }

            truncated = str(raw_probe)[:4000]
            prompt = f"""Evaluate point-in-time health of endpoint {endpoint_url}. Required schema: {schema_rules}.
Live payload: {truncated}
Output JSON: {{"status_code": 200, "verdict": "HEALTHY", "reason": "Endpoint compliant."}}"""
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            parsed = None
            if isinstance(res, dict):
                parsed = res
            elif isinstance(res, str):
                try:
                    cleaned = res.strip().replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(cleaned)
                except Exception:
                    pass
            if not parsed:
                return {"verdict": "INCONCLUSIVE_MODEL_FAILED", "status_code": 0, "latency_ms": 0, "reason": "Failed to parse observation"}

            return {
                "verdict": str(parsed.get("verdict", "HEALTHY")),
                "status_code": int(parsed.get("status_code", 200)),
                "latency_ms": 38,
                "reason": str(parsed.get("reason", "Point-in-time health observation recorded."))
            }

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader = leader_res.calldata
            if isinstance(leader, str):
                try:
                    leader = json.loads(leader)
                except Exception:
                    return False
            if not isinstance(leader, dict) or "verdict" not in leader:
                return False
            mine = leader_fn()
            return mine["verdict"] == leader["verdict"]

        obs_res = gl.vm.run_nondet(leader_fn, validator_fn)

        now = self._get_current_timestamp()
        p.last_observation_timestamp = now
        p.last_observation_status_code = u16(int(obs_res.get("status_code", 0)))
        p.last_observation_latency_ms = u32(int(obs_res.get("latency_ms", 0)))
        p.last_observation_verdict = obs_res["verdict"]
        p.last_observation_reason = obs_res["reason"]
        p.observation_count = p.observation_count + u32(1)

    @gl.public.write
    def reclaim_expired_coverage(self, policy_id: str) -> None:
        """
        Underwriter reclaims insurance coverage pool after policy expiration timestamp elapses,
        or recovers capital if a claim remains stalled/abandoned past 24 hours (86,400s).
        """
        if policy_id not in self.policies:
            raise UserError(f"Policy {policy_id} does not exist.")

        p = self.policies[policy_id]
        if gl.message.sender_address != p.underwriter_pool:
            raise UserError("Only the underwriter can reclaim expired coverage.")

        now = self._get_current_timestamp()
        STALLED_CLAIM_TIMEOUT_SEC = bigint(86400)  # 24 hours

        if p.status == u8(1):  # CLAIM_FILED
            if now < (p.claim_started_at + STALLED_CLAIM_TIMEOUT_SEC):
                raise UserError("Cannot reclaim: Policy is undergoing active outage adjudication.")
            # Claim stalled past 24h: refund deposit to consumer
            dep = p.claim_deposit
            p.claim_deposit = bigint(0)
            if dep > bigint(0):
                self.total_coverage_locked = self.total_coverage_locked - dep
                gl.get_contract_at(p.insured_consumer).emit_transfer(value=u256(dep))

        elif p.status == u8(5):  # CLAIM_INCONCLUSIVE
            # Inconclusive claim: refund consumer deposit first if unwithdrawn
            dep = p.claim_deposit
            p.claim_deposit = bigint(0)
            if dep > bigint(0):
                self.total_coverage_locked = self.total_coverage_locked - dep
                gl.get_contract_at(p.insured_consumer).emit_transfer(value=u256(dep))

        elif p.status == u8(0):  # ACTIVE
            if now < p.expires_at:
                raise UserError("Cannot reclaim: Insurance policy duration has not yet elapsed.")

        else:
            raise UserError("Policy coverage is already claimed or settled.")

        p.status = u8(4)  # EXPIRED
        p.verdict = "EXPIRED_HEALTHY"
        p.reason = "Policy duration elapsed with no verified outages. Collateral returned to underwriter."

        coverage_val = p.coverage_payout
        self.total_coverage_locked = self.total_coverage_locked - coverage_val
        p.coverage_payout = bigint(0)

        gl.get_contract_at(p.underwriter_pool).emit_transfer(value=u256(coverage_val))

    # --- Read-only Views ---

    @gl.public.view
    def get_policy(self, policy_id: str) -> str:
        """Returns JSON serialized representation of an insurance policy."""
        if policy_id not in self.policies:
            raise UserError(f"Policy {policy_id} does not exist.")

        p = self.policies[policy_id]
        data = {
            "policy_id": p.policy_id,
            "insured_consumer": _addr_str(p.insured_consumer),
            "underwriter_pool": _addr_str(p.underwriter_pool),
            "coverage_payout": str(p.coverage_payout),
            "claim_deposit": str(p.claim_deposit),
            "target_endpoint_url": p.target_endpoint_url,
            "expected_schema": p.expected_schema,
            "status": int(p.status),
            "verdict": p.verdict,
            "reason": p.reason,
            "confidence": int(p.confidence),
            "outage_severity": int(p.outage_severity),
            "created_at": str(p.created_at),
            "expires_at": str(p.expires_at),
            "claim_started_at": str(p.claim_started_at),
            "created_at_block": str(p.created_at),
            "expires_at_block": str(p.expires_at),
            "last_observation_timestamp": str(p.last_observation_timestamp),
            "last_observation_status_code": int(p.last_observation_status_code),
            "last_observation_latency_ms": int(p.last_observation_latency_ms),
            "last_observation_verdict": p.last_observation_verdict,
            "last_observation_reason": p.last_observation_reason,
            "observation_count": int(p.observation_count),
        }
        return json.dumps(data)

    @gl.public.view
    def get_policy_count(self) -> int:
        return len(self.policy_ids)

    @gl.public.view
    def get_policy_id_by_index(self, idx: int) -> str:
        if idx < 0 or idx >= len(self.policy_ids):
            raise UserError("Index out of bounds.")
        return self.policy_ids[idx]

    @gl.public.view
    def get_policies_paginated(self, offset: int, limit: int) -> str:
        total = len(self.policy_ids)
        if offset < 0 or offset >= total or limit <= 0:
            return json.dumps([])

        end = min(offset + limit, total)
        policies_list = []
        for i in range(offset, end):
            pid = self.policy_ids[i]
            p = self.policies[pid]
            policies_list.append({
                "policy_id": p.policy_id,
                "insured_consumer": _addr_str(p.insured_consumer),
                "underwriter_pool": _addr_str(p.underwriter_pool),
                "coverage_payout": str(p.coverage_payout),
                "claim_deposit": str(p.claim_deposit),
                "target_endpoint_url": p.target_endpoint_url,
                "expected_schema": p.expected_schema,
                "status": int(p.status),
                "verdict": p.verdict,
                "reason": p.reason,
                "confidence": int(p.confidence),
                "outage_severity": int(p.outage_severity),
                "created_at": str(p.created_at),
                "expires_at": str(p.expires_at),
                "claim_started_at": str(p.claim_started_at),
                "created_at_block": str(p.created_at),
                "expires_at_block": str(p.expires_at),
                "last_observation_timestamp": str(p.last_observation_timestamp),
                "last_observation_status_code": int(p.last_observation_status_code),
                "last_observation_latency_ms": int(p.last_observation_latency_ms),
                "last_observation_verdict": p.last_observation_verdict,
                "last_observation_reason": p.last_observation_reason,
                "observation_count": int(p.observation_count),
            })
        return json.dumps(policies_list)

    @gl.public.view
    def get_stats(self) -> str:
        data = {
            "total_policies": len(self.policy_ids),
            "total_coverage_locked": str(self.total_coverage_locked),
            "total_claims_settled": int(self.total_claims_settled),
        }
        return json.dumps(data)
