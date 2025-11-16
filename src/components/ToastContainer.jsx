import React, { useReducer, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, Globe, AlertTriangle } from 'lucide-react';

const toastReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TOAST': return [...state, { id: Date.now(), ...action.payload }];
        case 'REMOVE_TOAST': return state.filter(t => t.id !== action.payload.id);
        default: return state;
    }
};

export const useToast = () => {
    const [toasts, dispatch] = useReducer(toastReducer, []);
    const add = (type, message, duration = 5000) => {
        const payload = { type, message };
        dispatch({ type: 'ADD_TOAST', payload });
        setTimeout(() => { dispatch({ type: 'REMOVE_TOAST', payload: payload }); }, duration);
    };
    const remove = (id) => { dispatch({ type: 'REMOVE_TOAST', payload: { id } }); };
    return { toasts, add, remove };
};

export default function ToastContainer({ toasts, remove }) {
    const iconMap = { 
        success: <CheckCircle className="w-5 h-5 text-green-500" />, 
        error: <XCircle className="w-5 h-5 text-red-500" />, 
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />, 
        info: <Globe className="w-5 h-5 text-blue-500" /> 
    };
    const colorMap = { 
        success: 'bg-green-50 border-green-200', 
        error: 'bg-red-50 border-red-200', 
        warning: 'bg-yellow-50 border-yellow-200', 
        info: 'bg-blue-50 border-blue-200' 
    };
    
    return (
        <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none w-full max-w-sm">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`flex items-center p-4 rounded-xl shadow-2xl border ${colorMap[toast.type]} pointer-events-auto transition-all duration-300 ease-out transform`} 
                    role="alert" 
                    onClick={() => remove(toast.id)}
                >
                    {iconMap[toast.type]}
                    <div className="ml-3 text-sm font-medium text-gray-800">{toast.message}</div>
                </div>
            ))}
        </div>
    );
}

