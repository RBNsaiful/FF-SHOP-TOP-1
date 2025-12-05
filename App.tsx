import React, { useState, useEffect, useMemo, FC } from 'react';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/ProfileScreen';
import WalletScreen from './components/WalletScreen';
import MyOrdersScreen from './components/MyOrdersScreen';
import MyTransactionScreen from './components/MyTransactionScreen';
import ContactUsScreen from './components/ContactUsScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import WatchAdsScreen from './components/WatchAdsScreen';
import EditProfileScreen from './components/EditProfileScreen';
import NotificationScreen from './components/NotificationScreen';
import AdminScreen from './components/AdminScreen'; 
import BottomNav from './components/BottomNav';
import RewardAnimation from './components/RewardAnimation';
import { TEXTS, DIAMOND_OFFERS as initialDiamondOffers, LEVEL_UP_PACKAGES as initialLevelUpPackages, MEMBERSHIPS as initialMemberships, PREMIUM_APPS as initialPremiumApps, APP_LOGO_URL, DEFAULT_APP_SETTINGS, PAYMENT_METHODS as initialPaymentMethods, BANNER_IMAGES as initialBanners, SUPPORT_CONTACTS as initialContacts } from './constants';
import type { User, Language, Theme, Screen, DiamondOffer, LevelUpPackage, Membership, PremiumApp, Notification, AppSettings, PaymentMethod, SupportContact, AdUnit, Banner } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const ArrowLeftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
const WalletHeaderIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
        <path d="M16 10h6v4h-6z" />
    </svg>
);
const BellIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const MaintenanceIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);

interface HeaderProps {
    appName: string;
    screen: Screen;
    texts: any;
    onBack: () => void;
    user: User | null;
    onNavigate: (screen: Screen) => void;
    isBalancePulsing: boolean;
    onBalancePulseEnd: () => void;
    hasUnreadNotifications: boolean;
}

