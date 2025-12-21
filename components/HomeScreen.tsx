
import React, { useState, useRef, useEffect, FC } from 'react';
import type { User, DiamondOffer, LevelUpPackage, Membership, GenericOffer, PremiumApp, Screen, AppVisibility, Banner, SpecialOffer, UiSettings } from '../types';
import PurchaseModal from './PurchaseModal';
import { db } from '../firebase';
import { ref, push, runTransaction } from 'firebase/database';
import AdRenderer from './AdRenderer';

interface HomeScreenProps {
  user: User;
  texts: any;
  onPurchase: (price: number) => void;
  diamondOffers: DiamondOffer[];
  levelUpPackages: LevelUpPackage[];
  memberships: Membership[];
  premiumApps: PremiumApp[];
  specialOffers?: SpecialOffer[];
  onNavigate: (screen: Screen) => void;
  bannerImages: Banner[];
  visibility?: AppVisibility;
  homeAdCode?: string;
  homeAdActive?: boolean;
  uiSettings?: UiSettings;
}

const DiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);
const StarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IdCardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="9" x2="10" y2="9"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="9" x2="18" y2="9"/><line x1="14" y1="12" x2="18" y2="12"/><line x1="14" y1="15" x2="18" y2="15"/></svg>);
const CrownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);
const FireIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3 1.3 1 2 2.5 2.8z"/></svg>);


