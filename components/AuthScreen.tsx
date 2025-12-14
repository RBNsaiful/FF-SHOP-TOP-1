
import React, { useState, FC, FormEvent, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, linkWithCredential, AuthCredential } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, set, get, update } from 'firebase/database';

interface AuthScreenProps {
  texts: any;
  appName: string;
  logoUrl: string;
  onLoginAttempt: () => void;
}

// Icons
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const EyeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x="1" y1="1" x2="23" y2="23"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const LinkIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
const AlertIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);

const Spinner: FC = () => (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>);

const AuthScreen: React.FC<AuthScreenProps> = ({ texts, appName, logoUrl, onLoginAttempt }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [nameFieldError, setNameFieldError] = useState('');
  const [emailFieldError, setEmailFieldError] = useState('');
  const [passFieldError, setPassFieldError] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- ACCOUNT LINKING STATE ---
  const [isLinking, setIsLinking] = useState(false);
  const [pendingCred, setPendingCred] = useState<AuthCredential | null>(null);
  const [linkingEmail, setLinkingEmail] = useState('');

  useEffect(() => {
      const storedError = sessionStorage.getItem('auth_error');
      if (storedError) {
          setError(storedError);
          sessionStorage.removeItem('auth_error'); 
          setLoading(false); 
      }
      setPersistence(auth, browserLocalPersistence).catch(console.error);
  }, []);

  // Bengali Friendly Error Messages
  const getErrorMessage = (code: string, message: string) => {
      console.log("Auth Error:", code, message);
      switch (code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
          case 'auth/invalid-login-credentials':
              return "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।";
          case 'auth/too-many-requests':
              return "অতিরিক্ত ভুল চেষ্টার কারণে এই ডিভাইসটি সাময়িকভাবে ব্লক করা হয়েছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
          case 'auth/user-disabled':
              return "এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। সাপোর্টে যোগাযোগ করুন।";
          case 'auth/credential-already-in-use':
              return "এই Google অ্যাকাউন্টটি ইতিমধ্যে অন্য একটি ইউজারের সাথে যুক্ত আছে।";
          case 'auth/email-already-in-use':
              return "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা আছে। লগইন করার চেষ্টা করুন।";
          case 'auth/network-request-failed':
              return "ইন্টারনেট সংযোগ চেক করুন।";
          default:
              return message || "লগইন করা সম্ভব হয়নি। আবার চেষ্টা করুন।";
      }
  };

  // Validation
  const validateNameRule = (val: string): boolean => { return val.length >= 3 && val.length <= 20; };
  const validateEmailRule = (val: string): boolean => { return /\S+@\S+\.\S+/.test(val); };
  const validatePasswordRule = (val: string): boolean => { return val.length >= 6; };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { setName(e.target.value); setNameFieldError(''); };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setEmailFieldError(''); };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setPassFieldError(''); };
  const handleConfirmPassChange = (e: React.ChangeEvent<HTMLInputElement>) => { setConfirmPassword(e.target.value); setPassFieldError(''); };

  const handleNameBlur = () => { if (!isLogin && !validateNameRule(name)) setNameFieldError("Name must be 3-20 characters"); };
  const handleEmailBlur = () => { if (email.length > 0 && !validateEmailRule(email)) setEmailFieldError("Invalid Email"); };
  const handlePasswordBlur = () => { if (password.length > 0 && !validatePasswordRule(password)) setPassFieldError("Password must be at least 6 chars"); else if (!isLogin && confirmPassword.length > 0 && password !== confirmPassword) setPassFieldError("Passwords do not match"); };

  const isNameValid = isLogin ? true : validateNameRule(name);
  const isEmailValid = validateEmailRule(email);
  const isPasswordValid = validatePasswordRule(password);
  const isConfirmValid = isLogin ? true : password === confirmPassword;
  const isFormValid = isNameValid && isEmailValid && isPasswordValid && isConfirmValid;

  // --- 1. GOOGLE LOGIN (DETECTION & LINKING TRIGGER) ---
  const handleGoogleLogin = async () => {
    onLoginAttempt(); 
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      await handleLoginSuccess(result.user);

    } catch (error: any) {
      setLoading(false);
      
      // CRITICAL: Handle existing account collision
      if (error.code === 'auth/account-exists-with-different-credential') {
          const credential = GoogleAuthProvider.credentialFromError(error);
          const email = error.customData?.email;
          
          if (email && credential) {
              // We found a conflict. 
              setPendingCred(credential);
              setLinkingEmail(email);
              setIsLinking(true); // SWITCH UI TO LINK MODE
              setPassword(''); 
              
              // Bengali Instructions
              setError("এই ইমেইলটি আগে থেকেই পাসওয়ার্ড দিয়ে খোলা আছে। দয়া করে পাসওয়ার্ড দিয়ে Google অ্যাকাউন্টটি লিঙ্ক করুন।");
          } else {
              setError("Account conflict detected but data missing. Please try regular login.");
          }
      } else if (error.code !== 'auth/popup-closed-by-user') {
          setError(getErrorMessage(error.code, error.message));
      }
    }
  };

  const handleLoginSuccess = async (user: any) => {
      try {
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const val = snapshot.val();
            if (val.authMethod !== 'hybrid' && user.providerData.length > 1) {
                await update(userRef, { authMethod: 'hybrid' });
            }
        } else {
            // New User Creation
            await set(userRef, {
                name: user.displayName || 'User',
                email: user.email || '',
                balance: 0,
                role: 'user',
                uid: user.uid,
                totalEarned: 0,
                totalAdsWatched: 0,
                isBanned: false,
                authMethod: user.providerData.some((p: any) => p.providerId === 'password') ? 'password' : 'google'
            });
        }
        setSuccess(true);
        // Loading stays true until App.tsx redirects via onAuthStateChanged
      } catch (err) {
          console.error("DB Error", err);
          setLoading(false); // If DB fails, at least let them in locally, App.tsx will handle
          setSuccess(true);
      }
  };

  // --- 2. CONFIRM LINKING (MERGE GOOGLE INTO PASSWORD ACCOUNT) ---
  const handleConfirmLinking = async (e: FormEvent) => {
      e.preventDefault();
      if (!password || !pendingCred) {
          setError("দয়া করে পাসওয়ার্ড দিন।");
          return;
      }
      
      setLoading(true);
      setError('');

      try {
          // A. FIRST: Login with existing email/password
          // This call alone is sufficient to log the user in.
          const result = await signInWithEmailAndPassword(auth, linkingEmail, password);
          
          // B. SECOND: Try to Link
          try {
              await linkWithCredential(result.user, pendingCred);
          } catch (linkErr: any) {
              console.warn("Linking failed, but user is logged in:", linkErr.code);
              // Do NOT stop execution. The user successfully proved ownership of the account.
              // We just failed to attach the Google credential for *future* logins.
              // They are still logged in via Password now.
          }
          
          // C. Success - Proceed to App
          // The onAuthStateChanged listener in App.tsx will pick this up automatically.
          
      } catch (err: any) {
          setLoading(false);
          setError(getErrorMessage(err.code, err.message));
      }
  };

  // --- 3. STANDARD LOGIN/REGISTER ---
  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (isLinking) return handleConfirmLinking(e); 
    
    if (!isFormValid) {
        if (!isLogin && !validateNameRule(name)) setNameFieldError("নাম অবশ্যই ৩-২০ অক্ষরের হতে হবে");
        if (!validateEmailRule(email)) setEmailFieldError("সঠিক ইমেইল দিন");
        if (!validatePasswordRule(password)) setPassFieldError("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে");
        setError("অনুগ্রহ করে উপরের ভুলগুলো সংশোধন করুন");
        return;
    }

    onLoginAttempt();
    setError('');
    setLoading(true);
    
    if (isLogin) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Success handled by onAuthStateChanged
        } catch (err: any) {
            setLoading(false);
            setError(getErrorMessage(err.code, err.message));
        }
    } else {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            await handleLoginSuccess(userCredential.user);
        } catch (err: any) {
            setLoading(false);
            setError(getErrorMessage(err.code, err.message));
        }
    }
  };

  const switchMode = () => {
      setIsLogin(!isLogin); 
      // Ensure clean state when switching
      cancelLinking();
  };

  const cancelLinking = () => {
      setIsLinking(false);
      setPendingCred(null);
      setLinkingEmail('');
      setError('');
      setPassword('');
      setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center px-6 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      <div className="w-full max-w-md mx-auto z-10">
          
          <div className="flex flex-col items-center mb-6 mt-20">
              <div className="relative mb-2">
                  <div className={`w-[5.5rem] h-[5.5rem] rounded-full p-1 shadow-md ring-1 ${isLinking ? 'bg-yellow-50 ring-yellow-400' : 'bg-white dark:bg-dark-card ring-gray-200 dark:ring-gray-700'}`}>
                      <img src={logoUrl} alt={appName} className="w-full h-full object-cover rounded-full" />
                  </div>
                  {isLinking && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-dark-card animate-bounce">
                          <LinkIcon className="w-4 h-4" />
                      </div>
                  )}
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
                {appName}
              </h1>
              <p className={`text-sm font-medium mt-1 ${isLinking ? 'text-yellow-600 dark:text-yellow-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {isLinking 
                    ? "Link to Existing Account" 
                    : (isLogin ? texts.loginTitle : texts.registerTitle)
                  }
              </p>
          </div>

          <form onSubmit={handleAuth} className="w-full space-y-4">
            
            {/* Show error at top if linking for visibility */}
            {isLinking && error && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm rounded-xl border border-yellow-200 dark:border-yellow-700 flex gap-3 items-start animate-fade-in">
                    <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {!isLogin && !isLinking && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.name}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            onBlur={handleNameBlur}
                            placeholder="Name"
                            className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                                ${nameFieldError 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-primary'
                                }
                            `}
                        />
                    </div>
                    {nameFieldError && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{nameFieldError}</p>}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.email}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className={`h-5 w-5 ${isLinking ? 'text-gray-400' : 'text-primary'}`} />
                    </div>
                    <input
                        type="email"
                        value={isLinking ? linkingEmail : email}
                        onChange={handleEmailChange}
                        onBlur={handleEmailBlur}
                        placeholder="Email"
                        disabled={isLinking}
                        className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                            ${emailFieldError 
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-primary'
                            }
                            ${isLinking ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}
                        `}
                        required
                    />
                </div>
                {emailFieldError && !isLinking && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{emailFieldError}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.password}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockIcon className={`h-5 w-5 ${isLinking ? 'text-yellow-500' : 'text-primary'}`} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        placeholder={isLinking ? "পাসওয়ার্ড দিন লিঙ্ক করার জন্য" : "Password"}
                        className={`w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                            ${passFieldError 
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                : isLinking ? 'border-yellow-300 dark:border-yellow-700 focus:ring-yellow-500 focus:border-yellow-500' : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-primary'
                            }
                        `}
                        required
                        autoFocus={isLinking} 
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                    >
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
                {passFieldError && isLogin && !isLinking && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{passFieldError}</p>}
            </div>

            {!isLogin && !isLinking && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.confirmPassword}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockIcon className="h-5 w-5 text-primary" />
                        </div>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={handleConfirmPassChange}
                            onBlur={handlePasswordBlur}
                            placeholder="Confirm Password"
                            className={`w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                                ${passFieldError && confirmPassword 
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-primary'
                                }
                            `}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    {passFieldError && !isLogin && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{passFieldError}</p>}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || success || (!isLinking && !isFormValid)}
                className={`w-full h-14 font-bold rounded-xl flex justify-center items-center transition-all duration-200 text-white shadow-lg
                    ${isLinking 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30' 
                        : 'bg-gradient-to-r from-primary to-secondary shadow-primary/30'
                    }
                    ${(loading || success || (!isLinking && !isFormValid))
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'opacity-100 hover:opacity-90 active:scale-[0.98]'
                    }
                `}
            >
                {loading ? (
                    <Spinner />
                ) : success ? (
                    <CheckIcon className="w-8 h-8 text-white drop-shadow-md animate-smart-pop-in" />
                ) : isLinking ? (
                    "যাচাই করুন এবং লিঙ্ক করুন (Link Account)"
                ) : (
                    isLogin ? texts.login : texts.register
                )}
            </button>
            
            {/* Show normal error here only if NOT linking */}
            {error && !isLinking && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-100 dark:border-red-800 animate-fade-in font-medium">
                    {error}
                </div>
            )}

          </form>

          {!isLinking && (
              <>
                <div className="relative flex py-4 items-center w-full"> 
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-medium">Or</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                </div>

                <div className="w-full space-y-3 mb-6">
                    <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>Google (Quick Login)</span>
                    </button>
                </div>

                <div className="text-center pb-8">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isLogin ? texts.noAccount : texts.haveAccount}{" "}
                        <button 
                            onClick={switchMode}
                            className="text-primary font-bold hover:underline transition-colors ml-1"
                        >
                            {isLogin ? texts.register : texts.login}
                        </button>
                    </p>
                </div>
              </>
          )}
          
          {isLinking && (
              <div className="text-center mt-4 pb-8">
                  <button 
                    onClick={cancelLinking}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                      <span>বাতিল করুন (Cancel)</span>
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};
export default AuthScreen;
