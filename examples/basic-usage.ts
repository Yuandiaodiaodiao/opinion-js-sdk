/**
 * Basic usage example for Opinion CLOB SDK
 *
 * This example demonstrates how to:
 * - Initialize the client
 * - Fetch market data
 * - Place and cancel orders
 * - Check positions and balances
 */

import { Client, OrderSide, OrderType, safeAmountToWei } from '../src/index.js';
import type { Hex, Address } from 'viem';

async function main() {
  // Initialize client
  const client = new Client({
    host: 'https://api.opinion.com', // Replace with actual API endpoint
    apiKey: process.env.OPINION_API_KEY || 'your-api-key',
    rpcUrl: 'https://bsc-dataseed.binance.org/', // BNB Chain RPC
    privateKey: (process.env.PRIVATE_KEY || '0x...') as Hex,
    vaultAddress: (process.env.VAULT_ADDRESS || '0x...') as Address,
    chainId: 56, // BNB Chain
  });

  console.log('✅ Client initialized\n');

  // ========== Get Market Data ==========

  console.log('📊 Fetching markets...');
  const markets = await client.getMarkets({ page: 1, limit: 5 });
  console.log(`Found ${markets.list.length} markets:`);
  markets.list.forEach((market, i) => {
    console.log(`  ${i + 1}. ${market.title} (ID: ${market.id})`);
  });
  console.log();

  if (markets.list.length === 0) {
    console.log('No markets available');
    return;
  }

  // Get first market details
  const marketId = markets.list[0].id;
  console.log(`📈 Fetching market ${marketId} details...`);
  const market = await client.getMarket(marketId);
  console.log(`Market: ${market.title}`);
  console.log(`Status: ${market.status}`);
  console.log();

  // Get orderbook
  if (market.outcome_tokens && market.outcome_tokens.length > 0) {
    const tokenId = market.outcome_tokens[0].token_id;
    console.log(`📖 Fetching orderbook for token ${tokenId.substring(0, 10)}...`);
    const orderbook = await client.getOrderbook(tokenId);
    console.log(`Bids: ${orderbook.bids.length} levels`);
    console.log(`Asks: ${orderbook.asks.length} levels`);
    console.log();
  }

  // ========== Enable Trading ==========

  console.log('🔓 Enabling trading (approving tokens)...');
  try {
    const approvalHashes = await client.enableTrading();
    if (approvalHashes.length > 0) {
      console.log(`✅ Approved ${approvalHashes.length} tokens`);
      approvalHashes.forEach((hash, i) => {
        console.log(`  ${i + 1}. ${hash}`);
      });
    } else {
      console.log('✅ Already approved');
    }
    console.log();
  } catch (error: any) {
    console.error('❌ Failed to enable trading:', error.message);
  }

  // ========== Check Account ==========

  console.log('👤 Checking account balances...');
  try {
    const balances = await client.getMyBalances();
    console.log(`Found ${balances.length} balances:`);
    balances.forEach((balance) => {
      console.log(`  ${balance.symbol}: ${balance.balance}`);
    });
    console.log();
  } catch (error: any) {
    console.error('❌ Failed to fetch balances:', error.message);
  }

  console.log('📊 Checking positions...');
  try {
    const positions = await client.getMyPositions({ page: 1, limit: 10 });
    console.log(`Found ${positions.list.length} positions`);
    positions.list.forEach((pos, i) => {
      console.log(`  ${i + 1}. Market ${pos.market_id}: ${pos.size} ${pos.outcome}`);
    });
    console.log();
  } catch (error: any) {
    console.error('❌ Failed to fetch positions:', error.message);
  }

  // ========== Place Order (Example - won't execute) ==========

  console.log('💱 Place order example:');
  console.log(`
  const order = await client.placeOrder({
    marketId: ${marketId},
    tokenId: '0x...',
    price: '0.55',
    makerAmountInQuoteToken: '10', // 10 USDC
    side: OrderSide.BUY,
    orderType: OrderType.LIMIT_ORDER,
  }, true); // checkApproval = true
  `);
  console.log('(Not executed in this example)\n');

  // ========== Get Orders ==========

  console.log('📋 Fetching my orders...');
  try {
    const orders = await client.getMyOrders({ page: 1, limit: 10 });
    console.log(`Found ${orders.list.length} orders`);
    orders.list.forEach((order, i) => {
      console.log(`  ${i + 1}. Order ${order.id}: ${order.side === 0 ? 'BUY' : 'SELL'} @ ${order.price}`);
    });
    console.log();
  } catch (error: any) {
    console.error('❌ Failed to fetch orders:', error.message);
  }

  // ========== Split/Merge Example ==========

  console.log('💰 Token operations example:');
  console.log(`
  // Split collateral into outcome tokens
  const amount = safeAmountToWei(100, 6); // 100 USDC (6 decimals)
  const splitTx = await client.split(${marketId}, amount, true);
  console.log('Split tx:', splitTx);

  // Merge outcome tokens back to collateral
  const mergeTx = await client.merge(${marketId}, amount, true);
  console.log('Merge tx:', mergeTx);
  `);
  console.log('(Not executed in this example)\n');

  console.log('✅ Example completed!');
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
