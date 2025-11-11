import type { Address, Hex, PrivateKeyAccount } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { EIP712Domain, Order } from '../types/index.js';
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
   * @param order - Complete order object to sign
   * @param domain - EIP712 domain
   * @returns Signature as hex string
   */
  async signOrder(order: Order, domain: EIP712Domain): Promise<Hex> {
    const signature = await this.account.signTypedData({
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types: EIP712_ORDER_TYPES,
      primaryType: 'Order',
      message: order,
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
