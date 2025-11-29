export class Logger {
    private enabled: boolean;

    constructor(enabled: boolean = true) {
        this.enabled = enabled;
    }

    private formatTimestamp(): string {
        return new Date().toISOString();
    }

    info(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.log(`[${this.formatTimestamp()}] INFO: ${message}`, ...args);
        }
    }

    success(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.log(`[${this.formatTimestamp()}] SUCCESS: ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.warn(`[${this.formatTimestamp()}] WARN: ${message}`, ...args);
        }
    }

    error(message: string, error?: any): void {
        if (this.enabled) {
            console.error(`[${this.formatTimestamp()}] ERROR: ${message}`);
            if (error) {
                console.error(error);
            }
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.enabled && process.env.DEBUG === 'true') {
            console.log(`[${this.formatTimestamp()}] DEBUG: ${message}`, ...args);
        }
    }

    separator(): void {
        if (this.enabled) {
            console.log('─'.repeat(80));
        }
    }
}
