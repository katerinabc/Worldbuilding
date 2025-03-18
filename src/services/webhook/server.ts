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
// import { ListenBot } from './service';

const express = require('express');
const bodyParser = require('body-parser');

export const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the bot service
// const bot = new ListenBot();

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

// Basic route handler for testing
app.get('/', (req: Request, res: Response) => {
    console.log('DEBUG: Root path accessed');
    res.send('Webhook server is running');
});

// I'm listening to post requests. that's why it's app.post
app.post('/', (req: Request, res: Response) => {
    console.log('\n📦 Event Data:');
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).send('OK');
});
    

// Start the server
app.listen(PORT, () => {
    console.log(`👂 Listening for events on port ${PORT}`);
});