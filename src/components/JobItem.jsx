import React, { useState } from 'react';
import { Loader, Zap, Music, Download, CheckCircle, XCircle, Edit, Save, Trash2, Globe } from 'lucide-react';

const StatusBadge = ({ status }) => {
    let color = 'bg-gray-100 text-gray-600';
    let icon = <Loader className="w-4 h-4 mr-1 animate-spin" />;
    
    if (status.includes('Processing')) {
        color = 'bg-yellow-100 text-yellow-800';
        icon = <Zap className="w-4 h-4 mr-1 animate-pulse" />;
    } else if (status === 'Normalizing') {
        color = 'bg-blue-100 text-blue-800';
        icon = <Music className="w-4 h-4 mr-1 animate-spin" />;
    } else if (status === 'Completed') {
        color = 'bg-green-100 text-green-800';
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
    } else if (status === 'Failed') {
        color = 'bg-red-100 text-red-800';
        icon = <XCircle className="w-4 h-4 mr-1" />;
    } else if (status === 'Pending') {
         color = 'bg-indigo-100 text-indigo-800';
         icon = <Globe className="w-4 h-4 mr-1" />;
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${color} transition-colors duration-200`}>
            {icon}
            {status.replace('Processing:', '')}
        </span>
    );
};

export default function JobItem({ job: initialJob, setJobs, handleJobUpdate, handleJobDelete, handleDownload }) {
    const [job, setJob] = useState(initialJob);

    // Sync local state when the prop updates from App.jsx (e.g., status changes)
    React.useEffect(() => {
        setJob(initialJob);
    }, [initialJob]);

    const handleEditToggle = () => {
        setJobs(prev => prev.map(j => j.jobId === job.jobId ? { ...j, isEditing: !j.isEditing } : j));
        setJob(prev => ({ ...prev, isEditing: !prev.isEditing }));
    };

    const handleFieldChange = (field, value) => {
        setJob(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        handleJobUpdate(job);
        // isEditing state update handled in parent via prop change after API success
    };
    
    const isCompleted = job.status === 'Completed';
    const isFailed = job.status === 'Failed';

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 transition-shadow hover:shadow-lg">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                        {job.isEditing ? 'Editing Metadata' : job.title || job.url}
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                        <StatusBadge status={job.status} />
                        <span className="text-xs text-gray-500 truncate">
                            {job.message || `Job ID: ${job.jobId?.substring(0, 12)}...`}
                        </span>
                    </div>
                </div>
                <div className="flex space-x-2 ml-4 flex-shrink-0">
                    {isCompleted && (
                        <button
                            onClick={() => handleDownload(job)}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-150 shadow-md"
                            title="Download MP3"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    {(isCompleted || job.isEditing) && (
                        <button
                            onClick={job.isEditing ? handleSave : handleEditToggle}
                            className={`p-2 rounded-full transition-colors duration-150 shadow-md ${job.isEditing ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                            title={job.isEditing ? "Save Changes" : "Edit Metadata"}
                            disabled={!isCompleted && !job.isEditing}
                        >
                            {job.isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                        </button>
                    )}
                    <button
                        onClick={() => handleJobDelete(job.jobId)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-150 shadow-md"
                        title="Delete Job"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Autonomous AI Metadata Editor */}
            {job.isEditing && (
                <div className="mt-4 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1 space-y-2">
                        <label className="block text-xs font-medium text-gray-500">Title (AI Tag)</label>
                        <input
                            value={job.title || ''}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <label className="block text-xs font-medium text-gray-500">Artist (AI Tag)</label>
                        <input
                            value={job.artist || ''}
                            onChange={(e) => handleFieldChange('artist', e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <label className="block text-xs font-medium text-gray-500">Genre (AI Category)</label>
                        <input
                            value={job.genre || ''}
                            onChange={(e) => handleFieldChange('genre', e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <label className="block text-xs font-medium text-gray-500">Album</label>
                         <input
                            value={job.album || ''}
                            onChange={(e) => handleFieldChange('album', e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="col-span-1 flex flex-col items-center">
                        <div className="text-sm font-medium text-gray-600 mb-2">AI Generated Art</div>
                        <img 
                            src={job.artUrl || "https://placehold.co/150x150/f0f4ff/4f46e5?text=NO+ART"} 
                            alt="AI Generated Album Art" 
                            className="w-full max-w-[180px] h-auto rounded-lg shadow-xl object-cover border-4 border-indigo-200"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150x150/f0f4ff/4f46e5?text=NO+ART"; }}
                        />
                    </div>
                </div>
            )}
            {/* Display failure message if applicable */}
            {isFailed && (
                 <div className="mt-4 border-t pt-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                    <span className="font-bold">Failure Analysis:</span> {job.message}
                 </div>
            )}
        </div>
    );
}

