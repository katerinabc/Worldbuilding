/**
 * Webhook Server Handler (server.ts)
 * 
 * Purpose: Acts as the entry point for incoming webhooks from Farcaster via Neynar.
 * Think of this as a receptionist that:
 * 1. Receives HTTP POST requests from Neynar
 * 2. Validates the webhook signature
 * 3. Ensures the request is properly formatted
 * 4. Passes valid webhook data to the WebhookService for processing
 * 
 * This separation allows us to change how we receive webhooks without touching the business logic.
 */ 
import { Request, Response, NextFunction } from 'express';
import { ListenBot } from './service';

const express = require('express');
const bodyParser = require('body-parser');

export const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the bot service
const bot = new ListenBot();

// Parse JSON bodies
app.use(express.json());

// Log all requests, regardless of path
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('\n🔍 New Request:');
    console.log('Time:', new Date().toLocaleTimeString());
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    next();
});
app.post('/', async (req: Request, res: Response) => {
    console.log('DEBUG: Root path accessed with post');
    res.send('Webhook server is running. smile.');
});

// I'm listening to post requests. that's why it's app.post
app.post('/webhook', async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
        console.log('\n📦 Event Data:');
        console.log('Time received:', new Date().toISOString());
        
        // Process the webhook
        const result = await bot.handleWebhook(req.body);
        console.log('[DEBUG] Webhook processing result:', result);
        
        // Send success response after processing
        const processingTime = Date.now() - startTime;
        console.log(`[DEBUG] Webhook processed successfully in ${processingTime}ms`);
        
        // Send proper JSON response to Neynar
        const response = {
            success: true,
            message: 'Webhook processed successfully',
            processingTime: `${processingTime}ms`
        };
        
        console.log('[DEBUG] Sending response to Neynar:', response);
        res.status(200).json(response);
    } catch (error) {
        console.error('[ERROR] Error processing webhook:', error);
        const processingTime = Date.now() - startTime;
        console.log(`[DEBUG] Webhook failed after ${processingTime}ms`);
        
        // Send error response to Neynar
        const errorResponse = {
            success: false,
            message: 'Error processing webhook',
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: `${processingTime}ms`
        };
        
        console.log('[DEBUG] Sending error response to Neynar:', errorResponse);
        res.status(500).json(errorResponse);
    }
});

// Basic route handler for testing
app.get('/', (req: Request, res: Response) => {
    console.log('DEBUG: Root path accessed with get');
    res.send('Webhook server is running. smile.');
});
    

// Start the server
app.listen(PORT, () => {
    console.log(`👂 Listening for events on port ${PORT}`);
});