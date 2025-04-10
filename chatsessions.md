# Chat session

# Chat Session - 2024-03-07

## Project: Sci-Fi Literature Chatbot for Farcaster

### Context
- Initial planning phase for building a chatbot that will interact with users on Farcaster
- Bot will use GaiaNet node with specialized knowledge base on science fiction literature
- You have experience with APIs, Farcaster API, and GaiaNet node
- You have beginner-level experience with HTML, Node, and JavaScript, but stronger experience in Python and data analysis

### Today's Goals
- Establish communication framework for our collaboration
- Understand project scope and available tools

### Discussion
Q: What is your training cutoff date?
A: Training cutoff is in 2024, exact date uncertain. Familiar with recent chatbot technology but specific versions should be verified.

Q: What context/documentation do you have access to?
A: Explained that I don't retain information between sessions and can only work with explicitly shared information.

Q: How to collaborate over multiple days?
A: Need context refreshers at start of each session, code snippets shared, and tracking of previous decisions.

Q: What are your limitations?
A: Can't access external resources, remember between sessions, execute code, or access real-time information.

Q: How to export our conversations?
A: Explored various options for saving conversations in Cursor (Version 0.46.11), including manual copy-paste method.

### New Discussion: Webhook Implementation
Q: How should we structure the webhook service?
A: Decided on a folder structure in services/webhook/ with:
- server.ts: Handles HTTP and receiving webhooks
- service.ts: Contains business logic and conversation management
- types.ts: Webhook-specific type definitions

Q: Why this structure?
A: Separating concerns for:
1. HTTP handling (server.ts)
2. Business logic (service.ts)
3. Type definitions (types.ts)
This makes the code more maintainable and follows single responsibility principle.

Q: How will conversation state work?
A: Will track:
- Thread hashes to identify conversations
- Current stage of interaction (analyzing, generating, etc.)
- User information and context
This helps manage the back-and-forth between user and bot.

### Understanding the Webhook Structure
The decision to structure the webhook service into separate files mirrors how a business might handle customer interactions. Think of server.ts as a receptionist who receives all incoming calls (webhooks) and ensures they're legitimate before passing them along. The service.ts file acts like the department specialist who knows exactly what to do with each request and how to process it. Just as a business keeps records of ongoing customer interactions, our conversation state management tracks where we are in each interaction with users on Farcaster.

