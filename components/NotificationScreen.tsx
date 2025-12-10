import React, { FC, useEffect } from 'react';
import { Notification } from '../types';

interface NotificationScreenProps {
  texts: any;
  notifications: Notification[];
  onRead: () => void;
}

const BellIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);

const NotificationItem: FC<{ notification: Notification }> = ({ notification }) => (
    <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-3 animate-smart-slide-up">
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full flex-shrink-0 ${
                notification.type === 'bonus' ? 'bg-green-100 text-green-600' :
                notification.type === 'offer' ? 'bg-purple-100 text-purple-600' :
                'bg-blue-100 text-blue-600'
            }`}>
                <BellIcon className="w-5 h-5" />
            </div>
            <div className="flex-grow min-w-0">
                 {notification.title && (
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        {notification.title}
                    </h3>
                )}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2 whitespace-pre-wrap">
                    {notification.message}
                </p>
                <p className="text-[10px] text-gray-400">
                    {new Date(notification.timestamp).toLocaleString()}
                </p>
            </div>
        </div>
    </div>
);

const NotificationScreen: FC<NotificationScreenProps> = ({ texts, notifications, onRead }) => {
    useEffect(() => {
        onRead();
    }, []);

    return (
        <div className="p-4 pb-20 min-h-screen">
             <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{texts.notifications}</h2>
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                        {notifications.length}
                    </span>
                </div>

                {notifications.length > 0 ? (
                    <div className="space-y-2">
                        {notifications.map(n => (
                            <NotificationItem key={n.id} notification={n} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <BellIcon className="w-8 h-8" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{texts.noNotifications}</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default NotificationScreen;