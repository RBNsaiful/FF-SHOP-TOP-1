
import React, { useState, FC, FormEvent } from 'react';
import { auth } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import AdRenderer from './AdRenderer';

const EyeIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x="1" y1="2" x2="22" y2="22"/></svg>
);

const KeyIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
);

const CheckCircleIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

interface ChangePasswordScreenProps {
  texts: any;
  onPasswordChanged: () => void;
  adCode?: string;
  adActive?: boolean;
}

const ChangePasswordScreen: FC<ChangePasswordScreenProps> = ({ texts, onPasswordChanged, adCode, adActive }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Button Activation Logic
  const isFormValid = 
      currentPassword.length > 0 && 
      newPassword.length >= 6 && 
      newPassword === confirmNewPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
          throw new Error("User not authenticated");
      }

      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update Password
      await updatePassword(user, newPassword);

      setSuccess(true);
      setTimeout(() => {
          onPasswordChanged();
      }, 2000);

    } catch (err: any) {
        if (err.code === 'auth/wrong-password') {
            setError(texts.incorrectCurrentPassword);
        } else if (err.code === 'auth/too-many-requests') {
            setError("Too many attempts. Try again later.");
        } else {
            setError("Failed to update password. Please try again.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 animate-smart-fade-in pb-24">
      <div className="max-w-md mx-auto">
         <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-6 space-y-6 border border-gray-100 dark:border-gray-800">
            
            {/* Header Icon Only */}
            <div className="text-center mb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <KeyIcon className="w-8 h-8 text-primary" />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block ml-1">{texts.currentPassword}</label>
                    <div className="relative">
                        <input 
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full p-3.5 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-light-text dark:text-dark-text transition-all font-medium"
                        />
                         <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showCurrentPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                 {/* New Password */}
                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block ml-1">{texts.newPassword}</label>
                    <div className="relative">
                        <input 
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full p-3.5 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-light-text dark:text-dark-text transition-all font-medium"
                        />
                         <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                 {/* Confirm New Password */}
                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block ml-1">{texts.confirmNewPassword}</label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            className={`w-full p-3.5 pr-10 bg-gray-50 dark:bg-gray-800 border rounded-2xl focus:ring-2 outline-none text-light-text dark:text-dark-text transition-all font-medium
                                ${confirmNewPassword && newPassword !== confirmNewPassword 
                                    ? 'border-red-500 focus:ring-red-500/50' 
                                    : 'border-gray-200 dark:border-gray-700 focus:ring-primary'
                                }
                            `}
                        />
                         <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                     {confirmNewPassword && newPassword !== confirmNewPassword && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold animate-fade-in">{texts.passwordsDoNotMatch}</p>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg font-bold text-center animate-pulse border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-lg font-bold text-center animate-bounce flex items-center justify-center gap-2 border border-green-200 dark:border-green-800">
                        <CheckCircleIcon className="w-4 h-4" /> {texts.passwordChangedSuccess}
                    </div>
                )}

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={loading || success || !isFormValid}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center transition-all duration-300
                            ${loading || success
                                ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                                : !isFormValid 
                                    ? 'bg-gradient-to-r from-primary to-secondary opacity-50 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-primary to-secondary hover:opacity-95 active:scale-95 shadow-primary/30 cursor-pointer'
                            }
                        `}
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : texts.updatePassword}
                    </button>
                </div>
            </form>
         </div>
      </div>

        {/* --- FOOTER ADVERTISEMENT --- */}
        {adCode && (
            <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[250px]">
                <AdRenderer code={adCode} active={adActive} />
            </div>
        )}
    </div>
  );
};

export default ChangePasswordScreen;
