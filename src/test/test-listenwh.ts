import { ListenBot } from '../services/webhook/service';
import { app } from '../services/webhook/server';

async function listenEvent() {
    try {
        console.log('Testing: Starting webhook test...');
        
        // Create an instance of your ListenBot
        // const bot = new ListenBot();
    
        // 2. Start the server (it's already configured in server.ts)
        // const PORT = 3001;
        // app.listen(PORT, () => {
            console.log(`Testing: server is running on...`);
            console.log('Testing: Ready to receive mentions');
    //     })
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
listenEvent();