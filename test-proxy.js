// 测试代理是否在所有fetch请求中工作
const { ProxyAgent } = require('undici');

async function testFetch() {
  const proxy = process.env.https_proxy || process.env.HTTPS_PROXY;
  console.log('Proxy:', proxy);

  const apiKey = 'Wfd0sGGKrrfsIsgUqZyCRhZ3ASciL8Gg';

  const urls = [
    `https://proxy.opinion.trade:8443/openapi/quoteToken?apikey=${apiKey}&chainId=56`,
    `https://proxy.opinion.trade:8443/openapi/market?apikey=${apiKey}&chainId=56&page=1&limit=2`,
  ];

  for (const url of urls) {
    console.log(`\n测试 URL: ${url.replace(apiKey, 'API_KEY...')}`);

    try {
      const proxyAgent = proxy ? new ProxyAgent(proxy) : undefined;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        dispatcher: proxyAgent,
      });

      console.log(`状态码: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`响应成功:`, JSON.stringify(data).substring(0, 100) + '...');
      } else {
        const text = await response.text();
        console.log(`错误响应:`, text.substring(0, 200));
      }
    } catch (error) {
      console.error(`请求失败:`, error.message);
    }
  }
}

testFetch();
