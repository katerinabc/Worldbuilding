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
import { Request, Response } from 'express';
import { ListenBot } from './service';

const express = require('express');
const bodyParser = require('body-parser');

export const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the bot service
const bot = new ListenBot();

// Logging middleware for all requests
app.use((req: Request, res: Response, next: Function) => {
    console.log('\n📥 Incoming Request:');
    console.log('Time:', new Date().toLocaleTimeString());
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', Object.keys(req.headers));
    console.log('-------------------\n');
    next();
});

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// I'm listening to post requests. that's why it's app.post
app.post('/webhook', async (req: Request, res: Response) => {
    try {
        console.log('\n🔔 Webhook Received!');
        console.log('Time:', new Date().toLocaleTimeString());
        console.log('Headers:', Object.keys(req.headers));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('-------------------\n');
        
        // Process the webhook using our bot service
        await bot.handleWebhook(req.body);
        
        res.status(200).send('Webhook received successfully');
    } catch (error) {
        console.error('\n❌ Webhook Error!');
        console.error('Time:', new Date().toLocaleTimeString());
        console.error('Error:', error);
        console.error('-------------------\n');
        res.status(500).send('Internal server error');
    }
});
    

// Start the server
app.listen(PORT, () => {
    console.log('starting the server to listening to events...');
    console.log(`Secure webhook server running on port ${PORT}`);
    console.log('waiting for events...');
});