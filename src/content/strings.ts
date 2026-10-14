/**
 * CamneX Centralized UI Strings & Translation System
 * Plain-language customer-facing text, centralized for consistency and field-level localization (English & Bengali).
 * Backed by admin-editable overrides from database SiteSettings.contentOverrides.
 * Fallback is English.
 */

export interface LocaleString {
  en: string;
  bn?: string;
}

export const TRANSLATIONS: Record<string, Record<string, LocaleString>> = {
  common: {
    companyName: { en: 'CamneX Bangladesh', bn: 'ক্যামনেক্স বাংলাদেশ' },
    viewAll: { en: 'View all', bn: 'সব দেখুন' },
    explore: { en: 'Explore', bn: 'দেখুন' },
    loading: { en: 'Loading...', bn: 'লোড হচ্ছে...' },
    currency: { en: 'BDT', bn: 'টাকা' },
    currencySymbol: { en: '৳', bn: '৳' },
    warranty: { en: 'Official Bangladesh Warranty', bn: 'অফিসিয়াল বাংলাদেশ ওয়ারেন্টি' },
    inStock: { en: 'In stock', bn: 'স্টকে আছে' },
    lowStock: { en: 'Low stock', bn: 'সীমিত স্টক' },
    outOfStock: { en: 'Out of stock', bn: 'স্টক শেষ' },
    askForPrice: { en: 'Ask for price', bn: 'মূল্য জানতে চান' },
    addToCart: { en: 'Add to cart', bn: 'কার্টে যোগ করুন' },
    buyNow: { en: 'Order now', bn: 'এখনই অর্ডার করুন' },
    filterBy: { en: 'Filter by', bn: 'ফিল্টার করুন' },
    clearFilters: { en: 'Clear filters', bn: 'ফিল্টার মুছুন' },
    resetFilters: { en: 'Reset filters', bn: 'রিসেট করুন' },
    backToHome: { en: 'Back to Home', bn: 'হোমে ফিরে যান' },
    save: { en: 'Save', bn: 'সংরক্ষণ করুন' },
    cancel: { en: 'Cancel', bn: 'বাতিল' },
    delete: { en: 'Delete', bn: 'মুছুন' },
    edit: { en: 'Edit', bn: 'সম্পাদনা' },
    search: { en: 'Search', bn: 'অনুসন্ধান' }
  },

  navigation: {
    home: { en: 'Home', bn: 'হোম' },
    packages: { en: 'Packages', bn: 'প্যাকেজ' },
    catalog: { en: 'Products', bn: 'পণ্যসমূহ' },
    solutions: { en: 'Solutions', bn: 'সমাধান' },
    services: { en: 'Services', bn: 'সার্ভিসসমূহ' },
    profile: { en: 'Company Profile', bn: 'কোম্পানি পরিচিতি' },
    cart: { en: 'Cart', bn: 'কার্ট' },
    wishlist: { en: 'Wishlist', bn: 'পছন্দের তালিকা' },
    compare: { en: 'Compare', bn: 'তুলনা করুন' },
    tracking: { en: 'Track Order', bn: 'অর্ডার ট্র্যাক' },
    account: { en: 'Account', bn: 'অ্যাকাউন্ট' },
    admin: { en: 'Admin', bn: 'অ্যাডমিন' },
    staff: { en: 'Staff', bn: 'স্টাফ' }
  },

  hero: {
    badge: { en: 'Security & Surveillance Hardware', bn: 'নিরাপত্তা ও নজরদারি হার্ডওয়্যার' },
    title: { en: 'Commercial Security & Network Hardware', bn: 'বাণিজ্যিক নিরাপত্তা ও নেটওয়ার্ক হার্ডওয়্যার' },
    subtitle: {
      en: 'Authorized distributor stock with genuine manufacturer warranty and direct support in Dhaka.',
      bn: 'জেনুইন প্রস্তুতকারক ওয়ারেন্টি এবং ঢাকায় সরাসরি সহায়তা সহ পরিবেশক স্টক।'
    },
    primaryCta: { en: 'Explore Products', bn: 'পণ্য দেখুন' },
    secondaryCta: { en: 'Ready-made Packages', bn: 'রেডিমেড প্যাকেজ' }
  },

  packages: {
    eyebrow: { en: 'Ready-made packages', bn: 'রেডিমেড প্যাকেজ' },
    title: { en: 'Complete CCTV Packages', bn: 'সম্পূর্ণ সিসিটিভি প্যাকেজ' },
    subtitle: {
      en: 'Camera sets with recorder, storage and cables. Pick a set, then adjust it to fit your place.',
      bn: 'রেকর্ডার, স্টোরেজ এবং ক্যাবল সহ ক্যামেরা সেট। একটি সেট বেছে নিন, তারপর আপনার স্থান অনুযায়ী সমন্বয় করুন।'
    },
    customizeButton: { en: 'Customize package', bn: 'প্যাকেজ কাস্টমাইজ করুন' },
    askForPrice: { en: 'Ask for price', bn: 'মূল্য জানতে চান' },
    cameraSetBadge: { en: 'Camera set', bn: 'ক্যামেরা সেট' },
    viewAllPackages: { en: 'All packages', bn: 'সব প্যাকেজ' },
    systemTypeLabel: { en: 'System type', bn: 'সিস্টেমের ধরন' },
    cameraCountLabel: { en: 'Cameras', bn: 'ক্যামেরা' },
    nightViewLabel: { en: 'Night view', bn: 'নাইট ভিশন' },
    allSystems: { en: 'All Systems', bn: 'সব সিস্টেম' },
    allCameras: { en: 'All', bn: 'সব' },
    allViews: { en: 'All Views', bn: 'সব নাইট ভিশন' },
    partsList: { en: 'Included parts', bn: 'সংযুক্ত যন্ত্রাংশ' },
    noPackagesFound: { en: 'No packages found matching this filter combination.', bn: 'এই ফিল্টারে কোনো প্যাকেজ পাওয়া যায়নি।' }
  },

  wifiCameras: {
    eyebrow: { en: 'Wi-Fi cameras', bn: 'ওয়াই-ফাই ক্যামেরা' },
    title: { en: 'Wi-Fi Cameras', bn: 'ওয়াই-ফাই ক্যামেরা' },
    subtitle: { en: 'Single cameras you control from a phone app', bn: 'মোবাইল অ্যাপ দিয়ে নিয়ন্ত্রিত স্বতন্ত্র ক্যামেরা' },
    buttonText: { en: 'Explore all Wi-Fi cameras', bn: 'সব ওয়াই-ফাই ক্যামেরা দেখুন' }
  },

  newArrivals: {
    eyebrow: { en: 'Just added', bn: 'নতুন সংযোজন' },
    title: { en: 'New Arrivals', bn: 'নতুন আগমন' },
    subtitle: { en: 'Fresh hardware models, switches, and camera additions', bn: 'নতুন হার্ডওয়্যার মডেল, সুইচ এবং ক্যামেরা' },
    buttonText: { en: 'View catalog', bn: 'ক্যাটালগ দেখুন' }
  },

  categories: {
    eyebrow: { en: 'Categories', bn: 'ক্যাটাগরি' },
    title: { en: 'Categories', bn: 'ক্যাটাগরিসমূহ' },
    subtitle: {
      en: 'Browse all security cameras, recorders, access control, and network hardware.',
      bn: 'সমস্ত নিরাপত্তা ক্যামেরা, রেকর্ডার, অ্যাক্সেস কন্ট্রোল এবং নেটওয়ার্ক হার্ডওয়্যার দেখুন।'
    }
  },

  solutions: {
    eyebrow: { en: 'By place', bn: 'স্থানভেদে' },
    title: { en: 'Solutions for Your Place', bn: 'আপনার স্থানের সমাধান' },
    subtitle: { en: 'Find the right setup for your place.', bn: 'আপনার নির্দিষ্ট স্থানের জন্য সঠিক সমাধান খুঁজুন।' },
    tailoredHeading: { en: 'Solutions', bn: 'সমাধান' }
  },

  accessories: {
    eyebrow: { en: 'Add-ons', bn: 'আনুষঙ্গিক' },
    title: { en: 'Accessories & Add-ons', bn: 'এক্সেসরিজ ও এক্সেসরি পার্টস' },
    subtitle: { en: 'Cables, hard drives, mounts, and power backup units.', bn: 'ক্যাবল, হার্ড ড্রাইভ, মাউন্ট এবং পাওয়ার ব্যাকআপ ইউনিট।' }
  },

  assistance: {
    pill: { en: 'Need help?', bn: 'সাহায্য দরকার?' },
    heading: { en: 'Need help choosing hardware?', bn: 'হার্ডওয়্যার নির্বাচনে সহায়তা দরকার?' },
    subtitle: {
      en: 'Our technical team provides clear hardware guidance for your building, store, or office.',
      bn: 'আমাদের প্রযুক্তিগত দল আপনার ভবন, দোকান বা অফিসের জন্য সঠিক হার্ডওয়্যার দিকনির্দেশনা দেবে।'
    },
    callbackButton: { en: 'Request a call back', bn: 'কল ব্যাক অনুরোধ' },
    bookVisitButton: { en: 'Book a site visit', bn: 'সাইট ভিজিট বুক করুন' }
  },

  newsletter: {
    headline: { en: 'Get product news and offers', bn: 'পণ্যের খবর এবং অফার পান' },
    subtitle: { en: 'Sign up for product releases and genuine hardware announcements.', bn: 'নতুন পণ্য প্রকাশ এবং অফিশিয়াল ঘোষণার জন্য সাবস্ক্রাইব করুন।' },
    placeholder: { en: 'Enter your email address...', bn: 'আপনার ইমেইল ঠিকানা লিখুন...' },
    button: { en: 'Subscribe', bn: 'সাবস্ক্রাইব' }
  },

  cart: {
    title: { en: 'Shopping Cart', bn: 'শপিং কার্ট' },
    emptyMessage: { en: 'Your cart is empty', bn: 'আপনার কার্ট খালি' },
    continueShopping: { en: 'Continue shopping', bn: 'কেনাকাটা চালিয়ে যান' },
    checkout: { en: 'Proceed to Checkout', bn: 'চেকআউট করুন' }
  },

  checkout: {
    title: { en: 'Checkout', bn: 'চেকআউট' },
    submitOrder: { en: 'Confirm Order', bn: 'অর্ডার নিশ্চিত করুন' },
    unconfiguredPayment: {
      en: 'Online checkout payments are currently being configured by our team. Please request a price quote or call us directly.',
      bn: 'অনলাইন চেকআউট পেমেন্ট প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কোটেশন অনুরোধ করুন বা সরাসরি যোগাযোগ করুন।'
    }
  }
};

