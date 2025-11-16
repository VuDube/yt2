Auto.MP3 Autonomous Converter - Cloudflare Fullstack
This project is a complete, single-repository, full-stack SPA/PWA designed for seamless deployment on Cloudflare Pages and Functions. It leverages Cloudflare's Free Tier services:
 * Frontend: React SPA deployed on Cloudflare Pages.
 * Backend: Serverless Functions (/functions/api) using:
   * Cloudflare D1: For job persistence and status tracking.
   * Cloudflare R2: For storing AI-generated album art (and final MP3s).
   * Cloudflare Workers AI: For intelligent metadata tagging and error analysis.
Build and Deployment Steps (Cloudflare)
This project requires initial setup of Cloudflare services before the final deploy.
1. Prerequisites
 * A Cloudflare account.
 * Install Wrangler CLI: npm install -g wrangler
2. Cloudflare Service Setup (Initial)
Run these commands in your terminal to create the required services:
A. Create D1 Database
wrangler d1 create auto-mp3-jobs-db

ACTION: Copy the returned database_id. You will need this for manual configuration in the Cloudflare Dashboard (Step 3).
B. Initialize D1 Schema
Create the jobs table:
wrangler d1 execute auto-mp3-jobs-db --command "CREATE TABLE jobs (jobId TEXT PRIMARY KEY, url TEXT, bitrate TEXT, title TEXT, artist TEXT, album TEXT, genre TEXT, category TEXT, artUrl TEXT, status TEXT, message TEXT, createdAt INTEGER);"

C. Create R2 Bucket
Create the storage bucket for art and audio files:
wrangler r2 bucket create auto-mp3-storage

ACTION: Note the R2 Public URL Endpoint. You must update the placeholder in functions/api/ai-orchestrator.js with this URL (e.g., https://pub-xxxxxxxx.r2.dev).
3. Deploy to Cloudflare Pages
 * Commit all files to a Git repository (e.g., GitHub).
 * Go to the Cloudflare Dashboard -> Pages -> Create a project.
 * Connect your Git repository.
 * Build Settings:
   * Build command: npm install && npm run build
   * Build output directory: dist
 * Bindings Configuration: This is crucial for connecting the Functions to your services.
   * D1 Database Bindings:
     * Variable Name: AUTO_MP3_DB
     * D1 Database: Select the auto-mp3-jobs-db you created.
   * R2 Bucket Bindings:
     * Variable Name: R2_BUCKET
     * R2 Bucket: Select the auto-mp3-storage bucket.
   * Workers AI Bindings:
     * Variable Name: AI
     * Type: AI
 * Click Deploy site. Cloudflare will build the React SPA and automatically deploy the files in the /functions folder as Workers, routing all requests to /api/* to these functions.
This configuration achieves maximum performance, scale, and cost-efficiency using a unified, best-practice repository structure.
