import LRUCache from 'lru-cache';
import crypto from 'crypto';

const OTP_STORE_MAX_LENGTH = 10000; // < 1 MB
const OTP_STORE_MAX_AGE = 10 * 60 * 1000; // 10 minutes

const otpStore = new LRUCache<string, string>({
  max: OTP_STORE_MAX_LENGTH,
  maxAge: OTP_STORE_MAX_AGE,
  stale: false,
  updateAgeOnGet: false,
});

function getRandomOtp(): string {
  const value = crypto.randomInt(0, 1000000);
  return ('000000' + value).slice(-6);
}

export function createOtp(email: string): string {
  const newOtp = getRandomOtp();
  otpStore.set(email, newOtp);
  return newOtp;
}

export function verifyOtp(email: string, otp: string) {
  return otpStore.get(email) === otp;
}
