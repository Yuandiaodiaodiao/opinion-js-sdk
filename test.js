/**
 * 测试 Opinion CLOB SDK 的所有查询功能
 */

require('dotenv').config();
const { Client, OrderSide, TopicType } = require('./dist/index.js');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function logSuccess(message) {
  log('green', '✅', message);
}

function logError(message) {
  log('red', '❌', message);
}

function logInfo(message) {
  log('cyan', 'ℹ️', message);
}

function logSection(message) {
  console.log('\n' + '='.repeat(60));
  log('blue', '📋', message);
  console.log('='.repeat(60));
}

// 验证配置
function validateConfig() {
  const required = {
    'HOST': process.env.HOST,
    'API_KEY': process.env.API_KEY,
    'RPC_URL': process.env.RPC_URL,
    'PRIVATE_KEY': process.env.PRIVATE_KEY,
    'MULTI_SIG_ADDRESS': process.env.MULTI_SIG_ADDRESS,
    'CHAIN_ID': process.env.CHAIN_ID,
  };

  const missing = [];
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logError(`缺少必需的环境变量: ${missing.join(', ')}`);
    logInfo('请检查 .env 文件');
    process.exit(1);
  }

  // 验证私钥格式
  const privateKey = process.env.PRIVATE_KEY;
  let useTestKey = false;
  if (!privateKey.startsWith('0x')) {
    logError('PRIVATE_KEY 必须以 0x 开头');
    process.exit(1);
  }
  if (privateKey.length !== 66) {
    log('yellow', '⚠️', `PRIVATE_KEY 长度不正确 (期望 66 字符，实际 ${privateKey.length} 字符)`);
    logInfo('将使用临时测试私钥继续测试公开查询功能');
    logInfo('注意: 需要签名的功能（如下单、取消订单等）将无法使用');
    useTestKey = true;
  }

  // 验证地址格式
  const address = process.env.MULTI_SIG_ADDRESS;
  if (!address.startsWith('0x') || address.length !== 42) {
    logError('MULTI_SIG_ADDRESS 格式不正确');
    process.exit(1);
  }

  if (useTestKey) {
    logSuccess('配置验证通过 (使用临时测试私钥)');
  } else {
    logSuccess('配置验证通过');
  }

  return { useTestKey };
}

// 初始化客户端
function initClient(useTestKey = false) {
  try {
    // 如果私钥不完整，使用临时测试私钥（仅用于初始化客户端）
    const privateKey = useTestKey
      ? '0x1234567890123456789012345678901234567890123456789012345678901234'
      : process.env.PRIVATE_KEY;

    const client = new Client({
      host: process.env.HOST,
      apiKey: process.env.API_KEY,
      rpcUrl: process.env.RPC_URL,
      privateKey: privateKey,
      walletAddress: process.env.MULTI_SIG_ADDRESS,
      chainId: parseInt(process.env.CHAIN_ID),
      conditionalTokensAddr: process.env.CONDITIONAL_TOKEN_ADDR,
    });

    if (useTestKey) {
      logSuccess('客户端初始化成功 (使用临时测试私钥)');
    } else {
      logSuccess('客户端初始化成功');
    }
    return client;
  } catch (error) {
    logError(`客户端初始化失败: ${error.message}`);
    console.error('\n详细错误:', error);
    process.exit(1);
  }
}

