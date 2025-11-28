import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';
import { ToastContainer, ToastData, ToastType } from '../components/ui/Toast';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface NotificationContextType {
    // Toast methods
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    
    // Confirm modal method
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    // Toast state
    const [toasts, setToasts] = useState<ToastData[]>([]);
    
    // Confirm modal state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions;
        resolve: ((value: boolean) => void) | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        options: { title: '', message: '' },
        resolve: null,
        isLoading: false
    });

    // Toast methods
    const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newToast: ToastData = { id, type, title, message, duration };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const closeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        showToast('success', title, message);
    }, [showToast]);

    const error = useCallback((title: string, message?: string) => {
        showToast('error', title, message);
    }, [showToast]);

    const warning = useCallback((title: string, message?: string) => {
        showToast('warning', title, message);
    }, [showToast]);

    const info = useCallback((title: string, message?: string) => {
        showToast('info', title, message);
    }, [showToast]);

    // Confirm modal method
    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                options,
                resolve,
                isLoading: false
            });
        });
    }, []);

    const handleConfirm = () => {
        if (confirmState.resolve) {
            confirmState.resolve(true);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false, resolve: null }));
    };

    const handleCancel = () => {
        if (confirmState.resolve) {
            confirmState.resolve(false);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false, resolve: null }));
    };

    return (
        <NotificationContext.Provider value={{ showToast, success, error, warning, info, confirm }}>
            {children}
            
            {/* Toast Container */}
            <ToastContainer toasts={toasts} onClose={closeToast} />
            
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.options.title}
                message={confirmState.options.message}
                confirmText={confirmState.options.confirmText}
                cancelText={confirmState.options.cancelText}
                type={confirmState.options.type}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={confirmState.isLoading}
            />
        </NotificationContext.Provider>
    );
};

export default NotificationContext;