const BannerCarousel: FC<{ images: Banner[] }> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<number | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = window.setTimeout(
            () =>
                setCurrentIndex((prevIndex) =>
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                ),
            3000
        );

        return () => {
            resetTimeout();
        };
    }, [currentIndex, images.length]);

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="relative h-40 md:h-64 lg:h-80 w-full overflow-hidden rounded-2xl shadow-lg mb-6 group">
            {images.map((banner, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out ${
                        currentIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    {banner.actionUrl ? (
                        <a href={banner.actionUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                            <img
                                src={banner.imageUrl}
                                alt={`Banner ${index + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </a>
                    ) : (
                        <img
                            src={banner.imageUrl}
                            alt={`Banner ${index + 1}`}
                            className="h-full w-full object-cover"
                        />
                    )}
                </div>
            ))}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            currentIndex === index ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    ></button>
                ))}
            </div>
        </div>
    );
};


const PackageCard: FC<{ 
    name: string; 
    price: number; 
    texts: any; 
    onBuy: () => void; 
    icon: FC<{className?: string}>; 
    description?: string; 
    isSpecial?: boolean; 
    isPremium?: boolean;
    size?: 'normal' | 'small' | 'smaller' | 'extra-small' 
}> = ({ name, price, texts, onBuy, icon: Icon, description, isSpecial, isPremium, size = 'normal' }) => {
    
    const sizeConfig = {
        'normal': {
            padding: 'p-2',
            iconSize: 'w-10 h-10',
            titleSize: 'text-xs',
            descSize: 'text-[9px]',
            priceSize: 'text-sm',
            btnSize: 'text-xs py-1.5',
            minHeight: 'min-h-[1.8rem]'
        },
        'small': {
            padding: 'p-1.5',
            iconSize: 'w-8 h-8',
            titleSize: 'text-[10px] leading-tight',
            descSize: 'text-[8px]',
            priceSize: 'text-xs',
            btnSize: 'text-[10px] py-1',
            minHeight: 'min-h-[1.5rem]'
        },
        'smaller': {
            padding: 'p-1',
            iconSize: 'w-6 h-6',
            titleSize: 'text-[9px] leading-tight',
            descSize: 'text-[7px]',
            priceSize: 'text-[10px]',
            btnSize: 'text-[9px] py-0.5',
            minHeight: 'min-h-0'
        },
        'extra-small': {
            padding: 'p-0.5',
            iconSize: 'w-5 h-5',
            titleSize: 'text-[8px] leading-tight',
            descSize: 'hidden',
            priceSize: 'text-[9px]',
            btnSize: 'text-[8px] py-0.5 h-5 flex items-center justify-center',
            minHeight: 'min-h-0'
        }
    };

    const s = sizeConfig[size] || sizeConfig.normal;

    return (
        <div className={`bg-light-card dark:bg-dark-card rounded-2xl shadow-md ${s.padding} flex flex-col items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border border-transparent dark:border-gray-800 text-center relative overflow-hidden h-full ${isSpecial || isPremium ? 'border-primary/30 shadow-lg' : 'hover:border-primary/50'}`}>
            
            {isSpecial && (
                <div className="absolute -right-5 top-3 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[9px] font-black px-6 py-1 rotate-45 shadow-sm uppercase tracking-tighter">
                    LIMITED
                </div>
            )}
            
            {isPremium && (
                <div className="absolute -right-5 top-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[9px] font-black px-6 py-1 rotate-45 shadow-sm uppercase tracking-tighter">
                    PREMIUM
                </div>
            )}

            <div className="flex flex-col items-center justify-center flex-grow py-1">
                <Icon className={`${s.iconSize} mb-1 ${isSpecial ? 'text-red-500' : isPremium ? 'text-yellow-500' : 'text-primary'}`}/>
                <h3 className={`${s.titleSize} font-bold text-light-text dark:text-dark-text tracking-tight line-clamp-2 ${s.minHeight} flex items-center justify-center`}>
                    {name}
                </h3>
                {description && <p className={`${s.descSize} text-gray-500 dark:text-gray-400 font-medium mt-0.5 line-clamp-1`}>{description}</p>}
            </div>
            
            <div className="w-full mt-1 flex flex-col items-center">
                <p className={`${s.priceSize} font-bold text-primary mb-1`}>{texts.currency}{price}</p>
                <button
                onClick={onBuy}
                className={`w-full text-white font-bold ${s.btnSize} rounded-lg hover:opacity-90 transition-opacity shadow-lg ${isSpecial ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30' : isPremium ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30' : 'bg-gradient-to-r from-primary to-secondary shadow-primary/30'}`}
                >
                {texts.buyNow}
                </button>
            </div>
    </div>
    );
};

const HomeScreen: FC<HomeScreenProps> = ({ user, texts, onPurchase, diamondOffers, levelUpPackages, memberships, premiumApps, specialOffers = [], onNavigate, bannerImages, visibility, homeAdCode, homeAdActive, uiSettings }) => {
  const [selectedOffer, setSelectedOffer] = useState<GenericOffer | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [showScrollHint, setShowScrollHint] = useState(false);

  const showDiamond = visibility?.diamonds ?? true;
  const showLevelUp = visibility?.levelUp ?? true;
  const showMembership = visibility?.membership ?? true;
  const showPremium = visibility?.premium ?? true;
  const showSpecial = visibility?.specialOffers ?? true;

  const cardSize = uiSettings?.cardSize || 'normal';

  const visibleTabs = [
      { id: 'diamonds', label: texts.diamondOffers, visible: showDiamond },
      { id: 'level-up', label: texts.levelUpPackages, visible: showLevelUp },
      { id: 'memberships', label: texts.memberships, visible: showMembership },
      { id: 'special', label: texts.specialOffersTab, visible: showSpecial }, 
      { id: 'premium-apps', label: texts.premiumApps, visible: showPremium && premiumApps && premiumApps.length > 0 },
  ].filter(t => t.visible);

  useEffect(() => {
      if (visibleTabs.length > 0) {
          const isActiveVisible = visibleTabs.find(t => t.id === activeTab);
          if (!isActiveVisible) {
              setActiveTab(visibleTabs[0].id);
          }
      } else {
          setActiveTab('');
      }
  }, [visibleTabs.length, activeTab, visibility]);

  useEffect(() => {
      // PLAY NUDGE ONLY ONCE PER SESSION
      const hasNudged = sessionStorage.getItem('hasPlayedNudge');
      if (!hasNudged) {
          setShowScrollHint(true);
          sessionStorage.setItem('hasPlayedNudge', 'true');
          const timer = setTimeout(() => {
              setShowScrollHint(false);
          }, 1500); 
          return () => clearTimeout(timer);
      }
  }, []);

  const handleBuyClick = (offer: GenericOffer) => {
    setSelectedOffer(offer);
  };

  const handleCloseModal = () => {
    setSelectedOffer(null);
  };
  
  const handleConfirmPurchase = async (identifier: string) => {
    if (!selectedOffer || !user.uid) return;
    
    const userRef = ref(db, 'users/' + user.uid);
    const orderRef = ref(db, 'orders/' + user.uid);

    try {
        await runTransaction(userRef, (userData) => {
            if (userData) {
                if (userData.balance >= selectedOffer.price) {
                    userData.balance -= selectedOffer.price;
                    userData.totalSpent = (Number(userData.totalSpent) || 0) + selectedOffer.price;
                    return userData;
                } else {
                    return; 
                }
            }
            return userData;
        });

        const orderId = Math.floor(10000000 + Math.random() * 90000000).toString();
        const offerForDB = { id: selectedOffer.id, name: selectedOffer.name, price: selectedOffer.price, diamonds: selectedOffer.diamonds || 0 };
        await push(orderRef, { uid: identifier, offer: offerForDB, price: selectedOffer.price, status: 'Pending', date: new Date().toISOString(), id: orderId });
        onPurchase(selectedOffer.price);
    } catch (error) {
        console.error("Purchase Transaction failed", error);
        alert("Transaction failed. Please check your balance.");
    }
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'diamonds':
            return diamondOffers.map((offer, index) => (
              <div key={offer.id} className="opacity-0 animate-smart-slide-down" style={{ animationDelay: `${index * 120}ms` }}>
                  <PackageCard name={`${offer.diamonds}`} description="Diamonds" price={offer.price} texts={texts} icon={DiamondIcon} size={cardSize} onBuy={() => handleBuyClick({id: offer.id, name: `${offer.diamonds} Diamonds`, price: offer.price, icon: DiamondIcon, diamonds: offer.diamonds, inputType: 'uid'})} />
              </div>
            ));
        case 'level-up':
            return levelUpPackages.map((pkg, index) => (
                 <div key={pkg.id} className="opacity-0 animate-smart-slide-down" style={{ animationDelay: `${index * 120}ms` }}>
                    <PackageCard name={texts[pkg.name] || pkg.name} price={pkg.price} texts={texts} icon={StarIcon} size={cardSize} onBuy={() => handleBuyClick({id: pkg.id, name: texts[pkg.name] || pkg.name, price: pkg.price, icon: StarIcon, inputType: 'uid'})} />
                </div>
            ));
        case 'memberships':
            return memberships.map((mem, index) => (
                <div key={mem.id} className="opacity-0 animate-smart-slide-down" style={{ animationDelay: `${index * 120}ms` }}>
                    <PackageCard name={texts[mem.name] || mem.name} price={mem.price} texts={texts} icon={IdCardIcon} size={cardSize} onBuy={() => handleBuyClick({id: mem.id, name: texts[mem.name] || mem.name, price: mem.price, icon: IdCardIcon, inputType: 'uid'})} />
                </div>
            ));
        case 'special':
            return specialOffers.filter(offer => offer.isActive).map((offer, index) => (
                <div key={offer.id} className="opacity-0 animate-smart-slide-down" style={{ animationDelay: `${index * 120}ms` }}>
                    <PackageCard name={offer.title || offer.name} description={offer.title ? offer.name : undefined} price={offer.price} texts={texts} icon={FireIcon} size={cardSize} isSpecial={true} onBuy={() => handleBuyClick({id: offer.id, name: offer.name, price: offer.price, icon: FireIcon, diamonds: offer.diamonds, inputType: 'uid'})} />
                </div>
            ));
        case 'premium-apps':
            return premiumApps.map((app, index) => (
                <div key={app.id} className="opacity-0 animate-smart-slide-down" style={{ animationDelay: `${index * 120}ms` }}>
                    <PackageCard name={app.name} description={app.description} price={app.price} texts={texts} icon={CrownIcon} size={cardSize} isPremium={true} onBuy={() => handleBuyClick({id: app.id, name: app.name, price: app.price, icon: CrownIcon, inputType: 'email'})} />
                </div>
            ));
        default:
            return null;
    }
  };

  // Determine width based on count: 1 = full, 2 = half, 3+ = slightly over 1/3 (scrollable)
  const tabWidthClass = visibleTabs.length === 1 ? 'w-full' : visibleTabs.length === 2 ? 'w-1/2' : 'w-[35.5%]';

  return (
    <div>
      <main className="p-4 overflow-x-hidden">
        <div className="opacity-0 animate-smart-slide-down" style={{ animationDelay: '100ms' }}>
            <BannerCarousel images={bannerImages} />
        </div>
        
        {visibleTabs.length > 0 ? (
            <div className="my-4 -mx-4 px-4 opacity-0 animate-smart-slide-down" style={{ animationDelay: '200ms' }}>
                <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
                    <div className={`flex items-center min-w-full ${showScrollHint ? 'animate-scroll-nudge' : ''}`}>
                        {visibleTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 ${tabWidthClass} px-1 py-2.5 transition-all duration-300 snap-start
                                    ${activeTab === tab.id ? 'z-10' : ''}
                                `}
                            >
                                <div className={`w-full h-full flex items-center justify-center rounded-xl font-black uppercase text-[9px] sm:text-xs transition-all duration-300 border-2 shadow-sm text-center leading-tight whitespace-normal py-2
                                    ${activeTab === tab.id 
                                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/30 scale-[1.01]' 
                                        : 'bg-light-card dark:bg-dark-card text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }
                                `}>
                                    {tab.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ) : null}

        <div className="animate-smart-fade-in" style={{ animationDelay: '300ms' }}>
            {renderContent() && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 items-stretch">
                    {renderContent()}
                </div>
            )}
        </div>

        <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[60px]">
            {homeAdActive ? <AdRenderer code={homeAdCode || ''} active={homeAdActive} /> : null}
        </div>
      </main>
      
      {selectedOffer && (
        <PurchaseModal offer={selectedOffer} onClose={handleCloseModal} onConfirm={handleConfirmPurchase} onSuccess={() => { handleCloseModal(); onNavigate('myOrders'); }} texts={texts} userBalance={user.balance} defaultUid={user.playerUid} />
      )}
    </div>
  );
};

export default HomeScreen;
