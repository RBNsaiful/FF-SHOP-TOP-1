
import React, { useState, useEffect, FC, FormEvent, useMemo, useRef } from 'react';
import { User, Screen, Transaction, Purchase, AppSettings, Language, PaymentMethod, AppVisibility, Notification, DeveloperSettings, Banner, Theme, PopupConfig } from '../types';
import { db } from '../firebase';
import { ref, update, onValue, get, remove, push, set, runTransaction, query, limitToLast } from 'firebase/database';
import { 
    APP_LOGO_URL,
    DEFAULT_AVATAR_URL,
    DEFAULT_APP_SETTINGS,
    PROTECTION_KEY
} from '../constants';

// Icons
const DashboardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const UsersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const OrdersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const MoneyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const SettingsIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const ImageIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const TagIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x="7" y="7" x2="7.01" y2="7"/></svg>);
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

const SunIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2" />
        <path d="M12 21v2" />
        <path d="M4.22 4.22l1.42 1.42" />
        <path d="M18.36 18.36l1.42 1.42" />
        <path d="M1 12h2" />
        <path d="M21 12h2" />
        <path d="M4.22 19.78l1.42-1.42" />
        <path d="M18.36 5.64l1.42-1.42" />
    </svg>
);

const MoonIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

// Offer Icons
const DiamondIcon: FC<{className?: string}> = ({className}) => (<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}><path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" /></svg>);
const StarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IdCardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="9" x2="10" y2="9"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="9" x2="18" y2="9"/><line x1="14" y1="12" x2="18" y2="12"/><line x1="14" y1="15" x2="18" y2="15"/></svg>);
const CrownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);


const ADMIN_TEXTS = {
    en: {
        dashboard: "Dashboard",
        users: "Users",
        orders: "Orders",
        deposits: "Deposits",
        tools: "Tools",
        offers: "Offers",
        wallet: "Wallet",
        graphics: "Graphics",
        notifications: "Notifications",
        contacts: "Contacts",
        ads: "Ads Manager",
        settings: "Settings",
        totalUsers: "Total Users",
        totalDeposit: "Total Deposit",
        pendingOrders: "Pending Orders",
        pendingDeposits: "Pending Deposits",
        approve: "Approve",
        reject: "Reject",
        refund: "Refund",
        save: "Save",
        cancel: "Cancel",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        send: "Send",
        appName: "App Name",
        maintenance: "Maintenance",
        notice: "Notice Message",
        logout: "Logout",
        manageBalance: "Manage Balance",
        addBalance: "Add Balance",
        deductBalance: "Deduct Balance",
        amount: "Amount",
        bannerUrl: "Banner Image URL",
        actionUrl: "Click Action URL",
        appLogo: "App Logo URL",
        visibility: "Visibility Control",
        appControl: "App Access & Control",
        diamond: "Diamond",
        levelUp: "Level Up",
        membership: "Membership",
        premium: "Premium Apps",
        special: "Special Event",
        earn: "Earn Section",
        permissionDenied: "Permission Denied. Check DB Rules.",
        methodName: "Method Name",
        accNum: "Account Number",
        logo: "Logo URL",
        instructions: "Instructions (Optional)",
        notifTitle: "Notification Title",
        notifBody: "Message Body",
        notifType: "Type",
        confirmTitle: "Are you sure?",
        confirmMsg: "This action cannot be undone.",
        confirmLogout: "Are you sure you want to logout?",
        confirmYes: "Yes, Proceed",
        confirmNo: "No, Cancel",
        contactLabel: "Display Name",
        contactLink: "Link/Number",
        contactType: "Type",
        earnConfig: "Earning Rules",
        adsConfig: "Ads Configuration",
        dailyLimit: "Daily Ad Limit",
        rewardPerAd: "Reward Per Ad (৳)",
        cooldown: "Wait Time (Seconds)",
        resetHours: "Lockdown Duration (Hours)",
        webAds: "Web Ads (Current Web)",
        adMob: "AdMob (APK Only)",
        adUrl: "Web Ads URL (YouTube / Link)",
        adDuration: "Watch Duration (Sec)",
        appId: "AdMob App ID",
        rewardId: "Reward Ad ID",
        bannerId: "Banner Ad ID",
        interstitialId: "Interstitial Ad ID",
        pending: "Pending",
        completed: "Completed",
        failed: "Cancelled",
        adTitle: "Ad Title",
        adCode: "Ad Code (HTML/JS)",
        adStatus: "Status",
        preview: "Preview",
        active: "Active",
        inactive: "Inactive",
        searchUser: "Search Users...",
        searchOrder: "Search Order ID, UID...",
        searchTxn: "Search TrxID, Method...",
        devInfo: "Developer Info (Restricted)",
        devTitle: "Developer Title",
        devUrl: "Developer URL",
        devMsg: "Credit Message",
        devDesc: "Description",
        updateDev: "Save Developer Info",
        unlockDev: "Unlock & Edit",
        devLocked: "Developer Information Locked",
        securityCheck: "Security Check",
        enterKey: "Enter Secret Key",
        unlock: "Unlock",
        editBanner: "Edit Banner",
        reorder: "Reorder",
        homeAdCode: "Home Screen Ad Code",
        earnAdCode: "Earn Screen Ad Code",
        profileAdCode: "Profile Pages Ad Code",
        adCodeInstructions: "Paste your HTML/JS ad code here. It will appear at the bottom of the screen.",
        uiAppearance: "UI & Appearance",
        cardSize: "Offer Card Size",
        globalAnim: "Global Animation",
        small: "Small",
        medium: "Medium",
        large: "Large",
        aiManager: "AI Manager",
        totalAiInteractions: "Total Interactions",
        aiActiveUsers: "Active Users",
        aiConfig: "AI Configuration",
        enableAi: "Enable AI Support",
        aiName: "Bot Name",
        aiApiKey: "Gemini API Key",
        contactSettings: "Contact Page Text",
        contactMsg: "Support Message",
        opHours: "Operating Hours Text",
    }
};

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

// Confirmation Dialog
const ConfirmationDialog: FC<{ title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText: string; cancelText: string; }> = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-smart-fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <div className="flex space-x-2">
                <button
                    onClick={onCancel}
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity text-xs"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors text-xs"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

// Helper Component for Copy Button
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
            className={`flex items-center gap-1.5 ${iconOnly ? 'p-1.5' : 'px-2 py-1'} bg-gray-100 dark:bg-gray-700/50 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors active:scale-95 border border-gray-200 dark:border-gray-700 max-w-full`}
            title="Click to copy"
        >
            {!iconOnly && <span className="font-mono text-[10px] text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[150px]">{label || text}</span>}
            {copied ? <CheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" /> : <CopyIcon className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
        </button>
    );
};

