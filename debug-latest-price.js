const { Client } = require('./dist/index.js');
require('dotenv').config();

async function main() {
  const client = new Client({
    host: process.env.HOST,
    apiKey: process.env.API_KEY,
    privateKey: process.env.PRIVATE_KEY,
    walletAddress: process.env.MULTI_SIG_ADDRESS,
    rpcUrl: process.env.RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID),
  });

  console.log('获取市场列表...');
  const { list: markets } = await client.getMarkets({
    chainId: '56',
    page: 1,
    limit: 1,
  });

  const market = markets[0];
  console.log(`\n测试市场: ${market.marketId} - ${market.marketTitle}`);
  console.log(`Yes Token ID: ${market.yesTokenId}`);
  console.log(`Chain ID: ${market.chainId}`);

  console.log('\n尝试调用 getLatestPrice...');

  try {
    const result = await client.getLatestPrice(market.yesTokenId);
    console.log('成功！结果:', result);
  } catch (error) {
    console.log('失败！错误信息:', error.message);
    console.log('\n完整错误:', error);
  }

  // 尝试直接调用 API
  console.log('\n尝试直接查看 API URL...');
  const url = `${process.env.HOST}/openapi/token/latest-price?token_id=${market.yesTokenId}&chain_id=56`;
  console.log('URL:', url);

  console.log('\n尝试使用 fetch 直接调用...');
  try {
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': process.env.API_KEY,
      }
    });
    const data = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Fetch 失败:', error.message);
  }
}

main().catch(console.error);
