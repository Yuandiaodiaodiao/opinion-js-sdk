# 测试指南

## 运行测试

1. **配置环境变量**

   复制 `.env.example` 为 `.env`:
   ```bash
   cp .env.example .env
   ```

   然后编辑 `.env` 文件，填入正确的配置:

   - `API_KEY`: 您的 Opinion API 密钥
   - `PRIVATE_KEY`: **完整的** 64 字符私钥 (0x + 64 个十六进制字符)
   - `MULTI_SIG_ADDRESS`: 您的钱包地址
   - `HOST`: API 服务器地址
   - 其他参数可以使用默认值

   **⚠️ 重要**: 
   - 私钥必须是完整的 66 字符 (0x + 64 个十六进制字符)
   - 例如: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
   - 请勿将包含真实私钥的 .env 文件提交到 git

2. **安装依赖** (如果还没安装)

   ```bash
   npm install
   ```

3. **构建 SDK** (如果还没构建)

   ```bash
   npm run build
   ```

4. **运行测试**

   ```bash
   node test.js
   ```

## 测试覆盖的功能

测试脚本会依次测试以下 12 个查询功能:

1. ✅ **getQuoteTokens** - 获取支持的报价代币
2. ✅ **getMarkets** - 获取市场列表
3. ✅ **getMarket** - 获取单个市场详情
4. ✅ **getOrderbook** - 获取订单簿
5. ✅ **getPriceHistory** - 获取价格历史
6. ✅ **getLatestPrice** - 获取最新价格
7. ✅ **getFeeRates** - 获取手续费率
8. ✅ **getMyOrders** - 获取我的订单
9. ✅ **getMyPositions** - 获取我的持仓
10. ✅ **getMyBalances** - 获取我的余额
11. ✅ **getMyTrades** - 获取我的交易历史
12. ✅ **getUserAuth** - 获取用户认证信息

## 测试输出

测试脚本会输出彩色的结果:
- 🟢 绿色 ✅ = 成功
- 🔴 红色 ❌ = 失败
- 🔵 蓝色 ℹ️ = 信息

最后会显示测试总结，包括成功和失败的数量。

## 常见问题

### 1. 私钥格式错误

**错误**: `PRIVATE_KEY 长度不正确`

**解决**: 确保私钥是完整的 66 字符:
- 必须以 `0x` 开头
- 后面跟 64 个十六进制字符 (0-9, a-f)
- 总长度 = 66 字符

### 2. API 密钥无效

**错误**: `HTTP error! status: 401` 或 `Unauthorized`

**解决**: 检查 `.env` 中的 `API_KEY` 是否正确

### 3. 网络连接问题

**错误**: `fetch failed` 或 `ECONNREFUSED`

**解决**: 
- 检查网络连接
- 确认 `HOST` 和 `RPC_URL` 地址正确
- 尝试访问 API 服务器地址确认可达

### 4. 没有数据

某些测试可能返回空列表 (如 orders, positions, trades)，这是正常的，说明账户还没有相关数据。

## 仅测试特定功能

如果只想测试特定功能，可以注释掉 test.js 中不需要的测试调用。

例如，只测试市场相关功能:

```javascript
// 注释掉用户相关测试
// await testGetMyOrders(client);
// await testGetMyPositions(client);
// await testGetMyBalances(client);
// await testGetMyTrades(client);
```

## 安全提示

⚠️ **请勿**:
- 将包含真实私钥的 .env 文件提交到版本控制
- 在公开场合分享您的私钥或 API 密钥
- 使用测试脚本进行实际交易 (这些是只读查询)

✅ **建议**:
- 使用测试账户进行测试
- 将 .env 添加到 .gitignore
- 定期更换 API 密钥
