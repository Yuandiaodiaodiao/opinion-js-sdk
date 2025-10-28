import type { Address, Hex } from 'viem';
import { Signer } from './signer.js';
import type { OrderData, SignedOrder, EIP712Domain } from '../types/index.js';
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
   * Build and sign an order
   * @param orderData - Order data
   * @returns Signed order
   */
  async buildSignedOrder(orderData: OrderData): Promise<SignedOrder> {
    // Generate random salt
    const salt = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

    // Create complete order data with salt
    const completeOrderData: OrderData = {
      ...orderData,
    };

    // Sign the order
    const signature = await this.signer.signOrder(completeOrderData, this.domain);

    // Return signed order in API format
    const signedOrder: SignedOrder = {
      salt: salt.toString(),
      maker: orderData.maker,
      signer: orderData.signer,
      taker: orderData.taker,
      tokenId: orderData.tokenId,
      makerAmount: orderData.makerAmount.toString(),
      takerAmount: orderData.takerAmount.toString(),
      expiration: orderData.expiration,
      nonce: orderData.nonce,
      feeRateBps: orderData.feeRateBps,
      side: orderData.side.toString(),
      signatureType: orderData.signatureType.toString(),
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
