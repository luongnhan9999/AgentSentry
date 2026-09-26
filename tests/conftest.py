"""
conftest.py — gltest direct_vm fixtures for AgentSentry Intelligent Contract.
Supports direct GenVM execution, time-warping, and web/LLM mocking.
"""
import pytest
import json
from typing import Dict, Any, Optional
from pathlib import Path

CONTRACT_PATH = Path(__file__).resolve().parent.parent / "contracts" / "contract.py"


@pytest.fixture
def sim_install_mocks(request):
    """
    Fixture supporting web and LLM mocks for direct_vm.
    """
    def _install(
        vm: Any,
        mock_web: Optional[Dict[str, Dict[str, Any]]] = None,
        mock_llm: Optional[Dict[str, str]] = None,
    ):
        if hasattr(vm, "mock_web") and hasattr(vm, "mock_llm"):
            if mock_web:
                for url, data in mock_web.items():
                    vm.mock_web(
                        url,
                        {
                            "method": data.get("method", "GET"),
                            "status": data.get("status", 200),
                            "body": data.get("body", ""),
                        },
                    )
            if mock_llm:
                for pattern, resp in mock_llm.items():
                    vm.mock_llm(pattern, resp)
            return True
        return False

    return _install


@pytest.fixture(autouse=True)
def sync_direct_vm_warp(direct_vm):
    """
    Ensure direct_vm.warp synchronizes gl.message_raw['datetime']
    so contracts prioritizing authoritative gl.message_raw['datetime']
    receive the exact warped timestamp.
    """
    orig_warp = direct_vm.warp

    def _wrapped_warp(timestamp: str) -> None:
        orig_warp(timestamp)
        import sys
        if 'genlayer.gl' in sys.modules:
            gl = sys.modules['genlayer.gl']
            if hasattr(gl, 'message_raw') and isinstance(gl.message_raw, dict):
                gl.message_raw['datetime'] = timestamp

    direct_vm.warp = _wrapped_warp
