import React, { useState, useEffect, FC, FormEvent, useMemo } from 'react';
import { User, Screen, Transaction, Purchase, AppSettings, Language, PaymentMethod, AppVisibility, Notification, DeveloperSettings, Banner } from '../types';
import { db } from '../firebase';
import { ref, update, onValue, get, remove, push, set, runTransaction } from 'firebase/database';
import { 
    APP_LOGO_URL,
    DEFAULT_AVATAR_URL,
    DEFAULT_APP_SETTINGS,
    PROTECTION_KEY
} from '../constants';

// Icons
const DashboardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const UsersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
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
const XIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SearchIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const CodeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>);
const UnlockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>);
const PlusIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const MinusIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const LinkIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
const ArrowUpIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>);
const ArrowDownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>);

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
        adMob: "AdMob (Future APK)",
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
        adCodeInstructions: "Paste your HTML/JS ad code here. It will appear at the bottom of the screen.",
    },
    bn: {
        dashboard: "ড্যাশবোর্ড",
        users: "ইউজার",
        orders: "অর্ডার",
        deposits: "ডিপোজিট",
        tools: "টুলস",
        offers: "অফার",
        wallet: "ওয়ালেট",
        graphics: "গ্রাফিক্স",
        notifications: "নোটিফিকেশন",
        contacts: "যোগাযোগ",
        ads: "অ্যাড ম্যানেজার",
        settings: "সেটিংস",
        totalUsers: "মোট ইউজার",
        totalDeposit: "মোট ডিপোজিট",
        pendingOrders: "পেন্ডিং অর্ডার",
        pendingDeposits: "পেন্ডিং ডিপোজিট",
        approve: "অনুমোদন",
        reject: "বাতিল",
        refund: "ফেরত",
        save: "সংরক্ষণ",
        cancel: "বাতিল",
        add: "যোগ করুন",
        edit: "এডিট",
        delete: "মুছুন",
        send: "পাঠান",
        appName: "অ্যাপের নাম",
        maintenance: "মেইনটেইনেন্স",
        notice: "নোটিশ মেসেজ",
        logout: "লগআউট",
        manageBalance: "ব্যালেন্স ম্যানেজ",
        addBalance: "টাকা যোগ",
        deductBalance: "টাকা কর্তন",
        amount: "পরিমাণ",
        bannerUrl: "ব্যানার লিংক",
        actionUrl: "ক্লিক অ্যাকশন লিংক",
        appLogo: "অ্যাপ লোগো লিংক",
        visibility: "দৃশ্যমানতা",
        appControl: "অ্যাপ এক্সেস এবং কন্ট্রোল",
        diamond: "ডায়মন্ড",
        levelUp: "লেভেল আপ",
        membership: "মেম্বারশিপ",
        premium: "প্রিমিয়াম অ্যাপ",
        earn: "আয়ের সেকশন",
        permissionDenied: "পারমিশন নেই। রুলস চেক করুন।",
        methodName: "পদ্ধতির নাম",
        accNum: "অ্যাকাউন্ট নম্বর",
        logo: "লোগো লিংক",
        instructions: "নির্দেশনা (ঐচ্ছিক)",
        notifTitle: "শিরোনাম",
        notifBody: "মেসেজ",
        notifType: "ধরন",
        confirmTitle: "আপনি কি নিশ্চিত?",
        confirmMsg: "এই কাজটি আর ফিরিয়ে আনা যাবে না।",
        confirmLogout: "আপনি কি নিশ্চিতভাবে লগআউট করতে চান?",
        confirmYes: "হ্যাঁ, নিশ্চিত",
        confirmNo: "না, বাতিল",
        contactLabel: "প্রদর্শন নাম",
        contactLink: "লিংক/নম্বর",
        contactType: "ধরন",
        earnConfig: "আয়ের নিয়মাবলী",
        adsConfig: "বিজ্ঞাপন কনফিগারেশন",
        dailyLimit: "দৈনিক অ্যাড লিমিট",
        rewardPerAd: "প্রতি অ্যাডের পুরস্কার (৳)",
        cooldown: "অপেক্ষা সময় (সেকেন্ড)",
        resetHours: "লকডাউন সময়কাল (ঘন্টা)",
        webAds: "ওয়েব বিজ্ঞাপন",
        adMob: "AdMob বিজ্ঞাপন",
        adUrl: "ওয়েব অ্যাড লিংক (YouTube / Link)",
        adDuration: "অ্যাড সময় (সেকেন্ড)",
        appId: "AdMob অ্যাপ আইডি",
        rewardId: "রিওয়ার্ড অ্যাড আইডি",
        bannerId: "ব্যানার অ্যাড আইডি",
        interstitialId: "ইন্টারস্টিশিয়াল অ্যাড আইডি",
        pending: "পেন্ডিং",
        completed: "সম্পন্ন",
        failed: "বাতিল",
        adTitle: "অ্যাডের নাম",
        adCode: "অ্যাড কোড (HTML/JS)",
        adStatus: "অবস্থা",
        preview: "প্রিভিউ",
        active: "চালু",
        inactive: "বন্ধ",
        searchUser: "ইউজার খুঁজুন...",
        searchOrder: "অর্ডার আইডি, ইউআইডি খুঁজুন...",
        searchTxn: "ট্রানজেকশন আইডি খুঁজুন...",
        devInfo: "ডেভেলপার তথ্য (সুরক্ষিত)",
        devTitle: "ডেভেলপার নাম",
        devUrl: "ডেভেলপার লিংক",
        devMsg: "ক্রেডিট মেসেজ",
        devDesc: "বিবরণ",
        updateDev: "সংরক্ষণ করুন",
        unlockDev: "আনলক এবং এডিট করুন",
        devLocked: "ডেভেলপার তথ্য লক করা হয়েছে",
        securityCheck: "নিরাপত্তা যাচাই",
        enterKey: "গোপন কী লিখুন",
        unlock: "আনলক",
        editBanner: "ব্যানার এডিট করুন",
        reorder: "অর্ডার পরিবর্তন",
        homeAdCode: "হোম স্ক্রিন অ্যাড কোড",
        earnAdCode: "আর্ন স্ক্রিন অ্যাড কোড",
        adCodeInstructions: "এখানে আপনার HTML/JS কোড পেস্ট করুন। এটি স্ক্রিনের নিচে দেখাবে।",
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
}

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
            {!iconOnly && <span className="font-mono text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[150px]">{label || text}</span>}
            {copied ? <CheckIcon className="w-3 h-3 text-green-500 flex-shrink-0" /> : <CopyIcon className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
        </button>
    );
};

