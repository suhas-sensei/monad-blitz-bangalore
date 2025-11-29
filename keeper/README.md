# Prediction Market Keeper Service

Automated keeper service for the PredictionV0 contract on Monad. This service runs a cron job that calls `performUpkeep()` every 60 seconds to automate round execution.

## Features

- ✅ **Automated Round Execution**: Calls `performUpkeep()` on schedule
- ✅ **Health Monitoring**: Checks operator balance, contract status, and RPC connection
- ✅ **Error Handling**: Graceful error handling with optional alerting
- ✅ **Gas Configuration**: Support for EIP-1559 gas parameters
- ✅ **Logging**: Detailed logging with timestamps and emoji indicators
- ✅ **Graceful Shutdown**: Handles SIGINT and SIGTERM signals

## Prerequisites

- Node.js v18+ 
- npm or yarn
- Monad RPC endpoint
- Operator wallet with sufficient ETH for gas fees

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

Edit the `.env` file with your settings:

```env
# RPC Configuration
RPC_URL=https://your-monad-rpc-url.com

# Wallet Configuration (KEEP THIS SECURE!)
OPERATOR_PRIVATE_KEY=0xYourPrivateKeyHere

# Contract Configuration
PREDICTION_CONTRACT_ADDRESS=0xYourContractAddress

# Cron Configuration (default: every 60 seconds)
CRON_SCHEDULE=*/60 * * * * *

# Gas Configuration (optional - leave empty for auto)
MAX_FEE_PER_GAS=
MAX_PRIORITY_FEE_PER_GAS=
GAS_LIMIT=500000

# Monitoring
ENABLE_LOGGING=true
ALERT_ON_ERROR=false
```

### Cron Schedule Format

The cron schedule uses the format: `second minute hour day month weekday`

Examples:
- `*/60 * * * * *` - Every 60 seconds (default)
- `0 * * * * *` - Every minute at 0 seconds
- `0 */5 * * * *` - Every 5 minutes
- `0 0 * * * *` - Every hour

## Usage

### Development Mode

```bash
# Run with auto-reload on file changes
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start the service
npm start
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name prediction-keeper

# View logs
pm2 logs prediction-keeper

# Monitor
pm2 monit

# Stop
pm2 stop prediction-keeper

# Restart
pm2 restart prediction-keeper

# Auto-start on system reboot
pm2 startup
pm2 save
```

## Project Structure

```
keeper/
├── src/
│   ├── index.ts       # Main entry point
│   ├── config.ts      # Configuration management
│   ├── logger.ts      # Logging utility
│   └── keeper.ts      # Keeper service logic
├── abi/
│   └── PredictionV0.json  # Contract ABI (auto-generated)
├── dist/              # Compiled JavaScript (generated)
├── .env               # Environment variables (create from .env.example)
├── .env.example       # Environment template
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## How It Works

1. **Initialization**: Loads configuration and validates environment variables
2. **Health Check**: Verifies RPC connection, operator balance, and contract status
3. **Cron Scheduling**: Sets up a cron job based on `CRON_SCHEDULE`
4. **Execution Loop**:
   - Checks if contract is paused
   - Gets current epoch
   - Calls `performUpkeep()` with configured gas parameters
   - Waits for transaction confirmation
   - Logs results and new epoch
5. **Error Handling**: Catches and logs errors, optionally triggers alerts

## Monitoring

The service logs the following information:

- ✅ Successful upkeep executions
- ⚠️  Warnings (e.g., too early to execute, low balance)
- ❌ Errors (e.g., transaction failures, RPC issues)
- ℹ️  Info (e.g., current epoch, gas used, block number)

### Example Output

```
[2025-11-29T10:00:00.000Z] ℹ️  🚀 Starting Prediction Market Keeper Service
[2025-11-29T10:00:00.100Z] ✅ Configuration validated successfully
[2025-11-29T10:00:00.200Z] ℹ️  Keeper service initialized
[2025-11-29T10:00:00.300Z] ℹ️  🏥 Running health check...
[2025-11-29T10:00:00.400Z] ✅ Connected to RPC (Block: 12345678)
[2025-11-29T10:00:00.500Z] ℹ️  Operator balance: 1.5 ETH
[2025-11-29T10:00:00.600Z] ℹ️  Current epoch: 42
[2025-11-29T10:00:00.700Z] ✅ Health check completed
[2025-11-29T10:01:00.000Z] ℹ️  ⏰ Cron job triggered
[2025-11-29T10:01:00.100Z] ℹ️  🔄 Executing performUpkeep...
[2025-11-29T10:01:00.200Z] ℹ️  Current epoch: 42
[2025-11-29T10:01:01.000Z] ℹ️  Transaction sent: 0xabc123...
[2025-11-29T10:01:03.000Z] ✅ ✨ Upkeep executed successfully!
[2025-11-29T10:01:03.100Z] ℹ️  Block: 12345679
[2025-11-29T10:01:03.200Z] ℹ️  Gas used: 250000
[2025-11-29T10:01:03.300Z] ℹ️  New epoch: 43
```

## Security Best Practices

1. **Never commit `.env` file** - It contains your private key!
2. **Use a dedicated operator wallet** - Don't use your main wallet
3. **Keep sufficient balance** - Monitor operator balance regularly
4. **Secure your server** - Use firewall, SSH keys, and regular updates
5. **Rotate keys periodically** - Change operator wallet occasionally
6. **Monitor logs** - Set up log monitoring and alerting

## Troubleshooting

### "Missing required environment variable"
- Make sure you've created `.env` file from `.env.example`
- Check that all required variables are set

### "Transaction failed" or "Too early/late"
- The contract has strict timing windows
- Ensure your cron schedule aligns with the contract's `intervalSeconds`
- Check that your server time is synchronized (use NTP)

### "Insufficient funds"
- Top up your operator wallet with ETH
- Check gas prices on Monad

### "Contract is paused"
- The contract admin has paused the contract
- Wait for it to be unpaused or contact the admin

## Gas Optimization

- Set `GAS_LIMIT` to a reasonable value (default: 500000)
- Monitor actual gas usage and adjust accordingly
- Use EIP-1559 parameters (`MAX_FEE_PER_GAS`, `MAX_PRIORITY_FEE_PER_GAS`) for better gas management

## Upgrading the ABI

If the contract is updated, regenerate the ABI:

```bash
cd ../contracts
forge build
cat out/PredictionV0.sol/PredictionV0.json | jq '.abi' > ../keeper/abi/PredictionV0.json
```

## License

MIT
