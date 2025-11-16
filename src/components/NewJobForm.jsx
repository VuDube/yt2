import React from 'react';
import { Music, Zap, Loader } from 'lucide-react';

export default function NewJobForm({ conversionForm, setConversionForm, handleSubmit, isSubmitting }) {
    return (
        <div className="lg:col-span-1 space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Music className="w-5 h-5 mr-2 text-indigo-500" /> New Autonomous Conversion
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Input: URL */}
                    <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700">Video URL</label>
                        <input
                            type="url"
                            id="url"
                            required
                            value={conversionForm.url}
                            onChange={(e) => setConversionForm({ ...conversionForm, url: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                            placeholder="e.g., https://youtube.com/watch?v=..."
                        />
                    </div>

                    {/* Bitrate Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Audio Bitrate (kbps)</label>
                        <div className="flex space-x-4">
                            {['320', '192', '128'].map(rate => (
                                <div key={rate} className="flex items-center">
                                    <input
                                        id={`bitrate-${rate}`}
                                        name="bitrate"
                                        type="radio"
                                        value={rate}
                                        checked={conversionForm.bitrate === rate}
                                        onChange={() => setConversionForm({ ...conversionForm, bitrate: rate })}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <label htmlFor={`bitrate-${rate}`} className="ml-2 text-sm text-gray-700 font-medium">
                                        {rate}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">320kbps is the highest fidelity standard.</p>
                    </div>
                    
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white transition-all duration-200 
                            ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                    >
                        {isSubmitting ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                        {isSubmitting ? 'Starting AI Pipeline...' : 'Start Autonomous Conversion'}
                    </button>
                </form>
            </section>
        </div>
    );
}

