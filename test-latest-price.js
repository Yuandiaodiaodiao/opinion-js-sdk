const { Client } = require('./dist/index.js');
require('dotenv').config();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}📋 ${title}${colors.reset}`);
  console.log('='.repeat(60));
}

async function testLatestPrice(client, marketId, tokenId, label) {
  try {
    const result = await client.getLatestPrice(tokenId);
    logSuccess(`Market ${marketId} (${label}): 价格 = ${result.price}`);
    return result;
  } catch (error) {
    logError(`Market ${marketId} (${label}): ${error.message}`);
    return null;
  }
}

async function main() {
  console.log(`${colors.blue}🚀 测试多个市场的 getLatestPrice${colors.reset}\n`);

  // 初始化客户端
  const client = new Client({
    host: process.env.HOST,
    apiKey: process.env.API_KEY,
    privateKey: process.env.PRIVATE_KEY,
    walletAddress: process.env.MULTI_SIG_ADDRESS,
    rpcUrl: process.env.RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID),
  });

  logSection('获取市场列表');

  const { list: markets } = await client.getMarkets({
    chainId: '56',
    page: 1,
    limit: 10,
  });

  logSuccess(`成功获取 ${markets.length} 个市场`);

  let successCount = 0;
  let failCount = 0;

  logSection('测试各个市场的 getLatestPrice');

  for (const market of markets) {
    console.log(`\n--- Market ID: ${market.marketId} - ${market.marketTitle} ---`);

    // 测试 Yes token
    if (market.yesTokenId) {
      const yesResult = await testLatestPrice(
        client,
        market.marketId,
        market.yesTokenId,
        `YES (${market.yesLabel || 'YES'})`
      );
      if (yesResult) successCount++;
      else failCount++;
    }

    // 测试 No token
    if (market.noTokenId) {
      const noResult = await testLatestPrice(
        client,
        market.marketId,
        market.noTokenId,
        `NO (${market.noLabel || 'NO'})`
      );
      if (noResult) successCount++;
      else failCount++;
    }
  }

  logSection('测试总结');
  console.log(`${colors.green}✅ 成功: ${successCount} 个测试${colors.reset}`);
  console.log(`${colors.red}❌ 失败: ${failCount} 个测试${colors.reset}`);
  console.log(`总计: ${successCount + failCount} 个测试\n`);

  if (failCount > 0) {
    console.log(`${colors.red}❌ 有 ${failCount} 个测试失败${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ 所有测试通过！${colors.reset}`);
  }
}

main().catch(console.error);
