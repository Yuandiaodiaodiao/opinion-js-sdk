#!/usr/bin/env python3
"""
Opinion CLOB SDK Test Script
Tests core functionality of the Python SDK
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_import():
    """Test SDK import"""
    print("Testing SDK import...")
    try:
        from opinion_clob_sdk import Client
        from opinion_clob_sdk.model import TopicStatusFilter
        print("✓ SDK import successful")
        return True
    except ImportError as e:
        print(f"✗ Failed to import SDK: {e}")
        print("Please install: pip install opinion-clob-sdk")
        return False

def test_client_initialization():
    """Test client initialization"""
    print("\nTesting client initialization...")
    try:
        from opinion_clob_sdk import Client

        client = Client(
            host=os.getenv('HOST'),
            apikey=os.getenv('API_KEY'),
            chain_id=int(os.getenv('CHAIN_ID', 56)),
            rpc_url=os.getenv('RPC_URL'),
            private_key=os.getenv('PRIVATE_KEY'),
            multi_sig_addr=os.getenv('MULTI_SIG_ADDRESS'),
            conditional_tokens_addr=os.getenv('CONDITIONAL_TOKEN_ADDR'),
            multisend_addr=os.getenv('MULTISEND_ADDR')
        )
        print("✓ Client initialized successfully")
        print(f"  Host: {os.getenv('HOST')}")
        print(f"  Chain ID: {os.getenv('CHAIN_ID')}")
        return client
    except Exception as e:
        print(f"✗ Client initialization failed: {e}")
        return None

def test_get_markets(client):
    """Test fetching markets"""
    print("\nTesting market fetching...")
    try:
        from opinion_clob_sdk.model import TopicStatusFilter

        response = client.get_markets(
            status=TopicStatusFilter.ACTIVATED,
            page=1,
            limit=10
        )

        if response.errno == 0:
            markets = response.result.list
            print(f"✓ Found {len(markets)} active markets")

            if markets:
                print("\nFirst 3 markets:")
                for i, market in enumerate(markets[:3], 1):
                    print(f"  {i}. Market #{market.marketId}: {market.marketTitle}")
                    print(f"     Status: {market.status}")

                return markets
            else:
                print("  No markets found")
                return []
        else:
            print(f"✗ Error fetching markets: {response.errmsg}")
            return None
    except Exception as e:
        print(f"✗ Exception during market fetch: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_get_market_detail(client, market_id):
    """Test fetching market details"""
    print(f"\nTesting market details for market #{market_id}...")
    try:
        response = client.get_market(market_id)

        if response.errno == 0:
            market = response.result.data
            print(f"✓ Market details retrieved")
            print(f"  Title: {market.marketTitle}")
            print(f"  Condition ID: {market.conditionId}")
            print(f"  Quote Token: {market.quoteToken}")
            print(f"  Chain ID: {market.chainId}")
            print(f"  Status: {market.status}")
            return market
        else:
            print(f"✗ Error fetching market details: {response.errmsg}")
            return None
    except Exception as e:
        print(f"✗ Exception during market detail fetch: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_get_orderbook(client, token_id):
    """Test fetching orderbook"""
    print(f"\nTesting orderbook for token {token_id[:20]}...")
    try:
        response = client.get_orderbook(token_id)

        if response.errno == 0:
            book = response.result.data
            print(f"✓ Orderbook retrieved")

            if book.bids:
                print(f"  Best Bid: {book.bids[0]}")
            else:
                print("  No bids")

            if book.asks:
                print(f"  Best Ask: {book.asks[0]}")
            else:
                print("  No asks")

            return book
        else:
            print(f"✗ Error fetching orderbook: {response.errmsg}")
            return None
    except Exception as e:
        print(f"✗ Exception during orderbook fetch: {e}")
        return None

def test_get_balances(client):
    """Test fetching user balances"""
    print("\nTesting balance fetching...")
    try:
        response = client.get_my_balances()

        if response.errno == 0:
            balances = response.result
            print(f"✓ Balances retrieved")
            if hasattr(balances, 'list') and balances.list:
                print(f"  Found {len(balances.list)} balance entries")
                for balance in balances.list[:3]:
                    print(f"    Token: {balance.tokenId[:20]}... Balance: {balance.amount}")
            else:
                print("  No balances found")
            return balances
        else:
            print(f"✗ Error fetching balances: {response.errmsg}")
            return None
    except Exception as e:
        print(f"✗ Exception during balance fetch: {e}")
        return None

def test_get_positions(client):
    """Test fetching user positions"""
    print("\nTesting position fetching...")
    try:
        response = client.get_my_positions(limit=20)

        if response.errno == 0:
            positions = response.result
            print(f"✓ Positions retrieved")
            if hasattr(positions, 'list') and positions.list:
                print(f"  Found {len(positions.list)} positions")
                for pos in positions.list[:3]:
                    print(f"    Market #{pos.marketId}: {pos.marketTitle}")
            else:
                print("  No positions found")
            return positions
        else:
            print(f"✗ Error fetching positions: {response.errmsg}")
            return None
    except Exception as e:
        print(f"✗ Exception during position fetch: {e}")
        return None

def main():
    """Main test runner"""
    print("=" * 60)
    print("Opinion CLOB SDK Test Suite")
    print("=" * 60)

    # Check environment variables
    required_vars = ['API_KEY', 'RPC_URL', 'PRIVATE_KEY', 'MULTI_SIG_ADDRESS', 'HOST', 'CHAIN_ID']
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"\n✗ Missing environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file")
        return 1

    print("\n✓ All required environment variables found")

    # Test 1: Import
    if not test_import():
        return 1

    # Test 2: Client initialization
    client = test_client_initialization()
    if not client:
        return 1

    # Test 3: Get markets
    markets = test_get_markets(client)
    if markets is None:
        print("\n⚠ Warning: Could not fetch markets, skipping dependent tests")
        return 1

    # Test 4: Get market details
    if markets:
        market_detail = test_get_market_detail(client, markets[0].marketId)

        # Test 5: Get orderbook (if market has options/tokens)
        if market_detail and hasattr(market_detail, 'options') and market_detail.options:
            test_get_orderbook(client, market_detail.options[0].tokenId)

    # Test 6: Get balances
    test_get_balances(client)

    # Test 7: Get positions
    test_get_positions(client)

    print("\n" + "=" * 60)
    print("Test Suite Completed")
    print("=" * 60)

    return 0

if __name__ == '__main__':
    sys.exit(main())
