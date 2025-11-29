import cron from 'node-cron';
import { config, validateConfig } from './config';
import { Logger } from './logger';
import { KeeperService } from './keeper';

async function main() {
    // Initialize logger
    const logger = new Logger(config.enableLogging);

    logger.separator();
    logger.info('Starting Prediction Market Keeper Service');
    logger.separator();

    try {
        // Validate configuration
        validateConfig();

        // Initialize keeper service
        const keeper = new KeeperService(logger);

        // Run initial health check
        await keeper.healthCheck();

        // Schedule cron job
        logger.info(`Scheduling cron job: ${config.cronSchedule}`);

        const task = cron.schedule(config.cronSchedule, async () => {
            logger.separator();
            logger.info('Cron job triggered');
            await keeper.performUpkeep();
            logger.separator();
        });

        logger.success('Keeper service started successfully!');
        logger.info('Press Ctrl+C to stop');

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            logger.info('\nShutting down keeper service...');
            task.stop();
            logger.success('Keeper service stopped');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            logger.info('\nShutting down keeper service...');
            task.stop();
            logger.success('Keeper service stopped');
            process.exit(0);
        });

    } catch (error) {
        logger.error('Failed to start keeper service', error);
        process.exit(1);
    }
}

// Start the application
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
