import React, { useState, FC, ChangeEvent, FormEvent } from 'react';
import { auth } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const EyeIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

const Spinner: FC = () => (<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>);
const CheckCircleIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

interface PasswordInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    style?: React.CSSProperties;
    className?: string;
    error?: string;
    placeholder?: string;
}

const PasswordInput: FC<PasswordInputProps> = ({ id, label, value, onChange, style, className, error, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div style={style} className={className}>
            <label htmlFor={id} className="text-sm font-medium">{label}</label>
            <div className="relative mt-1">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    required
                    placeholder={placeholder}
                    className={`w-full p-3 pr-10 bg-light-bg dark:bg-dark-bg border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary'} rounded-lg focus:outline-none focus:ring-2`}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
                    tabIndex={-1}
                >
                    {show ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
        </div>
    );
};

interface ChangePasswordScreenProps {
  texts: any;
  onPasswordChanged: () => void;
}

const ChangePasswordScreen: FC<ChangePasswordScreenProps> = ({ texts, onPasswordChanged }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [error, setError] = useState<string>('');
    
    const isMinLengthMet = newPassword.length >= 6;
    const doPasswordsMatch = newPassword === confirmNewPassword;
    const isAllFilled = currentPassword.length > 0 && newPassword.length > 0 && confirmNewPassword.length > 0;
    
    const isSubmitDisabled = status === 'processing' || !isAllFilled || !isMinLengthMet || !doPasswordsMatch;

    const newPasswordError = (!isMinLengthMet && newPassword.length > 0) ? "Password: use at least 6 characters" : undefined;
    const matchError = (!doPasswordsMatch && confirmNewPassword.length > 0) ? texts.passwordsDoNotMatch : undefined;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (isSubmitDisabled) return;

        setStatus('processing');
        
        try {
            const user = auth.currentUser;
            if (user && user.email) {
                 const credential = EmailAuthProvider.credential(user.email, currentPassword);
                 await reauthenticateWithCredential(user, credential);
                 await updatePassword(user, newPassword);
                 
                 setStatus('success');
                 setTimeout(() => {
                    onPasswordChanged();
                 }, 2000);
            } else {
                 setError("User session invalid. Please re-login.");
                 setStatus('idle');
            }

        } catch (err: any) {
            console.error("Password change error:", err);
            setStatus('idle');
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError(texts.incorrectCurrentPassword);
            } else if (err.code === 'auth/weak-password') {
                 setError("Password: use at least 6 characters");
            } else if (err.code === 'auth/too-many-requests') {
                 setError("Too many attempts. Please try again later.");
            } else if (err.code === 'auth/requires-recent-login') {
                setError("Security check failed. Please logout and login again.");
            } else {
                setError("Failed to update password. Check your connection.");
            }
        }
    };

    return (
        <div className="p-4 animate-smart-fade-in">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg">
                {status === 'success' ? (
                     <div className="flex flex-col items-center justify-center text-center p-8 animate-smart-pop-in">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-green-500"/>
                        </div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400">{texts.passwordChangedSuccess}</h3>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center mb-4">
                            <h2 className="text-xl font-bold mb-1">{texts.changePassword}</h2>
                            <p className="text-sm text-gray-500 text-center">Enter your current password to set a new one.</p>
                        </div>

                        <PasswordInput 
                            id="currentPassword"
                            label={texts.currentPassword}
                            value={currentPassword}
                            onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
                            className="opacity-0 animate-smart-slide-up"
                            style={{ animationDelay: '100ms' }}
                        />
                         <PasswordInput 
                            id="newPassword"
                            label={texts.newPassword}
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                            className="opacity-0 animate-smart-slide-up"
                            style={{ animationDelay: '200ms' }}
                            error={newPasswordError}
                            placeholder="Min 6 characters"
                        />
                         <PasswordInput 
                            id="confirmNewPassword"
                            label={texts.confirmNewPassword}
                            value={confirmNewPassword}
                            onChange={(e) => { setConfirmNewPassword(e.target.value); setError(''); }}
                            className="opacity-0 animate-smart-slide-up"
                            style={{ animationDelay: '300ms' }}
                            error={matchError}
                        />
                        
                        {error && <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm text-center font-medium animate-smart-fade-in">{error}</div>}
                        
                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className={`w-full font-bold py-3.5 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg
                                ${isSubmitDisabled 
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none opacity-60' 
                                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-primary/20 transform active:scale-95'
                                } opacity-0 animate-smart-slide-up`}
                            style={{ animationDelay: '400ms' }}
                        >
                             {status === 'processing' ? <Spinner /> : texts.updatePassword}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordScreen;