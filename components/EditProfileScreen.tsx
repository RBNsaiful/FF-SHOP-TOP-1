
import React, { useState, FC, FormEvent, useRef, useEffect } from 'react';
import type { User, Screen } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';
import { db, auth } from '../firebase';
import { ref, update } from 'firebase/database';
import { updateProfile } from 'firebase/auth';
import AdRenderer from './AdRenderer';
import ImageCropper from './ImageCropper';

// Icons
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const GamepadIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.01.152v3.516a4 4 0 0 0 3.998 3.998c.044.001.087.002.13.002h10.384a4 4 0 0 0 3.998-3.998c.001-.044.002-.087.002-.13V8.742c0-.05-.004-.1-.01-.152A4 4 0 0 0 17.32 5z"/></svg>);
const Spinner: FC = () => (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>);
const CheckCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" /></svg>);
const CameraIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);

interface EditProfileScreenProps {
  user: User;
  texts: any;
  onNavigate: (screen: Screen) => void;
  adCode?: string;
  adActive?: boolean;
}

const EditProfileScreen: FC<EditProfileScreenProps> = ({ user, texts, onNavigate, adCode, adActive }) => {
  const [name, setName] = useState(user.name);
  const [playerUid, setPlayerUid] = useState(user.playerUid || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || DEFAULT_AVATAR_URL);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nameError, setNameError] = useState('');
  const [uidError, setUidError] = useState('');
  
  // Cropper State
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation Logic
  const validateName = (val: string) => {
      // 6-15 characters, no special chars like $:!#
      if (val.length < 6 || val.length > 15) return "Invalid name";
      if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) return "Invalid name";
      return "";
  };

  const validateUid = (val: string) => {
      if (!val) return ""; // Optional
      if (!/^\d+$/.test(val)) return "Player UID must be between 8 and 12 digits.";
      if (val.length < 8 || val.length > 12) return "Player UID must be between 8 and 12 digits.";
      return "";
  };

  // Check if button should be active
  const isFormValid = !nameError && !uidError && name.length > 0;
  const isDirty = name !== user.name || playerUid !== (user.playerUid || '') || avatarUrl !== user.avatarUrl;
  const canSave = isFormValid && isDirty && !isSaving;

  // Handle Input Changes with immediate validation
  const handleNameChange = (val: string) => {
      setName(val);
      setNameError(validateName(val));
  };

  const handleUidChange = (val: string) => {
      // Allow only numbers
      if (val && !/^\d*$/.test(val)) return;
      setPlayerUid(val);
      setUidError(validateUid(val));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave || !user.uid) return;

    // Final Validation Check
    const finalNameError = validateName(name);
    const finalUidError = validateUid(playerUid);
    
    if (finalNameError || finalUidError) {
        setNameError(finalNameError);
        setUidError(finalUidError);
        return;
    }

    setIsSaving(true);
    
    try {
        const updates: any = {
            name: name,
            playerUid: playerUid,
            avatarUrl: avatarUrl
        };

        // Update in Realtime DB
        await update(ref(db, 'users/' + user.uid), updates);
        
        // Update in Auth
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: name,
                photoURL: avatarUrl
            });
        }

        setShowSuccess(true);
        
        // Navigate back after success
        setTimeout(() => {
            onNavigate('profile');
        }, 1500);

    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile.");
        setIsSaving(false);
    }
  };

  // Image Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImageSrc(event.target?.result as string);
        setShowCropper(true);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
      setAvatarUrl(croppedImage);
      setShowCropper(false);
      setTempImageSrc(null);
  };

  return (
    <div className="p-4 animate-smart-fade-in pb-24">
      {/* Cropper Modal */}
      {showCropper && tempImageSrc && (
          <ImageCropper 
            imageSrc={tempImageSrc} 
            onCancel={() => { setShowCropper(false); setTempImageSrc(null); }}
            onCropComplete={handleCropComplete}
          />
      )}

      <div className="max-w-sm mx-auto">
         
         <form onSubmit={handleSave} className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-5 space-y-5 border border-gray-100 dark:border-gray-800">
            
            {/* Avatar Section - Compact */}
            <div className="flex flex-col items-center justify-center">
                <div 
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-br from-primary to-secondary shadow-md">
                        <img 
                            src={avatarUrl} 
                            alt="Avatar" 
                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-dark-card bg-gray-100"
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_URL; }}
                        />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-2 border-white dark:border-dark-card shadow-sm">
                        <CameraIcon className="w-3.5 h-3.5" />
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-primary font-bold text-xs hover:underline"
                >
                    {texts.changePhoto}
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            {/* Inputs Section */}
            <div className="space-y-4">
                {/* Name Input */}
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
                        {texts.name}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-1 outline-none transition-all text-sm font-medium text-light-text dark:text-dark-text
                                ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary'}
                            `}
                            placeholder="Enter your name"
                        />
                    </div>
                    {nameError && <p className="text-red-500 text-[10px] mt-1 font-bold">{nameError}</p>}
                </div>

                {/* Email Input (Read Only) */}
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
                        {texts.email}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MailIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="email" 
                            value={user.email}
                            disabled
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 cursor-not-allowed text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Player UID Input */}
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">
                        Save UID
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <GamepadIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={playerUid}
                            onChange={(e) => handleUidChange(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-1 outline-none transition-all text-sm font-medium text-light-text dark:text-dark-text
                                ${uidError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary'}
                            `}
                            placeholder="" // Removed demo number 12345678
                        />
                    </div>
                    {uidError && <p className="text-red-500 text-[10px] mt-1 font-bold">{uidError}</p>}
                </div>
            </div>

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={!canSave && !showSuccess}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center transition-all duration-300 text-sm
                        ${showSuccess 
                            ? 'bg-green-500 shadow-green-500/30'
                            : !canSave 
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-70 shadow-none' 
                                : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 active:scale-95 shadow-primary/30'
                        }
                    `}
                >
                    {isSaving ? <Spinner /> : showSuccess ? <span className="flex items-center gap-2 animate-pop-in"><CheckCircleIcon className="w-5 h-5"/> Saved</span> : texts.saveChanges}
                </button>
            </div>
         </form>
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

export default EditProfileScreen;
