/**
 * Base SDK error class
 */
export class OpinionSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpinionSDKError';
  }
}

/**
 * Invalid parameter error
 */
export class InvalidParamError extends OpinionSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParamError';
  }
}

/**
 * API error
 */
export class OpenApiError extends OpinionSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'OpenApiError';
  }
}

/**
 * Insufficient balance error
 */
export class BalanceNotEnough extends OpinionSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'BalanceNotEnough';
  }
}

/**
 * No positions to redeem error
 */
export class NoPositionsToRedeem extends OpinionSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'NoPositionsToRedeem';
  }
}

/**
 * Insufficient gas balance error
 */
export class InsufficientGasBalance extends OpinionSDKError {
  constructor(
    message: string,
    public signerAddress: string,
    public gasBalance: bigint,
    public requiredEth: bigint,
  ) {
    super(message);
    this.name = 'InsufficientGasBalance';
  }
}

/**
 * Invalid multisig transaction error
 */
export class InvalidMultisigTx extends OpinionSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMultisigTx';
  }
}

/**
 * Could not pay gas with ether error
 */
export class CouldNotPayGasWithEther extends InvalidMultisigTx {
  constructor(message: string) {
    super(message);
    this.name = 'CouldNotPayGasWithEther';
  }
}
