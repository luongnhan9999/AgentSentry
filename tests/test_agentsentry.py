"""
test_agentsentry.py — Pytest test suite for AgentSentry Intelligent Contract.

Tests cover:
  1. Policy purchase (happy path + edge cases)
  2. Outage claim filing with anti-spam deposit
  3. INCIDENT_VERIFIED → automatic payout to consumer
  4. ENDPOINT_HEALTHY → claim rejected, deposit forfeited to pool
  5. Expired policy coverage reclamation
  6. Edge cases: zero value, double-claim, wrong caller, invalid URL

Uses gltest fluent API: .connect(acct).method(args=[...]).transact(value=X) (R16)
Mock LLM/web installed BEFORE nondet transactions (R17)
"""
import json
import pytest
from conftest import install_incident_verified_mocks, install_endpoint_healthy_mocks


# ──────────────────────────────────────────────────────────────
# 1. Policy Purchase Tests
# ──────────────────────────────────────────────────────────────

class TestPurchasePolicy:

    def test_purchase_policy_happy_path(self, setup):
        """Consumer purchases a valid SLA insurance policy."""
        contract, client, deployer, consumer = setup

        result = contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with keys: status, uptime, response_time_ms",
                5000
            ]
        ).transact(value=10_000)

        # Verify policy was created
        count = contract.get_policy_count(args=[]).call()
        assert count == 1

        # Read policy back
        policy_json = contract.get_policy(args=["sentry-1"]).call()
        policy = json.loads(policy_json)
        assert policy["policy_id"] == "sentry-1"
        assert policy["target_endpoint_url"] == "https://api.example.com/v1/health"
        assert policy["status"] == 0  # ACTIVE
        assert policy["verdict"] == "PENDING"
        assert int(policy["coverage_payout"]) == 10_000

    def test_purchase_policy_zero_value_rejected(self, setup):
        """Policy purchase with 0 GEN should be rejected."""
        contract, client, deployer, consumer = setup

        with pytest.raises(Exception, match="Coverage insurance escrow must be greater than 0"):
            contract.connect(consumer).purchase_policy(
                args=[
                    "https://api.example.com/v1/health",
                    "Must return JSON with status key",
                    5000
                ]
            ).transact(value=0)

    def test_purchase_policy_invalid_url_rejected(self, setup):
        """Policy with non-HTTP URL should be rejected."""
        contract, client, deployer, consumer = setup

        with pytest.raises(Exception, match="Valid target endpoint HTTP/HTTPS URL is required"):
            contract.connect(consumer).purchase_policy(
                args=[
                    "ftp://invalid-protocol.com/data",
                    "Must return JSON with status key",
                    5000
                ]
            ).transact(value=10_000)

    def test_purchase_policy_empty_schema_rejected(self, setup):
        """Policy with empty or too-short schema should be rejected."""
        contract, client, deployer, consumer = setup

        with pytest.raises(Exception, match="Expected schema/invariant requirements must be provided"):
            contract.connect(consumer).purchase_policy(
                args=[
                    "https://api.example.com/v1/health",
                    "ab",
                    5000
                ]
            ).transact(value=10_000)


# ──────────────────────────────────────────────────────────────
# 2. Outage Claim Filing Tests
# ──────────────────────────────────────────────────────────────

class TestFileOutageClaim:

    def test_file_claim_happy_path(self, setup):
        """Consumer files an outage claim with sufficient anti-spam deposit."""
        contract, client, deployer, consumer = setup

        # Step 1: Purchase policy
        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with keys: status, uptime",
                5000
            ]
        ).transact(value=10_000)

        # Step 2: File claim with 5% deposit (500 wei minimum)
        contract.connect(consumer).file_outage_claim(
            args=["sentry-1"]
        ).transact(value=1_000)

        # Verify status changed to CLAIM_FILED
        policy_json = contract.get_policy(args=["sentry-1"]).call()
        policy = json.loads(policy_json)
        assert policy["status"] == 1  # CLAIM_FILED

    def test_file_claim_insufficient_deposit_rejected(self, setup):
        """Claim with deposit below 5% of coverage should be rejected."""
        contract, client, deployer, consumer = setup

        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with keys: status, uptime",
                5000
            ]
        ).transact(value=10_000)

        with pytest.raises(Exception, match="Must stake anti-spam deposit"):
            contract.connect(consumer).file_outage_claim(
                args=["sentry-1"]
            ).transact(value=100)  # Way below 5% of 10,000

    def test_file_claim_nonexistent_policy_rejected(self, setup):
        """Filing claim on a non-existent policy should fail."""
        contract, client, deployer, consumer = setup

        with pytest.raises(Exception, match="does not exist"):
            contract.connect(consumer).file_outage_claim(
                args=["sentry-999"]
            ).transact(value=1_000)

    def test_file_claim_wrong_caller_rejected(self, setup):
        """Only the insured consumer can file a claim, not a third party."""
        contract, client, deployer, consumer = setup

        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with keys: status, uptime",
                5000
            ]
        ).transact(value=10_000)

        # Deployer (not the consumer) tries to file claim
        with pytest.raises(Exception, match="Only the insured consumer"):
            contract.connect(deployer).file_outage_claim(
                args=["sentry-1"]
            ).transact(value=1_000)


# ──────────────────────────────────────────────────────────────
# 3. Adjudication — INCIDENT_VERIFIED (Payout)
# ──────────────────────────────────────────────────────────────

