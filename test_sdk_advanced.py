#!/usr/bin/env python3
"""
Opinion CLOB SDK Advanced Test Script
Comprehensive testing with detailed diagnostics and error handling
"""

import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TestResult:
    """Test result tracker"""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.results = []

    def add_pass(self, test_name, details=""):
        self.passed += 1
        self.results.append({
            "test": test_name,
            "status": "PASS",
            "details": details
        })
        print(f"✓ {test_name}")
        if details:
            print(f"  {details}")

    def add_fail(self, test_name, error):
        self.failed += 1
        self.results.append({
            "test": test_name,
            "status": "FAIL",
            "error": str(error)
        })
        print(f"✗ {test_name}")
        print(f"  Error: {error}")

    def add_skip(self, test_name, reason):
        self.skipped += 1
        self.results.append({
            "test": test_name,
            "status": "SKIP",
            "reason": reason
        })
        print(f"⊘ {test_name} (skipped: {reason})")

    def summary(self):
        total = self.passed + self.failed + self.skipped
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"✓ Passed: {self.passed}")
        print(f"✗ Failed: {self.failed}")
        print(f"⊘ Skipped: {self.skipped}")
        print(f"Success Rate: {(self.passed/total*100) if total > 0 else 0:.1f}%")
        return self.failed == 0

def print_section(title):
    """Print section header"""
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print('─' * 60)

def test_environment(results):
    """Test environment variables"""
    print_section("Environment Variables")

    required_vars = {
        'API_KEY': 'API authentication key',
        'RPC_URL': 'Blockchain RPC endpoint',
        'PRIVATE_KEY': 'Wallet private key',
        'MULTI_SIG_ADDRESS': 'Multi-signature wallet address',
        'HOST': 'API host URL',
        'CHAIN_ID': 'Blockchain chain ID',
        'CONDITIONAL_TOKEN_ADDR': 'Conditional token contract address',
        'MULTISEND_ADDR': 'Multisend contract address'
    }

    all_present = True
    for var, desc in required_vars.items():
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if 'KEY' in var:
                display_value = f"{value[:6]}...{value[-4:]}" if len(value) > 10 else "***"
            elif 'ADDRESS' in var or 'ADDR' in var:
                display_value = f"{value[:6]}...{value[-4:]}" if len(value) > 10 else value
            else:
                display_value = value

            results.add_pass(f"ENV: {var}", f"{desc}: {display_value}")
        else:
            results.add_fail(f"ENV: {var}", f"Missing: {desc}")
            all_present = False

    return all_present

def test_sdk_import(results):
    """Test SDK import"""
    print_section("SDK Import")

    try:
        from opinion_clob_sdk import Client
        results.add_pass("Import Client", "opinion_clob_sdk.Client")
    except ImportError as e:
        results.add_fail("Import Client", str(e))
        return False

    try:
        from opinion_clob_sdk.model import TopicStatusFilter
        results.add_pass("Import TopicStatusFilter", "opinion_clob_sdk.model.TopicStatusFilter")
    except ImportError as e:
        results.add_fail("Import TopicStatusFilter", str(e))
        return False

    try:
        from opinion_clob_sdk.chain.py_order_utils.model.order import PlaceOrderDataInput
        from opinion_clob_sdk.chain.py_order_utils.model.sides import OrderSide
        from opinion_clob_sdk.chain.py_order_utils.model.order_type import LIMIT_ORDER
        results.add_pass("Import Order Types", "Order-related classes imported")
    except ImportError as e:
        results.add_fail("Import Order Types", str(e))
        return False

    return True

def test_client_initialization(results):
    """Test client initialization"""
    print_section("Client Initialization")

    try:
        from opinion_clob_sdk import Client

        # Test with all parameters
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

        details = f"Host: {os.getenv('HOST')}, Chain: {os.getenv('CHAIN_ID')}"
        results.add_pass("Client Initialization", details)
        return client

    except Exception as e:
        results.add_fail("Client Initialization", str(e))
        return None

def test_api_connection(client, results):
    """Test API connection with various endpoints"""
    print_section("API Connection Tests")

    if not client:
        results.add_skip("API Connection", "Client not initialized")
        return False

    # Test 1: Get markets with different filters
    try:
        from opinion_clob_sdk.model import TopicStatusFilter

        response = client.get_markets(
            status=TopicStatusFilter.ACTIVATED,
            page=1,
            limit=5
        )

        if response.errno == 0:
            count = len(response.result.list) if response.result.list else 0
            results.add_pass("Get Active Markets", f"Found {count} markets")
            return response.result.list
        elif response.errno == 403 or '403' in str(response):
            results.add_fail("Get Active Markets", "403 Forbidden - Check API key validity")
            return None
        else:
            results.add_fail("Get Active Markets", f"Error {response.errno}: {response.errmsg}")
            return None

    except Exception as e:
        error_msg = str(e)
        if '403' in error_msg or 'Forbidden' in error_msg:
            results.add_fail("Get Active Markets", "403 Forbidden - API key may be invalid or expired")
        else:
            results.add_fail("Get Active Markets", error_msg)
        return None