This separation of responsibilities makes our code more maintainable and easier to test. If we need to change how we receive webhooks (the receptionist), we can modify server.ts without touching our core business logic in service.ts. Similarly, if we want to change how we handle user interactions (the specialist's work), we can update service.ts without worrying about how the webhooks are received. The types.ts file serves as our shared language, ensuring everyone in the system knows exactly what information they're working with.

### Key Decisions
- Need to maintain documentation of our sessions for continuity
- Will break down complex problems into smaller, manageable parts
- Will verify all implementation details due to potential version compatibility issues
- Webhook implementation will use a folder structure for better organization
- Will manage conversation state to handle multi-step interactions

### Next Steps
- Establish project structure
- Plan Farcaster integration approach
- Design GaiaNet node interaction
- Create documentation structure for tracking progress
- Implement webhook service structure

# Chat Session - 2024-03-XX (Webhook Debugging)

## Questions I Had

1. **Hosting Architecture**
   - Why do we need both DigitalOcean and Heroku?
   - How does the webhook flow work between Neynar → DigitalOcean → Heroku?
   - What's the difference between DigitalOcean and Heroku in this setup?

2. **Nginx Configuration**
   - What should be in the Nginx config file?
   - Why do we need Nginx at all?
   - How does Nginx handle SSL/TLS?

3. **Webhook Testing**
   - Why can't we use ngrok for testing? (Neynar advised against it)
   - How do we test webhooks locally without ngrok?
   - What's the best way to simulate webhook events?

## Hosting Setup Explained

### DigitalOcean's Role
- Acts as the main domain and SSL certificate provider
- Runs Nginx as a reverse proxy
- Handles incoming requests from Neynar
- Routes traffic to Heroku

### Heroku's Role
- Hosts the actual webhook server application
- Manages the Node.js runtime environment
- Handles application scaling and deployment
- Processes the webhook data

### Webhook Flow
1. Neynar sends webhook to your DigitalOcean domain
2. DigitalOcean's Nginx receives the request
3. Nginx forwards the request to Heroku
4. Heroku processes the webhook in your application

## Nginx Configuration
Here's what should be in your Nginx config file:

```nginx
# /etc/nginx/sites-available/your-domain.conf

server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Webhook endpoint
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Other routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Things I Did Not Understand Initially

1. **Webhook Architecture**
   - Didn't fully grasp the three-layer architecture (server.ts, service.ts, types.ts)
   - Wasn't clear about the separation between HTTP handling and business logic
   - Didn't understand why we needed separate files for different concerns

2. **Nginx Configuration**
   - Didn't realize Nginx needed specific location blocks for webhook endpoints
   - Wasn't aware that Nginx could block requests before they reached our Express server
   - Didn't understand the importance of proper proxy_pass configuration

3. **Port Management**
   - Wasn't clear about how multiple services could use the same port
   - Didn't understand the difference between port 3000 and 3001 in our setup
   - Wasn't aware of how to properly check for port conflicts

## Mistakes Made

1. **Server Configuration**
   - Started with a basic Express server without proper error handling
   - Didn't implement webhook signature validation initially
   - Failed to add comprehensive logging from the start

2. **Testing Approach**
   - Initially tried to use ngrok (not recommended by Neynar)
   - Made changes to multiple files simultaneously without testing each change
   - Didn't properly test the webhook endpoint before deployment

3. **Error Handling**
   - Didn't implement proper error responses
   - Failed to log detailed error information
   - Didn't validate incoming webhook data structure

## Things Learned

1. **Best Practices**
   - Always start with local testing using a proper test environment
   - Implement comprehensive logging from the beginning
   - Test each component separately before integration
   - Use proper error handling and status codes

2. **Architecture**
   - Separation of concerns is crucial (HTTP handling vs. business logic)
   - Type definitions help catch errors early
   - Middleware can handle common tasks like validation

3. **Debugging Tools**
   - curl for manual testing
   - Nginx logs for request tracking
   - Process management tools for port conflicts

# Webhook Debugging Cheatsheet

## 1. Initial Setup Check
```bash
# Check if port is in use
lsof -i :3000

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 2. Local Testing Setup
```bash
# Test webhook locally
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 3. Server Verification
```bash
# Check if server is running
ps aux | grep node

# Check server logs
pm2 logs

# Test server directly
curl http://localhost:3000/
```

## 4. Common Issues and Solutions

### Port Conflicts
1. Check running processes: `lsof -i :3000`
2. Kill conflicting process: `kill -9 <PID>`
3. Change port if needed

### 404 Errors
1. Check Nginx logs
2. Verify location block exists
3. Confirm proxy_pass configuration
4. Test endpoint directly

### No Webhook Data
1. Check server logs
2. Verify webhook URL is correct
3. Test with curl
4. Check Nginx access logs

### Connection Issues
1. Verify firewall settings
2. Check SSL/TLS configuration
3. Verify DNS settings

## 5. Testing Checklist
- [ ] Server starts without errors
- [ ] Port is available
- [ ] Nginx configuration is correct
- [ ] Local testing works with curl
- [ ] Webhook URL is accessible
- [ ] Logs show incoming requests
- [ ] Error handling works
- [ ] Response codes are correct

# Chat Session - 2024-04-03 (Conversation Flow Restructuring)

## Current Issue
- Bot is not properly maintaining conversation state between interactions
- Long gaps between user interactions cause the bot to lose context
- Current stage-based system (1-4) is not intuitive and relies heavily on state management

## Proposed Solution
Restructure the conversation flow into three distinct modes based on interaction patterns rather than stages:

1. **Initialization Mode**
   - Trigger: User mentions bot for the first time
   - Conditions:
     - `event.data.mentioned_profiles` includes bot (fid 913741)
     - `event.data.parent_author?.fid != 913741`
     - `event.data.author?.fid != 913741`
   - Purpose: Sets up initial story and gets user adjectives

2. **Singleplayer Mode**
   - Trigger: Direct reply to bot without mentions
   - Conditions:
     - `event.data.parent_author?.fid == 913741`
     - `event.data.mentioned_profiles` is empty
   - Purpose: Handles one-on-one story building
   - End State: Sets up coauthors via webhook
   - webhook could also include thread_hash

3. **Multiplayer Mode**
   - Trigger: Reply to bot mentioning a co-author
   - Conditions:
     - `event.data.parent_author?.fid == 913741`
     - `event.data.mentioned_profiles` includes a co-author
   - Purpose: Handles collaborative story building

## Required Changes
1. **service.ts**
   - Remove stage-based logic (1-4)
   - Implement mode-based conditions
   - Update conversation state management
   - Modify webhook handling logic

2. **types.ts**
   - Update type definitions to reflect new modes
   - Add mode-specific interfaces

3. **manager.ts**
   - Update state management to handle modes
   - Modify co-author tracking

## Benefits
- More intuitive flow based on actual interaction patterns
- Easier to debug (mode is clear from webhook data)
- Less reliance on persistent state
- Clearer conditions for each mode


## Open Questions
- How to handle users returning after long breaks?
- Should we add an agent at the start that interprets the users text and then guides it into the right category
- consider using [Neynar's cast summary api endpoint](https://api.neynar.com/v2/farcaster/cast/conversation/summary)? 

Final note for today: what I don't like is that the bot's instruction are too prescriptive. It doesn't include word for word what I want it to say