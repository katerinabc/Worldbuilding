export function truncateToBytes(text: string, maxBytes: number = 1024): string {
    const encoder = new TextEncoder();
    let bytes = encoder.encode(text);
    
    if (bytes.length <= maxBytes) {
        return text;
    }

    // Binary search for the right length
    let start = 0;
    let end = text.length;
    
    while (start < end) {
        const mid = Math.floor((start + end + 1) / 2);
        const truncated = text.slice(0, mid);
        
        if (encoder.encode(truncated).length <= maxBytes) {
            start = mid;
        } else {
            end = mid - 1;
        }
    }

    return text.slice(0, start);
}

// Usage:
// const safeCast = truncateToBytes(longText);

export function processLLMOutput(
    rawText: string, 
    intro: string,
    maxBytes: number = 1024): string {
        // 1. remove the '@' symbols from the LLM output 
        const cleanedText = rawText.replaceAll('@', '')

        // 2. add intro to the cleaned text
        const fullText = `${intro}${cleanedText}`

        // 3. truncate the text to the max bytes
        return truncateToBytes(fullText, maxBytes)

    }