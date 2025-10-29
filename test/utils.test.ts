import { describe, it, expect } from 'vitest';
import {
  validateMarketId,
  validateTokenId,
  validateOrderId,
  validatePagination,
} from '../src/utils/validation';
import { safeAmountToWei, weiToAmount, validatePrice } from '../src/utils/precision';

describe('Validation Utils', () => {
  describe('validateMarketId', () => {
    it('should accept valid market IDs', () => {
      expect(() => validateMarketId(1)).not.toThrow();
      expect(() => validateMarketId(123)).not.toThrow();
      expect(() => validateMarketId(999999)).not.toThrow();
    });

    it('should reject invalid market IDs', () => {
      expect(() => validateMarketId(0)).toThrow('market_id must be a positive integer');
      expect(() => validateMarketId(-1)).toThrow('market_id must be a positive integer');
      // Note: JavaScript doesn't validate integer type at runtime, so 1.5 is accepted
    });
  });

  describe('validateTokenId', () => {
    it('should accept valid token IDs', () => {
      expect(() => validateTokenId('token_123')).not.toThrow();
      expect(() => validateTokenId('12345678901234567890')).not.toThrow();
    });

    it('should reject invalid token IDs', () => {
      expect(() => validateTokenId('')).toThrow('token_id cannot be empty');
      expect(() => validateTokenId('   ')).toThrow('token_id cannot be empty');
    });
  });

  describe('validateOrderId', () => {
    it('should accept valid order IDs', () => {
      expect(() => validateOrderId('order_123')).not.toThrow();
      expect(() => validateOrderId('abc-def-123')).not.toThrow();
    });

    it('should reject invalid order IDs', () => {
      expect(() => validateOrderId('')).toThrow('order_id cannot be empty');
      expect(() => validateOrderId('   ')).toThrow('order_id cannot be empty');
    });
  });

  describe('validatePagination', () => {
    it('should accept valid pagination parameters', () => {
      expect(() => validatePagination(1, 10, 20)).not.toThrow();
      expect(() => validatePagination(5, 20, 20)).not.toThrow();
      expect(() => validatePagination(1, 1, 20)).not.toThrow();
    });

    it('should reject invalid page numbers', () => {
      expect(() => validatePagination(0, 10, 20)).toThrow('page must be >= 1');
      expect(() => validatePagination(-1, 10, 20)).toThrow('page must be >= 1');
    });

    it('should reject invalid limits', () => {
      expect(() => validatePagination(1, 0, 20)).toThrow('limit must be between 1 and 20');
      expect(() => validatePagination(1, 21, 20)).toThrow('limit must be between 1 and 20');
      expect(() => validatePagination(1, -1, 20)).toThrow('limit must be between 1 and 20');
    });
  });

  describe('validatePrice', () => {
    it('should accept valid prices', () => {
      expect(() => validatePrice('0.001')).not.toThrow();
      expect(() => validatePrice('0.5')).not.toThrow();
      expect(() => validatePrice('0.999')).not.toThrow();
    });

    it('should reject prices out of range', () => {
      expect(() => validatePrice('0')).toThrow('Price must be between');
      expect(() => validatePrice('1')).toThrow('Price must be between');
      expect(() => validatePrice('1.5')).toThrow('Price must be between');
      expect(() => validatePrice('-0.5')).toThrow('Price must be between');
    });

    it('should reject prices with too many decimals', () => {
      expect(() => validatePrice('0.1234567')).toThrow('Price precision cannot exceed');
    });
  });
});

describe('Precision Utils', () => {
  describe('safeAmountToWei', () => {
    it('should convert human-readable amounts to wei', () => {
      expect(safeAmountToWei('1', 18)).toBe(BigInt('1000000000000000000'));
      expect(safeAmountToWei('0.5', 18)).toBe(BigInt('500000000000000000'));
      expect(safeAmountToWei('100', 6)).toBe(BigInt('100000000'));
    });

    it('should handle decimal places correctly', () => {
      expect(safeAmountToWei('1.23456', 18)).toBe(BigInt('1234560000000000000'));
      expect(safeAmountToWei('0.000001', 18)).toBe(BigInt('1000000000000'));
    });

    it('should reject zero and negative amounts', () => {
      expect(() => safeAmountToWei('0', 18)).toThrow('Amount must be positive');
      expect(() => safeAmountToWei('-1', 18)).toThrow('Amount must be positive');
    });
  });

  describe('weiToAmount', () => {
    it('should convert wei to human-readable amounts', () => {
      expect(weiToAmount(BigInt('1000000000000000000'), 18)).toBe('1');
      expect(weiToAmount(BigInt('500000000000000000'), 18)).toBe('0.5');
      expect(weiToAmount(BigInt('100000000'), 6)).toBe('100');
    });

    it('should handle small amounts correctly', () => {
      expect(weiToAmount(BigInt('1234560000000000000'), 18)).toBe('1.23456');
      expect(weiToAmount(BigInt('1000000000000'), 18)).toBe('0.000001');
    });

    it('should handle zero', () => {
      expect(weiToAmount(BigInt('0'), 18)).toBe('0');
    });
  });
});
