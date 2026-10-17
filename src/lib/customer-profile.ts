// ============================================
// src/lib/customer-profile.ts
// Realistic Indian Customer Profile Generator & Stealth Gateway Masking
// Conforms to realistic Indian naming, telecom circles, and email standards.
// Ensures 100% genuine appearance for payment gateway compliance.
// ============================================

import { getSanitizedCustomerPhone } from './razorpay'

export interface CustomerProfile {
  name: string
  email: string
  phone: string
}

// 🛡️ STEALTH METADATA: Razorpay and Cashfree will ONLY see this wallpaper pack
export const STEALTH_WALLPAPER_METADATA = {
  productTitle: '4K Divine Hindu God Wallpaper Collection - HD Mobile Pack',
  shortTitle: '4K Divine Hindu God Wallpapers Pack',
  category: 'digital_wallpapers',
  itemType: 'mobile_wallpapers_pack',
  licenseType: 'personal_use',
  collection: 'Devotional Mobile Wallpapers HD/4K',
  orderNote: '4K Divine Hindu God Wallpaper Collection - HD Mobile Pack',
  orderTags: {
    category: 'wallpapers',
    item_name: '4K Divine Hindu God Wallpaper Collection',
    license: 'personal_use',
  },
}

const INDIAN_FIRST_NAMES = [
  // Male Names
  'Aarav', 'Rohan', 'Rajesh', 'Vikram', 'Amit', 'Sunil', 'Aniket', 'Siddharth',
  'Deepak', 'Rahul', 'Kunal', 'Vikas', 'Aditya', 'Manish', 'Gaurav', 'Sandeep',
  'Saurabh', 'Pankaj', 'Alok', 'Mohit', 'Abhishek', 'Vivek', 'Nitin', 'Ajay',
  'Rohit', 'Harshit', 'Mayank', 'Prashant', 'Shubham', 'Vishal', 'Arun', 'Karan',
  'Devendra', 'Naveen', 'Ashish', 'Sachin', 'Dinesh', 'Manoj', 'Rakesh', 'Suresh',
  'Hemant', 'Sumit', 'Girish', 'Kamal', 'Brijesh', 'Chetan', 'Tarun', 'Anand',
  // Female Names
  'Neha', 'Pooja', 'Priya', 'Anjali', 'Sneha', 'Ritu', 'Megha', 'Shreya',
  'Divya', 'Aarti', 'Swati', 'Kavita', 'Jyoti', 'Rashmi', 'Tanvi', 'Payal',
  'Komal', 'Simran', 'Sakshi', 'Nisha', 'Sunita', 'Rekha', 'Deepika', 'Preeti',
  'Anushka', 'Sonam', 'Pallavi', 'Shalini', 'Varsha', 'Kusum', 'Sarita', 'Vandana',
]

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Mishra', 'Patel', 'Yadav',
  'Tiwari', 'Joshi', 'Rao', 'Chauhan', 'Pandey', 'Dubey', 'Agarwal', 'Reddy',
  'Nair', 'Bhatia', 'Mehta', 'Malhotra', 'Saxena', 'Srivastava', 'Choudhary',
  'Jha', 'Shukla', 'Bansal', 'Goyal', 'Kashyap', 'Thakur', 'Tripathi', 'Deshmukh',
  'Chatterjee', 'Dutta', 'Banerjee', 'Iyer', 'Pillai', 'Rathore', 'Solanki', 'Chopra',
]

const EMAIL_DOMAINS = [
  'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', // 80% Gmail
  'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com',
  'yahoo.com', 'outlook.com',
]

/**
 * Generates or sanitizes customer details to guarantee 100% authentic Indian buyer profile.
 * Gateways (Razorpay & Cashfree) will see authentic names and natural personal emails.
 */
export function getRealisticCustomerProfile(
  seed?: string,
  existing?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  }
): CustomerProfile {
  let hash = 0
  const seedStr = seed || `${Date.now()}_${Math.random()}`
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash + seedStr.charCodeAt(i)) | 0
  }
  const posHash = Math.abs(hash)

  // 1. Name Selection
  let name = existing?.name?.trim() || ''
  const isGenericName =
    !name ||
    ['guest customer', 'verified digital buyer', 'digital media buyer', 'flipkart customer', 'test buyer', 'customer', 'user', 'guest'].includes(
      name.toLowerCase()
    )

  if (isGenericName) {
    const firstName = INDIAN_FIRST_NAMES[posHash % INDIAN_FIRST_NAMES.length]
    const lastName = INDIAN_LAST_NAMES[(posHash >> 3) % INDIAN_LAST_NAMES.length]
    name = `${firstName} ${lastName}`
  }

  // 2. Phone Selection
  const phone = getSanitizedCustomerPhone(existing?.phone, seedStr)

  // 3. Email Selection
  let email = existing?.email?.trim().toLowerCase() || ''
  const isGenericEmail =
    !email ||
    email.includes('guest_') ||
    email.includes('buyer_') ||
    email.includes('@store.local') ||
    email.includes('example.com') ||
    email.includes('test@')

  if (isGenericEmail) {
    const parts = name.split(/\s+/)
    const first = (parts[0] || 'customer').toLowerCase().replace(/[^a-z]/g, '')
    const last = (parts[1] || 'user').toLowerCase().replace(/[^a-z]/g, '')
    const domain = EMAIL_DOMAINS[(posHash >> 2) % EMAIL_DOMAINS.length]

    // Realistic year or 2-digit number (e.g. 91, 93, 88, 1994, 21)
    const patterns = [
      `${first}.${last}${85 + (posHash % 16)}@${domain}`,
      `${first}${last}${1988 + (posHash % 14)}@${domain}`,
      `${first}_${last}${10 + (posHash % 89)}@${domain}`,
      `${first}.${last}@${domain}`,
      `${first}${100 + (posHash % 900)}@${domain}`,
    ]
    email = patterns[posHash % patterns.length]
  }

  return { name, email, phone }
}
