import React, { useState, useRef, FC, ChangeEvent, FormEvent, useEffect } from 'react';
import type { User, Screen } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';
import { db } from '../firebase';
import { ref, update, get } from 'firebase/database';

// Icons
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const GamepadIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.01.152v3.516a4 4 0 0 0 3.998 3.998c.044.001.087.002.13.002h10.384a4 4 0 0 0 3.998-3.998c.001-.044.002-.087.002-.13V8.742c0-.05-.004-.1-.01-.152A4 4 0 0 0 17.32 5z"/></svg>);
const CameraIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const Spinner: FC = () => (<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>);
const CheckCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" /></svg>);


interface EditProfileScreenProps {
  user: User;
  texts: any;
  onNavigate: (screen: Screen) => void;
}

const InputField: FC<{ icon: FC<{className?: string}>, label: string, id: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void, onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void, placeholder?: string, type?: string, containerStyle?: React.CSSProperties, className?: string, disabled?: boolean, readOnly?: boolean, error?: string, maxLength?: number, inputMode?: "text" | "none" | "tel" | "url" | "email" | "numeric" | "decimal" | "search", pattern?: string }> = ({ icon: Icon, label, id, containerStyle, className, error, disabled, readOnly, ...props }) => (
    <div style={containerStyle} className={className}>
        <label htmlFor={id} className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{label}</label>
        <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon className={`h-5 w-5 ${disabled ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`} />
            </div>
            <input
                id={id}
                disabled={disabled}
                readOnly={readOnly}
                {...props}
                className={`w-full p-3 pl-10 rounded-lg focus:outline-none transition-colors
                    ${disabled || readOnly 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-default border-transparent focus:ring-0' 
                        : `bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-primary'} focus:ring-2`
                    }
                `}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
    </div>
);


const EditProfileScreen: FC<EditProfileScreenProps> = ({ user, texts, onNavigate }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [playerUid, setPlayerUid] = useState(user.playerUid || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || DEFAULT_AVATAR_URL);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [validationError, setValidationError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [initialState, setInitialState] = useState({
        name: user.name,
        playerUid: user.playerUid || '',
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL
    });

    useEffect(() => {
        setName(user.name);
        setEmail(user.email);
        setPlayerUid(user.playerUid || '');
        setAvatarUrl(user.avatarUrl || DEFAULT_AVATAR_URL);
        setInitialState({
             name: user.name,
             playerUid: user.playerUid || '',
             avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL
        });
    }, [user]);

    const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        setTimeout(() => {
            event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 15) {
            setName(val);
            if (validationError) setValidationError('');
        }
    };
    
    const handleUidChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            setPlayerUid(val);
            if (validationError) setValidationError('');
        }
    };

    const handleSaveChanges = async (e: FormEvent) => {
        e.preventDefault();
        
        const trimmedName = name.trim();
        if (trimmedName.length < 6 || trimmedName.length > 15) {
            setValidationError("Invalid name");
            return;
        }

        if (playerUid.length > 0) {
            if (playerUid.length < 8 || playerUid.length > 12) {
                setValidationError(texts.uidLength);
                return;
            }
        }

        if (status !== 'idle') return;

        setStatus('processing');
        
        try {
             if (user.uid) {
                 const userRef = ref(db, 'users/' + user.uid);
                 await update(userRef, {
                     name: trimmedName,
                     playerUid: playerUid.trim(), 
                     avatarUrl
                 });
             }
            setStatus('success');
            setTimeout(() => {
                onNavigate('profile');
            }, 1500);
        } catch (error) {
            console.error("Failed to update profile", error);
            setStatus('idle');
        }
    };
    
    const hasNameChanged = name.trim() !== initialState.name;
    const hasPlayerUidChanged = playerUid.trim() !== initialState.playerUid;
    const hasAvatarChanged = avatarUrl !== initialState.avatarUrl;
    const hasAnyChange = hasNameChanged || hasPlayerUidChanged || hasAvatarChanged;

    const isSaveDisabled = status !== 'idle' || !hasAnyChange;

    return (
        <div className="p-4 animate-smart-fade-in">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg">
                
                {/* Avatar & Basic Info */}
                <form onSubmit={handleSaveChanges} className="space-y-6">
                    <div className="flex flex-col items-center animate-smart-pop-in">
                        <div className="relative group">
                            <img 
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-dark-bg shadow-lg"
                            />
                             <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={texts.changePhoto}
                             >
                                <CameraIcon className="w-8 h-8 text-white" />
                             </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            className="hidden"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-3 text-sm font-semibold text-primary hover:underline"
                        >
                           {texts.changePhoto}
                        </button>
                    </div>

                    <InputField
                        id="name"
                        label={texts.name}
                        icon={UserIcon}
                        value={name}
                        onChange={handleNameChange}
                        onFocus={handleInputFocus}
                        className="opacity-0 animate-smart-slide-up"
                        containerStyle={{ animationDelay: '100ms' }}
                        error={validationError && !validationError.includes('UID') ? validationError : ''}
                        placeholder="Full Name"
                    />

                    <InputField
                        id="email"
                        label={texts.email}
                        icon={MailIcon}
                        value={email}
                        onChange={() => {}} 
                        type="email"
                        disabled={true}
                        readOnly={true}
                        className="opacity-0 animate-smart-slide-up"
                        containerStyle={{ animationDelay: '200ms' }}
                    />

                    <InputField
                        id="playerUid"
                        label={texts.uid}
                        icon={GamepadIcon}
                        value={playerUid}
                        onChange={handleUidChange}
                        placeholder={texts.uidOptional}
                        onFocus={handleInputFocus}
                        className="opacity-0 animate-smart-slide-up"
                        containerStyle={{ animationDelay: '300ms' }}
                        error={validationError && validationError.includes('UID') ? validationError : ''}
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={12}
                    />
                    
                    <div className="opacity-0 animate-smart-slide-up" style={{ animationDelay: '400ms' }}>
                        <button
                            type="submit"
                            disabled={isSaveDisabled}
                            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:opacity-90 transform active:scale-95"
                        >
                            {status === 'processing' && <Spinner />}
                            {status === 'success' && <CheckCircleIcon className="w-6 h-6" />}
                            {status === 'idle' && <span>{texts.saveChanges}</span>}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default EditProfileScreen;