const Header: FC<HeaderProps> = ({ appName, screen, texts, onBack, user, onNavigate, isBalancePulsing, onBalancePulseEnd, hasUnreadNotifications }) => {
    const isSubScreen = (['myOrders', 'myTransaction', 'contactUs', 'wallet', 'changePassword', 'watchAds', 'editProfile', 'notifications'] as Screen[]).includes(screen);
    const titleMap: { [key in Screen]?: string } = {
        myOrders: texts.myOrders,
        myTransaction: texts.myTransaction,
        contactUs: texts.contactUs,
        wallet: texts.navWallet,
        changePassword: texts.changePasswordTitle,
        watchAds: texts.watchAdsScreenTitle,
        editProfile: texts.editProfileTitle,
        notifications: texts.notifications, 
    };

    // Hide Header on Admin AND Profile screens
    if (screen === 'admin' || screen === 'profile') return null;

    // Desktop Nav Link Component
    const DesktopNavLink = ({ target, label }: { target: Screen, label: string }) => (
        <button 
            onClick={() => onNavigate(target)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${screen === target ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            {label}
        </button>
    );

    if (isSubScreen) {
        if (screen === 'watchAds') {
            return (
                <header className="sticky top-0 z-20 h-16 bg-transparent md:bg-light-bg md:dark:bg-dark-bg md:border-b md:border-gray-200 md:dark:border-gray-800">
                     <div className="hidden md:flex items-center justify-between h-full px-6 max-w-7xl mx-auto w-full">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{texts.watchAdsScreenTitle}</h1>
                        </div>
                        {user && (
                            <div className="flex items-center space-x-3">
                                <button onClick={() => onNavigate('wallet')} className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-4 py-1.5 rounded-full text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
                                    <WalletHeaderIcon className="w-4 h-4" />
                                    <span>{Math.floor(user.balance)}{texts.currency}</span>
                                </button>
                            </div>
                        )}
                     </div>
                </header>
            );
        }
        
        const isNotificationScreen = screen === 'notifications';
        
        return (
            <header className="bg-light-bg dark:bg-dark-bg p-4 flex items-center justify-between sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-gray-800 transition-colors shadow-sm md:px-8">
                <div className="flex-1 flex justify-start items-center gap-4">
                    <button onClick={onBack} className="text-gray-500 dark:text-gray-400 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card transition-colors">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </button>
                    {/* Desktop Breadcrumbs */}
                    <div className="hidden md:flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        <span onClick={() => onNavigate('home')} className="hover:text-primary cursor-pointer">Home</span>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 dark:text-white">{titleMap[screen]}</span>
                    </div>
                </div>
                <h1 className={`text-center truncate absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0
                    ${isNotificationScreen 
                        ? 'text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-wide uppercase' 
                        : 'text-lg font-semibold text-light-text dark:text-dark-text'
                    }
                `}>
                    {titleMap[screen]}
                </h1>
                <div className="flex-1 flex justify-end">
                     <div className="hidden md:block">
                        {user && (
                            <button onClick={() => onNavigate('wallet')} className="flex items-center space-x-2 text-primary font-bold px-3 py-1 rounded-full hover:bg-primary/5 transition-colors border border-primary/20">
                                <WalletHeaderIcon className="w-5 h-5" />
                                <span>{Math.floor(user.balance)}{texts.currency}</span>
                            </button>
                        )}
                     </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-light-bg dark:bg-dark-bg p-4 md:px-8 flex items-center justify-between sticky top-0 z-20 h-16 shadow-sm border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-8">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_2px_5px_rgba(124,58,237,0.3)] cursor-pointer" onClick={() => onNavigate('home')}>
                    {appName}
                </h1>

                {/* Desktop Navigation */}
                {user && (
                    <div className="hidden md:flex items-center space-x-2">
                        <DesktopNavLink target="home" label={texts.navHome} />
                        <DesktopNavLink target="wallet" label={texts.navWallet} />
                        <DesktopNavLink target="watchAds" label={texts.navEarn} />
                        <DesktopNavLink target="profile" label={texts.navProfile} />
                    </div>
                )}
            </div>
            
            {user && (
                <div className="flex items-center space-x-4">
                     <button onClick={() => onNavigate('notifications')} className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Notifications">
                        <BellIcon className="w-6 h-6" />
                        {hasUnreadNotifications && (<span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>)}
                    </button>
                    <button onClick={() => onNavigate('wallet')} className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-5 py-2 rounded-full text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/30" data-testid="header-wallet-button">
                        <WalletHeaderIcon className="w-6 h-6" />
                        <span onAnimationEnd={onBalancePulseEnd} className={isBalancePulsing ? 'animate-balance-pulse' : ''}>{Math.floor(user.balance)}{texts.currency}</span>
                    </button>

                    {/* Desktop Mini Profile */}
                    <div onClick={() => onNavigate('profile')} className="hidden md:block w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary transition-colors">
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                </div>
            )}
        </header>
    );
};


const App: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme | null) || 'light');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language | null) || 'en');
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  
  // Dynamic Data States - Initialize from LocalStorage if available to prevent flashing old data
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('cachedAppSettings');
      return saved ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_APP_SETTINGS;
  });
  
  const [diamondOffers, setDiamondOffers] = useState<DiamondOffer[]>(initialDiamondOffers);
  const [levelUpPackages, setLevelUpPackages] = useState<LevelUpPackage[]>(initialLevelUpPackages);
  const [memberships, setMemberships] = useState<Membership[]>(initialMemberships);
  const [premiumApps, setPremiumApps] = useState<PremiumApp[]>(initialPremiumApps);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>(initialContacts);
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);

  const [isBalancePulsing, setIsBalancePulsing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  
  const [showRewardAnim, setShowRewardAnim] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

  // Fetch App Config & Content
  useEffect(() => {
      const configRef = ref(db, 'config');
      const unsubscribeConfig = onValue(configRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              if (data.appSettings) {
                  setAppSettings(prev => {
                      const newSettings = {
                          ...prev,
                          ...data.appSettings,
                          visibility: { ...prev.visibility, ...(data.appSettings.visibility || {}) },
                          earnSettings: { 
                              ...DEFAULT_APP_SETTINGS.earnSettings, 
                              ...prev.earnSettings, 
                              ...(data.appSettings.earnSettings || {}),
                              webAds: { ...DEFAULT_APP_SETTINGS.earnSettings.webAds, ...(data.appSettings.earnSettings?.webAds || {}) },
                              adMob: { ...DEFAULT_APP_SETTINGS.earnSettings.adMob, ...(data.appSettings.earnSettings?.adMob || {}) }
                          },
                          developerSettings: {
                              ...DEFAULT_APP_SETTINGS.developerSettings,
                              ...(data.appSettings.developerSettings || {})
                          }
                      };
                      
                      // Cache immediately to prevent flashing on next reload
                      localStorage.setItem('cachedAppSettings', JSON.stringify(newSettings));
                      
                      return newSettings;
                  });
              }
              if (data.offers) {
                  if (data.offers.diamond) setDiamondOffers(Object.values(data.offers.diamond));
                  if (data.offers.levelUp) setLevelUpPackages(Object.values(data.offers.levelUp));
                  if (data.offers.membership) setMemberships(Object.values(data.offers.membership));
                  if (data.offers.premium) setPremiumApps(Object.values(data.offers.premium));
              }
              if (data.paymentMethods) setPaymentMethods(Object.values(data.paymentMethods));
              if (data.banners) {
                  const rawBanners = Object.values(data.banners);
                  // Ensure backwards compatibility with old string[] banners
                  const formattedBanners = rawBanners.map((b: any) => 
                      typeof b === 'string' ? { imageUrl: b, actionUrl: '' } : b
                  );
                  setBanners(formattedBanners);
              }
              if (data.supportContacts) setSupportContacts(Object.values(data.supportContacts));
              if (data.adUnits) setAdUnits(Object.values(data.adUnits));
              else setAdUnits([]);
          }
      }, (error) => {
          console.error("Config fetch error:", error);
      });
      return () => unsubscribeConfig();
  }, []);

  // Auth & Data Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            const userRef = ref(db, 'users/' + firebaseUser.uid);
            const unsubscribeData = onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const userData = { ...data, uid: firebaseUser.uid, playerUid: data.playerUid || '', role: data.role || 'user', isBanned: data.isBanned || false };
                    setUser(userData);
                    if (userData.role === 'admin') setActiveScreen('admin');
                } else {
                    setUser({ name: firebaseUser.displayName || 'User', email: firebaseUser.email || '', balance: 0, uid: firebaseUser.uid, playerUid: '', avatarUrl: firebaseUser.photoURL || undefined, totalAdsWatched: 0, totalEarned: 0, role: 'user', isBanned: false });
                }
                setLoading(false);
            }, (error) => {
                console.error("User data fetch error:", error);
                setLoading(false);
            });
            return () => unsubscribeData();
        } else {
            setUser(null);
            setLoading(false);
        }
    });
    return () => unsubscribeAuth();
  }, []);

  // Notifications Listener
  useEffect(() => {
      const notifRef = ref(db, 'notifications');
      const unsubscribeNotifs = onValue(notifRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const notifList: Notification[] = Object.keys(data).map(key => ({ ...data[key], id: key })).sort((a, b) => b.timestamp - a.timestamp);
              setNotifications(notifList);
              const lastReadTimestamp = Number(localStorage.getItem('lastReadTimestamp') || 0);
              const hasNew = notifList.some(n => n.timestamp > lastReadTimestamp);
              setHasUnreadNotifications(hasNew);
          } else {
              setNotifications([]);
              setHasUnreadNotifications(false);
          }
      });
      return () => unsubscribeNotifs();
  }, []);

  useEffect(() => {
      if (activeScreen === 'watchAds' && appSettings.visibility && !appSettings.visibility.earn) {
          setActiveScreen('home');
      }
  }, [activeScreen, appSettings.visibility]);

  const handleMarkNotificationsAsRead = () => {
      if (notifications.length > 0) {
          const latestTimestamp = notifications[0].timestamp;
          localStorage.setItem('lastReadTimestamp', latestTimestamp.toString());
          setHasUnreadNotifications(false);
      }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    document.querySelector('body')?.classList.add('font-sans');
  }, [theme]);
  
  useEffect(() => { localStorage.setItem('language', language); }, [language]);
  
  useEffect(() => {
    const handleBalanceUpdate = () => { setIsBalancePulsing(true); };
    document.addEventListener('balance-updated', handleBalanceUpdate);
    return () => { document.removeEventListener('balance-updated', handleBalanceUpdate); };
  }, []);

  const handleLogout = async () => {
    try { setUser(null); setActiveScreen('home'); await signOut(auth); } catch (error) { console.error("Logout failed", error); setUser(null); setActiveScreen('home'); }
  };
  
  const handleRewardEarned = (amount: number, showAnim: boolean = true) => { 
      setEarnedAmount(amount); 
      if (showAnim) {
          setShowRewardAnim(true); 
      }
      setIsBalancePulsing(true); 
  };
  const handlePurchase = (price: number) => { setIsBalancePulsing(true); };

  const texts = useMemo(() => TEXTS[language], [language]);
  const handleBack = () => {
      if (activeScreen === 'wallet' || activeScreen === 'notifications') { setActiveScreen('home'); } else if((['myOrders', 'myTransaction', 'contactUs', 'changePassword', 'editProfile'] as Screen[]).includes(activeScreen)) { setActiveScreen('profile'); } else if (activeScreen === 'admin') { setActiveScreen('profile'); }
  }
  const handleSuccessNavigate = (screen: Screen) => { setActiveScreen(screen); };

  if (loading) return (<div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>);

  if (!user) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-gray-100 dark:bg-gray-900 font-sans">
        <div className="w-full max-w-md min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text relative shadow-2xl overflow-x-hidden flex items-center justify-center p-4">
            <AuthScreen 
                texts={texts} 
                appName={appSettings.appName} 
                logoUrl={appSettings.logoUrl || APP_LOGO_URL} 
            />
        </div>
      </div>
    );
  }

  if (appSettings.maintenanceMode && user.role !== 'admin') {
      return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-6 text-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse"><MaintenanceIcon className="w-12 h-12 text-red-500" /></div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Under Maintenance</h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">{appSettings.notice || "We are currently updating our servers to provide you with a better experience. You are logged in, but services are temporarily unavailable."}</p>
              <button onClick={handleLogout} className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Logout</button>
          </div>
      )
  }

  if (user.isBanned) {
      return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 p-6 text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Account Suspended</h1>
              <p className="text-gray-600 dark:text-gray-400">Your account has been suspended for violating our terms.</p>
              <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Logout</button>
          </div>
      )
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home': return <HomeScreen user={user} texts={texts} onPurchase={handlePurchase} diamondOffers={diamondOffers} levelUpPackages={levelUpPackages} memberships={memberships} premiumApps={premiumApps} onNavigate={handleSuccessNavigate} bannerImages={banners} visibility={appSettings.visibility} adUnits={adUnits} />;
      case 'wallet': return <WalletScreen user={user} texts={texts} onNavigate={handleSuccessNavigate} paymentMethods={paymentMethods} />;
      case 'profile': return <ProfileScreen user={user} texts={texts} onLogout={handleLogout} setActiveScreen={setActiveScreen} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} appSettings={appSettings} />;
      case 'myOrders': return <MyOrdersScreen user={user} texts={texts} />;
      case 'myTransaction': return <MyTransactionScreen user={user} texts={texts} />;
      case 'contactUs': return <ContactUsScreen texts={texts} contacts={supportContacts} />;
      case 'changePassword': return <ChangePasswordScreen texts={texts} onPasswordChanged={() => setActiveScreen('profile')} />;
      case 'watchAds': 
        if (appSettings.visibility && !appSettings.visibility.earn) return null; 
        return <WatchAdsScreen user={user} texts={texts} onRewardEarned={handleRewardEarned} earnSettings={appSettings.earnSettings} />;
      case 'editProfile': return <EditProfileScreen user={user} texts={texts} onNavigate={setActiveScreen} />;
      case 'notifications': return <NotificationScreen texts={texts} notifications={notifications} onRead={handleMarkNotificationsAsRead} />;
      case 'admin':
          if (user.role !== 'admin') return <HomeScreen user={user} texts={texts} onPurchase={handlePurchase} diamondOffers={diamondOffers} levelUpPackages={levelUpPackages} memberships={memberships} premiumApps={premiumApps} onNavigate={handleSuccessNavigate} bannerImages={banners} visibility={appSettings.visibility} adUnits={adUnits} />;
          return <AdminScreen user={user} texts={texts} onNavigate={handleSuccessNavigate} onLogout={handleLogout} language={language} setLanguage={setLanguage} appSettings={appSettings} />;
      default: return <HomeScreen user={user} texts={texts} onPurchase={handlePurchase} diamondOffers={diamondOffers} levelUpPackages={levelUpPackages} memberships={memberships} premiumApps={premiumApps} onNavigate={handleSuccessNavigate} bannerImages={banners} visibility={appSettings.visibility} adUnits={adUnits} />;
    }
  };

  const isFullScreenPage = activeScreen === 'profile' || activeScreen === 'watchAds' || activeScreen === 'admin';

  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-100 dark:bg-gray-900 font-sans">
        {/* Expanded Container for Desktop */}
        <div className="w-full max-w-md md:max-w-7xl min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text relative shadow-2xl overflow-x-hidden transition-all duration-300 ease-in-out">
            <Header appName={appSettings.appName} screen={activeScreen} texts={texts} onBack={handleBack} user={user} onNavigate={setActiveScreen} isBalancePulsing={isBalancePulsing} onBalancePulseEnd={() => setIsBalancePulsing(false)} hasUnreadNotifications={hasUnreadNotifications} />
            
            <div className={!isFullScreenPage ? 'pb-24 md:pb-10' : ''}>
                {/* Center Sub-screens on Desktop */}
                <div className={`h-full w-full ${['wallet', 'profile', 'changePassword', 'editProfile', 'contactUs', 'myOrders', 'myTransaction', 'notifications'].includes(activeScreen) ? 'md:max-w-3xl md:mx-auto md:mt-6' : ''}`}>
                    {renderScreen()}
                </div>
            </div>
            
            {activeScreen !== 'admin' && (<BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} texts={texts} earnEnabled={appSettings.visibility?.earn ?? true} />)}
            {showRewardAnim && (<RewardAnimation amount={earnedAmount} texts={texts} onAnimationEnd={() => setShowRewardAnim(false)} />)}
        </div>
    </div>
  );
};

export default App;