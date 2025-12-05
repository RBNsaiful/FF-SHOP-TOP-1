import React, { useState, FC, FormEvent } from 'react';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, set } from 'firebase/database';

interface AuthScreenProps {
  texts: any;
  appName: string;
  logoUrl: string;
}

// Icons
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const EyeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);

const AuthScreen: React.FC<AuthScreenProps> = ({ texts, appName, logoUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Validation Logic
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 6;
  const isNameValid = isLogin || name.trim().length >= 3;
  const doPasswordsMatch = isLogin || (password === confirmPassword);
  
  const isFormValid = isEmailValid && isPasswordValid && isNameValid && doPasswordsMatch;

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      setError("Google Login Failed. Please try again.");
    }
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) return;

    setLoading(true);

    try {
      if (isLogin) {
        // Login Logic
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register Logic
        if (password !== confirmPassword) {
            throw new Error(texts.passwordsDoNotMatch);
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Profile Name
        await updateProfile(user, { displayName: name });

        // Initialize User in Database
        await set(ref(db, 'users/' + user.uid), {
            name: name,
            email: email,
            balance: 0,
            role: 'user',
            uid: user.uid,
            totalEarned: 0,
            totalAdsWatched: 0,
            isBanned: false
        });
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      if (err.code === 'auth/invalid-email') msg = texts.emailInvalid;
      if (err.code === 'auth/user-not-found') msg = "No account found.";
      if (err.code === 'auth/wrong-password') msg = texts.incorrectCurrentPassword;
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (err.code === 'auth/weak-password') msg = "Password too weak (min 6 chars).";
      if (err.message === texts.passwordsDoNotMatch) msg = texts.passwordsDoNotMatch;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center px-6 relative overflow-hidden bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      
      {/* Background Decor Elements - Subtle */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-secondary/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-md mx-auto z-10">
          
          {/* App Header */}
          <div className="flex flex-col items-center mb-8 animate-fade-in-up">
              <div className="relative group mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative w-20 h-20 rounded-full bg-white dark:bg-dark-card p-1 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800">
                      <img src={logoUrl} alt={appName} className="w-full h-full object-cover rounded-full" />
                  </div>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight">
                {appName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1 uppercase tracking-widest">
                  {isLogin ? texts.loginTitle : texts.registerTitle}
              </p>
          </div>

          {/* Main Form */}
          <form onSubmit={handleAuth} className="w-full space-y-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            
            {!isLogin && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">{texts.name}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium text-gray-800 dark:text-white"
                            required={!isLogin}
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">{texts.email}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium text-gray-800 dark:text-white"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">{texts.password}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3.5 bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium text-gray-800 dark:text-white"
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
                <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">{texts.confirmPassword}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-10 pr-10 py-3.5 bg-white dark:bg-dark-card border rounded-2xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                                ${confirmPassword && password !== confirmPassword 
                                    ? 'border-red-500 focus:ring-red-500/50' 
                                    : 'border-gray-100 dark:border-gray-800 focus:ring-primary/50 focus:border-primary'
                                }
                            `}
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
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold animate-fade-in">{texts.passwordsDoNotMatch}</p>
                    )}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs rounded-xl text-center font-bold animate-pulse border border-red-100 dark:border-red-800">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full py-4 font-bold rounded-2xl flex justify-center items-center transition-all duration-300
                    bg-gradient-to-r from-primary to-secondary text-white
                    ${!isFormValid || loading
                        ? 'opacity-50 cursor-not-allowed shadow-none'
                        : 'opacity-100 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:scale-95'
                    }
                `}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                    isLogin ? texts.login : texts.register
                )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {isLogin ? texts.noAccount : texts.haveAccount}{" "}
                  <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); setConfirmPassword(''); }}
                    className="text-primary font-bold hover:underline transition-colors ml-1"
                  >
                      {isLogin ? texts.register : texts.login}
                  </button>
              </p>
          </div>

          {/* Divider */}
          <div className="relative flex py-6 items-center w-full animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Social / Guest Login */}
          <div className="w-full space-y-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
             <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 font-bold rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 group"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
              <span>Google</span>
            </button>
          </div>
      </div>
    </div>
  );
};
export default AuthScreen;