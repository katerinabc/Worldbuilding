import { gaiaEmbeddingFunction } from './database/chromadb';

async function testEmbeddings() {
    // Create an instance of our embedding function
    const embedder = new gaiaEmbeddingFunction();

    // Example texts we want to convert to embeddings
    // These could be Farcaster casts, tweets, or any text
    const sampleTexts = [
        "I love coding in TypeScript",
        "Web3 is the future of the internet",
        "Just deployed my first smart contract"
    ];

    try {
        console.log('Starting embedding generation...');
        console.log('Input texts:', sampleTexts);

        // Generate embeddings for all texts at once
        // The generate method will:
        // 1. Send these texts to Gaia node's API
        // 2. Get back mathematical representations (embeddings)
        // 3. Return an array of embeddings (one per input text)
        const embeddings = await embedder.generate(sampleTexts);

        // Log results
        console.log('\nGenerated embeddings:');
        embeddings.forEach((embedding, index) => {
            console.log(`\nEmbedding for text: "${sampleTexts[index]}"`);
            console.log(`Embedding length: ${embedding.length}`);
            console.log(`First few values: ${embedding.slice(0, 5).join(', ')}...`);
        });

        // Example of how these embeddings could be used
        // Similar texts will have similar embeddings
        console.log('\nYou can use these embeddings to:');
        console.log('1. Find similar texts');
        console.log('2. Cluster related content');
        console.log('3. Search for content by meaning rather than keywords');

    } catch (error) {
        console.error('Failed to generate embeddings:', error);
    }
}

// Run the example
testEmbeddings().then(() => {
    console.log('\nExample completed!');
}).catch(error => {
    console.error('Example failed:', error);
});

/* Expected output might look like:
Starting embedding generation...
Input texts: [
    "I love coding in TypeScript",
    "Web3 is the future of the internet",
    "Just deployed my first smart contract"
]

Generated embeddings:
Embedding for text: "I love coding in TypeScript"
Embedding length: 384
First few values: 0.123, -0.456, 0.789, -0.012, 0.345...

Embedding for text: "Web3 is the future of the internet"
Embedding length: 384
First few values: -0.234, 0.567, -0.890, 0.123, -0.456...

(etc...)

Example completed!
*/ 