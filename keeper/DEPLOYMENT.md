# Deployment Guide

This guide covers different deployment options for the Prediction Market Keeper service.

## Table of Contents

1. [Local Development](#local-development)
2. [Production with PM2](#production-with-pm2)
3. [Systemd Service](#systemd-service)
4. [Docker Deployment](#docker-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Local Development

### Quick Start

```bash
# Run the setup script
./setup.sh

# Edit environment variables
nano .env

# Start in development mode
npm run dev
```

### Manual Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env

# Build TypeScript
npm run build

# Start the service
npm start
```

---

## Production with PM2

PM2 is a production process manager for Node.js applications.

### Installation

```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/index.js --name prediction-keeper

# View logs
pm2 logs prediction-keeper

# Monitor
pm2 monit

# Save PM2 configuration
pm2 save

# Setup auto-start on system reboot
pm2 startup
# Follow the instructions from the command output
```

### PM2 Commands

```bash
# Status
pm2 status

# Restart
pm2 restart prediction-keeper

# Stop
pm2 stop prediction-keeper

# Delete
pm2 delete prediction-keeper

# View logs (last 100 lines)
pm2 logs prediction-keeper --lines 100

# Real-time logs
pm2 logs prediction-keeper --raw
```

---

## Systemd Service

For running as a native Linux system service.

### Setup

1. **Edit the service file:**

```bash
nano prediction-keeper.service
```

Update these fields:
- `User=YOUR_USERNAME` → Your Linux username
- `WorkingDirectory=/path/to/bobasodaxmonad/keeper` → Full path to keeper directory
- `ExecStart=/usr/bin/node /path/to/bobasodaxmonad/keeper/dist/index.js` → Full path

2. **Create log directory:**

```bash
sudo mkdir -p /var/log/prediction-keeper
sudo chown $USER:$USER /var/log/prediction-keeper
```

3. **Install the service:**

```bash
# Copy service file
sudo cp prediction-keeper.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable prediction-keeper

# Start the service
sudo systemctl start prediction-keeper
```

### Systemd Commands

```bash
# Check status
sudo systemctl status prediction-keeper

# View logs
sudo journalctl -u prediction-keeper -f

# Restart
sudo systemctl restart prediction-keeper

# Stop
sudo systemctl stop prediction-keeper

# Disable auto-start
sudo systemctl disable prediction-keeper
```

---

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Using Docker CLI

```bash
# Build image
docker build -t prediction-keeper .

# Run container
docker run -d \
  --name prediction-keeper \
  --env-file .env \
  --restart unless-stopped \
  prediction-keeper

# View logs
docker logs -f prediction-keeper

# Stop container
docker stop prediction-keeper

# Remove container
docker rm prediction-keeper
```

### Docker on Remote Server

```bash
# Save image
docker save prediction-keeper | gzip > prediction-keeper.tar.gz

# Copy to server
scp prediction-keeper.tar.gz user@server:/path/to/

# On server: Load image
docker load < prediction-keeper.tar.gz

# Run
docker run -d \
  --name prediction-keeper \
  --env-file .env \
  --restart unless-stopped \
  prediction-keeper
```

---

## Monitoring & Maintenance

### Health Checks

The keeper performs automatic health checks on startup. You can also check manually:

```bash
# Check operator balance
# (View logs for balance information)

# Check if service is running
pm2 status prediction-keeper
# OR
sudo systemctl status prediction-keeper
# OR
docker ps | grep prediction-keeper
```

### Log Monitoring

**PM2:**
```bash
pm2 logs prediction-keeper --lines 100
```

**Systemd:**
```bash
sudo journalctl -u prediction-keeper -n 100 --no-pager
```

**Docker:**
```bash
docker logs prediction-keeper --tail 100
```

### Alerts Setup

For production, set up monitoring alerts:

1. **Low Balance Alert**: Monitor operator wallet balance
2. **Service Down Alert**: Monitor service uptime
3. **Transaction Failure Alert**: Set `ALERT_ON_ERROR=true` in `.env`

### Backup & Recovery

**Backup `.env` file securely:**
```bash
# Encrypt and backup
gpg -c .env
# Store .env.gpg in a secure location
```

**Recovery:**
```bash
# Decrypt
gpg .env.gpg

# Restore and restart service
pm2 restart prediction-keeper
```

### Updating the Keeper

```bash
# Pull latest code
git pull

# Rebuild
npm run build

# Restart service
pm2 restart prediction-keeper
# OR
sudo systemctl restart prediction-keeper
# OR
docker-compose up -d --build
```

### Updating the ABI

If the contract is upgraded:

```bash
# Regenerate ABI
cd ../contracts
forge build
cat out/PredictionV0.sol/PredictionV0.json | jq '.abi' > ../keeper/abi/PredictionV0.json

# Rebuild and restart
cd ../keeper
npm run build
pm2 restart prediction-keeper
```

---

## Troubleshooting

### Service Won't Start

1. Check logs for errors
2. Verify `.env` configuration
3. Ensure operator wallet has sufficient balance
4. Check RPC endpoint is accessible

### Transactions Failing

1. Check gas configuration
2. Verify operator has enough ETH
3. Check contract is not paused
4. Verify timing is correct (not too early/late)

### High Gas Costs

1. Adjust `GAS_LIMIT` in `.env`
2. Monitor actual gas usage in logs
3. Consider adjusting cron schedule

---

## Security Checklist

- [ ] `.env` file is not committed to git
- [ ] Private key is stored securely
- [ ] Operator wallet is separate from main wallet
- [ ] Server has firewall configured
- [ ] SSH uses key-based authentication
- [ ] Regular backups of `.env` file
- [ ] Monitoring and alerts are set up
- [ ] Logs are rotated and archived

---

## Support

For issues or questions:
1. Check the logs first
2. Review the main README.md
3. Verify your configuration
4. Check contract status on block explorer
