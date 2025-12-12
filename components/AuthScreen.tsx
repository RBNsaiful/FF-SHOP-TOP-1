
import React, { useState, FC, FormEvent } from 'react';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';

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

const Spinner: FC = () => (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>);

const AuthScreen: React.FC<AuthScreenProps> = ({ texts, appName, logoUrl, onLoginAttempt }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- HELPER: CHECK DATABASE FOR EMAIL CONFLICTS ---
  const checkEmailConflict = async (emailToCheck: string, intendedMethod: 'google' | 'password') => {
      const usersRef = ref(db, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(emailToCheck));
      const snapshot = await get(emailQuery);

      if (snapshot.exists()) {
          let conflictFound = false;
          snapshot.forEach((child) => {
              const val = child.val();
              // STRICT CHECK: If authMethod exists and DOES NOT MATCH intended method
              if (val.authMethod && val.authMethod !== intendedMethod) {
                  conflictFound = true;
              }
          });
          return conflictFound;
      }
      return false;
  };

  // --- GOOGLE LOGIN (QUICK LOGIN) ---
  const handleGoogleLogin = async () => {
    onLoginAttempt();
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid auto-login loops if multiple accounts exist
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. DATABASE CONFLICT CHECK
      const isConflict = await checkEmailConflict(user.email || '', 'google');
      
      if (isConflict) {
          // CRITICAL: Force Logout immediately if this email belongs to a Password account
          await signOut(auth);
          setError("এই ইমেইল দিয়ে পাসওয়ার্ড এর মাধ্যমে অ্যাকাউন্ট খোলা আছে। দয়া করে পাসওয়ার্ড দিয়ে লগইন করুন।");
          setLoading(false);
          return;
      }

      // 2. Setup/Update User in DB
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
          // Create new Google User
          await set(userRef, {
            name: user.displayName || 'User',
            email: user.email || '',
            balance: 0,
            role: 'user',
            uid: user.uid,
            totalEarned: 0,
            totalAdsWatched: 0,
            isBanned: false,
            authMethod: 'google' // MARKER
        });
      } else {
          // Ensure marker is set for legacy accounts
          if (!snapshot.val().authMethod) {
              await set(ref(db, 'users/' + user.uid + '/authMethod'), 'google');
          }
      }
      
      setSuccess(true);
    } catch (error: any) {
      setLoading(false);
      // Handle Firebase Merge Error specifically
      if (error.code === 'auth/account-exists-with-different-credential') {
          setError("এই ইমেইল দিয়ে পাসওয়ার্ড অ্যাকাউন্ট আছে। দয়া করে পাসওয়ার্ড ব্যবহার করুন।");
      } else {
          setError("Google Login canceled or failed.");
      }
    }
  };

  // --- PASSWORD LOGIN / REGISTER ---
  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    onLoginAttempt();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 1. DATABASE CONFLICT CHECK
        // If user logged in successfully via password, we MUST ensure the DB doesn't say it's a Google account
        const isConflict = await checkEmailConflict(user.email || '', 'password');
        
        if (isConflict) {
            await signOut(auth);
            setError("এই ইমেইল দিয়ে Google (Quick Login) এর মাধ্যমে অ্যাকাউন্ট খোলা আছে। দয়া করে Google দিয়ে লগইন করুন।");
            setLoading(false);
            return;
        }

        // Update authMethod if missing (Migration path)
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists() && !snapshot.val().authMethod) {
             await set(ref(db, 'users/' + user.uid + '/authMethod'), 'password');
        }

        setSuccess(true);

      } else {
        // --- REGISTER FLOW ---
        
        // 1. PRE-CHECK: Does this email exist in our DB with 'google'?
        // We do this BEFORE firebase create to avoid creating a "ghost" auth record that conflicts
        const isConflict = await checkEmailConflict(email, 'password');
        if (isConflict) {
            throw new Error("এই ইমেইল দিয়ে Google অ্যাকাউন্ট খোলা আছে। দয়া করে Google Login ব্যবহার করুন।");
        }

        if (password !== confirmPassword) {
            throw new Error(texts.passwordsDoNotMatch);
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });

        // 2. Create User Record with STRICT 'password' marker
        await set(ref(db, 'users/' + user.uid), {
            name: name,
            email: email,
            balance: 0,
            role: 'user',
            uid: user.uid,
            totalEarned: 0,
            totalAdsWatched: 0,
            isBanned: false,
            authMethod: 'password' // MARKER
        });
        
        setSuccess(true);
      }
    } catch (err: any) {
      setLoading(false);
      let msg = "Authentication failed.";
      if (err.code === 'auth/email-already-in-use') msg = "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা আছে।";
      else if (err.code === 'auth/wrong-password') msg = "ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।";
      else if (err.code === 'auth/user-not-found') msg = "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।";
      else if (err.code === 'auth/invalid-email') msg = "ইমেইল অ্যাড্রেসটি সঠিক নয়।";
      else if (err.message) msg = err.message;
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center px-6 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      
      <div className="w-full max-w-md mx-auto z-10">
          
          {/* App Header */}
          <div className="flex flex-col items-center mb-6 mt-20">
              <div className="relative mb-2">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-card p-1 shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
                      <img src={logoUrl} alt={appName} className="w-full h-full object-cover rounded-full" />
                  </div>
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
                {appName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                  {isLogin ? texts.loginTitle : texts.registerTitle}
              </p>
          </div>

          {/* Main Form */}
          <form onSubmit={handleAuth} className="w-full space-y-4">
            
            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.name}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                            className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-gray-800 dark:text-white"
                            required={!isLogin}
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.email}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className="h-5 w-5 text-primary" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-gray-800 dark:text-white"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.password}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockIcon className="h-5 w-5 text-primary" />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-gray-800 dark:text-white"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                    >
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.confirmPassword}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockIcon className="h-5 w-5 text-primary" />
                        </div>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-gray-800 dark:text-white"
                            required={!isLogin}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading || success}
                className={`w-full h-14 font-bold rounded-xl flex justify-center items-center transition-all duration-200
                    bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30
                    ${loading || success
                        ? 'opacity-70 cursor-wait'
                        : 'opacity-100 hover:opacity-90 active:scale-[0.98]'
                    }
                `}
            >
                {loading ? (
                    <Spinner />
                ) : success ? (
                    <CheckIcon className="w-8 h-8 text-white drop-shadow-md animate-smart-pop-in" />
                ) : (
                    isLogin ? texts.login : texts.register
                )}
            </button>
            
            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-100 dark:border-red-800 animate-fade-in font-medium">
                    {error}
                </div>
            )}

          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center w-full"> 
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-medium">Or</span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          </div>

          {/* Social / Guest Login */}
          <div className="w-full space-y-3 mb-6">
             <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              <span>Google</span>
            </button>
          </div>

          {/* Toggle Login/Register */}
          <div className="text-center pb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isLogin ? texts.noAccount : texts.haveAccount}{" "}
                  <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); setConfirmPassword(''); setSuccess(false); }}
                    className="text-primary font-bold hover:underline transition-colors ml-1"
                  >
                      {isLogin ? texts.register : texts.login}
                  </button>
              </p>
          </div>
      </div>
    </div>
  );
};
export default AuthScreen;
