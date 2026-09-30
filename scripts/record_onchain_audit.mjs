import { createClient, createAccount } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import { TransactionStatus } from '../frontend/node_modules/genlayer-js/dist/types/index.js';

const CONTRACT_ADDRESS = '0x5D8Eb68f944D291F4Ccf6C13f96c0871ceaD906a';
const RPC_ENDPOINT = 'https://studio.genlayer.com/api';

const PRIVATE_KEY = '0x0909fe6b9b671281b871e56215874fc39897e155bbf8858207528c4cea883707';
const underwriterAccount = createAccount(PRIVATE_KEY);

const client = createClient({
  chain: studionet,
  endpoint: RPC_ENDPOINT,
  account: underwriterAccount,
});

async function main() {
  console.log(`Triggering on-chain record_health_check for sentry-1 on ${CONTRACT_ADDRESS}...`);
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'record_health_check',
    args: ['sentry-1'],
    value: 0n,
  });
  console.log(`TX Submitted: ${txHash}`);
  console.log('Waiting for validator consensus...');
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 50,
  });
  console.log('Observation recorded successfully! Receipt status:', receipt.status);

  // Read updated policy state
  const rawPolicy = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy',
    args: ['sentry-1'],
  });
  const policy = JSON.parse(rawPolicy);
  console.log('\n--- Updated On-Chain Observation State ---');
  console.log('Policy ID:                   ', policy.policy_id);
  console.log('Observation Count:           ', policy.observation_count);
  console.log('Last Observation Timestamp:  ', policy.last_observation_timestamp);
  console.log('Last Observation Status Code:', policy.last_observation_status_code);
  console.log('Last Observation Verdict:    ', policy.last_observation_verdict);
  console.log('Last Observation Latency:    ', policy.last_observation_latency_ms, 'ms');
  console.log('Last Observation Reason:     ', policy.last_observation_reason);
}

main().catch(console.error);