// Reusable Search Input Component
const SearchInput: FC<{ value: string; onChange: (val: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
    <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
            type="text"
            className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs transition-shadow shadow-sm"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const AdminScreen: FC<AdminScreenProps> = ({ user, onNavigate, onLogout, language, setLanguage, appSettings, theme, setTheme }) => {
    // Navigation State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'offers' | 'orders' | 'deposits' | 'tools'>('dashboard');
    const [activeTool, setActiveTool] = useState<'users' | 'settings' | 'graphics' | 'wallet' | 'notifications' | 'contacts' | 'ads' | 'ai'>('users');
    
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
    
    // Counters only (For Dashboard)
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
    
    // Settings State
    const [settings, setSettings] = useState<AppSettings>(appSettings);
    const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(appSettings);
    
    // Developer Settings State (Separate for Security)
    const [devSettings, setDevSettings] = useState<DeveloperSettings>(DEFAULT_APP_SETTINGS.developerSettings!);
    const [isDevUnlocked, setIsDevUnlocked] = useState(false); // Security Lock State
    
    // Privacy Mechanism States
    const [showDevCard, setShowDevCard] = useState(false);
    const [headerTapCount, setHeaderTapCount] = useState(0);
    const tapTimeoutRef = useRef<number | null>(null);
    
    // Security Modal State
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [securityKeyInput, setSecurityKeyInput] = useState('');

    // Banner Edit State
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBannerIndex, setEditingBannerIndex] = useState<number | null>(null);
    const [tempBannerUrl, setTempBannerUrl] = useState('');
    const [tempActionUrl, setTempActionUrl] = useState('');

    // Other UI States
    const [permissionError, setPermissionError] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    // AI API Key Validation State
    const [apiKeyError, setApiKeyError] = useState('');

    // Offer State
    const [offerType, setOfferType] = useState<'diamond' | 'levelUp' | 'membership' | 'premium' | 'special'>('diamond');
    const [offersData, setOffersData] = useState<any>({ diamond: [], levelUp: [], membership: [], premium: [], special: [] });
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

    // Wallet / Payment Methods State
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [editingMethodIndex, setEditingMethodIndex] = useState<number | null>(null);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);

    // Graphics State
    const [banners, setBanners] = useState<Banner[]>([]);
    const [newBannerUrl, setNewBannerUrl] = useState('');
    const [newActionUrl, setNewActionUrl] = useState('');

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'system' });
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    // Contacts State
    const [contacts, setContacts] = useState<any[]>([]);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Popup Config State
    const [popupConfig, setPopupConfig] = useState<PopupConfig>({ active: false, title: 'Welcome', message: 'Welcome to our app!' });

    // Balance Modal State
    const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');

    const t = ADMIN_TEXTS['en']; // FORCE ENGLISH

    // Helper for Confirmation
    const requestConfirmation = (action: () => void, messageOverride?: string) => {
        setConfirmDialog({
            show: true,
            title: t.confirmTitle,
            message: messageOverride || t.confirmMsg,
            onConfirm: action
        });
    };

    // Handle Logout with Confirmation
    const handleLogoutClick = () => {
        requestConfirmation(onLogout, t.confirmLogout);
    };

    // --- Header Tap Logic for Hidden Dev Info ---
    const handleHeaderTap = () => {
        const newCount = headerTapCount + 1;
        setHeaderTapCount(newCount);
        
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        
        if (newCount >= 5) {
            setShowDevCard(prev => !prev);
            alert(showDevCard ? "Developer Info Hidden" : "Developer Info Unlocked");
            setHeaderTapCount(0);
        } else {
            tapTimeoutRef.current = window.setTimeout(() => setHeaderTapCount(0), 800);
        }
    };

    // --- OPTIMIZED DATA FETCHING ---
    // Instead of fetching EVERYTHING on load, we fetch what's needed.
    useEffect(() => {
        const fetchDashboardStats = () => {
            // Fetch Users (Needed for Total Users count & Ad Revenue)
            // Optimization: If user count is huge, we should only fetch minimal data, but Firebase RTDB doesn't support 'count'.
            // We fetch once.
            onValue(ref(db, 'users'), (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const uList: User[] = Object.keys(data).map(key => ({ ...data[key], uid: key }));
                    setUsers(uList); // Store users for "Users" tool
                    
                    const totalAdRev = uList.reduce((acc, u) => acc + (u.totalEarned || 0), 0);
                    setDashboardStats(prev => ({
                        ...prev,
                        totalUsers: uList.length,
                        totalAdRevenue: totalAdRev
                    }));
                }
            });

            // Fetch Recent Orders (Limit to last 500 for performance)
            const recentOrdersQuery = query(ref(db, 'orders'), limitToLast(500));
            onValue(recentOrdersQuery, (snap) => {
                if(snap.exists()) {
                    let allOrders: Purchase[] = [];
                    let pendingCount = 0;
                    let todayPurchaseAmt = 0;
                    const todayStr = new Date().toDateString();

                    snap.forEach(userOrders => {
                        const uOrders = userOrders.val();
                        if (uOrders) {
                            Object.keys(uOrders).forEach(key => {
                                const order = { ...uOrders[key], key, userId: userOrders.key! };
                                allOrders.push(order);
                                if (order.status === 'Pending') pendingCount++;
                                if (order.status === 'Completed' && new Date(order.date).toDateString() === todayStr) {
                                    todayPurchaseAmt += order.offer.price;
                                }
                            });
                        }
                    });
                    setOrders(allOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    setDashboardStats(prev => ({ ...prev, pendingOrders: pendingCount, todayPurchase: todayPurchaseAmt }));
                }
            });

            // Fetch Recent Transactions (Limit to last 500)
            const recentTxnQuery = query(ref(db, 'transactions'), limitToLast(500));
            onValue(recentTxnQuery, (snap) => {
                if(snap.exists()) {
                    let allTxns: Transaction[] = [];
                    let pendingCount = 0;
                    let todayDepositAmt = 0;
                    let todayAdRevAmt = 0;
                    const todayStr = new Date().toDateString();

                    snap.forEach(userTxns => {
                        const uTxns = userTxns.val();
                        if (uTxns) {
                            Object.keys(uTxns).forEach(key => {
                                const txn = { ...uTxns[key], key, userId: userTxns.key! };
                                allTxns.push(txn);
                                if (txn.status === 'Pending') pendingCount++;
                                if (new Date(txn.date).toDateString() === todayStr) {
                                    if (txn.status === 'Completed' && txn.type !== 'ad_reward') todayDepositAmt += txn.amount;
                                    if (txn.type === 'ad_reward') todayAdRevAmt += txn.amount;
                                }
                            });
                        }
                    });
                    setTransactions(allTxns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    setDashboardStats(prev => ({ 
                        ...prev, 
                        pendingDeposits: pendingCount, 
                        todayDeposit: todayDepositAmt,
                        todayAdRevenue: todayAdRevAmt,
                        // Lifetime deposit calculation might be inaccurate with 'limitToLast', 
                        // but for dashboard speed, we accept this trade-off or need a dedicated counter in DB.
                        // Ideally, we'd iterate ALL for total, but that kills performance.
                        // Current compromise: Total shows what's in cache/limit.
                        totalDeposit: allTxns.filter(t => t.status === 'Completed' && t.type !== 'ad_reward').reduce((acc, curr) => acc + curr.amount, 0)
                    }));
                }
            });
        };

        fetchDashboardStats();

        // Config & Others (Lightweight)
        onValue(ref(db, 'notifications'), (snap) => {
            if(snap.exists()) {
                const data = snap.val();
                const list = Object.keys(data).map(key => ({ ...data[key], id: key })).reverse();
                setNotifications(list);
            }
        });

        onValue(ref(db, 'config'), (snap) => {
            if(snap.exists()) {
                const data = snap.val();
                if(data.appSettings) {
                    const mergedSettings = {
                        ...data.appSettings,
                        earnSettings: {
                            ...DEFAULT_APP_SETTINGS.earnSettings,
                            ...(data.appSettings.earnSettings || {}),
                            webAds: { ...DEFAULT_APP_SETTINGS.earnSettings.webAds, ...(data.appSettings.earnSettings?.webAds || {}) },
                            adMob: { ...DEFAULT_APP_SETTINGS.earnSettings.adMob, ...(data.appSettings.earnSettings?.adMob || {}) },
                            homeAdCode: data.appSettings.earnSettings?.homeAdCode || DEFAULT_APP_SETTINGS.earnSettings.homeAdCode,
                            homeAdActive: data.appSettings.earnSettings?.homeAdActive ?? true,
                            earnAdCode: data.appSettings.earnSettings?.earnAdCode || DEFAULT_APP_SETTINGS.earnSettings.earnAdCode,
                            earnAdActive: data.appSettings.earnSettings?.earnAdActive ?? true,
                            profileAdCode: data.appSettings.earnSettings?.profileAdCode ?? DEFAULT_APP_SETTINGS.earnSettings.profileAdCode,
                            profileAdActive: data.appSettings.earnSettings?.profileAdActive ?? true,
                        },
                        uiSettings: {
                            ...DEFAULT_APP_SETTINGS.uiSettings,
                            ...(data.appSettings.uiSettings || {})
                        },
                        aiSupportActive: data.appSettings.aiSupportActive ?? DEFAULT_APP_SETTINGS.aiSupportActive,
                        aiName: data.appSettings.aiName || DEFAULT_APP_SETTINGS.aiName,
                        aiApiKey: data.appSettings.aiApiKey || "",
                        contactMessage: data.appSettings.contactMessage || DEFAULT_APP_SETTINGS.contactMessage,
                        operatingHours: data.appSettings.operatingHours || DEFAULT_APP_SETTINGS.operatingHours,
                        popupNotification: data.appSettings.popupNotification || { active: false, title: '', message: '' }
                    };
                    setSettings(mergedSettings);
                    setOriginalSettings(mergedSettings); 
                    if (data.appSettings.developerSettings) {
                        setDevSettings(data.appSettings.developerSettings);
                    }
                    if (data.appSettings.popupNotification) {
                        setPopupConfig(data.appSettings.popupNotification);
                    }
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
                    const formattedBanners = rawBanners.map((b: any) => 
                        typeof b === 'string' ? { imageUrl: b, actionUrl: '' } : b
                    );
                    setBanners(formattedBanners);
                }
                if(data.paymentMethods) {
                    setPaymentMethods(Object.values(data.paymentMethods));
                }
                if (data.supportContacts) {
                    setContacts(Object.values(data.supportContacts));
                }
            }
        });

    }, []); // Only runs once on mount

    const aiStats = useMemo(() => {
        const totalInteractions = users.reduce((acc, u) => acc + (u.aiRequestCount || 0), 0);
        const activeAiUsers = users.filter(u => (u.aiRequestCount || 0) > 0).length;
        return { totalInteractions, activeAiUsers };
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (!userSearch) return users;
        const lowerTerm = userSearch.toLowerCase();
        return users.filter(u => 
            u.name.toLowerCase().includes(lowerTerm) || 
            u.email.toLowerCase().includes(lowerTerm) || 
            u.uid.toLowerCase().includes(lowerTerm)
        );
    }, [users, userSearch]);

    const filteredOrders = useMemo(() => {
        let result = orders.filter(o => o.status === orderFilter);
        if (orderSearch) {
            const lowerTerm = orderSearch.toLowerCase();
            result = result.filter(o => 
                o.id.toLowerCase().includes(lowerTerm) || 
                o.uid.toLowerCase().includes(lowerTerm)
            );
        }
        return result;
    }, [orders, orderFilter, orderSearch]);

    const filteredTransactions = useMemo(() => {
        let result = transactions.filter(t => t.status === depositFilter);
        if (depositSearch) {
            const lowerTerm = depositSearch.toLowerCase();
            result = result.filter(t => 
                t.transactionId.toLowerCase().includes(lowerTerm) ||
                t.method.toLowerCase().includes(lowerTerm)
            );
        }
        return result;
    }, [transactions, depositFilter, depositSearch]);


    // --- Actions ---
    const isSettingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    const handleSettingsSave = async (e: FormEvent) => {
        e.preventDefault();
        
        const currentKey = settings.aiApiKey || '';
        if (currentKey.length > 0) {
            const apiKeyRegex = /^AIza[0-9A-Za-z\-_]{35}$/;
            if (!apiKeyRegex.test(currentKey)) {
                setApiKeyError("Invalid API Key format. Must start with 'AIza' and be 39 characters long.");
                alert("Settings NOT Saved!\n\nReason: Invalid Gemini API Key format.");
                return;
            }
        }
        setApiKeyError(''); 

        let finalSettings = { ...settings };
        const currentUrl = finalSettings.earnSettings?.webAds?.url || '';
        if (currentUrl) {
            const ytMatch = currentUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([^&?]*))/);
            if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1];
                const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1`;
                
                finalSettings = {
                    ...finalSettings,
                    earnSettings: {
                        ...finalSettings.earnSettings!,
                        webAds: {
                            ...finalSettings.earnSettings!.webAds,
                            url: embedUrl
                        }
                    }
                };
            }
        }

        const { developerSettings, ...safeSettings } = finalSettings;
        await update(ref(db, 'config/appSettings'), safeSettings);
        setSettings(finalSettings); 
        setOriginalSettings(finalSettings);
        
        alert("✅ Settings Saved Successfully!");
    };

    const handleUnlockDevInfo = () => {
        setSecurityKeyInput('');
        setIsSecurityModalOpen(true);
    };

    const handleVerifySecurityKey = (e: FormEvent) => {
        e.preventDefault();
        if (securityKeyInput === PROTECTION_KEY) {
            setIsDevUnlocked(true);
            setIsSecurityModalOpen(false);
        } else {
            alert("ACCESS DENIED: Incorrect Secret Key.");
        }
    };

    const handleSaveDeveloperInfo = async () => {
        try {
            await update(ref(db, 'config/appSettings/developerSettings'), devSettings);
            alert("Success: Developer Info Updated.");
            setIsDevUnlocked(false); 
        } catch (error) {
            alert("Error updating database.");
        }
    };

    const handleOrderAction = (order: Purchase, action: 'Completed' | 'Failed') => {
        requestConfirmation(async () => {
            if (order.key && order.userId) {
                await update(ref(db, `orders/${order.userId}/${order.key}`), { status: action });
                if (action === 'Failed') {
                    const userRef = ref(db, `users/${order.userId}`);
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        const currentBalance = userData.balance || 0;
                        await update(userRef, { balance: currentBalance + order.offer.price });
                    }
                }
            }
        }, `Confirm ${action}?`);
    };

    const handleTxnAction = (txn: Transaction, action: 'Completed' | 'Failed') => {
        requestConfirmation(async () => {
            if (txn.key && txn.userId) {
                await update(ref(db, `transactions/${txn.userId}/${txn.key}`), { status: action });
                if (action === 'Completed') {
                    const userRef = ref(db, `users/${txn.userId}`);
                    await runTransaction(userRef, (userData) => {
                        if (userData) {
                            userData.balance = (userData.balance || 0) + txn.amount;
                            return userData;
                        }
                        return userData;
                    });
                }
            }
        });
    };

    const handleBalanceUpdate = () => {
        if (!balanceModalUser || !balanceAmount) return;
        const amount = Number(balanceAmount);
        if (isNaN(amount) || amount <= 0) return;

        requestConfirmation(async () => {
            const userRef = ref(db, `users/${balanceModalUser.uid}`);
            const snap = await get(userRef);
            if (snap.exists()) {
                const currentBalance = snap.val().balance || 0;
                const newBalance = balanceAction === 'add' ? currentBalance + amount : currentBalance - amount;
                if (newBalance < 0) { alert("Insufficient balance."); return; }
                await update(userRef, { balance: newBalance });
                setBalanceModalUser(null); setBalanceAmount('');
            }
        }, `${balanceAction === 'add' ? 'Add' : 'Deduct'} ${amount} to ${balanceModalUser.name}?`);
    };

    const handleSaveOffer = async (e: FormEvent) => {
        e.preventDefault();
        const path = `config/offers/${offerType}`;
        let newOffer = { ...editingOffer };
        if (!newOffer.id) newOffer.id = Date.now();
        if (newOffer.price) newOffer.price = Number(newOffer.price);
        if (newOffer.diamonds) newOffer.diamonds = Number(newOffer.diamonds);
        if (offerType === 'special' && newOffer.isActive === undefined) newOffer.isActive = true;

        let updatedList = [...offersData[offerType]];
        if (editingOffer.id && offersData[offerType].find((o: any) => o.id === editingOffer.id)) {
            updatedList = updatedList.map((o: any) => o.id === editingOffer.id ? newOffer : o);
        } else { updatedList.push(newOffer); }
        await set(ref(db, path), updatedList); setIsOfferModalOpen(false); setEditingOffer(null);
    };
    const handleDeleteOffer = (id: number) => requestConfirmation(async () => {
        const path = `config/offers/${offerType}`;
        const updatedList = offersData[offerType].filter((o: any) => o.id !== id);
        await set(ref(db, path), updatedList);
    });
    
    const handleReorderOffer = async (index: number, direction: 'up' | 'down') => {
        const currentList = [...offersData[offerType]];
        if (direction === 'up' && index > 0) {
            [currentList[index], currentList[index - 1]] = [currentList[index - 1], currentList[index]];
        } else if (direction === 'down' && index < currentList.length - 1) {
            [currentList[index], currentList[index + 1]] = [currentList[index + 1], currentList[index]];
        } else {
            return;
        }
        setOffersData({ ...offersData, [offerType]: currentList });
        await set(ref(db, `config/offers/${offerType}`), currentList);
    };

    const openAddOfferModal = () => { setEditingOffer({}); setIsOfferModalOpen(true); };

    const handleSaveMethod = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingMethod) return;
        const updatedMethods = [...paymentMethods];
        if (editingMethodIndex !== null) updatedMethods[editingMethodIndex] = editingMethod;
        else updatedMethods.push(editingMethod);
        await set(ref(db, 'config/paymentMethods'), updatedMethods); setIsMethodModalOpen(false); setEditingMethod(null); setEditingMethodIndex(null);
    };
    const handleDeleteMethod = (index: number) => requestConfirmation(async () => {
        const updatedMethods = paymentMethods.filter((_, i) => i !== index);
        await set(ref(db, 'config/paymentMethods'), updatedMethods);
    });
    const openAddMethodModal = () => { setEditingMethod({ name: '', accountNumber: '', logo: '', instructions: '' }); setEditingMethodIndex(null); setIsMethodModalOpen(true); };
    const openEditMethodModal = (method: PaymentMethod, index: number) => { setEditingMethod({ ...method }); setEditingMethodIndex(index); setIsMethodModalOpen(true); };

    const handleSaveContact = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingContact) return;
        const updatedContacts = [...contacts];
        const contactToSave = { ...editingContact, labelKey: editingContact.title };
        if (editingContactIndex !== null) updatedContacts[editingContactIndex] = contactToSave;
        else updatedContacts.push(contactToSave);
        await set(ref(db, 'config/supportContacts'), updatedContacts); setIsContactModalOpen(false); setEditingContact(null); setEditingContactIndex(null);
    };
    const handleDeleteContact = (index: number) => requestConfirmation(async () => {
        const updatedContacts = contacts.filter((_, i) => i !== index);
        await set(ref(db, 'config/supportContacts'), updatedContacts);
    });
    const openAddContactModal = () => { setEditingContact({ type: 'phone', title: '', link: '', labelKey: '' }); setEditingContactIndex(null); setIsContactModalOpen(true); };
    const openEditContactModal = (contact: any, index: number) => { setEditingContact({ ...contact, title: contact.title || contact.labelKey }); setEditingContactIndex(index); setIsContactModalOpen(true); };

    const toggleUserSelection = (uid: string) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(uid)) { newSet.delete(uid); } else { newSet.add(uid); }
        setSelectedUserIds(newSet);
    };

    const handleSendNotification = async (e: FormEvent) => {
        e.preventDefault();
        if (selectedUserIds.size > 0) {
            const promises = Array.from(selectedUserIds).map(uid => {
                return push(ref(db, 'notifications'), { ...newNotif, timestamp: Date.now(), targetUid: uid });
            });
            await Promise.all(promises);
            setSelectedUserIds(new Set());
            alert(`Sent to ${selectedUserIds.size} users.`);
        } else {
            await push(ref(db, 'notifications'), { ...newNotif, timestamp: Date.now() });
        }
        setNewNotif({ title: '', message: '', type: 'system' });
        setIsNotifModalOpen(false);
    };

    const handleDeleteNotification = (id: string) => requestConfirmation(async () => { await remove(ref(db, `notifications/${id}`)); });

    const handleSavePopupConfig = async () => {
        await update(ref(db, 'config/appSettings'), { popupNotification: popupConfig });
        alert("Popup Settings Saved!");
        setSettings(prev => ({...prev, popupNotification: popupConfig}));
    };

    const handleAddBanner = async () => { if(!newBannerUrl) return; const updatedBanners = [...banners, { imageUrl: newBannerUrl, actionUrl: newActionUrl }]; await set(ref(db, 'config/banners'), updatedBanners); setNewBannerUrl(''); setNewActionUrl(''); };
    const handleDeleteBanner = (index: number) => requestConfirmation(async () => { const updatedBanners = banners.filter((_, i) => i !== index); await set(ref(db, 'config/banners'), updatedBanners); });
    
    const openEditBannerModal = (index: number, banner: Banner) => { setEditingBannerIndex(index); setTempBannerUrl(banner.imageUrl); setTempActionUrl(banner.actionUrl || ''); setIsBannerModalOpen(true); };
    const handleSaveBanner = async (e: FormEvent) => {
        e.preventDefault();
        if (editingBannerIndex !== null && tempBannerUrl) {
            const updatedBanners = [...banners];
            updatedBanners[editingBannerIndex] = { imageUrl: tempBannerUrl, actionUrl: tempActionUrl };
            await set(ref(db, 'config/banners'), updatedBanners);
            setIsBannerModalOpen(false);
            setEditingBannerIndex(null);
            setTempBannerUrl('');
            setTempActionUrl('');
        }
    };

    const handleUpdateLogo = async () => { if (settings.logoUrl) { await update(ref(db, 'config/appSettings'), { logoUrl: settings.logoUrl }); alert("Logo Updated!"); } };


    if(permissionError) {
        return (
            <div className="p-8 text-center text-red-500 bg-white h-screen flex flex-col items-center justify-center">
                <LockIcon className="w-16 h-16 mb-4" />
                <h2 className="text-xl font-bold mb-2">{t.permissionDenied}</h2>
            </div>
        );
    }

    const inputClass = "w-full p-2.5 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary outline-none transition-all text-sm";

    // --- UI RENDER START ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 pb-24 font-sans">
            {/* ... Header ... */}
            <div className="bg-white dark:bg-dark-card border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                <div onClick={handleHeaderTap} className="cursor-pointer select-none active:opacity-50 transition-opacity">
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">Admin Dashboard</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleLogoutClick} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"><LockIcon className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto">
                {/* ... Dashboard Tab ... */}
                {activeTab === 'dashboard' && (
                    <div className="animate-fade-in space-y-6">
                        
                        {/* 1. KEY STATS (Top) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/5 rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-center gap-2 mb-2 text-blue-600"><UsersIcon className="w-4 h-4" /><span className="font-bold text-[10px] uppercase tracking-wider">{t.totalUsers}</span></div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalUsers}</p>
                            </div>
                            
                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-16 h-16 bg-green-500/5 rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-center gap-2 mb-2 text-green-600"><MoneyIcon className="w-4 h-4" /><span className="font-bold text-[10px] uppercase tracking-wider">{t.totalDeposit}</span></div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">৳{dashboardStats.totalDeposit}</p>
                            </div>

                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-16 h-16 bg-orange-500/5 rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-center gap-2 mb-2 text-orange-500"><OrdersIcon className="w-4 h-4" /><span className="font-bold text-[10px] uppercase tracking-wider">{t.pendingOrders}</span></div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.pendingOrders}</p>
                            </div>

                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-16 h-16 bg-purple-500/5 rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-center gap-2 mb-2 text-purple-500"><WalletIcon className="w-4 h-4" /><span className="font-bold text-[10px] uppercase tracking-wider">{t.pendingDeposits}</span></div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.pendingDeposits}</p>
                            </div>
                        </div>

                        {/* 2. QUICK JUMP (Middle) */}
                        <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-xs uppercase text-gray-400 mb-4 tracking-wider">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setActiveTab('orders'); setOrderFilter('Pending'); }} className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm transition-colors flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 h-24">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600"><OrdersIcon className="w-5 h-5"/></div>
                                    <span>Manage Orders</span>
                                </button>
                                <button onClick={() => { setActiveTab('deposits'); setDepositFilter('Pending'); }} className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm transition-colors flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 h-24">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600"><WalletIcon className="w-5 h-5"/></div>
                                    <span>Verify Deposits</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. TODAY'S PERFORMANCE & ADS (Bottom) */}
                        <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xs uppercase text-gray-400 mb-4 tracking-wider">Today's Performance</h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Deposit Today</p>
                                    <p className="text-lg font-bold text-green-600">৳{dashboardStats.todayDeposit}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Sales Today</p>
                                    <p className="text-lg font-bold text-blue-600">৳{dashboardStats.todayPurchase}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                                    <p className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-500 mb-1">Ad Rev Today</p>
                                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">৳{dashboardStats.todayAdRevenue}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                                    <p className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-500 mb-1">Total Ad Rev</p>
                                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">৳{dashboardStats.totalAdRevenue}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ... Offers Tab ... */}
                {activeTab === 'offers' && (
                    <div className="animate-fade-in">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                            {['diamond', 'levelUp', 'membership', 'premium', 'special'].map((type) => (
                                <button key={type} onClick={() => setOfferType(type as any)} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all border ${offerType === type ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-gray-800 text-gray-500 border-transparent'}`}>{t[type as keyof typeof t] || type}</button>
                            ))}
                        </div>
                        <button onClick={openAddOfferModal} className="w-full py-3 mb-4 border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">+ Add New Offer</button>
                        <div className="grid grid-cols-2 gap-3">
                            {offersData[offerType]?.map((offer: any, index: number) => (
                                <div key={offer.id} className="relative p-3 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-full shadow-sm">
                                    {offerType === 'special' && (
                                        <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${offer.isActive ? 'bg-green-500' : 'bg-red-500'}`} title={offer.isActive ? 'Active' : 'Inactive'}></div>
                                    )}
                                    <div>
                                        <div className="bg-gray-50 dark:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center mb-2 text-primary font-bold text-xs">
                                            {offerType === 'diamond' && <DiamondIcon className="w-4 h-4" />}
                                            {offerType === 'levelUp' && <StarIcon className="w-4 h-4" />}
                                            {offerType === 'membership' && <IdCardIcon className="w-4 h-4" />}
                                            {offerType === 'premium' && <CrownIcon className="w-4 h-4" />}
                                            {offerType === 'special' && <TagIcon className="w-4 h-4" />}
                                        </div>
                                        <p className="font-bold text-sm leading-tight mb-1 text-gray-900 dark:text-white">{offer.name || `${offer.diamonds} Diamonds`}</p>
                                        <p className="text-[10px] text-gray-500">{offerType === 'diamond' || offerType === 'special' ? `${offer.diamonds} DM` : 'Package'}</p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <span className="font-bold text-sm text-primary">৳{offer.price}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleReorderOffer(index, 'up')} disabled={index === 0} className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"><ArrowUpIcon className="w-3 h-3"/></button>
                                            <button onClick={() => handleReorderOffer(index, 'down')} disabled={index === offersData[offerType].length - 1} className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"><ArrowDownIcon className="w-3 h-3"/></button>
                                            <button onClick={() => { setEditingOffer(offer); setIsOfferModalOpen(true); }} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg ml-1"><EditIcon className="w-3 h-3"/></button>
                                            <button onClick={() => handleDeleteOffer(offer.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><TrashIcon className="w-3 h-3"/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ... Orders Tab ... */}
                {activeTab === 'orders' && (
                    <div className="space-y-4 animate-fade-in">
                        <SearchInput value={orderSearch} onChange={setOrderSearch} placeholder="Search Order ID or UID..." />
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            {(['Pending', 'Completed', 'Failed'] as const).map(status => (
                                <button key={status} onClick={() => setOrderFilter(status)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderFilter === status ? 'bg-white dark:bg-dark-card shadow-sm text-primary' : 'text-gray-500'}`}>{t[status.toLowerCase() as keyof typeof t] || status}</button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {filteredOrders.length === 0 ? <div className="text-center py-10 text-gray-400 text-xs">No orders found</div> : filteredOrders.map(order => {
                                const isPremium = order.uid.includes('|');
                                let displayLabel = "Player UID";
                                let displayValueLine1 = order.uid;
                                let displayValueLine2 = null;

                                if (isPremium) {
                                    const parts = order.uid.split('|');
                                    displayLabel = "Contact";
                                    displayValueLine1 = parts[0].trim();
                                    displayValueLine2 = parts[1] ? parts[1].trim() : null;
                                } else if (order.uid.includes('@')) {
                                    displayLabel = "Gmail";
                                }

                                return (
                                <div key={order.key} className={`bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border-l-4 ${order.status === 'Pending' ? 'border-l-yellow-500' : order.status === 'Completed' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div><span className="font-bold text-sm block text-gray-900 dark:text-white">{order.offer.diamonds || order.offer.name}</span><span className="text-[10px] text-gray-400 font-mono">{new Date(order.date).toLocaleString()}</span></div>
                                        <div className="text-right"><span className="font-bold text-primary text-sm">৳{order.offer.price}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-[10px]">
                                            <p className="text-gray-400 mb-1">{displayLabel}</p>
                                            <div className="flex flex-col gap-1">
                                                <SmartCopy text={displayValueLine1} label={displayValueLine1.substring(0, 15) + (displayValueLine1.length > 15 ? '...' : '')} />
                                                {displayValueLine2 && (
                                                    <SmartCopy text={displayValueLine2} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-[10px]"><p className="text-gray-400 mb-1">Order ID</p><SmartCopy text={order.id} /></div>
                                    </div>
                                    {order.status === 'Pending' && <div className="flex gap-2 mt-2"><button onClick={() => handleOrderAction(order, 'Completed')} className="flex-1 bg-green-500 text-white py-2.5 rounded-lg font-bold text-xs shadow-md hover:bg-green-600 active:scale-95 transition-all">{t.approve}</button><button onClick={() => handleOrderAction(order, 'Failed')} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-bold text-xs shadow-md hover:bg-red-600 active:scale-95 transition-all">{t.reject}</button></div>}
                                    {order.status === 'Failed' && <div className="text-[10px] text-red-500 font-bold mt-1">Refunded</div>}
                                </div>
                            )})}
                        </div>
                    </div>
                )}

                {/* ... Deposits Tab ... */}
                {activeTab === 'deposits' && (
                    <div className="space-y-4 animate-fade-in">
                        <SearchInput value={depositSearch} onChange={setDepositSearch} placeholder="Search TrxID..." />
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            {(['Pending', 'Completed', 'Failed'] as const).map(status => (
                                <button key={status} onClick={() => setDepositFilter(status)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${depositFilter === status ? 'bg-white dark:bg-dark-card shadow-sm text-primary' : 'text-gray-500'}`}>{t[status.toLowerCase() as keyof typeof t] || status}</button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {filteredTransactions.length === 0 ? <div className="text-center py-10 text-gray-400 text-xs">No deposits found</div> : filteredTransactions.map(txn => (
                                <div key={txn.key} className={`bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border-l-4 ${txn.status === 'Pending' ? 'border-l-yellow-500' : txn.status === 'Completed' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="flex justify-between mb-3">
                                        <div><span className="font-bold text-sm block text-gray-900 dark:text-white">{txn.method}</span><span className="text-[10px] text-gray-400">{new Date(txn.date).toLocaleString()}</span></div>
                                        <div className="text-right"><span className="font-bold text-green-600 block text-sm">+৳{txn.amount}</span></div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-[10px] mb-3 flex justify-between items-center"><span className="text-gray-500">TrxID:</span><SmartCopy text={txn.transactionId} label={txn.transactionId} /></div>
                                    {txn.status === 'Pending' && <div className="flex gap-2"><button onClick={() => handleTxnAction(txn, 'Completed')} className="flex-1 bg-green-500 text-white py-2.5 rounded-lg font-bold text-xs shadow-md hover:bg-green-600 active:scale-95 transition-all">{t.approve}</button><button onClick={() => handleTxnAction(txn, 'Failed')} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-bold text-xs shadow-md hover:bg-red-600 active:scale-95 transition-all">{t.reject}</button></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TOOLS TAB */}
                {activeTab === 'tools' && (
                    <div className="animate-fade-in">
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                            {[
                                { id: 'users', label: t.users, icon: UsersIcon },
                                { id: 'wallet', label: t.wallet, icon: WalletIcon },
                                { id: 'ai', label: t.aiManager, icon: RobotIcon },
                                { id: 'graphics', label: t.graphics, icon: ImageIcon },
                                { id: 'ads', label: t.ads, icon: MegaphoneIcon },
                                { id: 'notifications', label: t.notifications, icon: BellIcon },
                                { id: 'contacts', label: t.contacts, icon: ContactIcon },
                                { id: 'settings', label: t.settings, icon: SettingsIcon },
                            ].map(tool => (
                                <button key={tool.id} onClick={() => setActiveTool(tool.id as any)} className={`flex flex-col items-center justify-center min-w-[70px] p-2.5 rounded-xl transition-all border ${activeTool === tool.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white dark:bg-dark-card text-gray-500 border-transparent'}`}><tool.icon className="w-5 h-5 mb-1" /><span className="text-[9px] font-bold uppercase">{tool.label}</span></button>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm min-h-[300px] border border-gray-100 dark:border-gray-800">
                            
                            {/* USERS TOOL (Updated with Selective Notification) */}
                            {activeTool === 'users' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-base font-bold text-gray-800 dark:text-white">User Management</h2>
                                        {selectedUserIds.size > 0 && (
                                            <button 
                                                onClick={() => setIsNotifModalOpen(true)}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-lg animate-pulse"
                                            >
                                                Msg {selectedUserIds.size}
                                            </button>
                                        )}
                                    </div>
                                    <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search User..." />
                                    {filteredUsers.length === 0 && <p className="text-gray-400 text-center text-xs py-4">No users found.</p>}
                                    {filteredUsers.slice(0, 50).map(u => (
                                        <div key={u.uid} className={`relative bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border flex flex-col gap-2 transition-colors ${selectedUserIds.has(u.uid) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
                                            
                                            {/* Selection Checkbox */}
                                            <div className="absolute top-3 right-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedUserIds.has(u.uid)} 
                                                    onChange={() => toggleUserSelection(u.uid)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <img src={u.avatarUrl || DEFAULT_AVATAR_URL} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0" />
                                                <div className="flex-1 min-w-0 overflow-hidden pr-6">
                                                    <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{u.name}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                                                    <div className="flex items-center gap-2 mt-1"><span className="text-[9px] font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-500">UID</span><SmartCopy text={u.uid} label={u.uid} iconOnly={false} /></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-gray-700/30 p-2 rounded-lg border border-gray-200 dark:border-gray-700/50">
                                                <div><p className="text-[9px] text-gray-500 uppercase font-bold">Wallet</p><p className="text-sm font-black text-primary truncate max-w-[100px]">৳{Math.floor(u.balance)}</p></div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setBalanceModalUser(u); setBalanceAction('add'); setBalanceAmount(''); }} className="bg-green-100 text-green-700 p-1.5 rounded-lg hover:bg-green-200 active:scale-95 transition-transform"><PlusIcon className="w-3 h-3" /></button>
                                                    <button onClick={() => { setBalanceModalUser(u); setBalanceAction('deduct'); setBalanceAmount(''); }} className="bg-red-100 text-red-700 p-1.5 rounded-lg hover:bg-red-200 active:scale-95 transition-transform"><MinusIcon className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredUsers.length > 50 && <p className="text-center text-[10px] text-gray-400 mt-2">Showing 50 of {filteredUsers.length} users.</p>}
                                </div>
                            )}

                            {activeTool === 'wallet' && (
                                <div>
                                    <button onClick={openAddMethodModal} className="w-full py-3 mb-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-xs">+ Add Wallet</button>
                                    <div className="space-y-3">
                                        {paymentMethods.map((method, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-3"><img src={method.logo} className="w-8 h-8 object-contain bg-white rounded p-0.5" /><div><p className="font-bold text-sm text-gray-900 dark:text-white">{method.name}</p><SmartCopy text={method.accountNumber} /></div></div>
                                                <div className="flex gap-2"><button onClick={() => openEditMethodModal(method, index)} className="p-1.5 bg-blue-100 text-blue-600 rounded"><EditIcon className="w-3 h-3"/></button><button onClick={() => handleDeleteMethod(index)} className="p-1.5 bg-red-100 text-red-600 rounded"><TrashIcon className="w-3 h-3"/></button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTool === 'ai' && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Stats Card */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            <RobotIcon className="w-6 h-6 text-white/90" />
                                            <h3 className="font-bold text-sm">{t.aiManager}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                                <p className="text-xl font-black mb-1">{aiStats.totalInteractions}</p>
                                                <p className="text-[9px] uppercase font-bold text-white/80">{t.totalAiInteractions}</p>
                                            </div>
                                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                                <p className="text-xl font-black mb-1">{aiStats.activeAiUsers}</p>
                                                <p className="text-[9px] uppercase font-bold text-white/80">{t.aiActiveUsers}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Configuration Card */}
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-xs mb-3 uppercase text-indigo-600 dark:text-indigo-400">{t.aiConfig}</h4>
                                        
                                        <div className="space-y-3">
                                            {/* Toggle Switch */}
                                            <div className="flex justify-between items-center p-3 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs">{t.enableAi}</span>
                                                </div>
                                                <div 
                                                    onClick={() => setSettings({...settings, aiSupportActive: !settings.aiSupportActive})}
                                                    className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${settings.aiSupportActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${settings.aiSupportActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                </div>
                                            </div>

                                            {/* AI Name Input */}
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.aiName}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.aiName || ''} 
                                                    onChange={(e) => setSettings({...settings, aiName: e.target.value})} 
                                                    className={inputClass}
                                                    placeholder="AI Tuktuki"
                                                />
                                            </div>

                                            {/* API Key Input */}
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.aiApiKey}</label>
                                                <div className="relative">
                                                    <input 
                                                        type="password" 
                                                        value={settings.aiApiKey || ''} 
                                                        onChange={(e) => {
                                                            setSettings({...settings, aiApiKey: e.target.value});
                                                            if (apiKeyError) setApiKeyError(''); // Clear error on change
                                                        }} 
                                                        className={`${inputClass} pr-8 ${apiKeyError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                        placeholder="AIzaSy..."
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                        <LockIcon className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleSettingsSave} 
                                            disabled={!isSettingsChanged}
                                            className={`w-full mt-4 py-2.5 font-bold text-sm rounded-xl shadow-md transition-all ${isSettingsChanged ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {t.save} Settings
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTool === 'graphics' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold mb-2 text-xs uppercase text-gray-500">{t.appLogo}</h3>
                                        <div className="flex gap-3"><img src={settings.logoUrl || APP_LOGO_URL} className="w-10 h-10 rounded-full border" /><input type="text" value={settings.logoUrl || ''} onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} className={inputClass} placeholder="Image URL" /></div>
                                        <button onClick={handleUpdateLogo} className="mt-2 text-[10px] bg-primary text-white px-3 py-1 rounded font-bold uppercase tracking-wide">Update Logo</button>
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-2 text-xs uppercase text-gray-500">Banners</h3>
                                        <div className="flex gap-2 mb-3">
                                            <input type="text" value={newBannerUrl} onChange={(e) => setNewBannerUrl(e.target.value)} className={inputClass} placeholder="Image URL" />
                                            <input type="text" value={newActionUrl} onChange={(e) => setNewActionUrl(e.target.value)} className={inputClass} placeholder="Action URL (Optional)" />
                                            <button onClick={handleAddBanner} className="bg-green-500 text-white px-3 rounded font-bold text-xs">{t.add}</button>
                                        </div>
                                        <div className="space-y-2">
                                            {banners.map((banner, index) => (
                                                <div key={index} className="relative h-20 rounded-lg overflow-hidden group">
                                                    <img src={banner.imageUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditBannerModal(index, banner)} className="bg-blue-600 text-white p-1 rounded shadow-md hover:bg-blue-700">
                                                            <EditIcon className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => handleDeleteBanner(index)} className="bg-red-600 text-white p-1 rounded shadow-md hover:bg-red-700">
                                                            <TrashIcon className="w-3 h-3"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTool === 'ads' && (
                                <div>
                                    <h4 className="font-bold text-xs mb-3 uppercase text-purple-600">{t.adsConfig}</h4>
                                    
                                    {/* VIDEO & REWARD ADS CONFIGURATION */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                                        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                            <MegaphoneIcon className="w-4 h-4 text-orange-500" />
                                            <h4 className="font-bold text-xs uppercase text-gray-600 dark:text-gray-300">Video Ads</h4>
                                        </div>

                                        {/* Web Ads Config */}
                                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-[10px] text-blue-600 uppercase">{t.webAds}</span>
                                                <div 
                                                    onClick={() => setSettings({
                                                        ...settings,
                                                        earnSettings: {
                                                            ...settings.earnSettings!,
                                                            webAds: { ...settings.earnSettings!.webAds, active: !settings.earnSettings!.webAds.active }
                                                        }
                                                    })}
                                                    className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.webAds?.active ? 'bg-blue-500' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${settings.earnSettings?.webAds?.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <input 
                                                    type="text" 
                                                    value={settings.earnSettings?.webAds?.url || ''} 
                                                    onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, webAds: { ...settings.earnSettings!.webAds, url: e.target.value } }})} 
                                                    className={inputClass} 
                                                    placeholder="URL (YouTube/MP4)" 
                                                />
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] text-gray-500 font-bold whitespace-nowrap">Duration (s)</label>
                                                    <input 
                                                        type="number" 
                                                        value={settings.earnSettings?.webAds?.duration || 15} 
                                                        onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, webAds: { ...settings.earnSettings!.webAds, duration: Number(e.target.value) } }})} 
                                                        className={inputClass} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AdMob Config */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                                        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                            <AdMobIcon className="w-4 h-4 text-blue-600" />
                                            <h4 className="font-bold text-xs uppercase text-gray-600 dark:text-gray-300">{t.adMob}</h4>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-bold text-[10px] text-gray-500 uppercase">Enable AdMob</span>
                                            <div 
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    earnSettings: {
                                                        ...settings.earnSettings!,
                                                        adMob: { ...settings.earnSettings!.adMob, active: !settings.earnSettings!.adMob.active }
                                                    }
                                                })}
                                                className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.adMob?.active ? 'bg-blue-600' : 'bg-gray-300'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${settings.earnSettings?.adMob?.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.appId}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.earnSettings?.adMob?.appId || ''} 
                                                    onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adMob: { ...settings.earnSettings!.adMob, appId: e.target.value } }})} 
                                                    className={inputClass} 
                                                    placeholder="ca-app-pub-..." 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.rewardId}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.earnSettings?.adMob?.rewardId || ''} 
                                                    onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adMob: { ...settings.earnSettings!.adMob, rewardId: e.target.value } }})} 
                                                    className={inputClass} 
                                                    placeholder="ca-app-pub-.../..." 
                                                />
                                            </div>
                                            {/* NEW: Banner & Interstitial IDs */}
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.bannerId}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.earnSettings?.adMob?.bannerId || ''} 
                                                    onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adMob: { ...settings.earnSettings!.adMob, bannerId: e.target.value } }})} 
                                                    className={inputClass} 
                                                    placeholder="ca-app-pub-.../..." 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1">{t.interstitialId}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.earnSettings?.adMob?.interstitialId || ''} 
                                                    onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adMob: { ...settings.earnSettings!.adMob, interstitialId: e.target.value } }})} 
                                                    className={inputClass} 
                                                    placeholder="ca-app-pub-.../..." 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Home Screen Ads */}
                                    <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase">{t.homeAdCode}</label>
                                            <div 
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    earnSettings: {
                                                        ...settings.earnSettings!,
                                                        homeAdActive: !settings.earnSettings!.homeAdActive
                                                    }
                                                })}
                                                className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.homeAdActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${settings.earnSettings?.homeAdActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <textarea 
                                            value={settings.earnSettings?.homeAdCode || ''} 
                                            onChange={(e) => setSettings({
                                                ...settings, 
                                                earnSettings: { 
                                                    ...settings.earnSettings!, 
                                                    homeAdCode: e.target.value 
                                                }
                                            })} 
                                            className={`${inputClass} font-mono text-[10px] h-20 mb-1`} 
                                            placeholder="HTML/JS Code"
                                        />
                                    </div>

                                    {/* Earn Screen Ads */}
                                    <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase">{t.earnAdCode}</label>
                                            <div 
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    earnSettings: {
                                                        ...settings.earnSettings!,
                                                        earnAdActive: !settings.earnSettings!.earnAdActive
                                                    }
                                                })}
                                                className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.earnAdActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${settings.earnSettings?.earnAdActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <textarea 
                                            value={settings.earnSettings?.earnAdCode || ''} 
                                            onChange={(e) => setSettings({
                                                ...settings, 
                                                earnSettings: { 
                                                    ...settings.earnSettings!, 
                                                    earnAdCode: e.target.value 
                                                }
                                            })} 
                                            className={`${inputClass} font-mono text-[10px] h-20 mb-1`} 
                                            placeholder={t.adCodeInstructions}
                                        />
                                    </div>

                                    {/* Profile Screen Ads */}
                                    <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase">{t.profileAdCode}</label>
                                            <div 
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    earnSettings: {
                                                        ...settings.earnSettings!,
                                                        profileAdActive: !settings.earnSettings!.profileAdActive
                                                    }
                                                })}
                                                className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.profileAdActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${settings.earnSettings?.profileAdActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <textarea 
                                            value={settings.earnSettings?.profileAdCode || ''} 
                                            onChange={(e) => setSettings({
                                                ...settings, 
                                                earnSettings: { 
                                                    ...settings.earnSettings!, 
                                                    profileAdCode: e.target.value 
                                                }
                                            })} 
                                            className={`${inputClass} font-mono text-[10px] h-20 mb-1`} 
                                            placeholder={t.adCodeInstructions}
                                        />
                                    </div>

                                    <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-3 font-bold text-sm rounded-xl shadow-md transition-all ${isSettingsChanged ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{t.save}</button>
                                </div>
                            )}

                            {activeTool === 'notifications' && (
                                <div className="space-y-6">
                                    {/* SEND NOTIFICATION */}
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/20">
                                        <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3">Quick Send</h3>
                                        <button onClick={() => setIsNotifModalOpen(true)} className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-md hover:bg-purple-700 transition-colors text-sm">+ Create Message</button>
                                        <p className="text-[10px] text-gray-400 mt-2 text-center">To send to specific users, select them in the "Users" tool first.</p>
                                    </div>

                                    {/* LOGIN POPUP SETTINGS */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                            <h4 className="font-bold text-xs uppercase text-indigo-600 dark:text-indigo-400">Login Popup</h4>
                                            
                                            {/* Toggle Switch */}
                                            <div 
                                                onClick={() => setPopupConfig({...popupConfig, active: !popupConfig.active})}
                                                className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${popupConfig.active ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${popupConfig.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <input 
                                                type="text" 
                                                placeholder="Title" 
                                                value={popupConfig.title} 
                                                onChange={(e) => setPopupConfig({...popupConfig, title: e.target.value})} 
                                                className={inputClass} 
                                            />
                                            <textarea 
                                                placeholder="Message..." 
                                                value={popupConfig.message} 
                                                onChange={(e) => setPopupConfig({...popupConfig, message: e.target.value})} 
                                                className={inputClass} 
                                                rows={2} 
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Image URL (Optional)" 
                                                value={popupConfig.imageUrl || ''} 
                                                onChange={(e) => setPopupConfig({...popupConfig, imageUrl: e.target.value})} 
                                                className={inputClass} 
                                            />
                                            <button 
                                                onClick={handleSavePopupConfig} 
                                                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs mt-2 hover:bg-indigo-700"
                                            >
                                                Save Popup
                                            </button>
                                        </div>
                                    </div>

                                    {/* HISTORY */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">History</h3>
                                        <div className="space-y-2">
                                            {notifications.map(n => (
                                                <div key={n.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-start border border-gray-100 dark:border-gray-700">
                                                    <div>
                                                        <p className="font-bold text-xs text-gray-900 dark:text-white">{n.title}</p>
                                                        <p className="text-[10px] text-gray-500 line-clamp-1">{n.message}</p>
                                                        {n.targetUid && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 rounded-sm font-bold">Private</span>}
                                                    </div>
                                                    <button onClick={() => handleDeleteNotification(n.id)} className="text-red-500 p-1"><TrashIcon className="w-3 h-3"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTool === 'contacts' && (
                                <div>
                                    {/* General Settings Card */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                                        <h4 className="font-bold text-xs mb-3 uppercase text-blue-600 dark:text-blue-400">{t.contactSettings}</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.contactMsg}</label>
                                                <textarea 
                                                    value={settings.contactMessage || ''} 
                                                    onChange={(e) => setSettings({...settings, contactMessage: e.target.value})} 
                                                    className={inputClass} 
                                                    rows={3}
                                                    placeholder="Have a question..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.opHours}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.operatingHours || ''} 
                                                    onChange={(e) => setSettings({...settings, operatingHours: e.target.value})} 
                                                    className={inputClass}
                                                    placeholder="10:00 AM - 10:00 PM"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full mt-3 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all ${isSettingsChanged ? 'bg-blue-600 text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                                            {t.save} Settings
                                        </button>
                                    </div>

                                    <button onClick={openAddContactModal} className="w-full py-3 mb-4 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">+ Add Contact</button>
                                    <div className="space-y-2">
                                        {contacts.map((c, i) => (
                                            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center border border-gray-100 dark:border-gray-700">
                                                <div><p className="font-bold text-xs text-gray-900 dark:text-white">{c.title || c.labelKey}</p><p className="text-[10px] text-gray-500 uppercase">{c.type}</p></div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditContactModal(c, i)} className="text-blue-500"><EditIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteContact(i)} className="text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SETTINGS TOOL */}
                            {activeTool === 'settings' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        
                                        {/* 0. Admin Preferences Card (Local) */}
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                                <UserIcon className="w-4 h-4 text-pink-500" />
                                                <h4 className="font-bold text-xs uppercase text-gray-600 dark:text-gray-300">Preferences</h4>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Theme</span>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => setTheme('light')} 
                                                        className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-orange-100 text-orange-500' : 'text-gray-400'}`}
                                                    >
                                                        <SunIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setTheme('dark')} 
                                                        className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-indigo-100 text-indigo-500' : 'text-gray-400'}`}
                                                    >
                                                        <MoonIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 1. App Identity Card */}
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                                <SettingsIcon className="w-4 h-4 text-blue-500" />
                                                <h4 className="font-bold text-xs uppercase text-gray-600 dark:text-gray-300">Identity</h4>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">{t.appName}</label>
                                                    <input type="text" value={settings.appName} onChange={(e) => setSettings({...settings, appName: e.target.value})} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">{t.appLogo}</label>
                                                    <input type="text" value={settings.logoUrl || ''} onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">{t.notice}</label>
                                                    <textarea value={settings.notice || ''} onChange={(e) => setSettings({...settings, notice: e.target.value})} className={inputClass} rows={2} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Control & Visibility Card */}
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                                <EyeIcon className="w-4 h-4 text-purple-500" />
                                                <h4 className="font-bold text-xs uppercase text-gray-600 dark:text-gray-300">{t.appControl}</h4>
                                            </div>
                                            <div className="space-y-2">
                                                {/* Maintenance Mode */}
                                                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <span className="font-bold text-xs text-red-500">{t.maintenance}</span>
                                                    <div onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}>
                                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-4' : ''}`}></div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {Object.keys(settings.visibility || {}).map((key) => (
                                                        <div key={key} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                            <span className="capitalize text-[10px] font-bold truncate pr-2">{t[key as keyof typeof t] || key}</span>
                                                            <div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, [key]: !settings.visibility![key as keyof AppVisibility]}})} className={`flex-shrink-0 w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility![key as keyof AppVisibility] ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility![key as keyof AppVisibility] ? 'translate-x-4' : ''}`}></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. UI Appearance Card */}
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                                <LayoutIcon className="w-4 h-4 text-teal-500" />
                                                <h4 className="font-bold text-xs uppercase text-gray-600 dark:text-gray-300">{t.uiAppearance}</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 mb-2">{t.cardSize}</label>
                                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                                        {['small', 'medium', 'large'].map((size) => (
                                                            <button
                                                                key={size}
                                                                onClick={() => setSettings({ ...settings, uiSettings: { ...settings.uiSettings!, cardSize: size as 'small' | 'medium' | 'large' } })}
                                                                className={`flex-1 py-1 rounded-md text-[10px] font-bold capitalize transition-all ${settings.uiSettings?.cardSize === size ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-500'}`}
                                                            >
                                                                {t[size as keyof typeof t] || size}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{t.globalAnim}</span>
                                                    <div onClick={() => setSettings({ ...settings, uiSettings: { ...settings.uiSettings!, animationsEnabled: !settings.uiSettings?.animationsEnabled } })} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.uiSettings?.animationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${settings.uiSettings?.animationsEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Earning Rules Card */}
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                                <DollarIcon className="w-4 h-4 text-yellow-500" />
                                                <h4 className="font-bold text-xs uppercase text-gray-600 dark:text-gray-300">{t.earnConfig}</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">{t.dailyLimit}</label><input type="number" value={settings.earnSettings?.dailyLimit} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, dailyLimit: Number(e.target.value) }})} className={inputClass} /></div>
                                                <div><label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">{t.rewardPerAd}</label><input type="number" value={settings.earnSettings?.rewardPerAd} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, rewardPerAd: Number(e.target.value) }})} className={inputClass} /></div>
                                                <div><label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">{t.cooldown} (s)</label><input type="number" value={settings.earnSettings?.adCooldownSeconds} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adCooldownSeconds: Number(e.target.value) }})} className={inputClass} /></div>
                                                <div><label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">{t.resetHours} (h)</label><input type="number" value={settings.earnSettings?.resetHours} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, resetHours: Number(e.target.value) }})} className={inputClass} /></div>
                                            </div>
                                        </div>

                                        {/* 5. Developer Card (Secure - HIDDEN BY DEFAULT) */}
                                        {showDevCard && (
                                            <div className="md:col-span-2 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30 relative overflow-hidden animate-smart-pop-in">
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <CodeIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                        <h4 className="font-bold text-xs uppercase text-red-700 dark:text-red-300">{t.devInfo}</h4>
                                                        {isDevUnlocked ? (
                                                            <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded font-bold border border-green-200 animate-pulse">UNLOCKED</span>
                                                        ) : (
                                                            <span className="bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded font-bold border border-red-200 flex items-center gap-1"><LockIcon className="w-3 h-3"/> LOCKED</span>
                                                        )}
                                                    </div>
                                                    
                                                    {isDevUnlocked ? (
                                                        <div className="animate-smart-slide-down">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                                                                <div><label className="block mb-1 text-gray-500">{t.devTitle}</label><input type="text" value={devSettings.title} onChange={(e) => setDevSettings({...devSettings, title: e.target.value})} className={inputClass} /></div>
                                                                <div><label className="block mb-1 text-gray-500">{t.devUrl}</label><input type="text" value={devSettings.url} onChange={(e) => setDevSettings({...devSettings, url: e.target.value})} className={inputClass} /></div>
                                                                <div><label className="block mb-1 text-gray-500">{t.devMsg}</label><input type="text" value={devSettings.message} onChange={(e) => setDevSettings({...devSettings, message: e.target.value})} className={inputClass} /></div>
                                                                <div><label className="block mb-1 text-gray-500">{t.devDesc}</label><input type="text" value={devSettings.description} onChange={(e) => setDevSettings({...devSettings, description: e.target.value})} className={inputClass} /></div>
                                                            </div>
                                                            <button onClick={handleSaveDeveloperInfo} className="w-full py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"><CheckIcon className="w-3 h-3" /> {t.updateDev}</button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 bg-white/50 dark:bg-black/20 rounded-lg border border-red-100 dark:border-red-900/20 backdrop-blur-sm">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">{t.devLocked}</p>
                                                            <button onClick={handleUnlockDevInfo} className="mx-auto px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 active:scale-95 transition-all text-xs flex items-center gap-2"><UnlockIcon className="w-3 h-3" /> {t.unlockDev}</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-3 font-bold text-sm rounded-xl shadow-md transition-all sticky bottom-20 z-20 ${isSettingsChanged ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{t.save} All Changes</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav for Admin */}
            <div className="fixed bottom-0 w-full bg-white dark:bg-dark-card border-t dark:border-gray-800 flex justify-around p-2 z-40 shadow-lg">
                {[
                    { id: 'dashboard', icon: DashboardIcon, label: t.dashboard },
                    { id: 'orders', icon: OrdersIcon, label: t.orders },
                    { id: 'deposits', icon: MoneyIcon, label: t.deposits },
                    { id: 'offers', icon: TagIcon, label: t.offers }, 
                    { id: 'tools', icon: MenuIcon, label: t.tools },
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === tab.id ? 'text-primary bg-primary/5' : 'text-gray-400'}`}
                    >
                        <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                        <span className="text-[9px] font-bold">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Modals */}
            {confirmDialog && (
                 <ConfirmationDialog 
                    title={confirmDialog.title} 
                    message={confirmDialog.message} 
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} 
                    onCancel={() => setConfirmDialog(null)} 
                    confirmText={t.confirmYes} 
                    cancelText={t.confirmNo} 
                />
            )}
            
            {/* Offer Modal */}
            {isOfferModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-2xl w-full max-w-sm">
                         <h3 className="text-lg font-bold mb-4">{editingOffer?.id ? t.edit : t.add} Offer ({offerType})</h3>
                         <form onSubmit={handleSaveOffer} className="space-y-3">
                            <input type="text" placeholder="Name" value={editingOffer?.name || ''} onChange={e => setEditingOffer({...editingOffer, name: e.target.value})} className={inputClass} />
                            {(offerType === 'diamond' || offerType === 'special') && (
                                <input type="number" placeholder="Diamonds" value={editingOffer?.diamonds || ''} onChange={e => setEditingOffer({...editingOffer, diamonds: e.target.value})} className={inputClass} />
                            )}
                            {offerType === 'special' && (
                                <input type="text" placeholder="Title (e.g. 100 Diamond 50 Taka)" value={editingOffer?.title || ''} onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} className={inputClass} />
                            )}
                            {offerType === 'special' && (
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={editingOffer?.isActive || false} onChange={e => setEditingOffer({...editingOffer, isActive: e.target.checked})} />
                                    <label>Active</label>
                                </div>
                            )}
                            {offerType === 'premium' && (
                                <input type="text" placeholder="Description" value={editingOffer?.description || ''} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} className={inputClass} />
                            )}
                            <input type="number" placeholder="Price" value={editingOffer?.price || ''} onChange={e => setEditingOffer({...editingOffer, price: e.target.value})} className={inputClass} />
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setIsOfferModalOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold">{t.save}</button>
                            </div>
                         </form>
                    </div>
                </div>
            )}
            
            {/* Method Modal */}
            {isMethodModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{editingMethodIndex !== null ? t.edit : t.add} Method</h3>
                        <form onSubmit={handleSaveMethod} className="space-y-3">
                            <input type="text" placeholder="Method Name" value={editingMethod?.name || ''} onChange={e => setEditingMethod({...editingMethod!, name: e.target.value})} className={inputClass} />
                            <input type="text" placeholder="Account Number" value={editingMethod?.accountNumber || ''} onChange={e => setEditingMethod({...editingMethod!, accountNumber: e.target.value})} className={inputClass} />
                            <input type="text" placeholder="Logo URL" value={editingMethod?.logo || ''} onChange={e => setEditingMethod({...editingMethod!, logo: e.target.value})} className={inputClass} />
                            <textarea placeholder="Instructions" value={editingMethod?.instructions || ''} onChange={e => setEditingMethod({...editingMethod!, instructions: e.target.value})} className={inputClass} />
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setIsMethodModalOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold">{t.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
             {isContactModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{editingContactIndex !== null ? t.edit : t.add} Contact</h3>
                        <form onSubmit={handleSaveContact} className="space-y-3">
                            <select value={editingContact?.type || 'phone'} onChange={e => setEditingContact({...editingContact, type: e.target.value})} className={inputClass}>
                                <option value="phone">Phone</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="telegram">Telegram</option>
                                <option value="email">Email</option>
                                <option value="video">Video</option>
                            </select>
                            <input type="text" placeholder="Title/Label" value={editingContact?.title || ''} onChange={e => setEditingContact({...editingContact, title: e.target.value})} className={inputClass} />
                            <input type="text" placeholder="Link/Number" value={editingContact?.link || ''} onChange={e => setEditingContact({...editingContact, link: e.target.value})} className={inputClass} />
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setIsContactModalOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold">{t.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Banner Modal */}
             {isBannerModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{t.editBanner}</h3>
                        <form onSubmit={handleSaveBanner} className="space-y-3">
                            <input type="text" placeholder="Image URL" value={tempBannerUrl} onChange={e => setTempBannerUrl(e.target.value)} className={inputClass} />
                            <input type="text" placeholder="Action URL" value={tempActionUrl} onChange={e => setTempActionUrl(e.target.value)} className={inputClass} />
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setIsBannerModalOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold">{t.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {isNotifModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Send Notification</h3>
                        {selectedUserIds.size > 0 && (
                            <div className="mb-3 p-2 bg-blue-50 text-blue-600 rounded text-xs font-bold text-center">
                                Sending to {selectedUserIds.size} selected users
                            </div>
                        )}
                        <form onSubmit={handleSendNotification} className="space-y-3">
                            <input type="text" placeholder="Title" value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} className={inputClass} />
                            <textarea placeholder="Message" value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} className={inputClass} rows={3} />
                            <select value={newNotif.type} onChange={e => setNewNotif({...newNotif, type: e.target.value as any})} className={inputClass}>
                                <option value="system">System</option>
                                <option value="offer">Offer</option>
                                <option value="bonus">Bonus</option>
                            </select>
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setIsNotifModalOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold">{t.send}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Security Modal */}
            {isSecurityModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-2xl w-full max-w-xs text-center">
                        <LockIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">{t.securityCheck}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t.enterKey}</p>
                        <form onSubmit={handleVerifySecurityKey}>
                            <input type="password" value={securityKeyInput} onChange={e => setSecurityKeyInput(e.target.value)} className={`${inputClass} text-center tracking-widest mb-4`} autoFocus />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsSecurityModalOpen(false)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">{t.unlock}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Balance Modal */}
            {balanceModalUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-2xl w-full max-w-xs">
                        <h3 className="text-lg font-bold mb-4">{balanceAction === 'add' ? t.addBalance : t.deductBalance}</h3>
                        <p className="text-sm text-gray-500 mb-2">User: <span className="font-bold">{balanceModalUser.name}</span></p>
                        <p className="text-sm text-gray-500 mb-4">Current: ৳{Math.floor(balanceModalUser.balance)}</p>
                        <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className={inputClass} placeholder="Amount" autoFocus />
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setBalanceModalUser(null)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">{t.cancel}</button>
                            <button onClick={handleBalanceUpdate} className={`flex-1 py-2 text-white rounded-xl text-xs font-bold ${balanceAction === 'add' ? 'bg-green-500' : 'bg-red-500'}`}>{balanceAction === 'add' ? t.add : 'Deduct'}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminScreen;
