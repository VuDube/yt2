/**
 * Centralized API Client for Cloudflare Workers/Functions.
 * Implements exponential backoff and sets necessary security headers.
 */

const MAX_RETRIES = 3;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Handles communication with the Cloudflare Functions (Workers).
 * @param {string} endpoint - The relative path (e.g., /api/job-manager).
 * @param {string} method - HTTP method.
 * @param {object | null} payload - Data payload.
 * @param {function} toast - Toast notification function.
 */
export async function fetchAutonomousWorker(endpoint, method, payload, toast) {
    const userId = localStorage.getItem('cf_user_id');
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            // Auth Header: Crucial for authorization check in the Workers
            'Authorization': `Bearer auto-mp3-session-user-${userId}` 
        },
        body: payload ? JSON.stringify(payload) : undefined,
    };

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(endpoint, options);

            if (response.status === 401) {
                 throw new Error("Unauthorized. Session token rejected by Worker.");
            }
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Worker returned error ${response.status}: ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            if (i === MAX_RETRIES - 1) {
                 toast('error', `API failed after multiple retries: ${error.message}`);
                 throw error;
            }
            toast('warning', `Worker service slow. Retrying... (Attempt ${i + 1}/${MAX_RETRIES})`);
            await delay(2 ** i * 1000 + Math.random() * 500); // Exponential Backoff
        }
    }
}