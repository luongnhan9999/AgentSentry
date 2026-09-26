import { createClient, createAccount } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import { TransactionStatus } from '../frontend/node_modules/genlayer-js/dist/types/index.js';

const CONTRACT_ADDRESS = '0x3339bFB2b7E345F4aB4476Ab68BB542690b627d4';
const RPC_ENDPOINT = 'https://studio.genlayer.com/api';

// Funded studionet test account
const PRIVATE_KEY = '0x0909fe6b9b671281b871e56215874fc39897e155bbf8858207528c4cea883707';
const account = createAccount(PRIVATE_KEY);

const client = createClient({
  chain: studionet,
  endpoint: RPC_ENDPOINT,
  account,
});

async function waitTx(hash, label) {
  console.log(`\n>>> [TX SENT] ${label}`);
  console.log(`    Hash: ${hash}`);
  const startTime = Date.now();
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 60,
  });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`    [CONFIRMED] Status: ${receipt.status} (${elapsed}s)`);
  return receipt;
}

async function getStats() {
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_stats',
    args: [],
  });
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function getPolicy(policyId) {
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy',
    args: [policyId],
  });
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function main() {
  console.log('================================================================');
  console.log('       AGENTSENTRY ON-CHAIN LIVE END-TO-END VERIFICATION        ');
  console.log('================================================================');
  console.log(`Contract:         ${CONTRACT_ADDRESS}`);
  console.log(`RPC Endpoint:     ${RPC_ENDPOINT}`);
  console.log(`Tester/Signer:    ${account.address}`);

  const balance = await client.getBalance({ address: account.address });
  console.log(`Balance:          ${balance.toString()} wei (${(Number(balance) / 1e18).toFixed(4)} GEN)`);

  const initialStats = await getStats();
  console.log('\n--- Initial Protocol Stats ---');
  console.log(JSON.stringify(initialStats, null, 2));

  // -------------------------------------------------------------
  // STEP 1: Underwriter purchases insurance policy for Consumer
  // -------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('STEP 1: Underwriter calls purchase_policy (Escrow 0.02 GEN)');
  console.log('----------------------------------------------------------------');
  const targetUrl = 'https://httpbin.org/status/503';
  const expectedSchema = 'HTTP 200 OK required. JSON payload must return status ok, response_time < 500ms, and zero 5xx server errors.';
  const coverageAmount = 20_000_000_000_000_000n; // 0.02 GEN
  const durationSeconds = 604800; // 7 days in seconds

  console.log(`Target Endpoint:  ${targetUrl}`);
  console.log(`Required Schema:  ${expectedSchema}`);
  console.log(`Coverage Escrow:  ${coverageAmount} wei (0.02 GEN)`);
  console.log(`Insured Consumer: ${account.address}`);

  const purchaseTx = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'purchase_policy',
    args: [
      account.address,
      targetUrl,
      expectedSchema,
      durationSeconds,
    ],
    value: coverageAmount,
  });

  await waitTx(purchaseTx, 'purchase_policy');

  const countAfter = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy_count',
    args: [],
  });
  console.log(`\nTotal policies count on-chain: ${countAfter}`);

  const latestPolicyId = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy_id_by_index',
    args: [Number(countAfter) - 1],
  });
  console.log(`Created Policy ID: ${latestPolicyId}`);

  let policyData = await getPolicy(latestPolicyId);
  console.log('\nPolicy on-chain record:');
  console.log(JSON.stringify(policyData, null, 2));

  // -------------------------------------------------------------
  // STEP 2: Insured Consumer files an Outage Claim with Anti-Spam Stake
  // -------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(`STEP 2: Consumer files claim for ${latestPolicyId} (Stake 5% deposit)`);
  console.log('----------------------------------------------------------------');

  const minDeposit = BigInt(policyData.coverage_payout) / 20n; // 5% anti-spam deposit
  console.log(`Staking anti-spam deposit: ${minDeposit} wei (0.001 GEN)`);

  const claimTx = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'file_outage_claim',
    args: [latestPolicyId],
    value: minDeposit,
  });

  await waitTx(claimTx, `file_outage_claim for ${latestPolicyId}`);

  policyData = await getPolicy(latestPolicyId);
  console.log('\nPolicy state after claim filing:');
  console.log(`Status:  ${policyData.status} (1 = CLAIM_FILED)`);
  console.log(`Reason:  ${policyData.reason}`);
  console.log(`Deposit: ${policyData.claim_deposit} wei`);

  // -------------------------------------------------------------
  // STEP 3: Trigger AI Jury Adjudication Chamber
  // -------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(`STEP 3: Convene AI Jury Adjudication for ${latestPolicyId}`);
  console.log('Validators execute gl.nondet.web.render live probe & LLM diagnostic assessment...');
  console.log('----------------------------------------------------------------');

  const adjudicateTx = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'adjudicate_incident',
    args: [latestPolicyId],
  });

  await waitTx(adjudicateTx, `adjudicate_incident for ${latestPolicyId}`);

  policyData = await getPolicy(latestPolicyId);

  // -------------------------------------------------------------
  // STEP 4: Final Verification of Resolved State
  // -------------------------------------------------------------
  const finalStats = await getStats();

  console.log('\n================================================================');
  console.log('         AI JURY ON-CHAIN CONSENSUS VERDICT REPORT              ');
  console.log('================================================================');
  console.log(`Policy ID:        ${policyData.policy_id}`);
  console.log(`Status Code:      ${policyData.status} (${policyData.status === 2 ? 'INDEMNIFIED / PAID' : policyData.status === 3 ? 'CLAIM_REJECTED' : 'OTHER'})`);
  console.log(`Verdict:          ${policyData.verdict}`);
  console.log(`Confidence:       ${policyData.confidence}%`);
  console.log(`Outage Severity:  ${policyData.outage_severity}%`);
  console.log(`Technical Reason: ${policyData.reason}`);
  console.log(`Insured Consumer: ${policyData.insured_consumer}`);
  console.log(`Underwriter Pool: ${policyData.underwriter_pool}`);

  console.log('\n--- Final Protocol Stats ---');
  console.log(JSON.stringify(finalStats, null, 2));

  console.log('\n================================================================');
  console.log('   >>> ON-CHAIN AUTOMATED LIFECYCLE TEST COMPLETED SUCCESSFULLY! <<<');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('\n[FATAL ERROR during on-chain execution]:', err);
  process.exit(1);
});
