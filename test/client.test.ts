import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Client } from '../src/client';
import { OrderSide, OrderType } from '../src/types';

// Mock environment variables
const mockEnv = {
  HOST: 'https://api.example.com',
  API_KEY: 'test_api_key',
  RPC_URL: 'https://rpc.example.com',
  PRIVATE_KEY: '0x0123456789012345678901234567890123456789012345678901234567890123',
  WALLET_ADDRESS: '0x1234567890123456789012345678901234567890',
  CHAIN_ID: '56',
};

describe('Client', () => {
  describe('Constructor', () => {
    it('should create a client instance with valid config', () => {
      const client = new Client({
        host: mockEnv.HOST,
        apiKey: mockEnv.API_KEY,
        rpcUrl: mockEnv.RPC_URL,
        privateKey: mockEnv.PRIVATE_KEY,
        walletAddress: mockEnv.WALLET_ADDRESS,
        chainId: parseInt(mockEnv.CHAIN_ID),
      });

      expect(client).toBeInstanceOf(Client);
    });

    it('should throw error for invalid chain ID', () => {
      expect(() => {
        new Client({
          host: mockEnv.HOST,
          apiKey: mockEnv.API_KEY,
          rpcUrl: mockEnv.RPC_URL,
          privateKey: mockEnv.PRIVATE_KEY,
          walletAddress: mockEnv.WALLET_ADDRESS,
          chainId: 999, // Invalid chain ID
        });
      }).toThrow('Chain ID');
    });

    it('should throw error for invalid private key format', () => {
      expect(() => {
        new Client({
          host: mockEnv.HOST,
          apiKey: mockEnv.API_KEY,
          rpcUrl: mockEnv.RPC_URL,
          privateKey: 'invalid_key',
          walletAddress: mockEnv.WALLET_ADDRESS,
          chainId: 56,
        });
      }).toThrow();
    });
  });
});

describe('Order Types and Enums', () => {
  it('should have correct OrderSide values', () => {
    expect(OrderSide.BUY).toBe(0);
    expect(OrderSide.SELL).toBe(1);
  });

  it('should have correct OrderType values', () => {
    expect(OrderType.MARKET_ORDER).toBe(1);
    expect(OrderType.LIMIT_ORDER).toBe(2);
  });
});
