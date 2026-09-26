import { createClient, createAccount } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import { TransactionStatus } from '../frontend/node_modules/genlayer-js/dist/types/index.js';

const CONTRACT_ADDRESS = '0x3339bFB2b7E345F4aB4476Ab68BB542690b627d4';
const RPC_ENDPOINT = 'https://studio.genlayer.com/api';

// Funded underwriter account
const PRIVATE_KEY = '0x0909fe6b9b671281b871e56215874fc39897e155bbf8858207528c4cea883707';
const underwriterAccount = createAccount(PRIVATE_KEY);

// User's MetaMask wallet address
const USER_CONSUMER_ADDRESS = '0x52c5e913fc54d00cba5df3312268bf66035661f8';

const client = createClient({
  chain: studionet,
  endpoint: RPC_ENDPOINT,
  account: underwriterAccount,
});

async function main() {
  console.log('================================================================');
  console.log('       CREATING ACTIVE POLICY FOR USER TESTING                  ');
  console.log('================================================================');
  console.log(`Contract Address:       ${CONTRACT_ADDRESS}`);
  console.log(`Underwriter (Funder):   ${underwriterAccount.address}`);
  console.log(`Insured Consumer:       ${USER_CONSUMER_ADDRESS}`);

  // Endpoint that is currently simulated down / returning 500 for testing
  const targetUrl = 'https://httpbin.org/status/500';
  const expectedSchema = 'HTTP 200 OK required. Server must return healthy 2xx status code without 500 Internal Server Errors.';
  const coverageAmount = 50_000_000_000_000_000n; // 0.05 GEN coverage
  const durationSeconds = 604800; // 7 days in seconds

  console.log(`\nCoverage Escrow Funded: 0.05 GEN (${coverageAmount} wei)`);
  console.log(`Target Endpoint:        ${targetUrl}`);
  console.log(`Expected Invariant:     ${expectedSchema}`);

  console.log('\nBroadcasting purchase_policy transaction to GenLayer Studionet...');
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'purchase_policy',
    args: [
      USER_CONSUMER_ADDRESS,
      targetUrl,
      expectedSchema,
      durationSeconds,
    ],
    value: coverageAmount,
  });

  console.log(`TX Submitted: ${txHash}`);
  console.log('Waiting for validator consensus...');

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 60,
  });

  console.log(`Receipt Status: ${receipt.status}`);

  // Fetch updated count and policy
  const count = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy_count',
    args: [],
  });
  console.log(`Total Policies on-chain: ${count}`);

  const policyId = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy_id_by_index',
    args: [Number(count) - 1],
  });
  console.log(`New Policy ID: ${policyId}`);

  const rawPolicy = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy',
    args: [policyId],
  });
  const policy = JSON.parse(rawPolicy);

  console.log('\n================================================================');
  console.log('             POLICY CREATED & READY FOR USER TESTING            ');
  console.log('================================================================');
  console.log(`Policy ID:        ${policy.policy_id}`);
  console.log(`Insured Consumer: ${policy.insured_consumer}`);
  console.log(`Coverage Escrow:  ${policy.coverage_payout} wei (0.05 GEN)`);
  console.log(`Required Deposit: ${BigInt(policy.coverage_payout) / 20n} wei (0.0025 GEN)`);
  console.log(`Target Endpoint:  ${policy.target_endpoint_url}`);
  console.log(`Status:           ACTIVE (${policy.status})`);
  console.log(`Verdict:          ${policy.verdict}`);
  console.log('================================================================\n');
}

main().catch(console.error);
