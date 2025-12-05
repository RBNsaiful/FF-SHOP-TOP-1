import React, { useState, useRef, useEffect, FC } from 'react';
import type { User, Purchase } from '../types';
import { db } from '../firebase';
import { ref, onValue, remove } from 'firebase/database';
import AdRenderer from './AdRenderer';

interface MyOrdersScreenProps {
  user: User;
  texts: any;
  adCode?: string;
  adActive?: boolean;
}

const CopyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const DiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);
const TrashIcon: FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>);
const ClockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" /></svg>);
const XCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);
const CalendarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const ShoppingBagIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);


const WavyPath = () => (
  <svg className="absolute w-full h-full top-0 left-0" preserveAspectRatio="none" viewBox="0 0 350 210">
    <path d="M0 70 C50 30, 100 110, 150 70 S250 30, 300 70 S400 110, 450 70" stroke="rgba(255, 255, 255, 0.2)" fill="none" strokeWidth="2" />
    <path d="M0 140 C50 100, 100 180, 150 140 S250 100, 300 140 S400 180, 450 140" stroke="rgba(255, 255, 255, 0.2)" fill="none" strokeWidth="2" />
  </svg>
);

const StatusBadge: FC<{ status: Purchase['status'], texts: any }> = ({ status, texts }) => {
    const config = {
        Completed: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckIcon, label: texts.statusCompleted },
        Pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: ClockIcon, label: texts.statusPending },
        Failed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircleIcon, label: texts.statusFailed },
    };
    
    const { color, icon: Icon, label } = config[status];

    return (
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color} border border-transparent`}>
            <Icon className="w-3 h-3" />
            <span>{label}</span>
        </div>
    );
};

const ConfirmationDialog: FC<{ title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText: string; cancelText: string; }> = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-smart-fade-in">
        <div className="bg-light-card dark:bg-dark-card rounded-2xl p-6 w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">{message}</p>
            <div className="flex space-x-3">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

const PurchaseCard: FC<{ purchase: Purchase, texts: any, index: number, onDelete: (p: Purchase) => void }> = ({ purchase, texts, index, onDelete }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div 
            className="group relative bg-light-card dark:bg-dark-card rounded-2xl p-0 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 overflow-hidden opacity-0 animate-smart-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                purchase.status === 'Completed' ? 'bg-green-500' : 
                purchase.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>

            <div className="p-4 pl-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                            <DiamondIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-light-text dark:text-dark-text leading-tight">
                                {purchase.offer?.diamonds || purchase.offer?.name}
                            </h3>
                            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Free Fire Topup</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="bg-light-bg dark:bg-dark-bg px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                             <span className="font-bold text-sm text-primary">{texts.currency}{purchase.offer.price}</span>
                         </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2 grid grid-cols-2 gap-y-2 gap-x-2 text-xs border border-gray-100 dark:border-gray-800/50">
                    <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> {texts.uid}
                        </p>
                        <p className="font-mono font-semibold text-gray-700 dark:text-gray-300 truncate text-xs">{purchase.uid}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                         <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1 sm:justify-end">
                            <CalendarIcon className="w-3 h-3" /> Date
                        </p>
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-[10px]">
                             {new Date(purchase.date).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                             })}
                        </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                         <div>
                            <p className="text-[10px] text-gray-400 mb-0.5">Order ID</p>
                            <div className="flex items-center space-x-2">
                                <span className="font-mono text-[10px] font-medium text-gray-600 dark:text-gray-400 select-all">{purchase.id}</span>
                                <button onClick={() => handleCopy(purchase.id)} className="text-gray-400 hover:text-primary transition-colors">
                                    {copied ? <CheckIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                                </button>
                            </div>
                         </div>
                         <div className="flex items-center">
                            <StatusBadge status={purchase.status} texts={texts} />
                         </div>
                    </div>
                </div>
            </div>

            {(purchase.status === 'Completed' || purchase.status === 'Failed') && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(purchase); }}
                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

const MyOrdersScreen: FC<MyOrdersScreenProps> = ({ user, texts, adCode, adActive }) => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

    useEffect(() => {
        if (!user.uid) return;
        const ordersRef = ref(db, 'orders/' + user.uid);
        const unsubscribe = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const ordersList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: data[key].id || key,
                    key: key
                })).reverse();
                setPurchases(ordersList);
            } else {
                setPurchases([]);
            }
        });
        return () => unsubscribe();
    }, [user.uid]);

    const handleDeleteClick = (purchase: Purchase) => {
        setPurchaseToDelete(purchase);
    };

    const handleConfirmDelete = () => {
        if (purchaseToDelete && user.uid && purchaseToDelete.key) {
             const orderRef = ref(db, `orders/${user.uid}/${purchaseToDelete.key}`);
             remove(orderRef).then(() => {
                 setPurchaseToDelete(null);
             });
        }
    };
    
    const handleCancelDelete = () => {
        setPurchaseToDelete(null);
    };

    const totalSpent = purchases
        .filter(p => p.status === 'Completed')
        .reduce((acc, curr) => acc + curr.offer.price, 0);

    return (
        <div className="p-4 animate-smart-fade-in pb-20">
            <div className="max-w-lg mx-auto">
                <div className="relative bg-gradient-to-r from-primary to-secondary p-5 rounded-2xl text-white shadow-xl mb-5 overflow-hidden animate-smart-slide-down flex items-center justify-between">
                    <WavyPath />
                    <div className="relative z-10 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">{texts.totalSpent}</p>
                        <div className="flex items-center space-x-2">
                             <span className="text-2xl font-extrabold text-white tracking-tight">{texts.currency}{totalSpent}</span>
                        </div>
                        <p className="text-[9px] text-white/70 mt-0.5 font-medium">Lifetime Spend</p>
                    </div>
                    <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/10">
                         <ShoppingBagIcon className="w-6 h-6 text-white" />
                    </div>
                </div>

                {purchases.length > 0 ? (
                    <div className="space-y-3">
                        {purchases.map((purchase, index) => (
                            <PurchaseCard 
                                key={purchase.key || purchase.id} 
                                purchase={purchase} 
                                texts={texts} 
                                index={index} 
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-smart-fade-in">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <ClockIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{texts.ordersEmpty}</p>
                    </div>
                )}
            </div>

            {purchaseToDelete && (
                <ConfirmationDialog
                    title={texts.deleteConfirmTitle}
                    message={texts.deleteConfirmMessage}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    confirmText={texts.deleteConfirmButton}
                    cancelText={texts.cancel}
                />
            )}

            {/* --- FOOTER ADVERTISEMENT (Scroll to View) --- */}
            {adCode && (
                <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[250px]">
                    <AdRenderer code={adCode} active={adActive} />
                </div>
            )}
        </div>
    );
};

export default MyOrdersScreen;