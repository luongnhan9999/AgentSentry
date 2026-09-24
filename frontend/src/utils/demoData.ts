export interface PolicyRecord {
  policy_id: string;
  insured_consumer: string;
  underwriter_pool: string;
  premium_paid: string;
  coverage_payout: string;
  claim_deposit: string;
  target_endpoint_url: string;
  expected_schema: string;
  status: number; // 0: ACTIVE, 1: CLAIM_FILED, 2: INDEMNIFIED, 3: CLAIM_REJECTED, 4: EXPIRED
  verdict: string;
  reason: string;
  confidence: number;
  outage_severity: number;
  created_at_block: string;
  expires_at_block: string;
  latency_ms?: number;
  uptime_pct?: number;
}

export const DEMO_POLICIES: PolicyRecord[] = [
  {
    policy_id: "sentry-101",
    insured_consumer: "0x71C8417937402F003b57121bfe84501D89d38101",
    underwriter_pool: "0x90dbdC2caA70f014867C7a6C85A918fA6f74C810",
    premium_paid: "2500000000000000000",
    coverage_payout: "25000000000000000000",
    claim_deposit: "1250000000000000000",
    target_endpoint_url: "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT",
    expected_schema: '{"symbol": "ETHUSDT", "price": "<number>"}',
    status: 0, // ACTIVE
    verdict: "PENDING",
    reason: "Policy active. Real-time GenLayer validator telemetry monitoring continuous uptime and SLA response thresholds.",
    confidence: 96,
    outage_severity: 0,
    created_at_block: "14820",
    expires_at_block: "19820",
    latency_ms: 32,
    uptime_pct: 99.99
  },
  {
    policy_id: "sentry-102",
    insured_consumer: "0x34A7B2c91823f54E9103C28096f9C128b1239822",
    underwriter_pool: "0x90dbdC2caA70f014867C7a6C85A918fA6f74C810",
    premium_paid: "5000000000000000000",
    coverage_payout: "50000000000000000000",
    claim_deposit: "2500000000000000000",
    target_endpoint_url: "https://arbitrum-sequencer.node-rpc.io/v1/health",
    expected_schema: '{"status": "synchronized", "block_height": "<int>", "mempool_ok": true}',
    status: 1, // CLAIM_FILED
    verdict: "PENDING",
    reason: "Consumer triggered incident claim: Sequencer reported returning 504 Gateway Timeout during flash crash. AI Jury actively conducting on-chain diagnostic probe.",
    confidence: 0,
    outage_severity: 75,
    created_at_block: "14850",
    expires_at_block: "19850",
    latency_ms: 2450,
    uptime_pct: 94.20
  },
  {
    policy_id: "sentry-103",
    insured_consumer: "0x58F0C9d300E19B2003881C824a7398D102482343",
    underwriter_pool: "0x90dbdC2caA70f014867C7a6C85A918fA6f74C810",
    premium_paid: "4000000000000000000",
    coverage_payout: "40000000000000000000",
    claim_deposit: "0",
    target_endpoint_url: "https://gateway.ai-agent-network.net/v1/completions",
    expected_schema: '{"choices": [{"text": "<string>"}], "usage": {"total_tokens": "<int>"}}',
    status: 2, // INDEMNIFIED
    verdict: "INCIDENT_VERIFIED",
    reason: "CRITICAL BREACH CONFIRMED: Target endpoint returned HTTP 503 Service Unavailable for 8 consecutive probing frames. Silent degradation violated schema invariants. 40 GEN insurance indemnity + 2 GEN deposit paid to Consumer.",
    confidence: 99,
    outage_severity: 95,
    created_at_block: "14200",
    expires_at_block: "19200",
    latency_ms: 0,
    uptime_pct: 88.40
  },
  {
    policy_id: "sentry-104",
    insured_consumer: "0x92B1089201Fe81283B4089C911244C1982740921",
    underwriter_pool: "0x90dbdC2caA70f014867C7a6C85A918fA6f74C810",
    premium_paid: "1000000000000000000",
    coverage_payout: "11000000000000000000",
    claim_deposit: "0",
    target_endpoint_url: "https://api.coingecko.com/api/v3/ping",
    expected_schema: '{"gecko_says": "(V3) To the Moon!"}',
    status: 0, // Reset to ACTIVE after healthy rejection
    verdict: "ENDPOINT_HEALTHY",
    reason: "CLAIM REJECTED — MALICIOUS/FRIVOLOUS PROBE: Target endpoint responded with valid 200 OK within 45ms. Payload schema perfectly matches expectations. Consumer 0.5 GEN deposit forfeited into underwriter liquidity pool.",
    confidence: 94,
    outage_severity: 8,
    created_at_block: "13900",
    expires_at_block: "18900",
    latency_ms: 45,
    uptime_pct: 99.95
  }
];

export const DEMO_STATS = {
  total_policies: 4,
  total_coverage_locked: "126000000000000000000", // 126 GEN
  total_claims_settled: 2,
};
