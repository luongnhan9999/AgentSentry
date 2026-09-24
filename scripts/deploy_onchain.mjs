import { createClient, createAccount } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import { TransactionStatus } from '../frontend/node_modules/genlayer-js/dist/types/index.js';
import fs from 'fs';

const PRIVATE_KEY = '0x0909fe6b9b671281b871e56215874fc39897e155bbf8858207528c4cea883707';
const account = createAccount(PRIVATE_KEY);
const client = createClient({
  chain: studionet,
  endpoint: 'https://studio.genlayer.com/api',
  account,
});

async function main() {
  console.log('Deployer Address:', account.address);
  const code = fs.readFileSync('contracts/contract.py', 'utf-8');
  console.log(`Contract code loaded (${code.length} bytes, ${code.split('\n').length} lines)`);

  console.log('Broadcasting deployContract transaction to GenLayer Studionet...');
  const txHash = await client.deployContract({
    account,
    code,
    args: [],
  });
  console.log('Deploy TX Hash:', txHash);

  console.log('Waiting for validator consensus...');
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 60,
  });
  console.log('Deployment Confirmed! Status:', receipt.status);

  // Retrieve contract address from transaction details
  const tx = await client.getTransaction({ hash: txHash });
  console.log('New Deployed Contract Address:', tx.contract_address || tx.to || tx.recipient);
  console.log('Full TX info:', JSON.stringify(tx, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error);
