import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    type = 'danger',
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: <Trash2 size={24} />,
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            buttonBg: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            icon: <AlertTriangle size={24} />,
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
        },
        info: {
            icon: <AlertTriangle size={24} />,
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
        },
    };

    const styles = typeStyles[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full animate-scale-in overflow-hidden">
                {/* Close button */}
                <button 
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center mx-auto mb-4`}>
                        {styles.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-border transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 ${styles.buttonBg} text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    İşleniyor...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

