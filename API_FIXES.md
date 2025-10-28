# API 调用修复总结

## 修复的问题

### 1. API 端点路径修复

#### 修复前 (错误)
- `/openapi/quote_token` ❌
- `/openapi/token/price_history` ❌
- `/openapi/token/latest_price` ❌
- `/openapi/token/fee_rates` ❌

#### 修复后 (正确)
- `/openapi/quoteToken` ✅
- `/openapi/token/price-history` ✅
- `/openapi/token/latest-price` ✅
- `/openapi/token/fee-rates` ✅

### 2. 查询参数命名修复

根据 Python SDK 的 OpenAPI 规范，不同 API 使用不同的参数命名约定：

#### Market API - 使用 camelCase

**修复前 (错误)**
```typescript
{
  chain_id: params.chainId,    // ❌
  topic_type: params.topicType, // ❌
  market_id: marketId,          // ❌
}
```

**修复后 (正确)**
```typescript
{
  chainId: params.chainId,      // ✅
  marketType: params.topicType, // ✅
  marketId: marketId,           // ✅
}
```

#### Token API - 使用 snake_case

这些端点**保持** snake_case (已经正确):
```typescript
{
  token_id: params.tokenId,     // ✅ 正确
  start_at: params.startAt,     // ✅ 正确
  end_at: params.endAt,         // ✅ 正确
}
```

#### User/Order API - 使用 camelCase

**修复前 (错误)**
```typescript
{
  market_id: params.marketId,   // ❌
  order_id: orderId,            // ❌
}
```

**修复后 (正确)**
```typescript
{
  marketId: params.marketId,    // ✅
  orderId: orderId,             // ✅
}
```

## API 端点参数规范总结

### 所有端点列表及其参数格式

| 端点 | 方法 | 参数格式 | 查询参数示例 |
|------|------|----------|--------------|
| `/openapi/market` | GET | camelCase | `chainId`, `marketType`, `page`, `limit`, `status` |
| `/openapi/market/{marketId}` | GET | camelCase (path) | `marketId`, `chainId` |
| `/openapi/market/categorical/{marketId}` | GET | camelCase (path) | `marketId` |
| `/openapi/quoteToken` | GET | camelCase | `chainId`, `page`, `limit` |
| `/openapi/token/orderbook` | GET | snake_case | `token_id` |
| `/openapi/token/price-history` | GET | snake_case | `token_id`, `interval`, `start_at`, `end_at` |
| `/openapi/token/latest-price` | GET | snake_case | `token_id` |
| `/openapi/token/fee-rates` | GET | snake_case | `token_id` |
| `/openapi/order` | GET | camelCase | `marketId`, `status`, `page`, `limit` |
| `/openapi/order` | POST | camelCase (body) | 订单数据 |
| `/openapi/order/cancel` | POST | camelCase (body) | `orderId` |
| `/openapi/order/{orderId}` | GET | camelCase (path) | `orderId` |
| `/openapi/positions` | GET | camelCase | `marketId`, `page`, `limit` |
| `/openapi/user/balance` | GET | camelCase | `chainId` |
| `/openapi/trade` | GET | camelCase | `marketId`, `page`, `limit` |
| `/openapi/user/auth` | GET | - | - |

## 验证方法

修复已通过以下方式验证：

1. **查看 Python SDK 源码**
   - 检查 `/mnt/c/Users/Yuan/miniconda3/Lib/site-packages/opinion_api/api/prediction_market_api.py`
   - 确认所有序列化方法中的参数命名

2. **查看 Pydantic 模型定义**
   - 检查 `/mnt/c/Users/Yuan/miniconda3/Lib/site-packages/opinion_api/models/` 中的模型
   - 确认字段别名 (alias)

3. **TypeScript 构建测试**
   - 所有修改后构建成功
   - 无类型错误

## 影响的文件

- ✅ `src/api/marketApi.ts` - 4 处端点路径，3 处参数名称
- ✅ `src/api/userApi.ts` - 4 处参数名称

## 兼容性说明

这些修复确保 TypeScript SDK 与 Opinion Labs 的 REST API 完全兼容。所有参数命名现在与 Python SDK 保持一致。
