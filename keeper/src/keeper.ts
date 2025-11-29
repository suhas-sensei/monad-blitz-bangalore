import { ethers } from 'ethers';
import { config } from './config';
import { Logger } from './logger';
import PredictionV0ABI from '../abi/PredictionV0.json';

export class KeeperService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;

        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

        // Initialize wallet
        this.wallet = new ethers.Wallet(config.operatorPrivateKey, this.provider);

        // Initialize contract
        this.contract = new ethers.Contract(
            config.predictionContractAddress,
            PredictionV0ABI,
            this.wallet
        );

        this.logger.info('Keeper service initialized');
        this.logger.info(`Operator address: ${this.wallet.address}`);
    }

    /**
     * Check if the contract is paused
     */
    async isPaused(): Promise<boolean> {
        try {
            return await this.contract.paused();
        } catch (error) {
            this.logger.error('Failed to check pause status', error);
            throw error;
        }
    }

    /**
     * Get current epoch from contract
     */
    async getCurrentEpoch(): Promise<bigint> {
        try {
            return await this.contract.currentEpoch();
        } catch (error) {
            this.logger.error('Failed to get current epoch', error);
            throw error;
        }
    }

    /**
     * Execute performUpkeep function
     */
    async performUpkeep(): Promise<void> {
        try {
            this.logger.info('Executing performUpkeep...');

            // Check if contract is paused
            const paused = await this.isPaused();
            if (paused) {
                this.logger.warn('Contract is paused, skipping upkeep');
                return;
            }

            // Get current epoch before execution
            const currentEpoch = await this.getCurrentEpoch();
            this.logger.info(`Current epoch: ${currentEpoch}`);

            // Prepare transaction options
            const txOptions: any = {
                gasLimit: config.gasLimit,
            };

            // Add EIP-1559 gas parameters if configured
            if (config.maxFeePerGas) {
                txOptions.maxFeePerGas = config.maxFeePerGas;
            }
            if (config.maxPriorityFeePerGas) {
                txOptions.maxPriorityFeePerGas = config.maxPriorityFeePerGas;
            }

            // Execute performUpkeep
            const tx = await this.contract.performUpkeep(txOptions);
            this.logger.info(`Transaction sent: ${tx.hash}`);

            // Wait for confirmation
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                this.logger.success('Upkeep executed successfully!');
                this.logger.info(`Block: ${receipt.blockNumber}`);
                this.logger.info(`Gas used: ${receipt.gasUsed.toString()}`);

                // Get new epoch after execution
                const newEpoch = await this.getCurrentEpoch();
                this.logger.info(`New epoch: ${newEpoch}`);
            } else {
                this.logger.error('Transaction failed');
            }

        } catch (error: any) {
            // Handle specific error cases
            if (error.message?.includes('Too early')) {
                this.logger.warn('Too early to execute, will retry on next schedule');
            } else if (error.message?.includes('Too late')) {
                this.logger.error('Too late to execute - missed the window!', error);
            } else {
                this.logger.error('Failed to execute performUpkeep', error);
            }

            if (config.alertOnError) {
                // Here you could integrate with alerting services (e.g., Telegram, Discord, Email)
                this.logger.error('ALERT: Critical error occurred!');
            }
        }
    }

    /**
     * Get operator balance
     */
    async getOperatorBalance(): Promise<string> {
        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            this.logger.error('Failed to get operator balance', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<void> {
        try {
            this.logger.separator();
            this.logger.info('Running health check...');

            // Check RPC connection
            const blockNumber = await this.provider.getBlockNumber();
            this.logger.success(`Connected to RPC (Block: ${blockNumber})`);

            // Check operator balance
            const balance = await this.getOperatorBalance();
            this.logger.info(`Operator balance: ${balance} ETH`);

            if (parseFloat(balance) < 0.01) {
                this.logger.warn('Low operator balance! Please top up.');
            }

            // Check contract status
            const paused = await this.isPaused();
            this.logger.info(`Contract paused: ${paused}`);

            // Check current epoch
            const epoch = await this.getCurrentEpoch();
            this.logger.info(`Current epoch: ${epoch}`);

            this.logger.success('Health check completed');
            this.logger.separator();
        } catch (error) {
            this.logger.error('Health check failed', error);
            throw error;
        }
    }
}
