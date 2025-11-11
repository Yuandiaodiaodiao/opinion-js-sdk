import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  formatEther,
} from 'viem';
import { bsc } from 'viem/chains';
import { Signer } from './signer.js';
import { ERC20_ABI, CONDITIONAL_TOKENS_ABI } from './abis.js';
import { InsufficientGasBalance, BalanceNotEnough } from '../errors.js';
import { GAS_SETTINGS } from '../config.js';
import type { TransactionResult } from '../types/models.js';

/**
 * Contract caller for blockchain operations
 */
export class ContractCaller {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private signer: Signer;
  private tokenDecimalsCache: Map<Address, number> = new Map();

  constructor(
    rpcUrl: string,
    _chainId: number,
    privateKey: Hex,
    private conditionalTokensAddr: Address,
  ) {
    this.signer = new Signer(privateKey);

    this.publicClient = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      chain: bsc,
      transport: http(rpcUrl),
      account: this.signer.getAccount(),
    });
  }

  /**
   * Get token decimals with caching
   */
  async getTokenDecimals(tokenAddress: Address): Promise<number> {
    const cached = this.tokenDecimalsCache.get(tokenAddress);
    if (cached !== undefined) {
      return cached;
    }

    const contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: this.publicClient,
    });

    const decimals = await contract.read.decimals();
    this.tokenDecimalsCache.set(tokenAddress, decimals);
    return decimals;
  }

  /**
   * Check if wallet has sufficient gas balance
   * @param estimatedGas - Estimated gas limit
   */
  async checkGasBalance(estimatedGas: bigint = GAS_SETTINGS.FALLBACK_GAS_LIMIT): Promise<void> {
    const signerAddress = this.signer.address();
    const gasBalance = await this.publicClient.getBalance({ address: signerAddress });

    // Get current block to determine gas pricing
    const block = await this.publicClient.getBlock({ blockTag: 'latest' });
    const baseFee = block.baseFeePerGas ?? 0n;

    let gasPrice: bigint;
    if (baseFee > 0n) {
      // EIP-1559
      const maxPriorityFee = GAS_SETTINGS.PRIORITY_FEE_GWEI * BigInt(1e9);
      const maxFeePerGas = baseFee * GAS_SETTINGS.BASE_FEE_MULTIPLIER + maxPriorityFee;
      gasPrice = maxFeePerGas;
    } else {
      // Legacy
      gasPrice = await this.publicClient.getGasPrice();
    }

    // Add safety margin
    const estimatedGasWithMargin = BigInt(
      Math.floor(Number(estimatedGas) * GAS_SETTINGS.SAFETY_MARGIN),
    );
    const requiredEth = estimatedGasWithMargin * gasPrice;

    if (gasBalance < requiredEth) {
      throw new InsufficientGasBalance(
        `Insufficient gas balance. Required: ${formatEther(requiredEth)} BNB, Available: ${formatEther(gasBalance)} BNB`,
        signerAddress,
        gasBalance,
        requiredEth,
      );
    }
  }

  /**
   * Enable trading by approving tokens
   * @param quoteTokenAddr - Quote token address
   * @param exchangeAddr - Exchange contract address
   * @returns Transaction result with hash, receipt, and event
   */
  async enableTrading(quoteTokenAddr: Address, exchangeAddr: Address): Promise<TransactionResult | null> {
    const signerAddress = this.signer.address();

    // Check current allowance
    const quoteTokenContract = getContract({
      address: quoteTokenAddr,
      abi: ERC20_ABI,
      client: this.publicClient,
    });

    const allowance = await quoteTokenContract.read.allowance([signerAddress, exchangeAddr]);

    // If already approved, return null (no transaction needed)
    const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);
    if (allowance >= MAX_UINT256 / BigInt(2)) {
      // Already has sufficient allowance
      return null;
    }

    // Check gas balance
    await this.checkGasBalance(100000n);

    // Approve max amount
    const hash = await this.walletClient.writeContract({
      address: quoteTokenAddr,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [exchangeAddr, MAX_UINT256],
      account: this.signer.getAccount(),
      chain: undefined,
    });

    // Wait for transaction receipt
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed. Hash: ${hash}`);
    }

    return {
      txHash: hash,
      receipt,
      event: receipt.logs[0], // First log entry as event
    };
  }

  /**
   * Split collateral into outcome tokens
   * @param quoteTokenAddr - Quote token address
   * @param conditionId - Condition ID
   * @param amount - Amount in wei
   * @param partition - Partition array
   * @returns Transaction result with hash, receipt, and event
   */
  async split(
    quoteTokenAddr: Address,
    conditionId: Hex,
    amount: bigint,
    partition: bigint[],
  ): Promise<TransactionResult> {
    const signerAddress = this.signer.address();

    // Check balance
    const quoteTokenContract = getContract({
      address: quoteTokenAddr,
      abi: ERC20_ABI,
      client: this.publicClient,
    });

    const balance = await quoteTokenContract.read.balanceOf([signerAddress]);
    if (balance < amount) {
      throw new BalanceNotEnough(
        `Insufficient balance. Required: ${amount}, Available: ${balance}`,
      );
    }

    // Check allowance for conditional tokens
    const allowance = await quoteTokenContract.read.allowance([
      signerAddress,
      this.conditionalTokensAddr,
    ]);

    if (allowance < amount) {
      // Need to approve first
      const approveHash = await this.walletClient.writeContract({
        address: quoteTokenAddr,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [this.conditionalTokensAddr, BigInt(2) ** BigInt(256) - BigInt(1)],
        account: this.signer.getAccount(),
        chain: undefined,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Check gas balance
    await this.checkGasBalance(300000n);

    // Split position
    const hash = await this.walletClient.writeContract({
      address: this.conditionalTokensAddr,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'splitPosition',
      args: [
        quoteTokenAddr,
        '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
        conditionId,
        partition,
        amount,
      ],
      account: this.signer.getAccount(),
      chain: undefined,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed. Hash: ${hash}`);
    }

    return {
      txHash: hash,
      receipt,
      event: receipt.logs[0],
    };
  }

  /**
   * Merge outcome tokens back to collateral
   * @param quoteTokenAddr - Quote token address
   * @param conditionId - Condition ID
   * @param amount - Amount in wei
   * @param partition - Partition array
   * @returns Transaction result with hash, receipt, and event
   */
  async merge(
    quoteTokenAddr: Address,
    conditionId: Hex,
    amount: bigint,
    partition: bigint[],
  ): Promise<TransactionResult> {
    // Check gas balance
    await this.checkGasBalance(300000n);

    // Merge positions
    const hash = await this.walletClient.writeContract({
      address: this.conditionalTokensAddr,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'mergePositions',
      args: [
        quoteTokenAddr,
        '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
        conditionId,
        partition,
        amount,
      ],
      account: this.signer.getAccount(),
      chain: undefined,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed. Hash: ${hash}`);
    }

    return {
      txHash: hash,
      receipt,
      event: receipt.logs[0],
    };
  }

  /**
   * Redeem winning tokens after resolution
   * @param quoteTokenAddr - Quote token address
   * @param conditionId - Condition ID
   * @param indexSets - Index sets to redeem
   * @returns Transaction result with hash, receipt, and event
   */
  async redeem(quoteTokenAddr: Address, conditionId: Hex, indexSets: bigint[]): Promise<TransactionResult> {
    // Check gas balance
    await this.checkGasBalance(300000n);

    // Redeem positions
    const hash = await this.walletClient.writeContract({
      address: this.conditionalTokensAddr,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'redeemPositions',
      args: [
        quoteTokenAddr,
        '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex,
        conditionId,
        indexSets,
      ],
      account: this.signer.getAccount(),
      chain: undefined,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed. Hash: ${hash}`);
    }

    return {
      txHash: hash,
      receipt,
      event: receipt.logs[0],
    };
  }

  /**
   * Get signer instance
   */
  getSigner(): Signer {
    return this.signer;
  }

  /**
   * Get public client
   */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /**
   * Get wallet client
   */
  getWalletClient(): WalletClient {
    return this.walletClient;
  }
}
