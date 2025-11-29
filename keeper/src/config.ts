import dotenv from 'dotenv';

dotenv.config();

interface Config {
    rpcUrl: string;
    operatorPrivateKey: string;
    predictionContractAddress: string;
    cronSchedule: string;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasLimit: bigint;
    enableLogging: boolean;
    alertOnError: boolean;
}

function getEnvVar(key: string, required: boolean = true): string {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
}

function parseBigInt(value: string | undefined): bigint | undefined {
    if (!value || value.trim() === '') return undefined;
    try {
        return BigInt(value);
    } catch {
        return undefined;
    }
}

export const config: Config = {
    // RPC Configuration
    rpcUrl: getEnvVar('RPC_URL'),

    // Wallet Configuration
    operatorPrivateKey: getEnvVar('OPERATOR_PRIVATE_KEY'),

    // Contract Configuration
    predictionContractAddress: getEnvVar('PREDICTION_CONTRACT_ADDRESS'),

    // Cron Configuration (default: every 60 seconds)
    cronSchedule: getEnvVar('CRON_SCHEDULE', false) || '*/60 * * * * *',

    // Gas Configuration
    maxFeePerGas: parseBigInt(process.env.MAX_FEE_PER_GAS),
    maxPriorityFeePerGas: parseBigInt(process.env.MAX_PRIORITY_FEE_PER_GAS),
    gasLimit: parseBigInt(process.env.GAS_LIMIT) || BigInt(500000),

    // Monitoring
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    alertOnError: process.env.ALERT_ON_ERROR === 'true',
};

// Validate configuration
export function validateConfig(): void {
    if (!config.rpcUrl.startsWith('http')) {
        throw new Error('Invalid RPC_URL: must start with http or https');
    }

    if (!config.operatorPrivateKey.startsWith('0x')) {
        throw new Error('Invalid OPERATOR_PRIVATE_KEY: must start with 0x');
    }

    if (!config.predictionContractAddress.startsWith('0x') || config.predictionContractAddress.length !== 42) {
        throw new Error('Invalid PREDICTION_CONTRACT_ADDRESS: must be a valid Ethereum address');
    }

    if (config.enableLogging) {
        console.log('Configuration validated successfully');
        console.log(`RPC URL: ${config.rpcUrl}`);
        console.log(`Contract: ${config.predictionContractAddress}`);
        console.log(`Cron Schedule: ${config.cronSchedule}`);
    }
}
