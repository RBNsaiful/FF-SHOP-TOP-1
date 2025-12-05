import type { FC } from 'react';

export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark';
export type Screen = 'home' | 'wallet' | 'profile' | 'myOrders' | 'myTransaction' | 'contactUs' | 'changePassword' | 'watchAds' | 'editProfile' | 'notifications' | 'admin';

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
  adsWatchedInfo?: {
      count: number;
      lastAdTimestamp?: number;
      limitReachedAt?: number; // Timestamp when daily limit was reached
  };
  // Referral System Fields
  referralCode?: string; // Own code (usually UID)
  referredBy?: string; // UID of the person who referred this user
  isReferralRewardClaimed?: boolean; // Has the referrer been paid yet?
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

export interface AdUnit {
    id: string;
    title: string;
    code: string; // HTML/Script code
    active: boolean;
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

    // System A: Web Ads
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
}

export interface DeveloperSettings {
    title: string;
    url: string;
    message: string;
    description: string;
}

export interface ReferralSettings {
    bonusAmount: number; // Amount referrer gets
    minDepositRequired: number; // Minimum first deposit to trigger reward
    active: boolean;
}

export interface AppSettings {
  appName: string;
  maintenanceMode: boolean;
  notice?: string;
  logoUrl?: string;
  visibility?: AppVisibility;
  earnSettings?: EarnSettings;
  developerSettings?: DeveloperSettings;
  referralSettings?: ReferralSettings;
}