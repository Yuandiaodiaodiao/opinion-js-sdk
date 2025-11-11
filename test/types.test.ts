import { describe, it, expect } from 'vitest';
import type {
  QuoteToken,
  Market,
  Order,
  Trade,
  Position,
  Balance,
  TokenBalance,
  FeeRates,
  PriceHistoryPoint,
  Orderbook,
} from '../src/types';

describe('Type Definitions', () => {
  describe('QuoteToken', () => {
    it('should match API response structure', () => {
      const token: QuoteToken = {
        id: 1,
        quoteTokenName: 'USDT',
        quoteTokenAddress: '0x55d398326f99059fF775485246999027B3197955',
        ctfExchangeAddress: '0x5f45344126d6488025b0b84a3a8189f2487a7246',
        decimal: 18,
        symbol: 'USDT',
        chainId: '56',
        createdAt: 1234567890,
      };

      expect(token.id).toBe(1);
      expect(token.symbol).toBe('USDT');
      expect(token.decimal).toBe(18);
      expect(typeof token.chainId).toBe('string');
    });
  });

  describe('Market', () => {
    it('should match API response structure', () => {
      const market: Market = {
        marketId: 123,
        marketTitle: 'Test Market',
        status: 2,
        statusEnum: 'Activated',
        quoteToken: '0x55d398326f99059fF775485246999027B3197955',
        chainId: '56',
        conditionId: 'abc123',
        questionId: 'q123',
        yesTokenId: 'token_yes',
        noTokenId: 'token_no',
        resultTokenId: '',
        volume: '1000',
        createdAt: 1234567890,
        cutoffAt: 1234567890,
        resolvedAt: 0,
      };

      expect(market.marketId).toBe(123);
      expect(market.statusEnum).toBe('Activated');
      expect(typeof market.chainId).toBe('string');
    });
  });

  describe('Order', () => {
    it('should match API response structure', () => {
      const order: Order = {
        orderId: 'order_123',
        transNo: 'trans_123',
        status: 1,
        statusEnum: 'Pending',
        marketId: 123,
        marketTitle: 'Test Market',
        rootMarketId: 0,
        rootMarketTitle: '',
        side: 0,
        sideEnum: 'Buy',
        tradingMethod: 2,
        tradingMethodEnum: 'Limit',
        outcome: 'YES',
        outcomeSide: 1,
        outcomeSideEnum: 'Yes',
        price: '0.55',
        orderShares: '100',
        orderAmount: '55',
        filledShares: '0',
        filledAmount: '0',
        profit: '0',
        quoteToken: '0x55d398326f99059fF775485246999027B3197955',
        createdAt: 1234567890,
        expiresAt: 0,
        trades: [],
      };

      expect(order.orderId).toBe('order_123');
      expect(order.sideEnum).toBe('Buy');
      expect(order.tradingMethodEnum).toBe('Limit');
    });
  });

  describe('Trade', () => {
    it('should match API response structure', () => {
      const trade: Trade = {
        orderNo: 'order_123',
        tradeNo: 'trade_456',
        txHash: '0xabc...',
        marketId: 123,
        marketTitle: 'Test Market',
        rootMarketId: 0,
        rootMarketTitle: '',
        side: 'Buy',
        outcome: 'YES',
        outcomeSide: 1,
        outcomeSideEnum: 'Yes',
        price: '0.55',
        shares: '100',
        amount: '55',
        fee: 0,
        profit: '0',
        quoteToken: '0x55d398326f99059fF775485246999027B3197955',
        quoteTokenUsdPrice: '1.0',
        usdAmount: '55',
        status: 2,
        statusEnum: 'Finished',
        chainId: '56',
        createdAt: 1234567890,
      };

      expect(trade.tradeNo).toBe('trade_456');
      expect(trade.side).toBe('Buy');
      expect(typeof trade.fee).toMatch(/number|string/);
    });
  });

  describe('Position', () => {
    it('should match API response structure', () => {
      const position: Position = {
        marketId: 123,
        marketTitle: 'Test Market',
        marketStatus: 2,
        marketStatusEnum: 'Activated',
        marketCutoffAt: 0,
        rootMarketId: 0,
        rootMarketTitle: '',
        outcome: 'YES',
        outcomeSide: 1,
        outcomeSideEnum: 'Yes',
        sharesOwned: '100',
        sharesFrozen: '0',
        unrealizedPnl: '10',
        unrealizedPnlPercent: '0.1',
        dailyPnlChange: '5',
        dailyPnlChangePercent: '0.05',
        conditionId: 'cond_123',
        tokenId: 'token_123',
        currentValueInQuoteToken: '110',
        avgEntryPrice: '0.55',
        claimStatus: 0,
        claimStatusEnum: 'CanNotClaim',
        quoteToken: '0x55d398326f99059fF775485246999027B3197955',
      };

      expect(position.marketId).toBe(123);
      expect(position.sharesOwned).toBe('100');
      expect(position.outcomeSideEnum).toBe('Yes');
    });
  });

  describe('Balance', () => {
    it('should match API response structure', () => {
      const tokenBalance: TokenBalance = {
        quoteToken: '0x55d398326f99059fF775485246999027B3197955',
        tokenDecimals: 18,
        totalBalance: '1000',
        availableBalance: '800',
        frozenBalance: '200',
      };

      const balance: Balance = {
        walletAddress: '0xabc...',
        multiSignAddress: '0xdef...',
        chainId: '56',
        balances: [tokenBalance],
      };

      expect(balance.balances.length).toBe(1);
      expect(balance.balances[0].tokenDecimals).toBe(18);
      expect(typeof balance.chainId).toBe('string');
    });
  });

  describe('FeeRates', () => {
    it('should match API response structure', () => {
      const feeRates: FeeRates = {
        tokenId: 'token_123',
        takerFeeBps: '10',
        makerFeeBps: '5',
      };

      expect(feeRates.tokenId).toBe('token_123');
      expect(feeRates.takerFeeBps).toBe('10');
      expect(feeRates.makerFeeBps).toBe('5');
    });
  });

  describe('PriceHistoryPoint', () => {
    it('should match API response structure', () => {
      const point: PriceHistoryPoint = {
        t: 1234567890,
        p: '0.55',
        v: '1000',
      };

      expect(point.t).toBe(1234567890);
      expect(point.p).toBe('0.55');
      expect(point.v).toBe('1000');
    });
  });

  describe('Orderbook', () => {
    it('should match API response structure', () => {
      const orderbook: Orderbook = {
        bids: [
          { price: '0.55', size: '100' },
          { price: '0.54', size: '200' },
        ],
        asks: [
          { price: '0.56', size: '150' },
          { price: '0.57', size: '250' },
        ],
      };

      expect(orderbook.bids.length).toBe(2);
      expect(orderbook.asks.length).toBe(2);
      expect(orderbook.bids[0].price).toBe('0.55');
      expect(orderbook.asks[0].price).toBe('0.56');
    });
  });
});