/**
 * Backward compatibility UI_STRINGS object (English text)
 */
export const UI_STRINGS = Object.entries(TRANSLATIONS).reduce((acc, [sectionKey, sectionValues]) => {
  acc[sectionKey] = Object.entries(sectionValues).reduce((secAcc, [itemKey, localeStr]) => {
    secAcc[itemKey] = localeStr.en;
    return secAcc;
  }, {} as Record<string, string>);
  return acc;
}, {} as Record<string, Record<string, string>>) as {
  common: {
    companyName: string;
    viewAll: string;
    explore: string;
    loading: string;
    currency: string;
    currencySymbol: string;
    warranty: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    askForPrice: string;
    addToCart: string;
    buyNow: string;
    filterBy: string;
    clearFilters: string;
    resetFilters: string;
    backToHome: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
  };
  navigation: {
    home: string;
    packages: string;
    catalog: string;
    solutions: string;
    services: string;
    profile: string;
    cart: string;
    wishlist: string;
    compare: string;
    tracking: string;
    account: string;
    admin: string;
    staff: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  packages: {
    eyebrow: string;
    title: string;
    subtitle: string;
    customizeButton: string;
    askForPrice: string;
    cameraSetBadge: string;
    viewAllPackages: string;
    systemTypeLabel: string;
    cameraCountLabel: string;
    nightViewLabel: string;
    allSystems: string;
    allCameras: string;
    allViews: string;
    partsList: string;
    noPackagesFound: string;
  };
  wifiCameras: {
    eyebrow: string;
    title: string;
    subtitle: string;
    buttonText: string;
  };
  newArrivals: {
    eyebrow: string;
    title: string;
    subtitle: string;
    buttonText: string;
  };
  categories: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  solutions: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tailoredHeading: string;
  };
  accessories: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  assistance: {
    pill: string;
    heading: string;
    subtitle: string;
    callbackButton: string;
    bookVisitButton: string;
  };
  newsletter: {
    headline: string;
    subtitle: string;
    placeholder: string;
    button: string;
  };
  cart: {
    title: string;
    emptyMessage: string;
    continueShopping: string;
    checkout: string;
  };
  checkout: {
    title: string;
    submitOrder: string;
    unconfiguredPayment: string;
  };
  [key: string]: any;
};

/**
 * Field-level translation lookup with locale fallback & admin overrides support.
 * @param path e.g. "hero.title", "common.inStock"
 * @param locale 'en' | 'bn' (default: 'en')
 * @param overrides optional admin-entered overrides from SiteSettings.contentOverrides
 */
export function t(path: string, locale: 'en' | 'bn' = 'en', overrides?: Record<string, string>): string {
  // 1. Check admin overrides first
  if (overrides && overrides[path]) {
    return overrides[path];
  }

  // 2. Parse section and key
  const [section, key] = path.split('.');
  if (!section || !key || !TRANSLATIONS[section] || !TRANSLATIONS[section][key]) {
    return path; // Fallback to key
  }

  const entry = TRANSLATIONS[section][key];
  if (locale === 'bn' && entry.bn) {
    return entry.bn;
  }
  return entry.en;
}

export default UI_STRINGS;
