"""
conftest.py — gltest fixtures for AgentSentry Intelligent Contract.

Uses bare-dict sim_installMocks (NOT wrapped in a list — R17).
Provides helper fixtures for deploying and funding test accounts.
"""
import pytest
import json
import os
import sys


def clear_known_contracts():
    """
    GenVM only allows 1 Contract class in registry at a time.
    Clear before each fresh deploy to avoid AssertionError.
    """
    for name, module in list(sys.modules.items()):
        if hasattr(module, "__name__") and "genlayer" in getattr(module, "__name__", "") and hasattr(module, "__known_contract__"):
            setattr(module, "__known_contract__", None)


@pytest.fixture
def setup(request):
    """
    Deploy AgentSentry contract and set up test accounts with funds.
    Returns (contract, client, deployer, consumer) tuple.
    """
    from gltest import get_default_runner

    runner = get_default_runner()
    client = runner.client

    # Fund test accounts
    deployer = runner.create_account(balance=100_000_000)
    consumer = runner.create_account(balance=100_000_000)

    clear_known_contracts()

    contract_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "contracts",
        "contract.py"
    )

    contract = runner.deploy(
        contract_path,
        account=deployer,
    )

    return contract, client, deployer, consumer


def install_incident_verified_mocks(client):
    """
    Install LLM + web mocks that simulate a dead/broken endpoint.
    The AI jury returns INCIDENT_VERIFIED.
    Params is a bare dict (R17 — never wrap in a list).
    """
    client.provider.make_request(
        method="sim_installMocks",
        params={
            "llm_mocks": {
                ".*": json.dumps({
                    "verdict": "INCIDENT_VERIFIED",
                    "confidence": 95,
                    "outage_severity": 90,
                    "reason": "Endpoint returned HTTP 503 Service Unavailable. Server is offline with no failover."
                })
            },
            "web_mocks": {
                ".*": {
                    "status": 503,
                    "body": "<html><body>503 Service Unavailable</body></html>"
                }
            }
        }
    )


def install_endpoint_healthy_mocks(client):
    """
    Install LLM + web mocks that simulate a healthy endpoint.
    The AI jury returns ENDPOINT_HEALTHY.
    """
    client.provider.make_request(
        method="sim_installMocks",
        params={
            "llm_mocks": {
                ".*": json.dumps({
                    "verdict": "ENDPOINT_HEALTHY",
                    "confidence": 92,
                    "outage_severity": 5,
                    "reason": "Endpoint responds with valid JSON, all required schema keys present. Response latency within SLA parameters."
                })
            },
            "web_mocks": {
                ".*": {
                    "status": 200,
                    "body": json.dumps({
                        "status": "ok",
                        "data": {"uptime": 99.99, "response_time_ms": 42},
                        "timestamp": "2026-09-24T00:00:00Z"
                    })
                }
            }
        }
    )
