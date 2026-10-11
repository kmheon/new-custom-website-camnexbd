/**
 * CamneX Centralized UI Strings
 * Plain-language customer-facing text, centralized for consistency and future localization (Bangla).
 * No marketing buzzwords: short, everyday words customers understand.
 */

export const UI_STRINGS = {
  common: {
    companyName: 'CamneX Bangladesh',
    viewAll: 'View all',
    explore: 'Explore',
    loading: 'Loading...',
    currency: 'BDT',
    warranty: 'Official Bangladesh Warranty',
    inStock: 'In stock',
    askForPrice: 'Ask for price',
    addToCart: 'Add to cart',
    buyNow: 'Order now',
    filterBy: 'Filter by',
    clearFilters: 'Clear filters',
    resetFilters: 'Reset filters',
  },

  navigation: {
    home: 'Home',
    packages: 'Packages',
    catalog: 'Products',
    solutions: 'Solutions',
    services: 'Services',
    profile: 'Company Profile',
    cart: 'Cart',
    admin: 'Admin',
    staff: 'Staff',
  },

  hero: {
    badge: 'Security & Surveillance Hardware',
    title: 'Commercial Security & Network Hardware',
    subtitle: 'Authorized distributor stock with genuine manufacturer warranty and direct support in Dhaka.',
    primaryCta: 'Explore Products',
    secondaryCta: 'Ready-made Packages',
  },

  packages: {
    eyebrow: 'Ready-made packages',
    title: 'Complete CCTV Packages',
    subtitle: 'Camera sets with recorder, storage and cables. Pick a set, then adjust it to fit your place.',
    customizeButton: 'Customize package',
    askForPrice: 'Ask for price',
    cameraSetBadge: 'Camera set',
    viewAllPackages: 'All packages',
    systemTypeLabel: 'System type',
    cameraCountLabel: 'Cameras',
    nightViewLabel: 'Night view',
    allSystems: 'All Systems',
    allCameras: 'All',
    allViews: 'All Views',
    partsList: 'Included parts',
    noPackagesFound: 'No packages found matching this filter combination.',
  },

  wifiCameras: {
    eyebrow: 'Wi-Fi cameras',
    title: 'Wi-Fi Cameras',
    subtitle: 'Single cameras you control from a phone app',
    buttonText: 'Explore all Wi-Fi cameras',
  },

  newArrivals: {
    eyebrow: 'Just added',
    title: 'New Arrivals',
    subtitle: 'Fresh hardware models, switches, and camera additions',
    buttonText: 'View catalog',
  },

  categories: {
    eyebrow: 'Categories',
    title: 'Categories',
    subtitle: 'Browse all security cameras, recorders, access control, and network hardware.',
  },

  solutions: {
    eyebrow: 'By place',
    title: 'Solutions for Your Place',
    subtitle: 'Find the right setup for your place.',
    tailoredHeading: 'Solutions',
  },

  accessories: {
    eyebrow: 'Add-ons',
    title: 'Accessories & Add-ons',
    subtitle: 'Cables, hard drives, mounts, and power backup units.',
  },

  assistance: {
    pill: 'Need help?',
    heading: 'Need help choosing hardware?',
    subtitle: 'Our technical team provides clear hardware guidance for your building, store, or office.',
    callbackButton: 'Request a call back',
    bookVisitButton: 'Book a site visit',
  },

  newsletter: {
    headline: 'Get product news and offers',
    subtitle: 'Sign up for product releases and genuine hardware announcements.',
    placeholder: 'Enter your email address...',
    button: 'Subscribe',
  },

  cart: {
    title: 'Shopping Cart',
    emptyMessage: 'Your cart is empty',
    continueShopping: 'Continue shopping',
    checkout: 'Proceed to Checkout',
  },

  checkout: {
    title: 'Checkout',
    submitOrder: 'Confirm Order',
  }
} as const;

export default UI_STRINGS;

