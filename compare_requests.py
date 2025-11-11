#!/usr/bin/env python3
"""Compare two API requests to find differences"""

first = {
    'contractAddress': '', 'currencyAddress': '0x55d398326f99059fF775485246999027B3197955',
    'expiration': '0', 'feeRateBps': '0', 'maker': '0xc99853ad4B116952e83640D5bb532c29698D119B',
    'makerAmount': '6000000000000000000', 'nonce': '0', 'orderExpTime': '0',
    'price': '0.01', 'safeRate': '0', 'salt': '1399621994', 'side': '0',
    'sign': '0x828de9aa041a4729908e2bd8fa6a831c2cd001196aab59db306292453173345c3ebc51d774395b0f7340baf9147d6c1283c844309cab190463056b2c860169901b',
    'signature': '0x828de9aa041a4729908e2bd8fa6a831c2cd001196aab59db306292453173345c3ebc51d774395b0f7340baf9147d6c1283c844309cab190463056b2c860169901b',
    'signatureType': '2', 'signer': '0x64C891124df965F53546834c3777da38f759B82E',
    'taker': '0x0000000000000000000000000000000000000000', 'takerAmount': '600000000000000000000',
    'timestamp': 1762896320, 'tokenId': '37029929800985239120461077343514542950048857363074104543068606430978923968964',
    'topicId': 1708, 'tradingMethod': 2
}

second = {
    'contract_address': '', 'salt': '8651874791422680', 'topic_id': 1708,
    'maker': '0x64C891124df965F53546834c3777da38f759B82E',
    'signer': '0x64C891124df965F53546834c3777da38f759B82E',
    'taker': '0x0000000000000000000000000000000000000000',
    'token_id': '37029929800985239120461077343514542950048857363074104543068606430978923968964',
    'maker_amount': '6000000000000000000', 'taker_amount': '600000000000000000000',
    'expiration': '0', 'nonce': '0', 'fee_rate_bps': '0', 'side': '0',
    'signature_type': '2',
    'signature': '0xa7b9a471d3c660795f4aa059c225022e9a35d58a293243ff2f1457b4fad25a5323e4fd1b157511a5386eccece2c7e8fb13b9c925215ff0ea4306c88181803bb81c',
    'sign': '0xa7b9a471d3c660795f4aa059c225022e9a35d58a293243ff2f1457b4fad25a5323e4fd1b157511a5386eccece2c7e8fb13b9c925215ff0ea4306c88181803bb81c',
    'currency_address': '0x55d398326f99059ff775485246999027b3197955',
    'price': '0.01', 'trading_method': 2, 'timestamp': 1762896444,
    'safe_rate': '0', 'order_exp_time': '0'
}

def camel_to_snake(name):
    """Convert camelCase to snake_case"""
    result = []
    for i, c in enumerate(name):
        if c.isupper() and i > 0:
            result.append('_')
            result.append(c.lower())
        else:
            result.append(c.lower())
    return ''.join(result)

print("=" * 80)
print("关键差异分析")
print("=" * 80)

# 1. 命名风格差异
print("\n1. 【命名风格差异】")
print("   第一个请求: camelCase (contractAddress, currencyAddress, makerAmount...)")
print("   第二个请求: snake_case (contract_address, currency_address, maker_amount...)")
print("   ⚠️  API可能只接受camelCase格式的字段名")

# 2. 字段名映射
print("\n2. 【字段名映射对照】")
first_keys = set(first.keys())
second_keys = set(second.keys())

second_to_camel = {k: camel_to_snake(k) for k in first.keys()}
print("   第一个请求字段 -> snake_case等效:")
for fk in sorted(first.keys()):
    snake = camel_to_snake(fk)
    has_in_second = snake in second_keys
    mark = "✓" if has_in_second else "✗"
    print(f"   {mark} {fk} -> {snake}")

# 3. 值的差异
print("\n3. 【字段值差异】")
differences = []

for first_key in first.keys():
    snake_key = camel_to_snake(first_key)
    if snake_key in second:
        first_val = str(first[first_key]).lower()
        second_val = str(second[snake_key]).lower()
        if first_val != second_val:
            differences.append((first_key, snake_key, first[first_key], second[snake_key]))

for fk, sk, fv, sv in differences:
    print(f"   • {fk} / {sk}:")
    print(f"     第一个: {fv}")
    print(f"     第二个: {sv}")

# 4. 地址大小写差异
print("\n4. 【地址格式差异】")
print(f"   currencyAddress (第一个): {first['currencyAddress']}")
print(f"   currency_address (第二个): {second['currency_address']}")
print("   ⚠️  注意大小写: 第一个有大写'F'，第二个全小写")

# 5. 根本原因分析
print("\n" + "=" * 80)
print("错误原因分析: can't convert to decimal")
print("=" * 80)
print("""
最可能的原因：
1. ⚠️  API后端期望 camelCase 字段名，但第二个请求发送的是 snake_case
2. 当字段名不匹配时，后端可能收到空值或错误字段，导致 decimal 转换失败
3. 地址格式问题：EIP-55校验和地址格式要求特定的大小写

解决方案：
✓ 使用 camelCase 字段名（与第一个请求保持一致）
✓ 保持地址的正确大小写格式（EIP-55 checksum）
✓ 检查SDK是否自动转换字段名格式
""")

print("\n5. 【相同值字段】")
same_fields = []
for first_key in first.keys():
    snake_key = camel_to_snake(first_key)
    if snake_key in second:
        first_val = str(first[first_key]).lower()
        second_val = str(second[snake_key]).lower()
        if first_val == second_val:
            same_fields.append(first_key)

print(f"   以下字段值相同: {', '.join(same_fields[:10])}")
if len(same_fields) > 10:
    print(f"   ... 等共{len(same_fields)}个字段")
