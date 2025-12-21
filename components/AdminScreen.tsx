
import React, { useState, useEffect, FC, FormEvent, useMemo, useRef } from 'react';
import { User, Screen, Transaction, Purchase, AppSettings, Language, PaymentMethod, AppVisibility, Notification, DeveloperSettings, Banner, Theme, PopupConfig } from '../types';
import { db } from '../firebase';
import { ref, update, onValue, get, remove, push, set, runTransaction, query, limitToLast, orderByChild } from 'firebase/database';
import { 
    APP_LOGO_URL,
    DEFAULT_AVATAR_URL,
    DEFAULT_APP_SETTINGS,
    PROTECTION_KEY
} from '../constants';

// --- ICONS (UI Only) ---
const DashboardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const UsersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const OrdersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const MoneyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const SettingsIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const ImageIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const TagIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
const TrashIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const CopyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const EditIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const WalletIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);
const BellIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>);
const ContactIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const MenuIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const MegaphoneIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 11.11V4a2 2 0 0 1 2-2h4.76c1.53 0 2.9.86 3.57 2.24l1.18 2.43a2 2 0 0 0 1.8 1.12H20a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3.67a2 2 0 0 0-1.8 1.12l-1.18 2.43A4 4 0 0 1 9.76 20H5a2 2 0 0 1-2-2v-6.89z"/><path d="M13 11h.01"/></svg>);
const EyeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const SearchIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const CodeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>);
const UnlockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>);
const PlusIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const MinusIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const ArrowUpIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>);
const ArrowDownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>);
const RobotIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>);
const LayoutIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>);
const DollarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const AdMobIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v12"/><path d="M8 10l4-4 4 4"/></svg>); 
const GridIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const BackIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
const GripIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>);
const SortIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="M3 17l3 3 3-3"/><path d="M6 18V4"/></svg>);

// Offer Icons
const DiamondIcon: FC<{className?: string}> = ({className}) => (<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}><path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" /></svg>);
const StarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IdCardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="9" x2="10" y2="9"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="9" x2="18" y2="9"/><line x1="14" y1="12" x2="18" y2="12"/><line x1="14" y1="15" x2="18" y2="15"/></svg>);
const CrownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);


