import type { Address, Hex } from 'viem';
import { Signer } from './signer.js';
import type { OrderData, Order, SignedOrder, EIP712Domain } from '../types/index.js';
import { ZERO_ADDRESS } from '../config.js';

/**
 * Order builder for creating and signing orders
 */
export class OrderBuilder {
  private domain: EIP712Domain;

  constructor(
    private exchangeAddress: Address,
    private chainId: number,
    private signer: Signer,
  ) {
    this.domain = {
      name: 'OPINION CTF Exchange',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.exchangeAddress,
    };
  }

  /**
   * Generate random salt
   */
  private generateSalt(): bigint {
    return BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  }

  /**
   * Validate order inputs
   */
  private validateInputs(data: OrderData): boolean {
    // Basic validation
    if (!data.maker || !data.tokenId) {
      return false;
    }
    return true;
  }

  /**
   * Build an order with all required fields
   * @param orderData - Order data
   * @returns Complete Order object
   */
  buildOrder(orderData: OrderData): Order {
    if (!this.validateInputs(orderData)) {
      throw new Error('Invalid order inputs');
    }

    // Verify signer matches
    if (orderData.signer !== this.signer.address()) {
      throw new Error('Signer does not match');
    }

    return {
      salt: this.generateSalt(),
      maker: orderData.maker,
      signer: orderData.signer,
      taker: orderData.taker,
      tokenId: BigInt(orderData.tokenId),
      makerAmount: orderData.makerAmount,
      takerAmount: orderData.takerAmount,
      expiration: BigInt(orderData.expiration),
      nonce: BigInt(orderData.nonce),
      feeRateBps: BigInt(orderData.feeRateBps),
      side: orderData.side,
      signatureType: orderData.signatureType,
    };
  }

  /**
   * Sign an order
   * @param order - Order to sign
   * @returns Signature
   */
  async buildOrderSignature(order: Order): Promise<Hex> {
    return this.signer.signOrder(order, this.domain);
  }

  /**
   * Build and sign an order
   * @param orderData - Order data
   * @returns Signed order in API format
   */
  async buildSignedOrder(orderData: OrderData): Promise<SignedOrder> {
    // Build the order
    const order = this.buildOrder(orderData);

    // Sign the order
    const signature = await this.buildOrderSignature(order);

    // Convert to API format (SignedOrder)
    const signedOrder: SignedOrder = {
      salt: order.salt.toString(),
      maker: order.maker,
      signer: order.signer,
      taker: order.taker,
      tokenId: order.tokenId.toString(),
      makerAmount: order.makerAmount.toString(),
      takerAmount: order.takerAmount.toString(),
      expiration: order.expiration.toString(),
      nonce: order.nonce.toString(),
      feeRateBps: order.feeRateBps.toString(),
      side: order.side.toString(),
      signatureType: order.signatureType.toString(),
      signature,
    };

    return signedOrder;
  }

  /**
   * Create order data structure
   * @param params - Order parameters
   * @returns Order data
   */
  createOrderData(params: {
    maker: Address;
    tokenId: string;
    makerAmount: bigint;
    takerAmount: bigint;
    side: number;
    signatureType: number;
    taker?: Address;
    feeRateBps?: string;
    nonce?: string;
    expiration?: string;
  }): OrderData {
    return {
      maker: params.maker,
      taker: params.taker ?? ZERO_ADDRESS,
      tokenId: params.tokenId,
      makerAmount: params.makerAmount,
      takerAmount: params.takerAmount,
      side: params.side,
      feeRateBps: params.feeRateBps ?? '0',
      nonce: params.nonce ?? '0',
      signer: this.signer.address(),
      expiration: params.expiration ?? '0',
      signatureType: params.signatureType,
    };
  }
}
