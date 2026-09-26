"""
test_agentsentry.py — GenVM direct integration tests for AgentSentry Intelligent Contract.

Tests strictly cover all Steward (Pavel Kolosov) audit requirements:
  1. Valid elapsed-time mechanism for policy expiry and stalled-claim recovery
  2. Failure cases: Web probe failure & Model failure enter INCONCLUSIVE path (NO auto-payout)
  3. Inconclusive deposit withdrawal by claimant
  4. Happy path: Incident verified triggers automatic payout
  5. Healthy endpoint: Claim rejected, anti-spam deposit forfeited to underwriter
  6. Persistent contract-recorded observations (Point-in-time SLA health audit)
  7. Pagination and view functions
"""
import pytest
import json
from conftest import CONTRACT_PATH


# ──────────────────────────────────────────────────────────────
# 1. Policy Purchase & Real Elapsed-Time Expiry Tests
# ──────────────────────────────────────────────────────────────

class TestPolicyTimingAndExpiry:

    def test_purchase_policy_sets_unix_timestamps(self, direct_deploy, direct_vm, direct_alice, direct_bob):
        """Underwriter purchases policy; created_at and expires_at are real unix timestamps."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))

        duration_sec = 86400 * 7  # 7 days
        pid = contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/health",
            "Must return valid JSON with keys: status, latency",
            duration_sec
        )
        assert pid == "sentry-1"

        policy = json.loads(contract.get_policy("sentry-1"))
        assert policy["policy_id"] == "sentry-1"
        assert policy["status"] == 0  # ACTIVE
        assert int(policy["coverage_payout"]) == 10_000

        created_ts = int(policy["created_at"])
        expires_ts = int(policy["expires_at"])
        assert expires_ts == created_ts + duration_sec
        assert created_ts > 1_700_000_000

    def test_underwriter_cannot_reclaim_before_expiry(self, direct_deploy, direct_vm, direct_alice, direct_bob):
        """Underwriter cannot reclaim collateral before policy duration elapses."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/health",
            "Must return valid JSON with status",
            86400 * 7
        )

        # Warp forward only 3 days (not yet expired)
        direct_vm.warp("2026-09-28T12:00:00Z")

        with pytest.raises(Exception, match="Insurance policy duration has not yet elapsed"):
            contract.reclaim_expired_coverage("sentry-1")

    def test_underwriter_reclaims_after_real_time_expiry(self, direct_deploy, direct_vm, direct_alice, direct_bob):
        """Underwriter successfully reclaims coverage after policy expires in real time."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/health",
            "Must return valid JSON with status",
            86400 * 7
        )

        # Warp forward 8 days (past the 7-day expiration)
        direct_vm.warp("2026-10-03T12:00:00Z")

        contract.reclaim_expired_coverage("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        assert policy["status"] == 4  # EXPIRED
        assert policy["verdict"] == "EXPIRED_HEALTHY"


# ──────────────────────────────────────────────────────────────
# 2. Stalled-Claim Timing & Timeout Recovery Tests
# ──────────────────────────────────────────────────────────────

class TestStalledClaimTiming:

    def test_stalled_claim_prevents_premature_reclaim(self, direct_deploy, direct_vm, direct_alice, direct_bob):
        """Underwriter cannot prematurely reclaim funds while claim adjudication is active."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/health",
            "Must return valid JSON with status",
            86400 * 7
        )

        # Consumer files claim with 5% deposit
        direct_vm.sender = direct_bob
        direct_vm.value = 1_000
        contract.file_outage_claim("sentry-1")

        # Underwriter tries to reclaim 2 hours later
        direct_vm.warp("2026-09-25T14:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 0

        with pytest.raises(Exception, match="Policy is undergoing active outage adjudication"):
            contract.reclaim_expired_coverage("sentry-1")

    def test_stalled_claim_recovers_after_24h_timeout(self, direct_deploy, direct_vm, direct_alice, direct_bob):
        """If a claim is abandoned past 24 hours, underwriter reclaims and consumer deposit is refunded."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/health",
            "Must return valid JSON with status",
            86400 * 7
        )

        # Bob files claim
        direct_vm.sender = direct_bob
        direct_vm.value = 1_000
        contract.file_outage_claim("sentry-1")

        # 26 hours pass without adjudication
        direct_vm.warp("2026-09-26T14:00:00Z")

        # Alice reclaims stalled policy
        direct_vm.sender = direct_alice
        direct_vm.value = 0
        contract.reclaim_expired_coverage("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        assert policy["status"] == 4  # EXPIRED
        assert int(policy["claim_deposit"]) == 0


# ──────────────────────────────────────────────────────────────
# 3. Failure Cases: Inconclusive & Retry Path (NO Auto-Payout)
# ──────────────────────────────────────────────────────────────

class TestFailureCasesInconclusive:

    def test_probe_failure_enters_inconclusive_no_payout(self, direct_deploy, direct_vm, direct_alice, direct_bob, sim_install_mocks):
        """
        When endpoint web render fails (network timeout/unreachable):
        Must enter INCONCLUSIVE_PROBE_FAILED. Underwriter funds MUST NOT be paid out.
        """
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://broken-or-offline-api.com/status",
            "Must return valid JSON with alive=true",
            86400 * 7
        )

        # Bob files claim
        direct_vm.sender = direct_bob
        direct_vm.value = 1_000
        contract.file_outage_claim("sentry-1")

        # Mock web probe failure: empty body or connection error
        sim_install_mocks(
            direct_vm,
            mock_web={
                "https://broken-or-offline-api.com/status": {
                    "status": 0,
                    "body": ""
                }
            }
        )

        # Adjudicate incident
        direct_vm.sender = direct_alice
        contract.adjudicate_incident("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        # Status MUST be 5 (CLAIM_INCONCLUSIVE), NOT 2 (INDEMNIFIED)
        assert policy["status"] == 5
        assert policy["verdict"] == "INCONCLUSIVE_PROBE_FAILED"
        # Underwriter coverage payout is NOT drained!
        assert int(policy["coverage_payout"]) == 10_000
        # Bob's anti-spam deposit is preserved
        assert int(policy["claim_deposit"]) == 1_000

        # Bob can withdraw his deposit safely
        direct_vm.sender = direct_bob
        contract.withdraw_inconclusive_deposit("sentry-1")

        policy_after = json.loads(contract.get_policy("sentry-1"))
        assert policy_after["status"] == 0  # Reset to ACTIVE
        assert int(policy_after["claim_deposit"]) == 0

    def test_model_failure_enters_inconclusive_no_payout(self, direct_deploy, direct_vm, direct_alice, direct_bob, sim_install_mocks):
        """
        When LLM returns malformed/unparseable JSON:
        Must enter INCONCLUSIVE_MODEL_FAILED. Underwriter funds MUST NOT be paid out.
        """
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/health",
            "Must return valid JSON with status",
            86400 * 7
        )

        # Bob files claim
        direct_vm.sender = direct_bob
        direct_vm.value = 1_000
        contract.file_outage_claim("sentry-1")

        # Web returns response, but LLM returns invalid syntax
        sim_install_mocks(
            direct_vm,
            mock_web={
                "https://api.example.com/v1/health": {
                    "status": 500,
                    "body": "Internal Server Error"
                }
            },
            mock_llm={
                ".*": "Sorry, I am an AI and cannot process this request [corrupted json..."
            }
        )

        # Adjudicate incident
        direct_vm.sender = direct_alice
        contract.adjudicate_incident("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        # Status MUST be 5 (CLAIM_INCONCLUSIVE), NOT 2 (INDEMNIFIED)
        assert policy["status"] == 5
        assert policy["verdict"] == "INCONCLUSIVE_MODEL_FAILED"
        assert int(policy["coverage_payout"]) == 10_000

    def test_inconclusive_claim_reclaim_lifecycle(self, direct_deploy, direct_vm, direct_alice, direct_bob, sim_install_mocks):
        """
        Anti-Front-running test:
        When a claim is INCONCLUSIVE, an underwriter CANNOT immediately front-run
        and reclaim coverage before the policy duration has elapsed.
        Once the policy duration has actually elapsed, underwriter can reclaim.
        """
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://intermittent-api.com/health",
            "Must return valid status",
            86400 * 7  # 7 days
        )

        # Bob files claim on Day 1
        direct_vm.sender = direct_bob
        direct_vm.value = 1_000
        contract.file_outage_claim("sentry-1")

        # Network error causes inconclusive verdict
        sim_install_mocks(
            direct_vm,
            mock_web={
                "https://intermittent-api.com/health": {
                    "status": 0,
                    "body": ""
                }
            }
        )
        direct_vm.sender = direct_alice
        contract.adjudicate_incident("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        assert policy["status"] == 5  # CLAIM_INCONCLUSIVE

        # Underwriter tries to reclaim on Day 1 (BEFORE 7 days elapse) -> MUST FAIL
        with pytest.raises(Exception) as exc_info:
            contract.reclaim_expired_coverage("sentry-1")
        assert "not yet elapsed" in str(exc_info.value).lower()

        # Warp time past the 7 days expiration (e.g. 8 days later)
        direct_vm.warp("2026-10-03T13:00:00Z")
        contract.reclaim_expired_coverage("sentry-1")

        policy_expired = json.loads(contract.get_policy("sentry-1"))
        assert policy_expired["status"] == 4  # EXPIRED
        assert policy_expired["verdict"] == "EXPIRED_HEALTHY"
        assert int(policy_expired["coverage_payout"]) == 0
        assert int(policy_expired["claim_deposit"]) == 0


# ──────────────────────────────────────────────────────────────
# 4. Happy Paths: Incident Verified & Endpoint Healthy
# ──────────────────────────────────────────────────────────────

class TestHappyPaths:

    def test_incident_verified_triggers_payout(self, direct_deploy, direct_vm, direct_alice, direct_bob, sim_install_mocks):
        """Valid verified outage triggers automated payout of coverage + deposit refund."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/service",
            "Must return JSON with active=true",
            86400 * 7
        )

        direct_vm.sender = direct_bob
        direct_vm.value = 1_000
        contract.file_outage_claim("sentry-1")

        # Install mock for verified outage
        sim_install_mocks(
            direct_vm,
            mock_web={
                "https://api.example.com/v1/service": {
                    "status": 503,
                    "body": "<html>503 Service Unavailable</html>"
                }
            },
            mock_llm={
                ".*": json.dumps({
                    "verdict": "INCIDENT_VERIFIED",
                    "confidence": 98,
                    "outage_severity": 95,
                    "status_code": 503,
                    "reason": "HTTP 503 Service Unavailable confirmed. API gateway down."
                })
            }
        )

        direct_vm.sender = direct_alice
        contract.adjudicate_incident("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        assert policy["status"] == 2  # INDEMNIFIED
        assert policy["verdict"] == "INCIDENT_VERIFIED"
        assert int(policy["outage_severity"]) == 95

        stats = json.loads(contract.get_stats())
        assert stats["total_claims_settled"] == 1

    def test_endpoint_healthy_forfeits_anti_spam_deposit(self, direct_deploy, direct_vm, direct_alice, direct_bob, sim_install_mocks):
        """Frivolous claim on healthy endpoint: claim rejected, deposit absorbed into underwriter coverage."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/service",
            "Must return JSON with status=ok",
            86400 * 7
        )

        direct_vm.sender = direct_bob
        direct_vm.value = 1_000
        contract.file_outage_claim("sentry-1")

        # Install mock for healthy endpoint
        sim_install_mocks(
            direct_vm,
            mock_web={
                "https://api.example.com/v1/service": {
                    "status": 200,
                    "body": json.dumps({"status": "ok", "uptime": 99.99})
                }
            },
            mock_llm={
                ".*": json.dumps({
                    "verdict": "ENDPOINT_HEALTHY",
                    "confidence": 94,
                    "outage_severity": 0,
                    "status_code": 200,
                    "reason": "Endpoint 200 OK. All required keys present."
                })
            }
        )

        direct_vm.sender = direct_alice
        contract.adjudicate_incident("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        assert policy["status"] == 0  # Reset to ACTIVE
        assert policy["verdict"] == "ENDPOINT_HEALTHY"
        # Anti-spam deposit (1,000) added to coverage pool (10,000 + 1,000 = 11,000)
        assert int(policy["coverage_payout"]) == 11_000
        assert int(policy["claim_deposit"]) == 0


# ──────────────────────────────────────────────────────────────
# 5. Contract-Recorded Observation Tests
# ──────────────────────────────────────────────────────────────

class TestContractRecordedObservations:

    def test_record_health_check_persists_observation(self, direct_deploy, direct_vm, direct_alice, direct_bob, sim_install_mocks):
        """Point-in-time SLA health audit records verified observation on-chain."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 10_000

        contract = direct_deploy(str(CONTRACT_PATH))
        contract.purchase_policy(
            direct_bob,
            "https://api.example.com/v1/health",
            "Must return valid JSON with healthy=true",
            86400 * 7
        )

        sim_install_mocks(
            direct_vm,
            mock_web={
                "https://api.example.com/v1/health": {
                    "status": 200,
                    "body": json.dumps({"healthy": True})
                }
            },
            mock_llm={
                ".*": json.dumps({
                    "status_code": 200,
                    "verdict": "HEALTHY",
                    "reason": "Point-in-time health check passed: HTTP 200 and schema compliant."
                })
            }
        )

        contract.record_health_check("sentry-1")

        policy = json.loads(contract.get_policy("sentry-1"))
        assert int(policy["observation_count"]) == 1
        assert int(policy["last_observation_status_code"]) == 200
        assert policy["last_observation_verdict"] == "HEALTHY"
        assert int(policy["last_observation_timestamp"]) > 0


# ──────────────────────────────────────────────────────────────
# 6. Pagination & View Functions
# ──────────────────────────────────────────────────────────────

class TestViewsAndPagination:

    def test_pagination_and_counts(self, direct_deploy, direct_vm, direct_alice, direct_bob):
        """Verify pagination and total policy counters."""
        direct_vm.warp("2026-09-25T12:00:00Z")
        direct_vm.sender = direct_alice
        direct_vm.value = 5_000

        contract = direct_deploy(str(CONTRACT_PATH))

        for i in range(3):
            contract.purchase_policy(
                direct_bob,
                f"https://api.example.com/v{i+1}",
                "Schema required with status",
                86400 * 7
            )

        assert contract.get_policy_count() == 3

        page = json.loads(contract.get_policies_paginated(0, 2))
        assert len(page) == 2
        assert page[0]["policy_id"] == "sentry-1"
        assert page[1]["policy_id"] == "sentry-2"

        stats = json.loads(contract.get_stats())
        assert stats["total_policies"] == 3
