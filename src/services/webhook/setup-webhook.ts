import { ListenBot } from './service';

async function setupWebhook() {
    console.log('Setting up webhook...');
    const bot = new ListenBot();
    await bot.createWebhook();
    console.log('Webhook setup complete!');
}

// Only run if this file is executed directly
if (require.main === module) {
    setupWebhook().catch(console.error);
} 