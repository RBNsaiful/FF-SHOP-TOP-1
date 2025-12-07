

import type { FC } from 'react';

export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark';
export type Screen = 'home' | 'wallet' | 'profile' | 'myOrders' | 'myTransaction' | 'contactUs' | 'changePassword' | 'watchAds' | 'editProfile' | 'notifications' | 'admin' | 'aiChat';

export interface User {
  name: string;
  email: string;
  balance: number;
  uid: string; // Firebase Auth UID
  playerUid?: string; // Free Fire UID (Game ID)
  avatarUrl?: string;
  totalAdsWatched: number;
  totalEarned: number;
  role?: 'user' | 'admin';
  isBanned?: boolean;
  aiRequestCount?: number; // New: Tracks number of AI interactions
  adsWatchedInfo?: {
      count: number;
      lastAdTimestamp?: number;
      limitReachedAt?: number; // Timestamp when daily limit was reached
  };
}

export interface Banner {
  id?: string;
  imageUrl: string;
  actionUrl?: string;
}

export interface DiamondOffer {
  id: number;
  diamonds: number;
  price: number;
  name?: string;
}

export interface LevelUpPackage {
  id: number;
  name: string;
  price: number;
}

export interface Membership {
  id: number;
  name: string;
  price: number;
}

export interface PremiumApp {
  id: number;
  name: string;
  price: number;
  description?: string;
}

export interface SpecialOffer {
  id: number;
  name: string; // Internal name (e.g. Winter Offer)
  title: string; // Display title (e.g. 100 Diamond 50 Taka)
  price: number;
  diamonds: number;
  isActive: boolean;
}

export interface GenericOffer {
  id: number;
  name: string;
  price: number;
  icon?: FC<{ className?: string }>;
  diamonds?: number;
  inputType?: 'uid' | 'email';
}

export interface PaymentMethod {
  name:string;
  logo: string;
  accountNumber: string;
  instructions?: string;
}

export interface SupportContact {
  type: 'phone' | 'whatsapp' | 'telegram' | 'email' | 'video';
  labelKey: string;
  link: string;
}

export type PurchaseStatus = 'Completed' | 'Pending' | 'Failed';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Purchase {
  id: string;
  key?: string;
  offer: DiamondOffer | GenericOffer;
  date: string;
  status: PurchaseStatus;
  uid: string;
  userId: string; // To verify ownership
}

export interface Transaction {
  id:string;
  key?: string;
  amount: number;
  date: string;
  method: string;
  status: TransactionStatus;
  userId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'bonus' | 'offer' | 'system';
}

export interface AppVisibility {
  diamonds: boolean;
  levelUp: boolean;
  membership: boolean;
  premium: boolean;
  earn: boolean;
}

// HYBRID AD SYSTEM SETTINGS
export interface EarnSettings {
    // Global Settings
    dailyLimit: number;
    rewardPerAd: number;
    adCooldownSeconds: number;
    resetHours: number;

    // System A: Web Ads (Popup/Video)
    webAds: {
        active: boolean;
        url: string; // Video or Web URL
        duration: number; // Watch time in seconds
    };

    // System B: AdMob (For APK)
    adMob: {
        active: boolean;
        appId: string; // App ID for initialization
        rewardId: string;
        interstitialId?: string;
        bannerId?: string;
    };

    // New Footer Ads
    homeAdCode?: string;
    homeAdActive?: boolean; // Control visibility for Home Ads
    earnAdCode?: string;
    earnAdActive?: boolean; // Control visibility for Earn Ads
    
    // Profile Pages Footer Ads
    profileAdCode?: string;
    profileAdActive?: boolean;
}

export interface DeveloperSettings {
    title: string;
    url: string;
    message: string;
    description: string;
}

export interface UiSettings {
    cardSize: 'small' | 'medium' | 'large';
    animationsEnabled: boolean;
}

export interface AppSettings {
  appName: string;
  maintenanceMode: boolean;
  aiSupportActive?: boolean; // NEW: AI Support Toggle
  aiApiKey?: string; // NEW: Custom API Key for AI
  aiName?: string; // NEW: Custom AI Name
  notice?: string;
  logoUrl?: string;
  visibility?: AppVisibility;
  earnSettings?: EarnSettings;
  developerSettings?: DeveloperSettings;
  uiSettings?: UiSettings;
}