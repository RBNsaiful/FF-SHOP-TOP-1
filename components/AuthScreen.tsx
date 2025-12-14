
import React, { useState, FC, FormEvent, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  signOut
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../firebase';

interface AuthScreenProps {
  texts: any;
  appName: string;
  logoUrl: string;
  onLoginAttempt: () => void;
}

// ---------------- ICONS ----------------
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const AlertIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const Spinner: FC = () => (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>);

// ---------------- MAIN COMPONENT ----------------
const AuthScreen: React.FC<AuthScreenProps> = ({ texts, appName, logoUrl, onLoginAttempt }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }, []);

  // ---------- SAVE USER HELPER ----------
  const saveUser = async (user: any, method: 'google' | 'password') => {
    const userRef = ref(db, 'users/' + user.uid);
    const snap = await get(userRef);

    if (!snap.exists()) {
      await set(userRef, {
        uid: user.uid,
        name: user.displayName || name || 'User',
        email: user.email,
        balance: 0,
        role: 'user',
        totalEarned: 0,
        totalAdsWatched: 0,
        isBanned: false,
        loginProvider: method // REQUIRED FIELD
      });
    } else {
        // Enforce provider consistency if needed, but primary check happens before login
        const data = snap.val();
        if (!data.loginProvider) {
             await set(ref(db, 'users/' + user.uid + '/loginProvider'), method);
        }
    }
  };

  // ---------- GOOGLE LOGIN ----------
  const loginWithGoogle = async () => {
    onLoginAttempt();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // 1. Popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Check Email
      if (!user.email) {
        await signOut(auth);
        throw new Error('Google login failed: No email provided.');
      }

      // 3. Fetch Methods
      const methods = await fetchSignInMethodsForEmail(auth, user.email);

      // 4. Check Password method
      if (methods.includes('password')) {
        await signOut(auth);
        throw new Error('This email is registered with Password. Please login using Email & Password.');
      }

      // 5. Save
      await saveUser(user, 'google');

    } catch (err: any) {
      setError(err.message || 'Google login failed');
      // If error occurred (e.g. strict check failed), ensure we are signed out
      if (auth.currentUser) {
          await signOut(auth);
      }
    }

    setLoading(false);
  };

  // ---------- EMAIL LOGIN / REGISTER ----------
  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    onLoginAttempt();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Forgot Password
      if (isForgotMode) {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
        setLoading(false);
        setTimeout(() => { setIsForgotMode(false); setMessage(''); }, 3000);
        return;
      }

      // 1. Fetch Methods
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (isLogin) {
        // Login Flow
        // 2. Check Google
        if (methods.includes('google.com')) {
          throw new Error('This account was created using Google. Please login with Google.');
        }
        
        // 3. SignIn
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register Flow
        // 2. Check Exists
        if (methods.length > 0) {
          throw new Error('Email already in use. Please login.');
        }

        // 3. Create
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await saveUser(cred.user, 'password');
      }

    } catch (err: any) {
        let msg = err.message || 'Authentication failed';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
        if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
        if (err.code === 'auth/invalid-credential') msg = 'Invalid credentials.';
        setError(msg);
    }

    setLoading(false);
  };

  const switchMode = () => {
      setIsLogin(!isLogin);
      setError('');
      setMessage('');
  };

  const toggleForgot = () => {
      setIsForgotMode(!isForgotMode);
      setError('');
      setMessage('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center px-6 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      <div className="w-full max-w-md mx-auto z-10">
          
          {/* LOGO AREA */}
          <div className="flex flex-col items-center mb-6 mt-20">
              <div className="relative mb-2">
                  <div className={`w-[5.5rem] h-[5.5rem] rounded-full p-1 shadow-md ring-1 bg-white dark:bg-dark-card ring-gray-200 dark:ring-gray-700`}>
                      <img src={logoUrl} alt={appName} className="w-full h-full object-cover rounded-full" />
                  </div>
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">{appName}</h1>
              <p className="text-sm font-medium mt-1 text-gray-500 dark:text-gray-400">
                  {isForgotMode ? "Reset Password" : (isLogin ? texts.loginTitle : texts.registerTitle)}
              </p>
          </div>

          <form onSubmit={handleEmailAuth} className="w-full space-y-4">
            
            {!isLogin && !isForgotMode && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.name}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-primary" /></div>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Name"
                            className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 dark:text-white"
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.email}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MailIcon className="h-5 w-5 text-primary" /></div>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 dark:text-white"
                    />
                </div>
            </div>

            {!isForgotMode && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.password}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockIcon className="h-5 w-5 text-primary" /></div>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 dark:text-white"
                        />
                    </div>
                </div>
            )}

            {isLogin && !isForgotMode && (
                <div className="flex justify-end">
                    <button type="button" onClick={toggleForgot} className="text-xs font-bold text-primary hover:text-secondary transition-colors">Forgot Password?</button>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full h-14 font-bold rounded-xl flex justify-center items-center transition-all duration-200 text-white shadow-lg bg-gradient-to-r from-primary to-secondary shadow-primary/30 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
                {loading ? <Spinner /> : (isForgotMode ? "Reset Password" : (isLogin ? texts.login : texts.register))}
            </button>
            
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-100 dark:border-red-800 flex gap-2 items-center justify-center">
                    <AlertIcon className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
            )}

            {message && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg text-center border border-green-100 dark:border-green-800 flex gap-2 items-center justify-center">
                    <CheckIcon className="w-5 h-5 flex-shrink-0" /><span>{message}</span>
                </div>
            )}

          </form>

          {!isForgotMode && (
              <>
                <div className="relative flex py-4 items-center w-full"> 
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-medium">Or</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                </div>

                <div className="w-full space-y-3 mb-6">
                    <button
                        onClick={loginWithGoogle}
                        disabled={loading}
                        className="w-full py-3 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span>Google (Quick Login)</span>
                    </button>
                </div>
              </>
          )}

          <div className="text-center pb-8 pt-4">
            {isForgotMode ? (
                <button onClick={toggleForgot} className="text-primary font-bold hover:underline transition-colors ml-1">Back to Login</button>
            ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isLogin ? texts.noAccount : texts.haveAccount}{" "}
                    <button onClick={switchMode} className="text-primary font-bold hover:underline transition-colors ml-1">{isLogin ? texts.register : texts.login}</button>
                </p>
            )}
          </div>
      </div>
    </div>
  );
};

export default AuthScreen;