interface AdminScreenProps {
    user: User;
    texts: any;
    onNavigate: (screen: Screen) => void;
    onLogout: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    appSettings: AppSettings;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

// Sidebar Link Component (Optimized)
const SidebarLink: FC<{ icon: FC<{className?: string}>, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group active:scale-95 ${
            active 
            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
        <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className={`text-sm font-bold tracking-wide`}>{label}</span>
    </button>
);

// Quick Action Card (New Mobile Feature)
const QuickActionCard: FC<{ label: string, icon: FC<{className?: string}>, color: string, onClick: () => void, count?: number }> = ({ label, icon: Icon, color, onClick, count }) => {
    const bgColors: {[key: string]: string} = {
        orange: 'bg-orange-500',
        purple: 'bg-purple-600',
        pink: 'bg-pink-500',
        blue: 'bg-blue-500'
    };
    const shadowColors: {[key: string]: string} = {
        orange: 'shadow-orange-500/30',
        purple: 'shadow-purple-600/30',
        pink: 'shadow-pink-500/30',
        blue: 'shadow-blue-500/30'
    };

    return (
        <button 
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 hover:brightness-110 hover:-translate-y-1 ${bgColors[color]} text-white shadow-lg ${shadowColors[color]}`}
        >
            <div className="absolute top-0 right-0 p-2 opacity-10"><Icon className="w-12 h-12" /></div>
            <Icon className="w-6 h-6 mb-1 relative z-10" />
            <span className="text-xs font-bold uppercase tracking-wider relative z-10">{label}</span>
            {count !== undefined && count > 0 && (
                <span className="absolute top-2 right-2 bg-white text-red-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                    {count}
                </span>
            )}
        </button>
    );
};

// Confirmation Dialog
const ConfirmationDialog: FC<{ title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText: string; cancelText: string; }> = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-smart-fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>
            <div className="flex space-x-3">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3.5 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity text-xs active:scale-95"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 bg-red-500 text-white font-bold py-3.5 rounded-2xl hover:bg-red-600 transition-colors text-xs shadow-lg shadow-red-500/30 active:scale-95"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

// Smart Copy Button
const SmartCopy: FC<{ text: string, label?: string, iconOnly?: boolean }> = ({ text, label, iconOnly }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button 
            onClick={handleCopy} 
            className={`flex items-center gap-1.5 ${iconOnly ? 'p-2' : 'px-3 py-1.5'} bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95 border border-gray-200 dark:border-gray-600 max-w-full`}
            title="Click to copy"
        >
            {!iconOnly && <span className="font-mono text-[10px] text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[150px]">{label || text}</span>}
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <CopyIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
        </button>
    );
};

// Search Input
const SearchInput: FC<{ value: string; onChange: (val: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
    <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
            type="text"
            className="block w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-shadow shadow-sm"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const AdminScreen: FC<AdminScreenProps> = ({ user, onNavigate, onLogout, language, setLanguage, appSettings, theme, setTheme }) => {
    // Navigation State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'offers' | 'orders' | 'deposits' | 'tools' | 'settings'>('dashboard');
    const [activeTool, setActiveTool] = useState<'wallet' | 'ai' | 'graphics' | 'ads' | 'notifications' | 'contacts'>('wallet');
    
    // Filter States
    const [orderFilter, setOrderFilter] = useState<'Pending' | 'Completed' | 'Failed'>('Pending');
    const [depositFilter, setDepositFilter] = useState<'Pending' | 'Completed' | 'Failed'>('Pending');

    // Search States
    const [userSearch, setUserSearch] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [depositSearch, setDepositSearch] = useState('');

    // Data States (OPTIMIZED)
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Purchase[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    // Animation State
    const [exitingItems, setExitingItems] = useState<Set<string>>(new Set());

    // Stats
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        totalDeposit: 0,
        pendingOrders: 0,
        pendingDeposits: 0,
        todayDeposit: 0,
        todayPurchase: 0,
        totalAdRevenue: 0,
        todayAdRevenue: 0
    });
    const [aiOverview, setAiOverview] = useState({ totalInteractions: 0, activeAiUsers: 0 });
    
    // Settings State
    const [settings, setSettings] = useState<AppSettings>(appSettings);
    const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(appSettings);
    
    // Developer Settings State
    const [devSettings, setDevSettings] = useState<DeveloperSettings>(DEFAULT_APP_SETTINGS.developerSettings!);
    const [isDevUnlocked, setIsDevUnlocked] = useState(false);
    
    // Privacy Mechanism States
    const [showDevCard, setShowDevCard] = useState(false);
    const [headerTapCount, setHeaderTapCount] = useState(0);
    const tapTimeoutRef = useRef<number | null>(null);
    
    // Modals & Popups
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [securityKeyInput, setSecurityKeyInput] = useState('');
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBannerIndex, setEditingBannerIndex] = useState<number | null>(null);
    const [tempBannerUrl, setTempBannerUrl] = useState('');
    const [tempActionUrl, setTempActionUrl] = useState('');
    const [permissionError, setPermissionError] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
    const [apiKeyError, setApiKeyError] = useState('');

    // Offer State
    const [offerType, setOfferType] = useState<'diamond' | 'levelUp' | 'membership' | 'premium' | 'special'>('diamond');
    const [offersData, setOffersData] = useState<any>({ diamond: [], levelUp: [], membership: [], premium: [], special: [] });
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    
    // Drag and Drop State
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Tools State
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [editingMethodIndex, setEditingMethodIndex] = useState<number | null>(null);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [newBannerUrl, setNewBannerUrl] = useState('');
    const [newActionUrl, setNewActionUrl] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'system' });
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [contacts, setContacts] = useState<any[]>([]);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [popupConfig, setPopupConfig] = useState<PopupConfig>({ active: false, title: 'Welcome', message: 'Welcome to our app!', imageUrl: '', videoUrl: '' });

    // Balance Modal
    const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');

    // Helper for micro-animations
    const animateAndAction = async (id: string, action: () => Promise<void>) => {
        setExitingItems(prev => new Set(prev).add(id));
        setTimeout(async () => {
            await action();
            setExitingItems(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 400); 
    };

    const requestConfirmation = (action: () => void, messageOverride?: string) => {
        setConfirmDialog({
            show: true,
            title: "Confirm Action",
            message: messageOverride || "This action cannot be undone.",
            onConfirm: action
        });
    };

    const handleLogoutClick = () => {
        requestConfirmation(onLogout, "Are you sure you want to logout?");
    };

    const handleHeaderTap = () => {
        const newCount = headerTapCount + 1;
        setHeaderTapCount(newCount);
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        if (newCount >= 5) {
            setShowDevCard(prev => !prev);
            setHeaderTapCount(0);
        } else {
            tapTimeoutRef.current = window.setTimeout(() => setHeaderTapCount(0), 800);
        }
    };

    // --- OPTIMIZED: Fetch dashboard stats only ---
    useEffect(() => {
        const fetchDashboardStats = () => {
            const usersQuery = query(ref(db, 'users'), limitToLast(200));
            onValue(usersQuery, (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const values: any[] = Object.values(data);
                    const totalAdRev = values.reduce((acc: number, u: any) => acc + (u.totalEarned || 0), 0);
                    const totalInteractions = values.reduce((acc: number, u: any) => acc + (u.aiRequestCount || 0), 0);
                    const activeAiUsers = values.filter((u: any) => (u.aiRequestCount || 0) > 0).length;
                    setAiOverview({ totalInteractions, activeAiUsers });
                    setDashboardStats(prev => ({ ...prev, totalUsers: Object.keys(data).length, totalAdRevenue: totalAdRev }));
                }
            });

            const pendingOrdersQuery = query(ref(db, 'orders'), limitToLast(200));
            onValue(pendingOrdersQuery, (snap) => {
                if(snap.exists()) {
                    let pendingCount = 0;
                    let todayPurchaseAmt = 0;
                    const todayStr = new Date().toDateString();
                    snap.forEach(userOrders => {
                        const uOrders = userOrders.val();
                        if (uOrders) {
                            Object.values(uOrders).forEach((order: any) => {
                                if (order.status === 'Pending') pendingCount++;
                                if (order.status === 'Completed' && new Date(order.date).toDateString() === todayStr) {
                                    todayPurchaseAmt += (order.offer?.price || 0);
                                }
                            });
                        }
                    });
                    setDashboardStats(prev => ({ ...prev, pendingOrders: pendingCount, todayPurchase: todayPurchaseAmt }));
                }
            });

            const pendingTxnsQuery = query(ref(db, 'transactions'), limitToLast(200));
            onValue(pendingTxnsQuery, (snap) => {
                if(snap.exists()) {
                    let pendingCount = 0;
                    let todayDepositAmt = 0;
                    let todayAdRevAmt = 0;
                    let totalDep = 0;
                    const todayStr = new Date().toDateString();
                    snap.forEach(userTxns => {
                        const uTxns = userTxns.val();
                        if (uTxns) {
                            Object.values(uTxns).forEach((txn: any) => {
                                if (txn.status === 'Pending') pendingCount++;
                                if (new Date(txn.date).toDateString() === todayStr) {
                                    if (txn.status === 'Completed' && txn.type !== 'ad_reward') todayDepositAmt += txn.amount;
                                    if (txn.type === 'ad_reward') todayAdRevAmt += txn.amount;
                                }
                                if (txn.status === 'Completed' && txn.type !== 'ad_reward') totalDep += txn.amount;
                            });
                        }
                    });
                    setDashboardStats(prev => ({ 
                        ...prev, 
                        pendingDeposits: pendingCount, 
                        todayDeposit: todayDepositAmt,
                        todayAdRevenue: todayAdRevAmt,
                        totalDeposit: totalDep
                    }));
                }
            });
        };

        fetchDashboardStats();

        onValue(ref(db, 'config'), (snap) => {
            if(snap.exists()) {
                const data = snap.val();
                if(data.appSettings) {
                    const mergedSettings = { ...data.appSettings, earnSettings: { ...DEFAULT_APP_SETTINGS.earnSettings, ...(data.appSettings.earnSettings || {}) }, uiSettings: { ...DEFAULT_APP_SETTINGS.uiSettings, ...(data.appSettings.uiSettings || {}) } };
                    setSettings(mergedSettings); setOriginalSettings(mergedSettings); 
                    if (data.appSettings.developerSettings) setDevSettings(data.appSettings.developerSettings);
                    if (data.appSettings.popupNotification) setPopupConfig(data.appSettings.popupNotification);
                }
                if(data.offers) {
                    setOffersData({
                        diamond: data.offers.diamond ? Object.values(data.offers.diamond) : [],
                        levelUp: data.offers.levelUp ? Object.values(data.offers.levelUp) : [],
                        membership: data.offers.membership ? Object.values(data.offers.membership) : [],
                        premium: data.offers.premium ? Object.values(data.offers.premium) : [],
                        special: data.offers.special ? Object.values(data.offers.special) : [],
                    });
                }
                if(data.banners) {
                    const rawBanners = Object.values(data.banners);
                    const formattedBanners = rawBanners.map((b: any) => typeof b === 'string' ? { imageUrl: b, actionUrl: '' } : b);
                    setBanners(formattedBanners);
                }
                if(data.paymentMethods) setPaymentMethods(Object.values(data.paymentMethods));
                if (data.supportContacts) setContacts(Object.values(data.supportContacts));
            }
        });
    }, []);

    // --- LAZY LOADING: Fetch List Data ONLY when tab is active ---
    useEffect(() => {
        if (activeTab === 'users') {
            const usersRef = query(ref(db, 'users'), limitToLast(50));
            const unsub = onValue(usersRef, (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const uList: User[] = Object.keys(data).map(key => ({ ...data[key], uid: key }));
                    setUsers(uList);
                }
            });
            return () => unsub();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'orders') {
            const ordersRef = query(ref(db, 'orders'), limitToLast(50));
            const unsub = onValue(ordersRef, (snap) => {
                if(snap.exists()) {
                    let allOrders: Purchase[] = [];
                    snap.forEach(userOrders => {
                        const uOrders = userOrders.val();
                        if (uOrders) {
                            Object.keys(uOrders).forEach(key => {
                                const order = { ...uOrders[key], key, userId: userOrders.key! };
                                allOrders.push(order);
                            });
                        }
                    });
                    setOrders(allOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else { setOrders([]); }
            });
            return () => unsub();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'deposits') {
            const txnsRef = query(ref(db, 'transactions'), limitToLast(50));
            const unsub = onValue(txnsRef, (snap) => {
                if(snap.exists()) {
                    let allTxns: Transaction[] = [];
                    snap.forEach(userTxns => {
                        const uTxns = userTxns.val();
                        if (uTxns) {
                            Object.keys(uTxns).forEach(key => {
                                const txn = { ...uTxns[key], key, userId: userTxns.key! };
                                allTxns.push(txn);
                            });
                        }
                    });
                    setTransactions(allTxns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else { setTransactions([]); }
            });
            return () => unsub();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'tools') {
             onValue(ref(db, 'notifications'), (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const list = Object.keys(data).map(key => ({ ...data[key], id: key })).reverse();
                    setNotifications(list);
                }
            });
        }
    }, [activeTab]);

    const filteredUsers = useMemo(() => {
        if (!userSearch) return users;
        const lowerTerm = userSearch.toLowerCase();
        return users.filter(u => (u.name || '').toLowerCase().includes(lowerTerm) || (u.email || '').toLowerCase().includes(lowerTerm) || (u.uid || '').toLowerCase().includes(lowerTerm));
    }, [users, userSearch]);

    const filteredOrders = useMemo(() => {
        let result = orders.filter(o => o.status === orderFilter);
        if (orderSearch) {
            const lowerTerm = orderSearch.toLowerCase();
            result = result.filter(o => (o.id || '').toLowerCase().includes(lowerTerm) || (o.uid || '').toLowerCase().includes(lowerTerm));
        }
        return result;
    }, [orders, orderFilter, orderSearch]);

    const filteredTransactions = useMemo(() => {
        let result = transactions.filter(t => t.status === depositFilter);
        if (depositSearch) {
            const lowerTerm = depositSearch.toLowerCase();
            result = result.filter(t => (t.transactionId || '').toLowerCase().includes(lowerTerm) || (t.method || '').toLowerCase().includes(lowerTerm));
        }
        return result;
    }, [transactions, depositFilter, depositSearch]);

    const isSettingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    
    const handleSettingsSave = async (e: FormEvent) => {
        e.preventDefault();
        const currentKey = settings.aiApiKey ? settings.aiApiKey.trim() : '';
        if (currentKey.length > 0 && !/^AIza[0-9A-Za-z\-_]{35}$/.test(currentKey)) {
            setApiKeyError("Invalid API Key format."); 
            alert("Settings NOT Saved! Invalid API Key."); 
            return;
        }
        setApiKeyError(''); 
        
        let finalSettings = { 
            ...settings,
            aiApiKey: currentKey,
            earnSettings: {
                ...settings.earnSettings,
                adMob: {
                    ...settings.earnSettings?.adMob,
                    appId: settings.earnSettings?.adMob?.appId?.trim() || '',
                    rewardId: settings.earnSettings?.adMob?.rewardId?.trim() || ''
                }
            }
        } as AppSettings;

        const { developerSettings, ...safeSettings } = finalSettings;
        await update(ref(db, 'config/appSettings'), safeSettings);
        setSettings(finalSettings); 
        setOriginalSettings(finalSettings); 
        alert("Settings Saved Successfully!");
    };

    const handleUnlockDevInfo = () => { setSecurityKeyInput(''); setIsSecurityModalOpen(true); };
    const handleVerifySecurityKey = (e: FormEvent) => { e.preventDefault(); if (securityKeyInput === PROTECTION_KEY) { setIsDevUnlocked(true); setIsSecurityModalOpen(false); } else { alert("ACCESS DENIED: Incorrect Secret Key."); } };
    const handleSaveDeveloperInfo = async () => { try { await update(ref(db, 'config/appSettings/developerSettings'), devSettings); alert("Success: Developer Info Updated."); setIsDevUnlocked(false); } catch (error) { alert("Error updating database."); } };

    const handleOrderAction = (order: Purchase, action: 'Completed' | 'Failed') => {
        requestConfirmation(() => animateAndAction(order.key!, async () => {
            if (order.key && order.userId) {
                const orderRef = ref(db, `orders/${order.userId}/${order.key}`);
                const snapshot = await get(orderRef);
                if (snapshot.exists() && snapshot.val().status === 'Pending') {
                    await update(orderRef, { status: action });
                    if (action === 'Failed') {
                        const userRef = ref(db, `users/${order.userId}`);
                        await runTransaction(userRef, (userData) => { 
                            if (userData) {
                                userData.balance = (Number(userData.balance) || 0) + Number(order.offer?.price || 0);
                                const price = Number(order.offer?.price || 0);
                                if (userData.totalSpent && userData.totalSpent >= price) {
                                    userData.totalSpent -= price;
                                }
                            } 
                            return userData; 
                        });
                    }
                }
            }
        }), `Confirm ${action}?`);
    };

    const handleDeleteOrder = (orderId: string, userId: string) => {
        requestConfirmation(() => animateAndAction(orderId, async () => { 
            await remove(ref(db, `orders/${userId}/${orderId}`)); 
        }), "Delete this order?");
    };

    const handleTxnAction = (txn: Transaction, action: 'Completed' | 'Failed') => {
        requestConfirmation(() => animateAndAction(txn.key!, async () => {
            if (txn.key && txn.userId) {
                const txnRef = ref(db, `transactions/${txn.userId}/${txn.key}`);
                const snapshot = await get(txnRef);
                if (snapshot.exists() && snapshot.val().status === 'Pending') {
                    await update(txnRef, { status: action });
                    if (action === 'Completed') {
                        const userRef = ref(db, `users/${txn.userId}`);
                        await runTransaction(userRef, (userData) => { 
                            if (userData) {
                                userData.balance = (Number(userData.balance) || 0) + Number(txn.amount);
                                userData.totalDeposit = (Number(userData.totalDeposit) || 0) + Number(txn.amount);
                            } 
                            return userData; 
                        });
                    }
                }
            }
        }));
    };
    
    const handleDeleteTransaction = (txnId: string, userId: string) => {
        requestConfirmation(() => animateAndAction(txnId, async () => { 
            await remove(ref(db, `transactions/${userId}/${txnId}`)); 
        }), "Delete this transaction?");
    };
    
    const handleBalanceUpdate = () => {
        if (!balanceModalUser || !balanceAmount) return;
        const amount = Number(balanceAmount);
        if (isNaN(amount) || amount <= 0) return;
        requestConfirmation(async () => {
            const userRef = ref(db, `users/${balanceModalUser.uid}`);
            await runTransaction(userRef, (userData) => { 
                if(userData) {
                    userData.balance = balanceAction === 'add' ? (userData.balance||0) + amount : (userData.balance||0) - amount; 
                }
                return userData; 
            });
            setBalanceModalUser(null); setBalanceAmount('');
        }, `${balanceAction === 'add' ? 'Add' : 'Deduct'} ${amount}?`);
    };

    const handleSaveOffer = async (e: FormEvent) => { e.preventDefault(); const path = `config/offers/${offerType}`; let newOffer = { ...editingOffer }; if (!newOffer.id) newOffer.id = Date.now(); if (newOffer.price) newOffer.price = Number(newOffer.price); if (newOffer.diamonds) newOffer.diamonds = Number(newOffer.diamonds); if (offerType === 'special' && newOffer.isActive === undefined) newOffer.isActive = true; let updatedList = [...offersData[offerType]]; if (editingOffer.id && offersData[offerType].find((o: any) => o.id === editingOffer.id)) { updatedList = updatedList.map((o: any) => o.id === editingOffer.id ? newOffer : o); } else { updatedList.push(newOffer); } await set(ref(db, path), updatedList); setIsOfferModalOpen(false); setEditingOffer(null); };
    const handleDeleteOffer = (id: number) => requestConfirmation(async () => { const path = `config/offers/${offerType}`; const updatedList = offersData[offerType].filter((o: any) => o.id !== id); await set(ref(db, path), updatedList); });
    
    // --- DRAG AND DROP REORDERING ---
    const handleSort = async () => {
        const _offers = [...offersData[offerType]];
        
        if (dragItem.current === null || dragOverItem.current === null) return;

        // Remove and insert
        const draggedItemContent = _offers.splice(dragItem.current, 1)[0];
        _offers.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        // Update State & DB
        setOffersData({ ...offersData, [offerType]: _offers });
        await set(ref(db, `config/offers/${offerType}`), _offers);
    };

    // --- SORT BY PRICE (New Feature) ---
    const handleSortByPrice = async () => {
        requestConfirmation(async () => {
            const sorted = [...offersData[offerType]].sort((a: any, b: any) => Number(a.price) - Number(b.price));
            setOffersData({ ...offersData, [offerType]: sorted });
            await set(ref(db, `config/offers/${offerType}`), sorted);
        }, "Auto-arrange all offers by price (Low to High)?");
    };
    
    const openAddOfferModal = () => { setEditingOffer({}); setIsOfferModalOpen(true); };
    const handleSaveMethod = async (e: FormEvent) => { e.preventDefault(); if (!editingMethod) return; const updatedMethods = [...paymentMethods]; if (editingMethodIndex !== null) updatedMethods[editingMethodIndex] = editingMethod; else updatedMethods.push(editingMethod); await set(ref(db, 'config/paymentMethods'), updatedMethods); setIsMethodModalOpen(false); setEditingMethod(null); };
    const handleDeleteMethod = (index: number) => requestConfirmation(async () => { const updatedMethods = paymentMethods.filter((_, i) => i !== index); await set(ref(db, 'config/paymentMethods'), updatedMethods); });
    const openAddMethodModal = () => { setEditingMethod({ name: '', accountNumber: '', logo: '', instructions: '' }); setEditingMethodIndex(null); setIsMethodModalOpen(true); };
    const openEditMethodModal = (method: PaymentMethod, index: number) => { setEditingMethod({ ...method }); setEditingMethodIndex(index); setIsMethodModalOpen(true); };
    const handleSaveContact = async (e: FormEvent) => { e.preventDefault(); if (!editingContact) return; const updatedContacts = [...contacts]; const contactToSave = { ...editingContact, labelKey: editingContact.title }; if (editingContactIndex !== null) updatedContacts[editingContactIndex] = contactToSave; else updatedContacts.push(contactToSave); await set(ref(db, 'config/supportContacts'), updatedContacts); setIsContactModalOpen(false); setEditingContact(null); };
    const handleDeleteContact = (index: number) => requestConfirmation(async () => { const updatedContacts = contacts.filter((_, i) => i !== index); await set(ref(db, 'config/supportContacts'), updatedContacts); });
    const openAddContactModal = () => { setEditingContact({ type: 'phone', title: '', link: '', labelKey: '' }); setEditingContactIndex(null); setIsContactModalOpen(true); };
    const openEditContactModal = (contact: any, index: number) => { setEditingContact({ ...contact, title: contact.title || contact.labelKey }); setEditingContactIndex(index); setIsContactModalOpen(true); };
    const toggleUserSelection = (uid: string) => { const newSet = new Set(selectedUserIds); if (newSet.has(uid)) newSet.delete(uid); else newSet.add(uid); setSelectedUserIds(newSet); };
    const handleSendNotification = async (e: FormEvent) => { e.preventDefault(); if (selectedUserIds.size > 0) { const promises = Array.from(selectedUserIds).map(uid => push(ref(db, 'notifications'), { ...newNotif, timestamp: Date.now(), targetUid: uid })); await Promise.all(promises); setSelectedUserIds(new Set()); alert(`Sent to ${selectedUserIds.size} users.`); } else { await push(ref(db, 'notifications'), { ...newNotif, timestamp: Date.now() }); } setNewNotif({ title: '', message: '', type: 'system' }); setIsNotifModalOpen(false); };
    const handleDeleteNotification = (id: string) => requestConfirmation(async () => { await remove(ref(db, `notifications/${id}`)); });
    const handleSavePopupConfig = async () => { await update(ref(db, 'config/appSettings'), { popupNotification: popupConfig }); alert("Popup Settings Saved!"); setSettings(prev => ({...prev, popupNotification: popupConfig})); };
    const handleAddBanner = async () => { if(!newBannerUrl) return; const updatedBanners = [...banners, { imageUrl: newBannerUrl, actionUrl: newActionUrl }]; await set(ref(db, 'config/banners'), updatedBanners); setNewBannerUrl(''); setNewActionUrl(''); };
    const handleDeleteBanner = (index: number) => requestConfirmation(async () => { const updatedBanners = banners.filter((_, i) => i !== index); await set(ref(db, 'config/banners'), updatedBanners); });
    const openEditBannerModal = (index: number, banner: Banner) => { setEditingBannerIndex(index); setTempBannerUrl(banner.imageUrl); setTempActionUrl(banner.actionUrl || ''); setIsBannerModalOpen(true); };
    const handleSaveBanner = async (e: FormEvent) => { e.preventDefault(); if (editingBannerIndex !== null && tempBannerUrl) { const updatedBanners = [...banners]; updatedBanners[editingBannerIndex] = { imageUrl: tempBannerUrl, actionUrl: tempActionUrl }; await set(ref(db, 'config/banners'), updatedBanners); setIsBannerModalOpen(false); setEditingBannerIndex(null); setTempBannerUrl(''); setTempActionUrl(''); } };
    const handleUpdateLogo = async () => { if (settings.logoUrl) { await update(ref(db, 'config/appSettings'), { logoUrl: settings.logoUrl }); alert("Logo Updated!"); } };

    if(permissionError) return (<div className="p-8 text-center text-red-500 bg-white h-screen flex flex-col items-center justify-center"><LockIcon className="w-16 h-16 mb-4" /><h2 className="text-xl font-bold mb-2">Permission Denied</h2></div>);

    const inputClass = "w-full p-3.5 border rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm";
    
    // RELAXED VALIDATION: Only Name and Price Mandatory for Special type
    const isOfferValid = 
        (offerType === 'diamond' ? Number(editingOffer?.price) > 0 && Number(editingOffer?.diamonds) > 0 :
        offerType === 'levelUp' ? editingOffer?.name?.trim() && Number(editingOffer?.price) > 0 :
        offerType === 'special' ? editingOffer?.name?.trim() && Number(editingOffer?.price) > 0 :
        editingOffer?.name?.trim() && Number(editingOffer?.price) > 0 && (offerType === 'premium' || offerType === 'membership' || Number(editingOffer?.diamonds) > 0));

    const isMethodValid = editingMethod?.name?.trim() && editingMethod?.accountNumber?.trim() && editingMethod?.logo?.trim();
    const isContactValid = editingContact?.title?.trim() && editingContact?.link?.trim();
    const isBannerValid = tempBannerUrl?.trim();
    const isNotifValid = newNotif.message.trim().length > 0;

    const showBackButton = ['orders', 'deposits', 'offers', 'tools'].includes(activeTab);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden">
            {isSidebarOpen && (<div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>)}

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Admin Panel</span>
                </div>
                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-5rem)]">
                    <SidebarLink icon={DashboardIcon} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
                    <SidebarLink icon={UsersIcon} label="Users" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
                    <SidebarLink icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
                <header className="h-16 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm/50">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden">
                            {showBackButton ? (
                                <button onClick={() => setActiveTab('dashboard')} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors active:scale-90 transform">
                                    <BackIcon className="w-6 h-6" />
                                </button>
                            ) : (
                                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                    <MenuIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                        <h2 className="text-lg font-bold select-none cursor-pointer text-gray-800 dark:text-white" onClick={handleHeaderTap}>
                            {activeTab === 'dashboard' ? 'Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h2>
                    </div>
                    <button onClick={handleLogoutClick} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95"><LockIcon className="w-5 h-5" /></button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                    {/* ... (Dashboard, Users sections) ... */}
                    {activeTab === 'dashboard' && (
                        <div className="animate-smart-fade-in space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-smart-slide-up">
                                <QuickActionCard label="Orders" icon={OrdersIcon} color="orange" onClick={() => setActiveTab('orders')} count={dashboardStats.pendingOrders} />
                                <QuickActionCard label="Deposits" icon={WalletIcon} color="purple" onClick={() => setActiveTab('deposits')} count={dashboardStats.pendingDeposits} />
                                <QuickActionCard label="Offers" icon={TagIcon} color="pink" onClick={() => setActiveTab('offers')} />
                                <QuickActionCard label="Tools" icon={GridIcon} color="blue" onClick={() => setActiveTab('tools')} />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-smart-slide-up" style={{ animationDelay: '100ms' }}>
                                <div className="p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-dark-card">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500"><UsersIcon className="w-24 h-24 text-blue-600" /></div>
                                    <div className="relative z-10"><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600 dark:bg-blue-900/20"><UsersIcon className="w-6 h-6" /></div><p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Users</p><h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{dashboardStats.totalUsers}</h3></div>
                                </div>
                                <div className="p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-dark-card">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500"><MoneyIcon className="w-24 h-24 text-green-600" /></div>
                                    <div className="relative z-10"><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-green-50 text-green-600 dark:bg-green-900/20"><MoneyIcon className="w-6 h-6" /></div><p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Deposit</p><h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">৳{dashboardStats.totalDeposit}</h3></div>
                                </div>
                                <div className="p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-dark-card">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500"><DollarIcon className="w-24 h-24 text-yellow-600" /></div>
                                    <div className="relative z-10"><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20"><DollarIcon className="w-6 h-6" /></div><p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Ad Rev</p><h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">৳{dashboardStats.totalAdRevenue}</h3></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-4 animate-smart-fade-in">
                            <div className="flex justify-between items-center mb-2">{selectedUserIds.size > 0 && (<button onClick={() => setIsNotifModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse ml-auto transform active:scale-95 transition-transform">Message {selectedUserIds.size}</button>)}</div>
                            <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search by Name, Email or UID..." />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-smart-slide-up">
                                {filteredUsers.slice(0, 50).map(u => (
                                    <div key={u.uid} className={`relative bg-white dark:bg-dark-card p-4 rounded-3xl border flex flex-col gap-3 transition-all ${selectedUserIds.has(u.uid) ? 'border-primary ring-1 ring-primary' : 'border-gray-100 dark:border-gray-800'}`}>
                                        <div className="absolute top-4 right-4"><input type="checkbox" checked={selectedUserIds.has(u.uid)} onChange={() => toggleUserSelection(u.uid)} className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300" /></div>
                                        <div className="flex items-center gap-3"><img src={u.avatarUrl || DEFAULT_AVATAR_URL} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600" /><div className="flex-1 min-w-0 pr-8"><p className="font-bold text-sm truncate text-gray-900 dark:text-white">{u.name}</p><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p><div className="flex items-center gap-2 mt-1"><span className="text-[9px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">UID</span><SmartCopy text={u.uid} label={u.uid} iconOnly={false} /></div></div></div>
                                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2.5 rounded-2xl"><div><p className="text-[10px] text-gray-500 font-bold uppercase">Balance</p><p className="text-base font-black text-primary">৳{Math.floor(u.balance)}</p></div><div className="flex gap-2"><button onClick={() => { setBalanceModalUser(u); setBalanceAction('add'); setBalanceAmount(''); }} className="bg-green-100 text-green-700 p-2 rounded-xl hover:bg-green-200 active:scale-90 transition-transform"><PlusIcon className="w-4 h-4" /></button><button onClick={() => { setBalanceModalUser(u); setBalanceAction('deduct'); setBalanceAmount(''); }} className="bg-red-100 text-red-700 p-2 rounded-xl hover:bg-red-200 active:scale-90 transition-transform"><MinusIcon className="w-4 h-4" /></button></div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'offers' && (
                        <div className="animate-smart-fade-in pb-10">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary hidden md:block">Manage Offers</h2>
                                <div className="flex w-full md:w-auto gap-2">
                                    <button 
                                        onClick={handleSortByPrice} 
                                        className="flex-1 md:flex-none py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                                        title="Auto Sort Low to High"
                                    >
                                        <SortIcon className="w-4 h-4" />
                                        <span>Sort by Price</span>
                                    </button>
                                    <button 
                                        onClick={openAddOfferModal} 
                                        className="flex-1 md:flex-none py-3 px-6 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        <span>Add New</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl mb-8 overflow-x-auto no-scrollbar shadow-inner border border-gray-200 dark:border-gray-700/50">
                                {['diamond', 'levelUp', 'membership', 'premium', 'special'].map((type) => (
                                    <button 
                                        key={type} 
                                        onClick={() => setOfferType(type as any)} 
                                        className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                                            offerType === type 
                                            ? 'bg-white dark:bg-dark-card text-primary shadow-md transform scale-[1.02]' 
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        {type === 'special' ? 'OFFERS' : type.replace(/([A-Z])/g, ' $1').trim()}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 animate-smart-slide-up">
                                {offersData[offerType]?.map((offer: any, index: number) => (
                                    <div 
                                        key={offer.id} 
                                        draggable
                                        onDragStart={() => (dragItem.current = index)}
                                        onDragEnter={() => (dragOverItem.current = index)}
                                        onDragEnd={handleSort}
                                        onDragOver={(e) => e.preventDefault()}
                                        className="group relative bg-white dark:bg-dark-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 flex flex-col justify-between overflow-hidden"
                                    >
                                        {offerType === 'special' && (
                                            <div className={`absolute top-0 right-0 rounded-bl-xl px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider z-10 ${offer.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {offer.isActive ? 'Active' : 'Hidden'}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-2 rounded-xl shadow-inner ${
                                                offerType === 'diamond' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' : 
                                                offerType === 'levelUp' ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/20' : 
                                                offerType === 'membership' ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20' : 
                                                offerType === 'special' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 
                                                'bg-yellow-50 text-yellow-500 dark:bg-yellow-900/20'
                                            }`}>
                                                {offerType === 'diamond' ? <DiamondIcon className="w-5 h-5" /> : 
                                                 offerType === 'levelUp' ? <StarIcon className="w-5 h-5" /> : 
                                                 offerType === 'membership' ? <IdCardIcon className="w-5 h-5" /> : 
                                                 offerType === 'special' ? <TagIcon className="w-5 h-5" /> : 
                                                 <CrownIcon className="w-5 h-5" />}
                                            </div>

                                            <div className="cursor-move p-1 text-gray-300 hover:text-primary transition-colors" title="Drag to reorder">
                                                <GripIcon className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 mb-0.5" title={offer.name}>
                                                {offer.name || `${offer.diamonds} Diamonds`}
                                            </h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {offerType === 'diamond' ? `${offer.diamonds} DM` : offerType === 'special' ? (offer.title || 'Special') : 'Package'}
                                            </p>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <span className="text-lg font-black text-gray-900 dark:text-white">
                                                ৳{offer.price}
                                            </span>
                                            
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => { setEditingOffer(offer); setIsOfferModalOpen(true); }} 
                                                    className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors active:scale-95"
                                                    title="Edit"
                                                >
                                                    <EditIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteOffer(offer.id)} 
                                                    className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors active:scale-95"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-smart-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"><div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"><SettingsIcon className="w-5 h-5 text-blue-500" /><h4 className="font-bold text-sm">Identity</h4></div><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 mb-2">App Name</label><input type="text" value={settings.appName} onChange={(e) => setSettings({...settings, appName: e.target.value})} className={inputClass} /></div><div><label className="block text-xs font-bold text-gray-500 mb-2">Notice Message</label><textarea value={settings.notice || ''} onChange={(e) => setSettings({...settings, notice: e.target.value})} className={inputClass} rows={2} /></div></div></div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"><div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"><EyeIcon className="w-5 h-5 text-purple-500" /><h4 className="font-bold text-sm">Control</h4></div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl"><span className="font-bold text-xs text-red-500">Maintenance</span><div onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-5' : ''}`}></div></div></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Explicit Visibility Controls */}
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                <span className="capitalize text-[10px] font-bold">Diamonds</span>
                                                <div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, diamonds: !settings.visibility?.diamonds}})} className={`flex-shrink-0 w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility?.diamonds ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility?.diamonds ? 'translate-x-4' : ''}`}></div></div>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                <span className="capitalize text-[10px] font-bold">Level Up</span>
                                                <div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, levelUp: !settings.visibility?.levelUp}})} className={`flex-shrink-0 w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility?.levelUp ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility?.levelUp ? 'translate-x-4' : ''}`}></div></div>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                <span className="capitalize text-[10px] font-bold">Membership</span>
                                                <div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, membership: !settings.visibility?.membership}})} className={`flex-shrink-0 w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility?.membership ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility?.membership ? 'translate-x-4' : ''}`}></div></div>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                <span className="capitalize text-[10px] font-bold">Premium App</span>
                                                <div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, premium: !settings.visibility?.premium}})} className={`flex-shrink-0 w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility?.premium ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility?.premium ? 'translate-x-4' : ''}`}></div></div>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                <span className="capitalize text-[10px] font-bold">OFFERS Tab</span>
                                                <div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, specialOffers: !settings.visibility?.specialOffers}})} className={`flex-shrink-0 w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility?.specialOffers ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility?.specialOffers ? 'translate-x-4' : ''}`}></div></div>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                <span className="capitalize text-[10px] font-bold">Earn Section</span>
                                                <div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, earn: !settings.visibility?.earn}})} className={`flex-shrink-0 w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility?.earn ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility?.earn ? 'translate-x-4' : ''}`}></div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* ... (rest of settings) ... */}
                            </div>
                            <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-4 font-bold text-sm rounded-2xl shadow-lg transition-all mt-6 active:scale-95 transform ${isSettingsChanged ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Save All Changes</button>
                        </div>
                    )}
                </main>
            </div>
            {/* ... (Modals remain unchanged) ... */}
            {confirmDialog && (<ConfirmationDialog title={confirmDialog.title} message={confirmDialog.message} onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} onCancel={() => setConfirmDialog(null)} confirmText="Yes" cancelText="No" />)}
            {isOfferModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                         <h3 className="text-xl font-bold mb-6 text-center">{editingOffer?.id ? 'Edit' : 'Add'} {offerType === 'special' ? 'OFFERS' : offerType}</h3>
                         <form onSubmit={handleSaveOffer} className="space-y-4">
                            {offerType !== 'diamond' && (<input type="text" placeholder="Name (Mandatory)" value={editingOffer?.name || ''} onChange={e => setEditingOffer({...editingOffer, name: e.target.value})} className={inputClass} required />)}
                            {(offerType === 'diamond' || offerType === 'special') && (<input type="number" placeholder="Diamonds (Optional)" value={editingOffer?.diamonds || ''} onChange={e => setEditingOffer({...editingOffer, diamonds: e.target.value})} className={inputClass} />)}
                            {offerType === 'special' && (<input type="text" placeholder="Title (Optional, e.g. Hot Deal)" value={editingOffer?.title || ''} onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} className={inputClass} />)}
                            {offerType === 'special' && (<div className="flex items-center gap-2 px-2"><input type="checkbox" id="offerActive" checked={editingOffer?.isActive || false} onChange={e => setEditingOffer({...editingOffer, isActive: e.target.checked})} className="w-4 h-4 text-primary focus:ring-primary rounded" /><label htmlFor="offerActive" className="text-sm font-bold text-gray-700 dark:text-gray-300">Visible to Users</label></div>)}
                            {offerType === 'premium' && (<input type="text" placeholder="Description (Optional)" value={editingOffer?.description || ''} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} className={inputClass} />)}
                            <input type="number" placeholder="Price (Mandatory)" value={editingOffer?.price || ''} onChange={e => setEditingOffer({...editingOffer, price: e.target.value})} className={inputClass} required />
                            <div className="flex gap-3 mt-6"><button type="button" onClick={() => setIsOfferModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-2xl text-xs active:scale-95 transform">Cancel</button><button type="submit" disabled={!isOfferValid} className={`flex-1 py-3 rounded-2xl text-xs font-bold text-white active:scale-95 transform ${isOfferValid ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300'}`}>Save Offer</button></div>
                         </form>
                    </div>
                </div>
            )}
            {/* ... other modals ... */}
        </div>
    );
};

export default AdminScreen;