class TestAdjudicateIncidentVerified:

    def test_incident_verified_triggers_payout(self, setup):
        """
        When AI jury confirms endpoint is down (INCIDENT_VERIFIED),
        consumer receives coverage payout + anti-spam deposit refund.
        """
        contract, client, deployer, consumer = setup

        # Purchase policy
        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with keys: status, uptime",
                5000
            ]
        ).transact(value=10_000)

        # File claim
        contract.connect(consumer).file_outage_claim(
            args=["sentry-1"]
        ).transact(value=1_000)

        # Install mocks for INCIDENT_VERIFIED BEFORE nondet tx (R17)
        install_incident_verified_mocks(client)

        # Adjudicate
        contract.connect(deployer).adjudicate_incident(
            args=["sentry-1"]
        ).transact()

        # Verify verdict
        policy_json = contract.get_policy(args=["sentry-1"]).call()
        policy = json.loads(policy_json)
        assert policy["verdict"] == "INCIDENT_VERIFIED"
        assert policy["status"] == 2  # INDEMNIFIED
        assert int(policy["confidence"]) > 0
        assert int(policy["outage_severity"]) > 0

        # Verify stats updated
        stats_json = contract.get_stats(args=[]).call()
        stats = json.loads(stats_json)
        assert stats["total_claims_settled"] == 1


# ──────────────────────────────────────────────────────────────
# 4. Adjudication — ENDPOINT_HEALTHY (Deposit Forfeited)
# ──────────────────────────────────────────────────────────────

class TestAdjudicateEndpointHealthy:

    def test_endpoint_healthy_forfeits_deposit(self, setup):
        """
        When AI jury confirms endpoint is fine (ENDPOINT_HEALTHY),
        consumer's anti-spam deposit is absorbed into coverage pool.
        """
        contract, client, deployer, consumer = setup

        # Purchase policy
        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with keys: status, uptime",
                5000
            ]
        ).transact(value=10_000)

        # File claim
        contract.connect(consumer).file_outage_claim(
            args=["sentry-1"]
        ).transact(value=1_000)

        # Install mocks for ENDPOINT_HEALTHY
        install_endpoint_healthy_mocks(client)

        # Adjudicate
        contract.connect(deployer).adjudicate_incident(
            args=["sentry-1"]
        ).transact()

        # Verify verdict
        policy_json = contract.get_policy(args=["sentry-1"]).call()
        policy = json.loads(policy_json)
        assert policy["verdict"] == "ENDPOINT_HEALTHY"
        assert policy["status"] == 0  # Reset to ACTIVE (not CLAIM_REJECTED)
        # Coverage should now include the forfeited deposit
        assert int(policy["coverage_payout"]) == 11_000  # 10,000 + 1,000 deposit


# ──────────────────────────────────────────────────────────────
# 5. Expired Coverage Reclamation
# ──────────────────────────────────────────────────────────────

class TestReclaimExpiredCoverage:

    def test_reclaim_expired_coverage(self, setup):
        """
        Underwriter reclaims coverage after policy expiration window.
        Uses duration_blocks=1 to ensure quick expiry in test.
        """
        contract, client, deployer, consumer = setup

        # Purchase policy with very short duration (1 block)
        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with keys: status, uptime",
                1  # Expires almost immediately
            ]
        ).transact(value=10_000)

        # Purchase another policy to advance the block counter past expiry
        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v2/status",
                "Must return JSON with key: alive",
                5000
            ]
        ).transact(value=5_000)

        # Now reclaim the first (expired) policy
        contract.connect(consumer).reclaim_expired_coverage(
            args=["sentry-1"]
        ).transact()

        # Verify status changed to EXPIRED
        policy_json = contract.get_policy(args=["sentry-1"]).call()
        policy = json.loads(policy_json)
        assert policy["status"] == 4  # EXPIRED
        assert policy["verdict"] == "EXPIRED_HEALTHY"


# ──────────────────────────────────────────────────────────────
# 6. View Functions & Pagination
# ──────────────────────────────────────────────────────────────

class TestViewFunctions:

    def test_get_stats_empty(self, setup):
        """Stats on empty contract."""
        contract, client, deployer, consumer = setup

        stats_json = contract.get_stats(args=[]).call()
        stats = json.loads(stats_json)
        assert stats["total_policies"] == 0
        assert stats["total_claims_settled"] == 0

    def test_pagination(self, setup):
        """Paginated view returns correct subset of policies."""
        contract, client, deployer, consumer = setup

        # Create 3 policies
        for i in range(3):
            contract.connect(consumer).purchase_policy(
                args=[
                    f"https://api.example.com/v{i+1}/health",
                    "Must return valid JSON response",
                    5000
                ]
            ).transact(value=5_000)

        # Get page 1 (offset=0, limit=2)
        page1_json = contract.get_policies_paginated(args=[0, 2]).call()
        page1 = json.loads(page1_json)
        assert len(page1) == 2
        assert page1[0]["policy_id"] == "sentry-1"
        assert page1[1]["policy_id"] == "sentry-2"

        # Get page 2 (offset=2, limit=2)
        page2_json = contract.get_policies_paginated(args=[2, 2]).call()
        page2 = json.loads(page2_json)
        assert len(page2) == 1
        assert page2[0]["policy_id"] == "sentry-3"

    def test_get_policy_by_index(self, setup):
        """Get policy ID by index in the DynArray."""
        contract, client, deployer, consumer = setup

        contract.connect(consumer).purchase_policy(
            args=[
                "https://api.example.com/v1/health",
                "Must return JSON with status key",
                5000
            ]
        ).transact(value=5_000)

        pid = contract.get_policy_id_by_index(args=[0]).call()
        assert pid == "sentry-1"

    def test_get_policy_by_index_out_of_bounds(self, setup):
        """Out of bounds index should raise error."""
        contract, client, deployer, consumer = setup

        with pytest.raises(Exception, match="Index out of bounds"):
            contract.get_policy_id_by_index(args=[999]).call()
