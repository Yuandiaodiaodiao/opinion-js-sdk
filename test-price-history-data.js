const { Client } = require('./dist/index.js');
require('dotenv').config();

async function test() {
  const client = new Client({
    host: process.env.HOST,
    apiKey: process.env.API_KEY,
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
    walletAddress: process.env.WALLET_ADDRESS,
  });

  const history = await client.getPriceHistory({
    tokenId: '10108728313991661552',
    interval: '1h',
  });

  console.log('Total data points:', history.length);
  if (history.length > 0) {
    console.log('First data point:', history[0]);
    console.log('Last data point:', history[history.length - 1]);
  }
}

test().catch(console.error);
