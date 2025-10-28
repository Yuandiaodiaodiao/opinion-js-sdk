/**
 * 调试API响应格式
 */
require('dotenv').config();
const { Client } = require('./dist/index.js');

async function debug() {
  const client = new Client({
    host: process.env.HOST,
    apiKey: process.env.API_KEY,
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    walletAddress: process.env.MULTI_SIG_ADDRESS,
    chainId: parseInt(process.env.CHAIN_ID),
  });

  try {
    console.log('\n=== getQuoteTokens ===');
    const tokens = await client.getQuoteTokens();
    console.log(JSON.stringify(tokens, null, 2));

    console.log('\n=== getMarkets ===');
    const markets = await client.getMarkets({ page: 1, limit: 2 });
    console.log(JSON.stringify(markets, null, 2));

    console.log('\n=== getMyBalances ===');
    const balances = await client.getMyBalances();
    console.log(JSON.stringify(balances, null, 2));

    console.log('\n=== getUserAuth ===');
    const auth = await client.getUserAuth();
    console.log(JSON.stringify(auth, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debug();
