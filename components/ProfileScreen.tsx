
// ... (Imports remain the same)
import React, { useState, FC } from 'react';
import type { User, Screen, Theme, Language, AppSettings } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';


interface ProfileScreenProps {
  user: User;
  texts: any;
  onLogout: () => void;
  setActiveScreen: (screen: Screen) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  appSettings?: AppSettings;
}

// ... (Icons remain the same)
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const PowerIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><path d="M12 2v10"/></svg>);
const MyOrdersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>);
const MyTransactionIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>);
const AddMoneyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);
const ContactUsIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>);
const ChevronRightIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>);
const KeyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>);
const EditIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const ShieldIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const TrophyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>);

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


const MenuItem: FC<{ icon: FC<{className?: string}>, label: string, action: () => void, index: number }> = ({ icon: Icon, label, action, index }) => {
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const id = Date.now();

        const newRipple = { x, y, id };
        setRipples(prev => [...prev, newRipple]);

        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 600); 

        setTimeout(() => {
            action();
        }, 200); 
    };

    return (
        <div 
            className="p-[1px] bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-xl shadow-sm hover:shadow-primary/10 transition-shadow opacity-0 animate-smart-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <button
                onClick={handleClick}
                className="relative overflow-hidden w-full flex items-center p-3.5 bg-light-card dark:bg-dark-card rounded-[10px] text-left transition-transform duration-150 active:scale-[0.98]"
            >
                {ripples.map(ripple => (
                    <span
                        key={ripple.id}
                        className="absolute bg-primary/20 dark:bg-white/10 rounded-full animate-ripple pointer-events-none"
                        style={{
                            left: ripple.x,
                            top: ripple.y,
                            width: '1px',
                            height: '1px',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}
                <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg mr-3.5 shadow-md">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm flex-grow text-light-text dark:text-dark-text">{label}</span>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </button>
        </div>
    );
};

const ConfirmationDialog: FC<{ title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText: string; cancelText: string; }> = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-smart-fade-in">
        <div className="bg-light-card dark:bg-dark-card rounded-2xl p-6 w-full max-w-xs animate-smart-pop-in shadow-xl">
            <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <div className="flex space-x-2">
                <button
                    onClick={onCancel}
                    className="w-full bg-gray-200 dark:bg-gray-700 text-light-text dark:text-dark-text font-bold py-3 rounded-lg hover:opacity-80 transition-opacity"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);


const ProfileScreen: FC<ProfileScreenProps> = ({ user, texts, onLogout, setActiveScreen, theme, setTheme, language, setLanguage, appSettings }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    const menuItems = [
        { label: texts.myOrders, icon: MyOrdersIcon, action: () => setActiveScreen('myOrders') },
        { label: texts.myTransaction, icon: MyTransactionIcon, action: () => setActiveScreen('myTransaction') },
        { label: texts.addFunds, icon: AddMoneyIcon, action: () => setActiveScreen('wallet') },
        { label: texts.contactUs, icon: ContactUsIcon, action: () => setActiveScreen('contactUs') },
        { label: texts.changePassword, icon: KeyIcon, action: () => setActiveScreen('changePassword') }
    ];

    // Add Ranking if Enabled
    if (appSettings?.visibility?.ranking !== false) {
        menuItems.splice(3, 0, { label: texts.ranking, icon: TrophyIcon, action: () => setActiveScreen('ranking') });
    }

    // REMOVED ADMIN BUTTON: Admins are now auto-redirected by App.tsx router.
    // If they somehow land here, they are treated as users to prevent mixed UI states.

    const devInfo = appSettings?.developerSettings || {
        message: "Developed by",
        title: "RBN Saiful",
        url: "http://rbm-saiful-contact.vercel.app",
        description: ""
    };

    return (
    <div className="animate-smart-fade-in bg-gradient-to-b from-primary to-secondary dark:from-primary-dark dark:to-secondary-dark pb-20 min-h-full">
      <div className="w-full">
        <div className="p-4 space-y-4">
            <div className="relative animate-smart-slide-up" style={{ animationDelay: '0ms' }}>
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-3xl blur-lg opacity-30 dark:opacity-50"></div>
                
                <div className="relative bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/30 p-6 rounded-3xl shadow-lg flex flex-col items-center text-center text-white">
                    <button 
                        onClick={() => setActiveScreen('editProfile')}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Edit Profile"
                    >
                        <EditIcon className="w-5 h-5 text-white/80" />
                    </button>
                    
                    <div className="relative mb-4 animate-smart-pop-in" style={{ animationDelay: '100ms' }}>
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-secondary to-primary rounded-full blur opacity-75"></div>
                        <img 
                            src={user.avatarUrl || DEFAULT_AVATAR_URL} 
                            alt={user.name}
                            className="relative w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-md"
                        />
                    </div>

                    <h2 className="font-bold text-xl truncate drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] animate-smart-slide-up" style={{ animationDelay: '200ms' }}>
                        {user.name}
                    </h2>
                    <p className="text-sm text-white/70 mt-1 truncate drop-shadow-sm animate-smart-slide-up" style={{ animationDelay: '300ms' }}>
                        {user.email}
                    </p>
                    {user.role === 'admin' && (
                        <span className="mt-2 px-3 py-1 bg-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">Administrator</span>
                    )}
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-md p-3 animate-smart-slide-up" style={{ animationDelay: '400ms' }}>
                <div className="space-y-2.5">
                    {menuItems.map((item, index) => (
                        <MenuItem key={item.label} label={item.label} icon={item.icon} action={item.action} index={index} />
                    ))}
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-md p-5 animate-smart-slide-up" style={{ animationDelay: '500ms' }}>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                    {texts.profileSettings}
                </h3>
                
                <div className="mb-5">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ease-out ${
                                language === 'en'
                                    ? 'bg-primary/5 border-primary shadow-[0_4px_14px_0_rgba(124,58,237,0.15)]'
                                    : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <span className="text-xl mr-3">🇺🇸</span>
                                <div className="flex flex-col items-start">
                                    <span className={`font-bold text-sm ${language === 'en' ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>English</span>
                                </div>
                            </div>
                            {language === 'en' && (
                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.6)] animate-pulse"></div>
                            )}
                        </button>

                        <button
                            onClick={() => setLanguage('bn')}
                            className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ease-out ${
                                language === 'bn'
                                    ? 'bg-primary/5 border-primary shadow-[0_4px_14px_0_rgba(124,58,237,0.15)]'
                                    : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <span className="text-xl mr-3">🇧🇩</span>
                                <div className="flex flex-col items-start">
                                    <span className={`font-bold text-sm ${language === 'bn' ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>বাংলা</span>
                                </div>
                            </div>
                             {language === 'bn' && (
                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.6)] animate-pulse"></div>
                            )}
                        </button>
                    </div>
                </div>
                
                <div className="w-full h-px bg-gray-100 dark:bg-gray-700/50 my-4"></div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                         <div className={`p-2.5 rounded-xl transition-colors duration-300 ${
                             theme === 'dark' ? 'bg-gray-800 text-indigo-400' : 'bg-orange-50 text-orange-500'
                         }`}>
                            {theme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-light-text dark:text-dark-text text-sm">{texts.theme}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {theme === 'dark' ? texts.dark : texts.light}
                            </span>
                         </div>
                    </div>

                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ease-out focus:outline-none shadow-inner ${
                            theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                        }`}
                        aria-label="Toggle Theme"
                    >
                        <div
                            className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) flex items-center justify-center ${
                                theme === 'dark' 
                                    ? 'translate-x-6 bg-primary text-white' 
                                    : 'translate-x-0 bg-white text-yellow-500'
                            }`}
                        >
                             {theme === 'dark' ? (
                                <MoonIcon className="w-3.5 h-3.5" />
                            ) : (
                                <SunIcon className="w-3.5 h-3.5" />
                            )}
                        </div>
                    </button>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-md mt-4 opacity-0 animate-smart-slide-up" style={{ animationDelay: '600ms' }}>
                <div className="p-1">
                    <button onClick={handleLogoutClick} className="w-full flex items-center p-3 rounded-lg text-left transition-colors text-red-500 hover:bg-red-500/10 group">
                        <div className="p-2 bg-red-500/10 rounded-lg mr-4">
                            <PowerIcon className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="font-medium text-sm">{texts.logout}</span>
                    </button>
                </div>
            </div>

            {/* Developer Credit - Fixed & Permanent */}
            <div className="mt-6 text-center pb-8 border-t border-gray-200 dark:border-gray-800 pt-4">
                <p className="text-[10px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-widest">
                    {devInfo.message} <a href={devInfo.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary hover:underline transition-colors">{devInfo.title}</a>
                </p>
                {devInfo.description && <p className="text-[9px] text-gray-400 mt-1">{devInfo.description}</p>}
            </div>

            {showLogoutConfirm && (
                <ConfirmationDialog
                    title={texts.logoutConfirmTitle}
                    message={texts.logoutConfirmMessage}
                    onConfirm={handleConfirmLogout}
                    onCancel={() => setShowLogoutConfirm(false)}
                    confirmText={texts.logoutConfirmButton}
                    cancelText={texts.cancel}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
