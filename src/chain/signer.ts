import type { Address, Hex, PrivateKeyAccount } from 'viem';
import { privateKeyToAccount, signTypedData } from 'viem/accounts';
import type { EIP712Domain, OrderData } from '../types/index.js';
import { EIP712_ORDER_TYPES } from '../types/index.js';

/**
 * Signer class for EIP712 order signing
 */
export class Signer {
  private account: PrivateKeyAccount;

  constructor(privateKey: Hex) {
    this.account = privateKeyToAccount(privateKey);
  }

  /**
   * Get the signer's address
   */
  address(): Address {
    return this.account.address;
  }

  /**
   * Sign an order using EIP712
   * @param orderData - Order data to sign
   * @param domain - EIP712 domain
   * @returns Signature as hex string
   */
  async signOrder(orderData: OrderData, domain: EIP712Domain): Promise<Hex> {
    const message = {
      salt: BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
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

    const signature = await signTypedData({
      account: this.account,
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types: EIP712_ORDER_TYPES,
      primaryType: 'Order',
      message,
    });

    return signature;
  }

  /**
   * Get the underlying account
   */
  getAccount(): PrivateKeyAccount {
    return this.account;
  }
}
