/**
 * CLOUDFLARE FUNCTION: AI Orchestrator
 * Path: /api/ai-orchestrator
 * BINDINGS REQUIRED:
 * - AI: env.AI
 * - R2 Bucket: env.R2_BUCKET (for saving generated art)
 */

import { Ai } from '@cloudflare/ai';

// Defines the strict JSON schema for the LLM output (Critical for structured data)
const METADATA_SCHEMA = {
    title: "The detected song title (1-5 words).",
    artist: "The primary artist/creator.",
    album: "A descriptive album name, max 4 words.",
    genre: "A single musical genre.",
};

async function handleGetMetadata(ai, url) {
    const prompt = `Analyze the content implied by this URL: ${url}. Provide accurate metadata for an MP3 tag. You must ONLY return a single JSON object that strictly adheres to this schema: ${JSON.stringify(METADATA_SCHEMA)}.`;
    
    // Use Mistral for high-quality, efficient structured analysis
    const response = await ai.run(
        '@cf/mistral/mistral-7b-instruct-v0.2',
        { prompt, stream: false }
    );
    
    // Extract and parse the strict JSON response
    let jsonText = response.response.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.lastIndexOf('```')).trim();
    }

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse AI metadata JSON:", jsonText);
        throw new Error("AI returned malformed JSON structure.");
    }
}

async function handleGenerateAlbumArt(ai, r2, title, artist) {
    const artPrompt = `High quality, stylized album art for a song titled "${title}" by artist "${artist}". Use sharp lines, vaporwave neon aesthetic, 1:1 aspect ratio.`;
    
    // Use Stable Diffusion XL for high-quality image generation
    const imageBuffer = await ai.run(
        '@cf/stabilityai/stable-diffusion-xl-lightning',
        { prompt: artPrompt, num_steps: 20 }
    );
    
    const key = `art/${crypto.randomUUID()}.png`;
    
    // Save the image buffer to R2 (Cloudflare Object Storage)
    await r2.put(key, imageBuffer, { httpMetadata: { contentType: 'image/png' } });

    // Fact: Cloudflare R2 provides a public URL for accessing objects.
    // The public URL must be configured on the R2 bucket.
    const publicR2Url = `https://<YOUR_R2_PUBLIC_DOMAIN>/${key}`; // Placeholder
    
    return { artUrl: publicR2Url };
}

async function handleAnalyzeFailure(ai, url, errorCode) {
    const errorPrompt = `A video conversion failed with error code ${errorCode} for URL ${url}. Provide a concise, user-friendly diagnosis (2-3 sentences max) for the user, focusing on why the conversion likely failed (e.g., geo-blocked, deleted, age-restricted).`;
    
    const response = await ai.run(
        '@cf/mistral/mistral-7b-instruct-v0.2',
        { prompt: errorPrompt, stream: false }
    );

    return { analysis: response.response.trim() };
}

export async function onRequest(context) {
    const { request, env } = context;
    const { AI: ai, R2_BUCKET: r2 } = env;

    // --- Authorization Check ---
    if (!request.headers.get('Authorization')) {
        return new Response('Unauthorized.', { status: 401 });
    }
    
    try {
        const { action, url, title, artist, errorCode } = await request.json();

        switch (action) {
            case 'getMetadata':
                const metadata = await handleGetMetadata(ai, url);
                return new Response(JSON.stringify(metadata), { headers: { 'Content-Type': 'application/json' } });

            case 'generateAlbumArt':
                const artResult = await handleGenerateAlbumArt(ai, r2, title, artist);
                return new Response(JSON.stringify(artResult), { headers: { 'Content-Type': 'application/json' } });

            case 'analyzeFailure':
                const analysisResult = await handleAnalyzeFailure(ai, url, errorCode);
                return new Response(JSON.stringify(analysisResult), { headers: { 'Content-Type': 'application/json' } });

            default:
                return new Response('Invalid AI action requested.', { status: 400 });
        }
    } catch (e) {
        console.error("AI Orchestrator Error:", e.message);
        return new Response(`AI Worker Error: ${e.message}`, { status: 500 });
    }
}