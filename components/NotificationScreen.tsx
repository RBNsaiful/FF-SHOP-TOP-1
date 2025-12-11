
import React, { FC, useEffect, useState } from 'react';
import { Notification } from '../types';

interface NotificationScreenProps {
  texts: any;
  notifications: Notification[];
  onRead: () => void;
}

// --- Premium Smooth Bell Icon (iPhone Style) ---
const BellIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
    </svg>
);

const NotificationScreen: FC<NotificationScreenProps> = ({ texts, notifications, onRead }) => {
    // Capture the read time when component mounts to determine "New" status locally for this view
    const [initialReadTime] = useState(() => Number(localStorage.getItem('lastReadTimestamp') || 0));

    useEffect(() => {
        // Mark all as read immediately or after a short delay so the badge on other screens clears
        onRead();
    }, []);

    // Helpers for Date Formatting
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'bonus': return {
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                dot: 'bg-amber-500',
                border: 'border-amber-200 dark:border-amber-900/30',
                highlight: 'bg-amber-50/50 dark:bg-amber-900/10'
            };
            case 'offer': return {
                iconBg: 'bg-pink-100 dark:bg-pink-900/30',
                iconColor: 'text-pink-600 dark:text-pink-400',
                dot: 'bg-pink-500',
                border: 'border-pink-200 dark:border-pink-900/30',
                highlight: 'bg-pink-50/50 dark:bg-pink-900/10'
            };
            case 'system':
            default: return {
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                dot: 'bg-blue-500',
                border: 'border-blue-200 dark:border-blue-900/30',
                highlight: 'bg-blue-50/50 dark:bg-blue-900/10'
            };
        }
    };

    return (
        <div className="relative min-h-screen pb-24 animate-smart-fade-in overflow-hidden">
             {/* --- 1. Soft Background Decoration (Subtler) --- */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[30%] bg-secondary/5 blur-[100px] rounded-full"></div>
             </div>

             <div className="relative z-10 max-w-xl mx-auto p-4 space-y-3">
                
                {notifications.length > 0 ? (
                    notifications.map((n, index) => {
                        const isUnread = n.timestamp > initialReadTime;
                        const styles = getTypeStyles(n.type || 'system');

                        return (
                            <div 
                                key={n.id} 
                                className={`
                                    group relative flex flex-col gap-3 p-4 sm:p-5 rounded-[20px] transition-all duration-300 animate-smart-slide-up
                                    bg-white dark:bg-dark-card
                                    shadow-sm hover:shadow-md
                                    border
                                    ${isUnread ? `${styles.border} ${styles.highlight}` : 'border-gray-100 dark:border-gray-800'}
                                `}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Header Section: Icon, Title, Time */}
                                <div className="flex items-start gap-4">
                                    {/* Icon Container */}
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors
                                        ${styles.iconBg}
                                    `}>
                                        <BellIcon className={`w-6 h-6 ${styles.iconColor}`} />
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`text-sm font-bold truncate leading-tight ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {n.title || 'Notification'}
                                            </h3>
                                            
                                            <div className="flex flex-col items-end ml-2 flex-shrink-0">
                                                <span className="text-[10px] font-medium text-gray-400">
                                                    {formatTime(n.timestamp)}
                                                </span>
                                                {/* Unread Dot */}
                                                {isUnread && (
                                                    <div className={`w-2 h-2 ${styles.dot} rounded-full shadow-sm mt-1.5`}></div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Multiline Message Body - Moved closer to title */}
                                        <p className={`mt-1.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${isUnread ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {n.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-60 animate-smart-fade-in">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700 shadow-inner">
                            <BellIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-sm">{texts.noNotifications}</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default NotificationScreen;