// 测试函数
async function testGetQuoteTokens(client) {
  logSection('测试 1: 获取支持的报价代币 (getQuoteTokens)');
  try {
    const tokens = await client.getQuoteTokens();
    logSuccess(`成功获取 ${tokens.length} 个报价代币`);
    tokens.forEach((token, i) => {
      console.log(`  ${i + 1}. ${token.symbol} (${token.name})`);
      console.log(`     地址: ${token.quote_token_address || token.address}`);
      console.log(`     精度: ${token.decimal || token.decimals}`);
      if (token.ctf_exchange_address) {
        console.log(`     交易所: ${token.ctf_exchange_address}`);
      }
    });
    return tokens;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function testGetMarkets(client) {
  logSection('测试 2: 获取市场列表 (getMarkets)');
  try {
    const result = await client.getMarkets({ page: 1, limit: 5 });
    logSuccess(`成功获取 ${result.list.length} 个市场`);
    if (result.total) {
      logInfo(`总共有 ${result.total} 个市场`);
    }
    result.list.forEach((market, i) => {
      console.log(`\n  ${i + 1}. [ID: ${market.marketId}] ${market.marketTitle}`);
      console.log(`     状态: ${market.status} (${market.statusEnum || 'N/A'})`);
      if (market.quoteToken) {
        console.log(`     报价代币: ${market.quoteToken}`);
      }
      if (market.yesTokenId && market.noTokenId) {
        console.log(`     Yes: ${market.yesLabel || 'YES'}, No: ${market.noLabel || 'NO'}`);
      }
      if (market.volume) {
        console.log(`     交易量: ${market.volume}`);
      }
    });
    return result.list;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return [];
  }
}

async function testGetMarket(client, marketId) {
  logSection(`测试 3: 获取单个市场详情 (getMarket) - Market ID: ${marketId}`);
  try {
    const market = await client.getMarket(marketId);
    console.log('市场详情',market);
    logSuccess(`成功获取市场详情`);
    console.log(`  标题: ${market.marketTitle}`);
    console.log(`  ID: ${market.marketId}`);
    console.log(`  状态: ${market.status} (${market.statusEnum || 'N/A'})`);
    console.log(`  报价代币: ${market.quoteToken}`);
    if (market.conditionId) {
      console.log(`  条件 ID: ${market.conditionId}`);
    }
    if (market.yesTokenId && market.noTokenId) {
      console.log(`  结果代币:`);
      console.log(`    Yes (${market.yesLabel || 'YES'}): ${market.yesTokenId.substring(0, 20)}...`);
      console.log(`    No (${market.noLabel || 'NO'}): ${market.noTokenId.substring(0, 20)}...`);
    }
    return market;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function testGetOrderbook(client, tokenId) {
  logSection(`测试 4: 获取订单簿 (getOrderbook)`);
  try {
    const orderbook = await client.getOrderbook(tokenId);
    logSuccess(`成功获取订单簿`);
    console.log(`  买单 (Bids): ${orderbook.bids ? orderbook.bids.length : 0} 个价格档位`);
    if (orderbook.bids && orderbook.bids.length > 0) {
      console.log(`    最高买价: ${orderbook.bids[0].price} (数量: ${orderbook.bids[0].size})`);
    }
    console.log(`  卖单 (Asks): ${orderbook.asks ? orderbook.asks.length : 0} 个价格档位`);
    if (orderbook.asks && orderbook.asks.length > 0) {
      console.log(`    最低卖价: ${orderbook.asks[0].price} (数量: ${orderbook.asks[0].size})`);
    }
    return orderbook;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function testGetPriceHistory(client, tokenId) {
  logSection(`测试 5: 获取价格历史 (getPriceHistory)`);
  try {
    const history = await client.getPriceHistory({
      tokenId: tokenId,
      interval: '1h',
    });
    logSuccess(`成功获取价格历史`);
    console.log(`  数据点数量: ${history.length}`);
    if (history.length > 0) {
      const latest = history[history.length - 1];
      console.log(`  最新价格: ${latest.p}`);
      if (latest.t) {
        console.log(`  时间戳: ${new Date(latest.t * 1000).toLocaleString()}`);
      }
      if (latest.v) {
        console.log(`  成交量: ${latest.v}`);
      }
    }
    return history;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function testGetLatestPrice(client, tokenId) {
  logSection(`测试 6: 获取最新价格 (getLatestPrice)`);
  try {
    const result = await client.getLatestPrice(tokenId);
    logSuccess(`成功获取最新价格`);
    console.log(`  价格: ${result.price}`);
    return result;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function testGetFeeRates(client, tokenId) {
  logSection(`测试 7: 获取手续费率 (getFeeRates)`);
  try {
    const fees = await client.getFeeRates(tokenId);
    logSuccess(`成功获取手续费率`);
    console.log(`  Maker 费率: ${fees.maker_fee_bps} bps`);
    console.log(`  Taker 费率: ${fees.taker_fee_bps} bps`);
    return fees;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function testGetMyOrders(client) {
  logSection('测试 8: 获取我的订单 (getMyOrders)');
  try {
    const result = await client.getMyOrders({ page: 1, limit: 10 });
    logSuccess(`成功获取订单列表`);
    console.log(`  订单数量: ${result.list.length}`);
    if (result.total) {
      logInfo(`总订单数: ${result.total}`);
    }
    result.list.forEach((order, i) => {
      console.log(`\n  ${i + 1}. 订单 ID: ${order.id}`);
      console.log(`     市场 ID: ${order.market_id}`);
      console.log(`     方向: ${order.side === 0 ? 'BUY' : 'SELL'}`);
      console.log(`     价格: ${order.price}`);
      console.log(`     状态: ${order.status}`);
    });
    return result;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return { list: [] };
  }
}

async function testGetMyPositions(client) {
  logSection('测试 9: 获取我的持仓 (getMyPositions)');
  try {
    const result = await client.getMyPositions({ page: 1, limit: 10 });
    logSuccess(`成功获取持仓列表`);
    console.log(`  持仓数量: ${result.list.length}`);
    if (result.total) {
      logInfo(`总持仓数: ${result.total}`);
    }
    result.list.forEach((pos, i) => {
      console.log(`\n  ${i + 1}. 市场 ID: ${pos.market_id}`);
      console.log(`     结果: ${pos.outcome}`);
      console.log(`     持仓量: ${pos.size}`);
      if (pos.avg_price) {
        console.log(`     平均价格: ${pos.avg_price}`);
      }
      if (pos.unrealized_pnl) {
        console.log(`     未实现盈亏: ${pos.unrealized_pnl}`);
      }
    });
    return result;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return { list: [] };
  }
}

async function testGetMyBalances(client) {
  logSection('测试 10: 获取我的余额 (getMyBalances)');
  try {
    const result = await client.getMyBalances();
    logSuccess(`成功获取余额列表`);
    console.log(`  钱包地址: ${result.walletAddress}`);
    console.log(`  多签地址: ${result.multiSignAddress || 'N/A'}`);
    console.log(`  链 ID: ${result.chainId}`);
    console.log(`  代币数量: ${result.balances?.length || 0}`);

    if (result.balances && result.balances.length > 0) {
      result.balances.forEach((balance, i) => {
        console.log(`\n  ${i + 1}. 代币: ${balance.quoteToken}`);
        console.log(`     总余额: ${balance.totalBalance}`);
        console.log(`     可用余额: ${balance.availableBalance}`);
        console.log(`     冻结余额: ${balance.frozenBalance}`);
        console.log(`     精度: ${balance.tokenDecimals}`);
      });
    }
    return result;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function testGetMyTrades(client) {
  logSection('测试 11: 获取我的交易历史 (getMyTrades)');
  try {
    const result = await client.getMyTrades({ page: 1, limit: 10 });
    logSuccess(`成功获取交易历史`);
    console.log(`  交易数量: ${result.list.length}`);
    if (result.total) {
      logInfo(`总交易数: ${result.total}`);
    }
    result.list.forEach((trade, i) => {
      console.log(`\n  ${i + 1}. 交易 ID: ${trade.id}`);
      console.log(`     市场 ID: ${trade.market_id}`);
      console.log(`     方向: ${trade.side === 0 ? 'BUY' : 'SELL'}`);
      console.log(`     价格: ${trade.price}`);
      console.log(`     数量: ${trade.amount}`);
      if (trade.fee) {
        console.log(`     手续费: ${trade.fee}`);
      }
      if (trade.timestamp) {
        console.log(`     时间: ${new Date(trade.timestamp * 1000).toLocaleString()}`);
      }
    });
    return result;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return { list: [] };
  }
}

async function testGetUserAuth(client) {
  logSection('测试 12: 获取用户认证信息 (getUserAuth)');
  try {
    const auth = await client.getUserAuth();
    logSuccess(`成功获取用户认证信息`);
    console.log(`  认证信息:`, JSON.stringify(auth, null, 2));
    return auth;
  } catch (error) {
    logError(`失败: ${error.message}`);
    console.error(error);
    return null;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('\n');
  log('blue', '🚀', '开始测试 Opinion CLOB SDK 所有查询功能');
  console.log('='.repeat(60));

  // 验证配置
  const { useTestKey } = validateConfig();

  // 初始化客户端
  const client = initClient(useTestKey);

  let successCount = 0;
  let failCount = 0;
  const results = {};

  // 测试 1: 获取报价代币
  const tokens = await testGetQuoteTokens(client);
  if (tokens && tokens.length > 0) {
    successCount++;
    results.quoteTokens = tokens;
  } else {
    failCount++;
  }

  // 测试 2: 获取市场列表
  const markets = await testGetMarkets(client);
  if (markets && markets.length > 0) {
    successCount++;
    results.markets = markets;
  } else {
    failCount++;
  }

  // 如果有市场，继续测试市场相关功能
  if (markets && markets.length > 0) {
    const firstMarket = markets[0];
    const marketId = firstMarket.marketId;

    // 测试 3: 获取市场详情
    const market = await testGetMarket(client, marketId);
    if (market) {
      successCount++;
      results.market = market;
    } else {
      failCount++;
    }

    // 如果有 outcome tokens，继续测试代币相关功能
    if (market && market.yesTokenId) {
      const tokenId = market.yesTokenId;

      // 测试 4: 获取订单簿
      const orderbook = await testGetOrderbook(client, tokenId);
      if (orderbook) {
        successCount++;
      } else {
        failCount++;
      }

      // 测试 5: 获取价格历史
      const history = await testGetPriceHistory(client, tokenId);
      if (history) {
        successCount++;
      } else {
        failCount++;
      }

      // 测试 6: 获取最新价格
      const latestPrice = await testGetLatestPrice(client, tokenId);
      if (latestPrice) {
        successCount++;
      } else {
        failCount++;
      }

      // 测试 7: 获取手续费率
      const fees = await testGetFeeRates(client, tokenId);
      if (fees) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      logInfo('跳过代币相关测试（没有 outcome tokens）');
      failCount += 4;
    }
  } else {
    logInfo('跳过市场相关测试（没有市场数据）');
    failCount += 5;
  }

  // 测试 8: 获取我的订单
  const orders = await testGetMyOrders(client);
  if (orders) {
    successCount++;
  } else {
    failCount++;
  }

  // 测试 9: 获取我的持仓
  const positions = await testGetMyPositions(client);
  if (positions) {
    successCount++;
  } else {
    failCount++;
  }

  // 测试 10: 获取我的余额
  const balances = await testGetMyBalances(client);
  if (balances) {
    successCount++;
  } else {
    failCount++;
  }

  // 测试 11: 获取我的交易历史
  const trades = await testGetMyTrades(client);
  if (trades) {
    successCount++;
  } else {
    failCount++;
  }

  // 测试 12: 获取用户认证信息
  const auth = await testGetUserAuth(client);
  if (auth) {
    successCount++;
  } else {
    failCount++;
  }

  // 打印测试总结
  console.log('\n');
  console.log('='.repeat(60));
  log('blue', '📊', '测试总结');
  console.log('='.repeat(60));
  logSuccess(`成功: ${successCount} 个测试`);
  if (failCount > 0) {
    logError(`失败: ${failCount} 个测试`);
  }
  console.log(`总计: ${successCount + failCount} 个测试`);
  console.log('');

  // 返回结果供进一步使用
  return {
    success: successCount,
    failed: failCount,
    total: successCount + failCount,
    results,
  };
}

// 运行测试
runAllTests()
  .then((summary) => {
    if (summary.failed === 0) {
      logSuccess('所有测试通过！🎉');
      process.exit(0);
    } else {
      logError(`有 ${summary.failed} 个测试失败`);
      process.exit(1);
    }
  })
  .catch((error) => {
    logError(`测试过程中发生错误: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
