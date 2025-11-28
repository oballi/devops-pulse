import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastData;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = toast.duration || 4000;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(toast.id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(toast.id), 300);
    };

    const typeStyles = {
        success: {
            icon: <CheckCircle size={22} />,
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            iconColor: 'text-green-500 dark:text-green-400',
            titleColor: 'text-green-800 dark:text-green-200',
        },
        error: {
            icon: <XCircle size={22} />,
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            iconColor: 'text-red-500 dark:text-red-400',
            titleColor: 'text-red-800 dark:text-red-200',
        },
        warning: {
            icon: <AlertCircle size={22} />,
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            iconColor: 'text-yellow-500 dark:text-yellow-400',
            titleColor: 'text-yellow-800 dark:text-yellow-200',
        },
        info: {
            icon: <Info size={22} />,
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            iconColor: 'text-blue-500 dark:text-blue-400',
            titleColor: 'text-blue-800 dark:text-blue-200',
        },
    };

    const styles = typeStyles[toast.type];

    return (
        <div 
            className={`
                ${styles.bg} ${styles.border} border rounded-xl p-4 shadow-lg 
                flex items-start gap-3 min-w-[320px] max-w-md
                transform transition-all duration-300 ease-out
                ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
            `}
        >
            <div className={`${styles.iconColor} flex-shrink-0 mt-0.5`}>
                {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-semibold ${styles.titleColor}`}>
                    {toast.title}
                </p>
                {toast.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {toast.message}
                    </p>
                )}
            </div>
            <button 
                onClick={handleClose}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded"
            >
                <X size={16} />
            </button>
        </div>
    );
};

// Toast Container - renders all toasts
interface ToastContainerProps {
    toasts: ToastData[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};

export default Toast;