def test_market_operations(client, markets, results):
    """Test market-related operations"""
    print_section("Market Operations")

    if not markets or len(markets) == 0:
        results.add_skip("Market Detail", "No markets available")
        results.add_skip("Market Orderbook", "No markets available")
        return

    # Test market details
    try:
        market_id = markets[0].marketId
        response = client.get_market(market_id)

        if response.errno == 0:
            market = response.result.data
            results.add_pass("Get Market Detail", f"Market #{market_id}: {market.marketTitle[:50]}")

            # Test orderbook if tokens available
            if hasattr(market, 'options') and market.options and len(market.options) > 0:
                try:
                    token_id = market.options[0].tokenId
                    orderbook_response = client.get_orderbook(token_id)

                    if orderbook_response.errno == 0:
                        book = orderbook_response.result.data
                        bids_count = len(book.bids) if book.bids else 0
                        asks_count = len(book.asks) if book.asks else 0
                        results.add_pass("Get Orderbook", f"{bids_count} bids, {asks_count} asks")
                    else:
                        results.add_fail("Get Orderbook", orderbook_response.errmsg)
                except Exception as e:
                    results.add_fail("Get Orderbook", str(e))
            else:
                results.add_skip("Get Orderbook", "No tokens in market")
        else:
            results.add_fail("Get Market Detail", response.errmsg)

    except Exception as e:
        results.add_fail("Market Operations", str(e))

def test_account_operations(client, results):
    """Test account-related operations"""
    print_section("Account Operations")

    if not client:
        results.add_skip("Account Operations", "Client not initialized")
        return

    # Test balances
    try:
        response = client.get_my_balances()
        if response.errno == 0:
            count = len(response.result.list) if hasattr(response.result, 'list') else 0
            results.add_pass("Get Balances", f"Found {count} balance entries")
        else:
            results.add_fail("Get Balances", response.errmsg)
    except Exception as e:
        results.add_fail("Get Balances", str(e))

    # Test positions
    try:
        response = client.get_my_positions(limit=20)
        if response.errno == 0:
            count = len(response.result.list) if hasattr(response.result, 'list') else 0
            results.add_pass("Get Positions", f"Found {count} positions")
        else:
            results.add_fail("Get Positions", response.errmsg)
    except Exception as e:
        results.add_fail("Get Positions", str(e))

def test_quote_tokens(client, results):
    """Test quote token retrieval"""
    print_section("Quote Token Operations")

    if not client:
        results.add_skip("Get Quote Tokens", "Client not initialized")
        return

    try:
        response = client.get_quote_tokens()
        if response.errno == 0:
            tokens = response.result
            count = len(tokens) if tokens else 0
            results.add_pass("Get Quote Tokens", f"Found {count} quote tokens")

            if tokens and count > 0:
                print(f"\n  Available quote tokens:")
                for token in tokens[:3]:
                    print(f"    - {token.symbol}: {token.address}")
        else:
            results.add_fail("Get Quote Tokens", response.errmsg)
    except Exception as e:
        results.add_fail("Get Quote Tokens", str(e))

def save_results(results, filename='test_results.json'):
    """Save test results to JSON file"""
    output = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total": results.passed + results.failed + results.skipped,
            "passed": results.passed,
            "failed": results.failed,
            "skipped": results.skipped
        },
        "tests": results.results
    }

    try:
        with open(filename, 'w') as f:
            json.dump(output, f, indent=2)
        print(f"\n✓ Results saved to {filename}")
    except Exception as e:
        print(f"\n✗ Failed to save results: {e}")

def main():
    """Main test runner"""
    print("=" * 60)
    print("Opinion CLOB SDK - Advanced Test Suite")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    results = TestResult()

    # Run tests
    env_ok = test_environment(results)
    if not env_ok:
        print("\n⚠ Environment validation failed. Some tests may fail.")

    import_ok = test_sdk_import(results)
    if not import_ok:
        print("\n✗ SDK import failed. Cannot continue.")
        results.summary()
        return 1

    client = test_client_initialization(results)

    markets = test_api_connection(client, results)

    test_market_operations(client, markets, results)

    test_account_operations(client, results)

    test_quote_tokens(client, results)

    # Summary and save
    success = results.summary()
    save_results(results)

    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
