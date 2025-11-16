/**
 * CLOUDFLARE FUNCTION: Job Manager (REST API for Job Persistence)
 * Path: /api/job-manager
 * BINDINGS REQUIRED:
 * - D1 Database: env.AUTO_MP3_DB
 */

const JOB_TABLE = 'jobs';

const D1_SCHEMA = `
  jobId TEXT PRIMARY KEY, 
  url TEXT, 
  bitrate TEXT, 
  title TEXT, 
  artist TEXT, 
  album TEXT, 
  genre TEXT, 
  category TEXT, 
  artUrl TEXT, 
  status TEXT, 
  message TEXT, 
  createdAt INTEGER
`;

// Helper to run D1 queries safely
async function executeD1Query(db, query, bindings = []) {
    try {
        return await db.prepare(query).bind(...bindings).run();
    } catch (error) {
        console.error("D1 Execution Error:", error.message);
        // Attempt to create table if it doesn't exist (helpful for first run)
        if (error.message.includes("no such table")) {
            await db.prepare(`CREATE TABLE IF NOT EXISTS ${JOB_TABLE} (${D1_SCHEMA})`).run();
            // Retry the original query once
            return await db.prepare(query).bind(...bindings).run();
        }
        throw error;
    }
}

// Utility for creating D1 insert/update queries dynamically
const createQueries = (job) => ({
    insertQuery: `INSERT INTO ${JOB_TABLE} (${Object.keys(job).join(', ')}) VALUES (${Object.values(job).map(() => '?').join(', ')})`,
    updateQuery: `UPDATE ${JOB_TABLE} SET ${Object.keys(job).filter(key => key !== 'jobId').map(key => `${key} = ?`).join(', ')} WHERE jobId = ?`
});

// Main handler for the Cloudflare Function
export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    // --- Authorization Check (Basic token simulation) ---
    if (!request.headers.get('Authorization')) {
        return new Response('Unauthorized: Missing Auth Token.', { status: 401 });
    }

    try {
        switch (method) {
            case 'POST': { // CREATE new job
                const jobData = await request.json();
                const newJob = {
                    jobId: crypto.randomUUID(),
                    createdAt: Date.now(),
                    ...jobData,
                    status: jobData.status || 'Pending'
                };
                
                const { insertQuery } = createQueries(newJob);
                await executeD1Query(env.AUTO_MP3_DB, insertQuery, Object.values(newJob));

                return new Response(JSON.stringify(newJob), { status: 201, headers: { 'Content-Type': 'application/json' } });
            }
            case 'GET': { // READ all jobs
                const { results } = await env.AUTO_MP3_DB.prepare(`SELECT * FROM ${JOB_TABLE} ORDER BY createdAt DESC`).all();
                return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
            }
            case 'PUT': { // UPDATE job status and metadata
                const updateData = await request.json();
                const jobId = updateData.jobId;
                
                if (!jobId) return new Response('Missing jobId.', { status: 400 });

                const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'jobId');
                const valuesToUpdate = fieldsToUpdate.map(key => updateData[key]);
                const { updateQuery } = createQueries(updateData);
                
                await executeD1Query(env.AUTO_MP3_DB, updateQuery, [...valuesToUpdate, jobId]);

                return new Response(JSON.stringify({ success: true, jobId }), { headers: { 'Content-Type': 'application/json' } });
            }
            case 'DELETE': { // DELETE job
                const { jobId: idToDelete } = await request.json();
                await executeD1Query(env.AUTO_MP3_DB, `DELETE FROM ${JOB_TABLE} WHERE jobId = ?`, [idToDelete]);

                return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
            }
            default:
                return new Response('Method Not Allowed', { status: 405 });
        }
    } catch (e) {
        return new Response(`Server Error: ${e.message}`, { status: 500 });
    }
}