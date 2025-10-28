/**
 * API连接诊断脚本
 * 帮助排查API密钥和连接问题
 */

require('dotenv').config();

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

async function diagnoseApi() {
  console.log('\n' + '='.repeat(60));
  log('blue', '🔍', 'Opinion CLOB API 连接诊断');
  console.log('='.repeat(60) + '\n');

  // 1. 检查环境变量
  log('cyan', 'ℹ️', '步骤 1: 检查环境变量');
  const apiKey = process.env.API_KEY || '';
  const host = process.env.HOST || '';
  const privateKey = process.env.PRIVATE_KEY || '';

  console.log(`  API_KEY: ${apiKey ? apiKey.substring(0, 10) + '... (长度: ' + apiKey.length + ')' : '未设置'}`);
  console.log(`  HOST: ${host || '未设置'}`);
  console.log(`  PRIVATE_KEY: ${privateKey ? privateKey.substring(0, 10) + '... (长度: ' + privateKey.length + ')' : '未设置'}\n`);

  if (!apiKey) {
    log('red', '❌', 'API_KEY 未设置');
    return;
  }
  if (!host) {
    log('red', '❌', 'HOST 未设置');
    return;
  }

  // 2. 测试基本连接
  log('cyan', 'ℹ️', '步骤 2: 测试服务器连接');
  try {
    const response = await fetch(host);
    log('green', '✅', `服务器可达 (状态码: ${response.status})`);
  } catch (error) {
    log('red', '❌', `无法连接到服务器: ${error.message}`);
    return;
  }

  // 3. 测试 API 调用
  log('cyan', 'ℹ️', '\n步骤 3: 测试 API 调用');

  const endpoints = [
    {
      name: 'getQuoteTokens',
      url: `${host}/openapi/quoteToken?apikey=${apiKey}&chainId=56`,
      description: '获取报价代币列表'
    },
    {
      name: 'getMarkets',
      url: `${host}/openapi/market?apikey=${apiKey}&chainId=56&page=1&limit=5`,
      description: '获取市场列表'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n  测试: ${endpoint.description}`);
    console.log(`  URL: ${endpoint.url.replace(apiKey, apiKey.substring(0, 5) + '...')}`);

    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`  HTTP 状态: ${response.status}`);

      if (response.status === 403) {
        log('red', '❌', '  认证失败 (403 Forbidden)');
        log('yellow', '⚠️', '  可能原因:');
        console.log('    1. API_KEY 无效或已过期');
        console.log('    2. API_KEY 没有访问此端点的权限');
        console.log('    3. API_KEY 被截断或不完整');

        // 尝试读取响应内容
        const text = await response.text();
        if (text) {
          console.log(`  响应内容: ${text.substring(0, 200)}`);
        }
      } else if (response.ok) {
        const data = await response.json();
        log('green', '✅', '  调用成功!');
        console.log(`  响应: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        log('yellow', '⚠️', `  HTTP错误: ${response.status}`);
        const text = await response.text();
        if (text) {
          console.log(`  响应: ${text.substring(0, 200)}`);
        }
      }
    } catch (error) {
      log('red', '❌', `  请求失败: ${error.message}`);
    }
  }

  // 4. 诊断结果和建议
  console.log('\n' + '='.repeat(60));
  log('blue', '📋', '诊断建议');
  console.log('='.repeat(60) + '\n');

  if (apiKey.length < 20) {
    log('yellow', '⚠️', `API_KEY 看起来很短 (${apiKey.length} 字符)`);
    console.log('  正常的 API 密钥通常更长');
    console.log('  请确认 .env 文件中的 API_KEY 是否完整\n');
  }

  if (privateKey.length !== 66) {
    log('yellow', '⚠️', `PRIVATE_KEY 长度不正确 (${privateKey.length} 字符，应为 66)`);
    console.log('  私钥格式: 0x + 64 个十六进制字符\n');
  }

  console.log('如果仍有问题，请:');
  console.log('  1. 检查 API_KEY 是否从 Opinion 平台正确复制');
  console.log('  2. 确认账户是否有权限访问这些 API');
  console.log('  3. 联系 Opinion 支持团队验证 API 密钥');
  console.log('');
}

diagnoseApi().catch(console.error);