// Reusable Search Input Component
const SearchInput: FC<{ value: string; onChange: (val: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
    <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow shadow-sm"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const AdminScreen: FC<AdminScreenProps> = ({ user, onNavigate, onLogout, language, setLanguage, appSettings }) => {
    // Navigation State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'offers' | 'orders' | 'deposits' | 'tools'>('dashboard');
    const [activeTool, setActiveTool] = useState<'users' | 'settings' | 'graphics' | 'wallet' | 'notifications' | 'contacts' | 'ads'>('users');
    
    // Filter States
    const [orderFilter, setOrderFilter] = useState<'Pending' | 'Completed' | 'Failed'>('Pending');
    const [depositFilter, setDepositFilter] = useState<'Pending' | 'Completed' | 'Failed'>('Pending');

    // Search States
    const [userSearch, setUserSearch] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [depositSearch, setDepositSearch] = useState('');

    // Data States
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Purchase[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    // Settings State
    const [settings, setSettings] = useState<AppSettings>(appSettings);
    const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(appSettings);
    
    // Developer Settings State (Separate for Security)
    const [devSettings, setDevSettings] = useState<DeveloperSettings>(DEFAULT_APP_SETTINGS.developerSettings!);
    const [isDevUnlocked, setIsDevUnlocked] = useState(false); // Security Lock State
    
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

    // Offer State
    const [offerType, setOfferType] = useState<'diamond' | 'levelUp' | 'membership' | 'premium'>('diamond');
    const [offersData, setOffersData] = useState<any>({ diamond: [], levelUp: [], membership: [], premium: [] });
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

    // Contacts State
    const [contacts, setContacts] = useState<any[]>([]);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Ads Manager State - NO LOCAL STATE, USE SETTINGS DIRECTLY

    // Balance Modal State
    const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');

    const t = ADMIN_TEXTS[language];

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

    // Fetch Data
    useEffect(() => {
        const fetchData = () => {
            // Normal Firebase Data Fetching
            onValue(ref(db, 'users'), (snap) => {
                if(snap.exists()) {
                    const uList: User[] = Object.values(snap.val());
                    setUsers(uList);
                }
            }, (error) => {
                if(error.message.includes("permission_denied")) setPermissionError(true);
            });

            onValue(ref(db, 'orders'), (snap) => {
                if(snap.exists()) {
                    let allOrders: Purchase[] = [];
                    snap.forEach(userOrders => {
                        const uOrders = userOrders.val();
                        Object.keys(uOrders).forEach(key => {
                            allOrders.push({ ...uOrders[key], key, userId: userOrders.key! });
                        });
                    });
                    setOrders(allOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else {
                    setOrders([]);
                }
            });

            onValue(ref(db, 'transactions'), (snap) => {
                if(snap.exists()) {
                    let allTxns: Transaction[] = [];
                    snap.forEach(userTxns => {
                        const uTxns = userTxns.val();
                        Object.keys(uTxns).forEach(key => {
                            allTxns.push({ ...uTxns[key], key, userId: userTxns.key! });
                        });
                    });
                    setTransactions(allTxns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else {
                    setTransactions([]);
                }
            });

            onValue(ref(db, 'notifications'), (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const list = Object.keys(data).map(key => ({ ...data[key], id: key })).reverse();
                    setNotifications(list);
                } else {
                    setNotifications([]);
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
                                // Ensure these fields exist and default to true if undefined
                                homeAdCode: data.appSettings.earnSettings?.homeAdCode || DEFAULT_APP_SETTINGS.earnSettings.homeAdCode,
                                homeAdActive: data.appSettings.earnSettings?.homeAdActive ?? true,
                                earnAdCode: data.appSettings.earnSettings?.earnAdCode || DEFAULT_APP_SETTINGS.earnSettings.earnAdCode,
                                earnAdActive: data.appSettings.earnSettings?.earnAdActive ?? true,
                            },
                        };
                        setSettings(mergedSettings);
                        setOriginalSettings(mergedSettings); 
                        if (data.appSettings.developerSettings) {
                            setDevSettings(data.appSettings.developerSettings);
                        }
                    }
                    if(data.offers) {
                        setOffersData({
                            diamond: data.offers.diamond ? Object.values(data.offers.diamond) : [],
                            levelUp: data.offers.levelUp ? Object.values(data.offers.levelUp) : [],
                            membership: data.offers.membership ? Object.values(data.offers.membership) : [],
                            premium: data.offers.premium ? Object.values(data.offers.premium) : [],
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
                    } else {
                        setPaymentMethods([]);
                    }
                    if (data.supportContacts) {
                        setContacts(Object.values(data.supportContacts));
                    } else {
                        setContacts([]);
                    }
                }
            });
        };
        fetchData();
    }, [user.uid]);

    // --- Derived State (Performance Optimized) ---
    const stats = useMemo(() => {
        return {
            users: users.length,
            deposit: transactions.filter(t => t.status === 'Completed').reduce((acc, curr) => acc + curr.amount, 0),
            pOrders: orders.filter(o => o.status === 'Pending').length,
            pDeposits: transactions.filter(t => t.status === 'Pending').length
        };
    }, [users, orders, transactions]);

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
        
        let finalSettings = { ...settings };
        
        // Parse YouTube Link logic
        const currentUrl = finalSettings.earnSettings?.webAds?.url || '';
        if (currentUrl) {
            // Parse for standard YouTube Watch or Share links to extract ID
            const ytMatch = currentUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([^&?]*))/);
            if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1];
                // Construct standard embed URL if a valid ID is found
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

        // Exclude developerSettings from this save to prevent accidental overwrite or bypass
        const { developerSettings, ...safeSettings } = finalSettings;
        await update(ref(db, 'config/appSettings'), safeSettings);
        setSettings(finalSettings); // Update local state with the transformed URL
        setOriginalSettings(finalSettings);
        alert(t.save + "d!");
    };

    // --- SECURE DEVELOPER INFO UNLOCK ---
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

    // --- SAVE DEVELOPER INFO (Then lock again) ---
    const handleSaveDeveloperInfo = async () => {
        try {
            await update(ref(db, 'config/appSettings/developerSettings'), devSettings);
            alert("Success: Developer Info Updated.");
            setIsDevUnlocked(false); // Auto-lock after saving
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
                // 1. Update Transaction Status
                await update(ref(db, `transactions/${txn.userId}/${txn.key}`), { status: action });
                
                if (action === 'Completed') {
                    const userRef = ref(db, `users/${txn.userId}`);
                    
                    // 2. Add Balance to User
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
    
    // --- REORDER OFFER LOGIC ---
    const handleReorderOffer = async (index: number, direction: 'up' | 'down') => {
        const currentList = [...offersData[offerType]];
        if (direction === 'up' && index > 0) {
            [currentList[index], currentList[index - 1]] = [currentList[index - 1], currentList[index]];
        } else if (direction === 'down' && index < currentList.length - 1) {
            [currentList[index], currentList[index + 1]] = [currentList[index + 1], currentList[index]];
        } else {
            return;
        }
        
        // Optimistic update
        setOffersData({ ...offersData, [offerType]: currentList });
        
        // Save to DB
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

    const handleSendNotification = async (e: FormEvent) => { e.preventDefault(); await push(ref(db, 'notifications'), { ...newNotif, timestamp: Date.now() }); setNewNotif({ title: '', message: '', type: 'system' }); setIsNotifModalOpen(false); };
    const handleDeleteNotification = (id: string) => requestConfirmation(async () => { await remove(ref(db, `notifications/${id}`)); });

    const handleAddBanner = async () => { if(!newBannerUrl) return; const updatedBanners = [...banners, { imageUrl: newBannerUrl, actionUrl: newActionUrl }]; await set(ref(db, 'config/banners'), updatedBanners); setNewBannerUrl(''); setNewActionUrl(''); };
    const handleDeleteBanner = (index: number) => requestConfirmation(async () => { const updatedBanners = banners.filter((_, i) => i !== index); await set(ref(db, 'config/banners'), updatedBanners); });
    
    // Banner Edit Handlers
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
                <h2 className="text-2xl font-bold mb-2">{t.permissionDenied}</h2>
            </div>
        );
    }

    const inputClass = "w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none transition-all";

    // --- UI RENDER START ---
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 pb-24 font-sans">
            {/* ... Header ... */}
            <div className="bg-white dark:bg-dark-card shadow-sm p-4 flex justify-between items-center sticky top-0 z-30">
                <div><h1 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ADMIN CONTROL</h1></div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')} className="text-[10px] font-bold px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 uppercase">{language === 'en' ? 'BN' : 'EN'}</button>
                    <button onClick={handleLogoutClick} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 active:scale-95 transition-transform"><LockIcon className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto">
                {/* ... Dashboard Tab ... */}
                {activeTab === 'dashboard' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border-l-4 border-l-primary"><div className="flex items-center gap-2 mb-2 text-primary"><UsersIcon className="w-5 h-5" /><span className="font-bold text-xs uppercase tracking-wider">{t.totalUsers}</span></div><p className="text-3xl font-black">{stats.users}</p></div>
                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border-l-4 border-l-green-500"><div className="flex items-center gap-2 mb-2 text-green-500"><MoneyIcon className="w-5 h-5" /><span className="font-bold text-xs uppercase tracking-wider">{t.totalDeposit}</span></div><p className="text-3xl font-black">৳{stats.deposit}</p></div>
                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border-l-4 border-l-orange-500"><div className="flex items-center gap-2 mb-2 text-orange-500"><OrdersIcon className="w-5 h-5" /><span className="font-bold text-xs uppercase tracking-wider">{t.pendingOrders}</span></div><p className="text-3xl font-black">{stats.pOrders}</p></div>
                            <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border-l-4 border-l-purple-500"><div className="flex items-center gap-2 mb-2 text-purple-500"><MoneyIcon className="w-5 h-5" /><span className="font-bold text-xs uppercase tracking-wider">{t.pendingDeposits}</span></div><p className="text-3xl font-black">{stats.pDeposits}</p></div>
                        </div>
                        <div>
                            <h3 className="font-bold mb-3 text-lg opacity-80">Quick Jump</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setActiveTab('orders'); setOrderFilter('Pending'); }} className="p-4 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 flex flex-col items-center gap-1"><OrdersIcon className="w-6 h-6"/><span>Manage Orders</span></button>
                                <button onClick={() => { setActiveTab('deposits'); setDepositFilter('Pending'); }} className="p-4 bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex flex-col items-center gap-1"><WalletIcon className="w-6 h-6"/><span>Verify Deposits</span></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ... Offers Tab ... */}
                {activeTab === 'offers' && (
                    <div className="animate-fade-in">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                            {['diamond', 'levelUp', 'membership', 'premium'].map((type) => (
                                <button key={type} onClick={() => setOfferType(type as any)} className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase whitespace-nowrap transition-colors border ${offerType === type ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'text-gray-500 border-gray-200'}`}>{t[type as keyof typeof t] || type}</button>
                            ))}
                        </div>
                        <button onClick={openAddOfferModal} className="w-full py-3 mb-4 border-2 border-dashed border-primary text-primary bg-primary/5 rounded-xl font-bold hover:bg-primary/10 transition-colors">+ {t.add} Offer</button>
                        <div className="grid grid-cols-2 gap-3">
                            {offersData[offerType]?.map((offer: any, index: number) => (
                                <div key={offer.id} className="relative p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="bg-white dark:bg-dark-card w-8 h-8 rounded-full flex items-center justify-center mb-2 shadow-sm text-primary font-bold text-xs">
                                            {offerType === 'diamond' && <DiamondIcon className="w-5 h-5" />}
                                            {offerType === 'levelUp' && <StarIcon className="w-5 h-5" />}
                                            {offerType === 'membership' && <IdCardIcon className="w-5 h-5" />}
                                            {offerType === 'premium' && <CrownIcon className="w-5 h-5" />}
                                        </div>
                                        <p className="font-bold text-sm leading-tight mb-1">{offer.name || `${offer.diamonds} Diamonds`}</p>
                                        <p className="text-xs text-gray-500">{offerType === 'diamond' ? `${offer.diamonds} DM` : 'Package'}</p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t dark:border-gray-700 flex justify-between items-center">
                                        <span className="font-black text-primary">৳{offer.price}</span>
                                        <div className="flex gap-1">
                                            {/* Reorder Buttons */}
                                            <button onClick={() => handleReorderOffer(index, 'up')} disabled={index === 0} className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-30"><ArrowUpIcon className="w-3 h-3"/></button>
                                            <button onClick={() => handleReorderOffer(index, 'down')} disabled={index === offersData[offerType].length - 1} className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-30"><ArrowDownIcon className="w-3 h-3"/></button>
                                            
                                            <button onClick={() => { setEditingOffer(offer); setIsOfferModalOpen(true); }} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 ml-1"><EditIcon className="w-3 h-3"/></button>
                                            <button onClick={() => handleDeleteOffer(offer.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><TrashIcon className="w-3 h-3"/></button>
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
                        <SearchInput value={orderSearch} onChange={setOrderSearch} placeholder={t.searchOrder} />
                        <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl">
                            {(['Pending', 'Completed', 'Failed'] as const).map(status => (
                                <button key={status} onClick={() => setOrderFilter(status)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderFilter === status ? 'bg-white dark:bg-dark-card shadow-sm text-primary' : 'text-gray-500'}`}>{t[status.toLowerCase() as keyof typeof t] || status}</button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {filteredOrders.length === 0 ? <div className="text-center py-10 text-gray-400">No orders found</div> : filteredOrders.map(order => (
                                <div key={order.key} className={`bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border-l-4 ${order.status === 'Pending' ? 'border-l-yellow-500' : order.status === 'Completed' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div><span className="font-bold text-lg block">{order.offer.diamonds || order.offer.name}</span><span className="text-xs text-gray-400 font-mono">{new Date(order.date).toLocaleString()}</span></div>
                                        <div className="text-right"><span className="font-bold text-primary text-lg">৳{order.offer.price}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs"><p className="text-gray-400 mb-1">Player UID</p><SmartCopy text={order.uid} /></div>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs"><p className="text-gray-400 mb-1">Order ID</p><SmartCopy text={order.id} /></div>
                                    </div>
                                    {order.status === 'Pending' && <div className="flex gap-2 mt-2"><button onClick={() => handleOrderAction(order, 'Completed')} className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-green-600 active:scale-95 transition-all">{t.approve}</button><button onClick={() => handleOrderAction(order, 'Failed')} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-red-600 active:scale-95 transition-all">{t.reject}</button></div>}
                                    {order.status === 'Failed' && <div className="text-xs text-red-500 font-bold mt-2">Refunded to User</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ... Deposits Tab ... */}
                {activeTab === 'deposits' && (
                    <div className="space-y-4 animate-fade-in">
                        <SearchInput value={depositSearch} onChange={setDepositSearch} placeholder={t.searchTxn} />
                        <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl">
                            {(['Pending', 'Completed', 'Failed'] as const).map(status => (
                                <button key={status} onClick={() => setDepositFilter(status)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${depositFilter === status ? 'bg-white dark:bg-dark-card shadow-sm text-primary' : 'text-gray-500'}`}>{t[status.toLowerCase() as keyof typeof t] || status}</button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {filteredTransactions.length === 0 ? <div className="text-center py-10 text-gray-400">No deposits found</div> : filteredTransactions.map(txn => (
                                <div key={txn.key} className={`bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border-l-4 ${txn.status === 'Pending' ? 'border-l-yellow-500' : txn.status === 'Completed' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="flex justify-between mb-3">
                                        <div><span className="font-bold text-base block">{txn.method}</span><span className="text-xs text-gray-400">{new Date(txn.date).toLocaleString()}</span></div>
                                        <div className="text-right"><span className="font-bold text-green-600 block text-lg">+৳{txn.amount}</span></div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs mb-3 flex justify-between items-center"><span className="text-gray-500">TrxID:</span><SmartCopy text={txn.transactionId} label={txn.transactionId} /></div>
                                    {txn.status === 'Pending' && <div className="flex gap-2"><button onClick={() => handleTxnAction(txn, 'Completed')} className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-green-600 active:scale-95 transition-all">{t.approve}</button><button onClick={() => handleTxnAction(txn, 'Failed')} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-red-600 active:scale-95 transition-all">{t.reject}</button></div>}
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
                                { id: 'graphics', label: t.graphics, icon: ImageIcon },
                                { id: 'ads', label: t.ads, icon: MegaphoneIcon },
                                { id: 'notifications', label: t.notifications, icon: BellIcon },
                                { id: 'contacts', label: t.contacts, icon: ContactIcon },
                                { id: 'settings', label: t.settings, icon: SettingsIcon },
                            ].map(tool => (
                                <button key={tool.id} onClick={() => setActiveTool(tool.id as any)} className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl transition-all border ${activeTool === tool.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white dark:bg-dark-card text-gray-500 border-transparent'}`}><tool.icon className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold uppercase">{tool.label}</span></button>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm min-h-[300px]">
                            
                            {/* USERS TOOL */}
                            {activeTool === 'users' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h2 className="text-lg font-bold mb-2">User Management</h2>
                                    <SearchInput value={userSearch} onChange={setUserSearch} placeholder={t.searchUser} />
                                    {filteredUsers.length === 0 && <p className="text-gray-400 text-center text-sm py-4">No users found.</p>}
                                    {filteredUsers.slice(0, 50).map(u => ( // Limit rendering for performance
                                        <div key={u.uid} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <img src={u.avatarUrl || DEFAULT_AVATAR_URL} alt={u.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0" />
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <p className="font-bold text-sm truncate">{u.name}</p>
                                                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-gray-700/30 p-1.5 rounded mt-1 border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-600 dark:text-gray-300 break-all leading-tight">{u.email}</p><SmartCopy text={u.email} iconOnly={true} /></div>
                                                    <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">UID</span><SmartCopy text={u.uid} label={u.uid} /></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-gray-700/30 p-2 rounded-lg border border-gray-200 dark:border-gray-700/50">
                                                <div><p className="text-[10px] text-gray-500 uppercase font-bold">Wallet</p><p className="text-lg font-black text-primary truncate max-w-[150px]">৳{Math.floor(u.balance)}</p></div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setBalanceModalUser(u); setBalanceAction('add'); setBalanceAmount(''); }} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 active:scale-95 transition-transform"><PlusIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => { setBalanceModalUser(u); setBalanceAction('deduct'); setBalanceAmount(''); }} className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 active:scale-95 transition-transform"><MinusIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredUsers.length > 50 && <p className="text-center text-xs text-gray-400 mt-2">Showing 50 of {filteredUsers.length} users. Refine search.</p>}
                                </div>
                            )}

                            {/* WALLET TOOL */}
                            {activeTool === 'wallet' && (
                                <div>
                                    <button onClick={openAddMethodModal} className="w-full py-3 mb-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800">+ Add Wallet</button>
                                    <div className="space-y-3">
                                        {paymentMethods.map((method, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="flex items-center gap-3"><img src={method.logo} className="w-8 h-8 object-contain bg-white rounded p-0.5" /><div><p className="font-bold text-sm">{method.name}</p><SmartCopy text={method.accountNumber} /></div></div>
                                                <div className="flex gap-2"><button onClick={() => openEditMethodModal(method, index)} className="p-1.5 bg-blue-100 text-blue-600 rounded"><EditIcon className="w-4 h-4"/></button><button onClick={() => handleDeleteMethod(index)} className="p-1.5 bg-red-100 text-red-600 rounded"><TrashIcon className="w-4 h-4"/></button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* NEW ADS MANAGER TOOL */}
                            {activeTool === 'ads' && (
                                <div>
                                    <h4 className="font-bold text-sm mb-3 uppercase text-purple-600">{t.adsConfig}</h4>
                                    
                                    {/* Home Screen Ads */}
                                    <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">{t.homeAdCode}</label>
                                            
                                            {/* Toggle Switch */}
                                            <div 
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    earnSettings: {
                                                        ...settings.earnSettings!,
                                                        homeAdActive: !settings.earnSettings!.homeAdActive
                                                    }
                                                })}
                                                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.earnSettings?.homeAdActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${settings.earnSettings?.homeAdActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
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
                                            className={`${inputClass} font-mono text-xs h-32 mb-2`} 
                                            placeholder={t.adCodeInstructions}
                                        />
                                        <p className="text-[10px] text-gray-400">This ad will appear at the bottom of the Home screen.</p>
                                    </div>

                                    {/* Earn Screen Ads */}
                                    <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">{t.earnAdCode}</label>
                                            
                                            {/* Toggle Switch */}
                                            <div 
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    earnSettings: {
                                                        ...settings.earnSettings!,
                                                        earnAdActive: !settings.earnSettings!.earnAdActive
                                                    }
                                                })}
                                                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.earnSettings?.earnAdActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${settings.earnSettings?.earnAdActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
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
                                            className={`${inputClass} font-mono text-xs h-32 mb-2`} 
                                            placeholder={t.adCodeInstructions}
                                        />
                                        <p className="text-[10px] text-gray-400">This ad will appear at the bottom of the Watch Ads screen.</p>
                                    </div>

                                    <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-3 font-bold rounded-xl shadow-md transition-all ${isSettingsChanged ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{t.save}</button>
                                </div>
                            )}

                            {/* GRAPHICS TOOL */}
                            {activeTool === 'graphics' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold mb-2 text-sm uppercase text-gray-500">{t.appLogo}</h3>
                                        <div className="flex gap-3"><img src={settings.logoUrl || APP_LOGO_URL} className="w-12 h-12 rounded-full border" /><input type="text" value={settings.logoUrl || ''} onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} className={inputClass} placeholder="Image URL" /></div>
                                        <button onClick={handleUpdateLogo} className="mt-2 text-xs bg-primary text-white px-3 py-1 rounded font-bold">Update Logo</button>
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-2 text-sm uppercase text-gray-500">Banners</h3>
                                        <div className="flex gap-2 mb-3">
                                            <input type="text" value={newBannerUrl} onChange={(e) => setNewBannerUrl(e.target.value)} className={inputClass} placeholder="Image URL" />
                                            <input type="text" value={newActionUrl} onChange={(e) => setNewActionUrl(e.target.value)} className={inputClass} placeholder="Action URL (Optional)" />
                                            <button onClick={handleAddBanner} className="bg-green-500 text-white px-3 rounded font-bold text-xs">{t.add}</button>
                                        </div>
                                        <div className="space-y-2">
                                            {banners.map((banner, index) => (
                                                <div key={index} className="relative h-24 rounded-lg overflow-hidden group">
                                                    <img src={banner.imageUrl} className="w-full h-full object-cover" />
                                                    {banner.actionUrl && (
                                                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                                                            <LinkIcon className="w-3 h-3"/> Link
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditBannerModal(index, banner)} className="bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700">
                                                            <EditIcon className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => handleDeleteBanner(index)} className="bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700">
                                                            <TrashIcon className="w-3 h-3"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SETTINGS TOOL */}
                            {activeTool === 'settings' && (
                                <div className="space-y-5">
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold uppercase text-gray-500">{t.appName}</label>
                                        <input type="text" value={settings.appName} onChange={(e) => setSettings({...settings, appName: e.target.value})} className={inputClass} />
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-4">
                                            <h4 className="font-bold text-sm mb-3 uppercase text-primary">{t.appControl}</h4>
                                            <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700"><span className="font-bold text-sm">{t.maintenance}</span><div onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-4' : ''}`}></div></div></div>
                                            <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">{t.visibility}</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.keys(settings.visibility || {}).map((key) => (
                                                    <div key={key} className="flex justify-between items-center p-2 bg-white dark:bg-dark-card rounded border border-transparent hover:border-primary/30 transition-colors"><span className="capitalize text-xs font-bold">{t[key as keyof typeof t] || key}</span><div onClick={() => setSettings({...settings, visibility: {...settings.visibility!, [key]: !settings.visibility![key as keyof AppVisibility]}})} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.visibility![key as keyof AppVisibility] ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.visibility![key as keyof AppVisibility] ? 'translate-x-4' : ''}`}></div></div></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* EARNING RULES (Global) */}
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-sm mb-3 uppercase text-gray-600 dark:text-gray-300">{t.earnConfig}</h4>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div><label className="block mb-1 text-gray-500">{t.dailyLimit}</label><input type="number" value={settings.earnSettings?.dailyLimit} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, dailyLimit: Number(e.target.value) }})} className={inputClass} /></div>
                                            <div><label className="block mb-1 text-gray-500">{t.rewardPerAd}</label><input type="number" value={settings.earnSettings?.rewardPerAd} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, rewardPerAd: Number(e.target.value) }})} className={inputClass} /></div>
                                            <div><label className="block mb-1 text-gray-500">{t.cooldown}</label><input type="number" value={settings.earnSettings?.adCooldownSeconds} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adCooldownSeconds: Number(e.target.value) }})} className={inputClass} /></div>
                                            <div><label className="block mb-1 text-gray-500">{t.resetHours}</label><input type="number" value={settings.earnSettings?.resetHours} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, resetHours: Number(e.target.value) }})} className={inputClass} /></div>
                                        </div>
                                    </div>

                                    {/* ADS CONFIGURATION (Hybrid) - Still kept for backward compat or if needed */}
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-sm mb-3 uppercase text-purple-600">Video/Reward Ads</h4>
                                        
                                        {/* SYSTEM 1: WEB ADS */}
                                        <div className="mb-4 bg-white dark:bg-dark-card p-3 rounded-lg border border-blue-200 dark:border-blue-900/30 shadow-sm">
                                            <div className="flex justify-between items-center mb-2 border-b pb-2 border-gray-100 dark:border-gray-700">
                                                <h5 className="text-xs font-bold text-blue-600 uppercase">{t.webAds}</h5>
                                                <div onClick={() => setSettings({
                                                    ...settings, 
                                                    earnSettings: { 
                                                        ...settings.earnSettings!, 
                                                        webAds: { ...settings.earnSettings!.webAds, active: !settings.earnSettings!.webAds.active },
                                                    }
                                                })} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.webAds?.active ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.earnSettings?.webAds?.active ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                            </div>
                                            <div className={`space-y-2 text-xs transition-opacity ${settings.earnSettings?.webAds?.active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                                <div>
                                                    <label className="block mb-1 text-gray-500">{t.adUrl}</label>
                                                    <input 
                                                        type="text" 
                                                        value={settings.earnSettings?.webAds?.url || ''} 
                                                        onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, webAds: { ...settings.earnSettings!.webAds, url: e.target.value } }})} 
                                                        className={inputClass} 
                                                        placeholder="https://... (YouTube or MP4)" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-gray-500">{t.adDuration}</label>
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

                                    {/* DEVELOPER INFO SECTION (SECURE) */}
                                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30 relative overflow-hidden transition-all">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                            <LockIcon className="w-24 h-24 text-red-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CodeIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                <h4 className="font-bold text-sm uppercase text-red-700 dark:text-red-300">{t.devInfo}</h4>
                                                {isDevUnlocked ? (
                                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold border border-green-200 animate-pulse">UNLOCKED</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold border border-red-200 flex items-center gap-1"><LockIcon className="w-3 h-3"/> LOCKED</span>
                                                )}
                                            </div>
                                            
                                            {isDevUnlocked ? (
                                                <div className="animate-smart-slide-down">
                                                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                                        <div>
                                                            <label className="block mb-1 text-gray-500">{t.devTitle}</label>
                                                            <input 
                                                                type="text" 
                                                                value={devSettings.title} 
                                                                onChange={(e) => setDevSettings({...devSettings, title: e.target.value})} 
                                                                className={inputClass} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block mb-1 text-gray-500">{t.devUrl}</label>
                                                            <input 
                                                                type="text" 
                                                                value={devSettings.url} 
                                                                onChange={(e) => setDevSettings({...devSettings, url: e.target.value})} 
                                                                className={inputClass} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block mb-1 text-gray-500">{t.devMsg}</label>
                                                            <input 
                                                                type="text" 
                                                                value={devSettings.message} 
                                                                onChange={(e) => setDevSettings({...devSettings, message: e.target.value})} 
                                                                className={inputClass} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block mb-1 text-gray-500">{t.devDesc}</label>
                                                            <input 
                                                                type="text" 
                                                                value={devSettings.description} 
                                                                onChange={(e) => setDevSettings({...devSettings, description: e.target.value})} 
                                                                className={inputClass} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={handleSaveDeveloperInfo}
                                                        className="w-full py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                                                    >
                                                        <CheckIcon className="w-3 h-3" /> {t.updateDev}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 bg-white/50 dark:bg-black/20 rounded-lg border border-red-100 dark:border-red-900/20 backdrop-blur-sm">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">{t.devLocked}</p>
                                                    <div className="flex flex-wrap gap-2 justify-center text-[10px] text-gray-400 mb-3 opacity-60">
                                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{devSettings.title}</span>
                                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{devSettings.url}</span>
                                                    </div>
                                                    <button 
                                                        onClick={handleUnlockDevInfo}
                                                        className="mx-auto px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 active:scale-95 transition-all text-xs flex items-center gap-2"
                                                    >
                                                        <UnlockIcon className="w-3 h-3" /> {t.unlockDev}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-3 font-bold rounded-xl shadow-md transition-all ${isSettingsChanged ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{t.save}</button>
                                </div>
                            )}

                            {/* NOTIFICATIONS & CONTACTS TOOL */}
                            {activeTool === 'notifications' && (
                                <div>
                                    <button onClick={() => setIsNotifModalOpen(true)} className="w-full py-3 mb-4 bg-purple-100 text-purple-600 rounded-xl font-bold">+ Send Notif</button>
                                    <div className="space-y-2">
                                        {notifications.map(n => (
                                            <div key={n.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between">
                                                <div><p className="font-bold text-sm">{n.title}</p><p className="text-xs text-gray-500">{n.message}</p></div>
                                                <button onClick={() => handleDeleteNotification(n.id)} className="text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeTool === 'contacts' && (
                                <div>
                                    <button onClick={openAddContactModal} className="w-full py-3 mb-4 bg-blue-50 text-blue-600 rounded-xl font-bold">+ Add Contact</button>
                                    <div className="space-y-2">
                                        {contacts.map((c, i) => (
                                            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between">
                                                <div><p className="font-bold text-sm">{c.title || c.labelKey}</p><p className="text-xs text-gray-500">{c.type}</p></div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditContactModal(c, i)} className="text-blue-500"><EditIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteContact(i)} className="text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                        <tab.icon className={`w-6 h-6 mb-1 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                        <span className="text-[10px] font-bold">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* --- Modals (Mobile Optimized: flex col, max-h-screen, overflow-y-auto) --- */}
            {confirmDialog && confirmDialog.show && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-xs p-6 rounded-2xl shadow-2xl animate-smart-pop-in text-center border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-xl mb-2">{confirmDialog.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300">{t.confirmNo}</button>
                            <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20">{t.confirmYes}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Security Modal (Replaces Native Prompt) */}
            {isSecurityModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[65] p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-card w-full max-w-xs p-6 rounded-2xl shadow-2xl animate-smart-pop-in text-center border border-red-200 dark:border-red-900/30">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LockIcon className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-bold text-xl mb-1 text-gray-800 dark:text-white">{t.securityCheck}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Authorized Personnel Only</p>
                        
                        <form onSubmit={handleVerifySecurityKey}>
                            <input 
                                type="password" 
                                autoFocus
                                value={securityKeyInput}
                                onChange={(e) => setSecurityKeyInput(e.target.value)}
                                className={`${inputClass} text-center font-bold tracking-widest mb-4`}
                                placeholder={t.enterKey}
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsSecurityModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/30">{t.unlock}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Offer Modal */}
            {isOfferModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm p-6 rounded-2xl shadow-xl animate-smart-pop-in flex flex-col max-h-[85vh]">
                        <h3 className="font-bold text-lg mb-4">{editingOffer?.id ? t.edit : t.add} Offer</h3>
                        <form onSubmit={handleSaveOffer} className="space-y-3 flex-1 overflow-y-auto">
                            {offerType !== 'diamond' && (
                                <div><label className="text-xs font-bold uppercase text-gray-500">Name</label><input required value={editingOffer?.name || ''} onChange={e => setEditingOffer({...editingOffer, name: e.target.value})} className={inputClass} /></div>
                            )}
                            {offerType === 'diamond' && (
                                <div><label className="text-xs font-bold uppercase text-gray-500">Diamonds</label><input required type="number" value={editingOffer?.diamonds || ''} onChange={e => setEditingOffer({...editingOffer, diamonds: e.target.value})} className={inputClass} /></div>
                            )}
                            <div><label className="text-xs font-bold uppercase text-gray-500">Price</label><input required type="number" value={editingOffer?.price || ''} onChange={e => setEditingOffer({...editingOffer, price: e.target.value})} className={inputClass} /></div>
                            {offerType === 'premium' && (
                                <div><label className="text-xs font-bold uppercase text-gray-500">Description</label><input value={editingOffer?.description || ''} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} className={inputClass} /></div>
                            )}
                            <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setIsOfferModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold">{t.cancel}</button><button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">{t.save}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Wallet Modal */}
            {isMethodModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm p-6 rounded-2xl shadow-xl animate-smart-pop-in flex flex-col max-h-[85vh]">
                        <h3 className="font-bold text-lg mb-4">{editingMethodIndex !== null ? t.edit : t.add} Wallet</h3>
                        <form onSubmit={handleSaveMethod} className="space-y-3 flex-1 overflow-y-auto">
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.methodName}</label><input required value={editingMethod?.name || ''} onChange={e => setEditingMethod({...editingMethod!, name: e.target.value})} className={inputClass} /></div>
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.accNum}</label><input required value={editingMethod?.accountNumber || ''} onChange={e => setEditingMethod({...editingMethod!, accountNumber: e.target.value})} className={inputClass} /></div>
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.logo}</label><input required value={editingMethod?.logo || ''} onChange={e => setEditingMethod({...editingMethod!, logo: e.target.value})} className={inputClass} placeholder="Image URL" /></div>
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.instructions}</label><textarea value={editingMethod?.instructions || ''} onChange={e => setEditingMethod({...editingMethod!, instructions: e.target.value})} className={inputClass} rows={3} /></div>
                            <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setIsMethodModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold">{t.cancel}</button><button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">{t.save}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Banner Modal */}
            {isBannerModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm p-6 rounded-2xl shadow-xl animate-smart-pop-in">
                        <h3 className="font-bold text-lg mb-4">{t.editBanner}</h3>
                        <form onSubmit={handleSaveBanner} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">{t.bannerUrl}</label>
                                <input 
                                    required 
                                    value={tempBannerUrl} 
                                    onChange={(e) => setTempBannerUrl(e.target.value)} 
                                    className={inputClass} 
                                    placeholder="Image URL" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">{t.actionUrl}</label>
                                <input 
                                    value={tempActionUrl} 
                                    onChange={(e) => setTempActionUrl(e.target.value)} 
                                    className={inputClass} 
                                    placeholder="https://... (Optional)" 
                                />
                            </div>
                            {tempBannerUrl && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-24 w-full">
                                    <img src={tempBannerUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex gap-2 mt-4 pt-2">
                                <button type="button" onClick={() => setIsBannerModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold text-gray-700">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">{t.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {isNotifModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm p-6 rounded-2xl shadow-xl animate-smart-pop-in flex flex-col max-h-[85vh]">
                        <h3 className="font-bold text-lg mb-4">Send Notification</h3>
                        <form onSubmit={handleSendNotification} className="space-y-3 flex-1 overflow-y-auto">
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.notifTitle}</label><input required value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} className={inputClass} /></div>
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.notifBody}</label><textarea required value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} className={inputClass} rows={3} /></div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">{t.notifType}</label>
                                <div className="flex gap-2 mt-1">
                                    {['system', 'bonus', 'offer'].map(type => (
                                        <button type="button" key={type} onClick={() => setNewNotif({...newNotif, type: type as any})} className={`px-3 py-1 rounded-lg text-xs font-bold border capitalize ${newNotif.type === type ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{type}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setIsNotifModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold">{t.cancel}</button><button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">{t.send}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {isContactModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm p-6 rounded-2xl shadow-xl animate-smart-pop-in">
                        <h3 className="font-bold text-lg mb-4">{editingContactIndex !== null ? t.edit : t.add} Contact</h3>
                        <form onSubmit={handleSaveContact} className="space-y-3">
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.contactLabel}</label><input required value={editingContact?.title || ''} onChange={e => setEditingContact({...editingContact!, title: e.target.value})} className={inputClass} /></div>
                            <div><label className="text-xs font-bold uppercase text-gray-500">{t.contactLink}</label><input required value={editingContact?.link || ''} onChange={e => setEditingContact({...editingContact!, link: e.target.value})} className={inputClass} placeholder="https://... or tel:..." /></div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">{t.contactType}</label>
                                <select value={editingContact?.type || 'phone'} onChange={e => setEditingContact({...editingContact!, type: e.target.value})} className={inputClass}>
                                    <option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="email">Email</option><option value="video">Video</option>
                                </select>
                            </div>
                            <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setIsContactModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold">{t.cancel}</button><button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold">{t.save}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Balance Modal */}
            {balanceModalUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-card w-full max-w-xs p-6 rounded-2xl shadow-xl animate-smart-pop-in text-center flex flex-col max-h-[85vh]">
                        <h3 className="font-bold text-lg mb-1">{t.manageBalance}</h3>
                        <p className="text-sm text-gray-500 mb-4">For: {balanceModalUser.name}</p>
                        <p className="text-2xl font-black mb-4 text-primary">৳{Math.floor(balanceModalUser.balance)}</p>
                        <input type="number" placeholder="Enter amount" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} className={`${inputClass} text-center font-bold text-lg mb-4`} />
                        <button 
                            onClick={handleBalanceUpdate} 
                            className={`py-3 ${balanceAction === 'add' ? 'bg-green-500 shadow-green-500/30' : 'bg-red-500 shadow-red-500/30'} text-white rounded-xl font-bold shadow-lg`}
                        >
                            {balanceAction === 'add' ? t.addBalance : t.deductBalance}
                        </button>
                        <button onClick={() => setBalanceModalUser(null)} className="mt-4 text-gray-400 text-sm hover:text-gray-600">Close</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminScreen;