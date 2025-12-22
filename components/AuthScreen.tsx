import React, { useState, FC, FormEvent } from 'react';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, set, get } from 'firebase/database';

interface AuthScreenProps {
  texts: any;
  appName: string;
  logoUrl: string;
  onLoginAttempt: () => void; // New prop to unlock app logout state
}

// Icons
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const EyeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);

const Spinner: FC = () => (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>);

const AuthScreen: React.FC<AuthScreenProps> = ({ texts, appName, logoUrl, onLoginAttempt }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (val: string) => {
      return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(val.trim());
  };

  const isEmailValid = validateEmail(email);
  const isPasswordValid = password.length >= 6;
  
  const validateName = (val: string) => {
      const trimmed = val.trim();
      // Length check
      if (trimmed.length < 3 || trimmed.length > 25) return false;
      // Block keyboard mashing (3+ consecutive identical characters)
      if (/(.)\1\1/.test(trimmed)) return false;
      // Support English & Bengali letters + single spaces
      return /^[a-zA-Z\u0980-\u09FF]+(?:\s[a-zA-Z\u0980-\u09FF]+)*$/.test(trimmed);
  };

  const isNameValid = isLogin || validateName(name);
  const doPasswordsMatch = isLogin || (password === confirmPassword);
  const isFormValid = isEmailValid && isPasswordValid && isNameValid && doPasswordsMatch;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // BLOCK trash characters (numbers, symbols) instantly
      const cleanVal = e.target.value.replace(/[^a-zA-Z\u0980-\u09FF\s]/g, '');
      setName(cleanVal);
  };

  const handleNameBlur = () => { setNameTouched(true); };
  const handleEmailBlur = () => { setEmailTouched(true); };

  const handleGoogleLogin = async () => {
    onLoginAttempt();
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.loginProvider !== 'google') {
              await set(ref(db, 'users/' + user.uid + '/loginProvider'), 'google');
          }
      } else {
          await set(userRef, {
            name: user.displayName || 'User',
            email: user.email || '',
            balance: 0,
            role: 'user',
            uid: user.uid,
            totalEarned: 0,
            totalAdsWatched: 0,
            isBanned: false,
            loginProvider: 'google'
        });
      }
      setSuccess(true);
    } catch (error: any) {
      console.error("Google Login failed", error);
      let msg = "Google Login Failed.";
      if (error.code === 'auth/popup-closed-by-user') msg = "Login canceled.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isLogin) setNameTouched(true);
    setEmailTouched(true);
    onLoginAttempt();
    if (!isFormValid) return;
    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: trimmedName });
        await set(ref(db, 'users/' + user.uid), {
            name: trimmedName,
            email: trimmedEmail,
            balance: 0,
            role: 'user',
            uid: user.uid,
            totalEarned: 0,
            totalAdsWatched: 0,
            isBanned: false,
            loginProvider: 'password'
        });
      }
      setLoading(false);
      setSuccess(true);
    } catch (err: any) {
      setLoading(false);
      let msg = "Authentication failed.";
      switch (err.code) {
          case 'auth/invalid-email': msg = texts.emailInvalid; break;
          case 'auth/invalid-credential': msg = "Invalid email or password."; break;
          case 'auth/email-already-in-use': msg = "Email already in use."; break;
          case 'auth/weak-password': msg = "Password too weak."; break;
          default: msg = "Connection error.";
      }
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center px-6 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      <div className="w-full max-w-md mx-auto z-10">
          <div className="flex flex-col items-center mb-6 mt-20">
              <div className="relative mb-2 min-h-[5rem] flex items-center justify-center"> 
                  {logoUrl ? (
                      <div className="w-20 h-20 rounded-full bg-white dark:bg-dark-card p-1 shadow-md ring-1 ring-gray-200 dark:ring-gray-700 animate-smart-pop-in">
                          <img src={logoUrl} alt={appName} className="w-full h-full object-cover rounded-full" />
                      </div>
                  ) : (
                      <div className="w-20 h-20 rounded-full bg-transparent"></div>
                  )}
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
                {appName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                  {isLogin ? "Login to your account" : "Create a new account"}
              </p>
          </div>

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
                            onChange={handleNameChange}
                            onBlur={handleNameBlur}
                            placeholder="Name"
                            className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                                ${nameTouched && !validateName(name) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-primary'}
                            `}
                            required={!isLogin}
                        />
                    </div>
                    {nameTouched && !validateName(name) && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">Invalid name</p>}
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
                        onBlur={handleEmailBlur}
                        placeholder="Email"
                        className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                            ${emailTouched && !isEmailValid 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-primary'
                            }
                        `}
                        required
                    />
                </div>
                {emailTouched && !isEmailValid && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">Invalid Email</p>}
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
                            className={`w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white
                                ${confirmPassword && password !== confirmPassword 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 dark:border-gray-700 focus:ring-primary focus:border-primary'
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
                        <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{texts.passwordsDoNotMatch}</p>
                    )}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || success || !isFormValid}
                className={`w-full h-14 font-bold rounded-xl flex justify-center items-center transition-all duration-200
                    bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30
                    ${!isFormValid || loading || success ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90 active:scale-[0.98]'}
                `}
            >
                {loading ? <Spinner /> : success ? <CheckIcon className="w-8 h-8 text-white drop-shadow-md animate-smart-pop-in" /> : (isLogin ? "Login" : "Register")}
            </button>
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-100 dark:border-red-800 animate-fade-in font-bold">
                    {error}
                </div>
            )}
          </form>

          <div className="relative flex py-4 items-center w-full"> 
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-medium">Or</span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          </div>

          <div className="w-full space-y-3 mb-6">
             <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="text-center pb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); setConfirmPassword(''); setNameTouched(false); setEmailTouched(false); setSuccess(false); }}
                    className="text-primary font-bold hover:underline transition-colors ml-1"
                  >
                      {isLogin ? "Register" : "Login"}
                  </button>
              </p>
          </div>
      </div>
    </div>
  );
};
export default AuthScreen;