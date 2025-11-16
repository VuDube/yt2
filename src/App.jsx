import React, { useState, useEffect, useReducer, useRef } from 'react';
import { Loader, Zap, Music, Download, CheckCircle, XCircle, LogOut } from 'lucide-react';
import NewJobForm from './components/NewJobForm.jsx';
import JobItem from './components/JobItem.jsx';
import ToastContainer, { useToast } from './components/ToastContainer.jsx';
import { fetchAutonomousWorker } from './api/autonomousWorker.js';

// --- I. STATE MANAGEMENT & CONSTANTS ---
const initialJobState = {
    url: '',
    bitrate: '320',
    title: '',
    artist: '',
    album: '',
    genre: 'Unknown',
    category: 'Music Video',
    artUrl: null,
};

const JOB_MANAGER_ENDPOINT = '/api/job-manager';
const AI_ORCHESTRATOR_ENDPOINT = '/api/ai-orchestrator';

function App() {
    // Auth & Persistence State (User ID is stored for Auth Header)
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // App State
    const [jobs, setJobs] = useState([]);
    const [conversionForm, setConversionForm] = useState(initialJobState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toasts, add: toast, remove: removeToast } = useToast();

    // Refs
    const downloadLinkRef = useRef(null);

    // 1. Session Initialization
    useEffect(() => {
        const storedUserId = localStorage.getItem('cf_user_id') || crypto.randomUUID();
        localStorage.setItem('cf_user_id', storedUserId);
        setUserId(storedUserId);
        setIsAuthReady(true);
    }, []);

    // 2. Initial Job History Load
    useEffect(() => {
        if (!isAuthReady) return;

        const loadJobs = async () => {
            try {
                // GET request to Job Manager Worker (reads D1)
                const fetchedJobs = await fetchAutonomousWorker(JOB_MANAGER_ENDPOINT, 'GET', null, toast);
                setJobs(fetchedJobs || []);
            } catch (error) {
                toast('error', `Could not load history from D1: ${error.message}`);
                setJobs([]);
            }
        };
        loadJobs();
    }, [isAuthReady]);

    /** * 3. The Autonomous Job Workflow */
    const runJobWorkflow = async (initialJob) => {
        const updateStatus = async (status, message, payload = {}) => {
            const updatedJob = { ...initialJob, status, message, ...payload };
            
            // PUT request to Job Manager Worker (updates D1)
            await fetchAutonomousWorker(JOB_MANAGER_ENDPOINT, 'PUT', updatedJob, toast);
            
            // Update local state for real-time UI feedback
            setJobs(prev => prev.map(j => j.jobId === initialJob.jobId ? updatedJob : j));
            return updatedJob;
        };

        try {
            // STEP 1: Autonomous Metadata Tagging (Workers AI - LLM)
            let job = await updateStatus('Processing:Metadata', 'AI-Powered analysis for accurate tagging...');
            const metadataResult = await fetchAutonomousWorker(AI_ORCHESTRATOR_ENDPOINT, 'POST', { action: 'getMetadata', url: job.url }, toast);
            job = { ...job, ...metadataResult };
            
            // STEP 2: AI Album Art Generation (Workers AI - Imagen)
            job = await updateStatus('Processing:Art', 'AI-Powered generation of custom album art...');
            const artResult = await fetchAutonomousWorker(AI_ORCHESTRATOR_ENDPOINT, 'POST', { action: 'generateAlbumArt', title: job.title, artist: job.artist }, toast);
            job = { ...job, artUrl: artResult.artUrl };
            
            // Update job with AI results and start conversion phase
            await updateStatus('Processing:Conversion', 'Backend converting and tagging...', { ...metadataResult, artUrl: artResult.artUrl });

            // STEP 3: Conversion & Normalization (External Service Simulation)
            // In a real scenario, this would be an async webhook. Here we simulate the external process.
            await new Promise(resolve => setTimeout(resolve, 5000));
            await updateStatus('Completed', 'Conversion and AI enrichment successful!');
            toast('success', `Job ${job.jobId.substring(0, 8)}... completed! Ready for download.`);

        } catch (error) {
            // STEP 4: Intelligent Error Remediation (Workers AI - LLM)
            const analysisResult = await fetchAutonomousWorker(AI_ORCHESTRATOR_ENDPOINT, 'POST', { action: 'analyzeFailure', url: initialJob.url, errorCode: 'CONV_500' }, toast);
            const analysis = analysisResult?.analysis || "Autonomous analysis failed. Please verify the URL manually.";
            await updateStatus('Failed', analysis);
            toast('error', `Job failed: ${analysis}`);
        }
    };

    // 4. Form Submission & Job Creation
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || !conversionForm.url) return toast('error', 'Please enter a valid video URL.');

        setIsSubmitting(true);
        const newJob = { ...conversionForm };

        try {
            // POST request to Job Manager Worker (creates D1 record)
            const jobWithId = await fetchAutonomousWorker(JOB_MANAGER_ENDPOINT, 'POST', newJob, toast);

            setConversionForm(initialJobState);
            toast('info', `New job ${jobWithId.jobId.substring(0, 8)}... queued. Starting AI analysis.`);
            
            // Add job locally and kick off the workflow
            setJobs(prev => [{...jobWithId, message: 'Queued to AI pipeline'}, ...prev]);
            runJobWorkflow(jobWithId);

        } catch (e) {
            toast('error', `Failed to queue job: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 5. Job Actions (Update/Delete/Download)
    const handleJobUpdate = async (job) => {
        const jobToUpdate = { jobId: job.jobId, title: job.title, artist: job.artist, album: job.album, genre: job.genre, artUrl: job.artUrl };

        try {
            // PUT request to Job Manager Worker (updates D1)
            await fetchAutonomousWorker(JOB_MANAGER_ENDPOINT, 'PUT', jobToUpdate, toast);
            setJobs(prev => prev.map(j => j.jobId === job.jobId ? { ...j, isEditing: false } : j));
            toast('success', `Metadata saved for ${job.jobId.substring(0, 8)}...`);
        } catch (e) {
            toast('error', 'Failed to save changes to persistent storage.');
        }
    };

    const handleJobDelete = async (jobId) => {
        try {
            // DELETE request to Job Manager Worker (deletes from D1)
            await fetchAutonomousWorker(JOB_MANAGER_ENDPOINT, 'DELETE', { jobId }, toast);
            setJobs(prev => prev.filter(j => j.jobId !== jobId));
            toast('info', `Job ${jobId.substring(0, 8)}... deleted from storage.`);
        } catch (e) {
            toast('error', 'Failed to delete job.');
        }
    };

    const handleDownload = (job) => {
        const filename = `${job.artist || 'Unknown'} - ${job.title || 'Untitled'} (${job.bitrate}kbps).mp3`;
        
        // This simulates a secure, temporary download URL from R2
        const mockDownloadUrl = `https://<YOUR_R2_PUBLIC_DOMAIN>/${job.jobId}.mp3`; 
        
        if (downloadLinkRef.current) {
            downloadLinkRef.current.href = mockDownloadUrl;
            downloadLinkRef.current.download = filename;
            downloadLinkRef.current.click();
        }
        toast('success', `Simulating download of "${filename}"`);
    };

    // Main Render
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <ToastContainer toasts={toasts} remove={removeToast} />
            
            {/* Hidden Download Link */}
            <a ref={downloadLinkRef} style={{ display: 'none' }} href="#" download></a>

            <header className="bg-white shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-extrabold text-indigo-700 tracking-tight flex items-center">
                        <Zap className="inline w-7 h-7 mr-2 text-indigo-500" /> Auto.MP3 Autonomous Converter
                    </h1>
                    <div className="text-sm font-medium text-gray-500 hidden md:block">
                        <LogOut className="inline w-4 h-4 mr-1 text-gray-400" /> User ID: **{userId?.substring(0, 8) || 'Init...'}**
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:grid lg:grid-cols-3 lg:gap-8">
                
                {/* Job Creation Form (Column 1) */}
                <NewJobForm 
                    conversionForm={conversionForm} 
                    setConversionForm={setConversionForm}
                    handleSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />

                {/* Job History and Status (Columns 2 & 3) */}
                <div className="lg:col-span-2 mt-8 lg:mt-0">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                        <Music className="w-6 h-6 mr-2 text-gray-600" /> Conversion Pipeline History ({jobs.length})
                    </h2>
                    
                    {jobs.length === 0 && (
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center text-gray-500">
                            No jobs found. Start your first autonomous conversion!
                        </div>
                    )}

                    <div className="space-y-4">
                        {jobs.map(job => (
                            <JobItem 
                                key={job.jobId} 
                                job={job} 
                                setJobs={setJobs} 
                                handleJobUpdate={handleJobUpdate}
                                handleJobDelete={handleJobDelete}
                                handleDownload={handleDownload}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;

