/**
 * OTP Service
 * Handles OTP generation, sending via EmailJS, and verification.
 * For a frontend-only app, OTP is generated client-side and sent via EmailJS.
 */

import { getEmailJSConfig } from './apiConfig';

// ─── OTP Storage (in-memory for current session) ──────────────────
interface OTPRecord {
  code: string;
  email: string;
  phone?: string;
  method: 'email' | 'sms';
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

let currentOTP: OTPRecord | null = null;

// ─── Generate 6-digit OTP ─────────────────────────────────────────
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Send OTP via EmailJS ─────────────────────────────────────────
async function sendOTPViaEmail(email: string, otp: string): Promise<boolean> {
  const config = getEmailJSConfig();

  if (!config) {
    // If EmailJS is not configured, use demo mode
    console.log(`[DEMO MODE] OTP for ${email}: ${otp}`);
    return true;
  }

  try {
    // Dynamically import EmailJS
    const emailjs = await import('@emailjs/browser');

    await emailjs.send(
      config.serviceId,
      config.templateId,
      {
        to_email: email,
        otp_code: otp,
        app_name: 'Aavis - Food Scanner',
        expiry_time: '5 minutes',
      },
      config.publicKey
    );

    return true;
  } catch (error) {
    console.error('EmailJS send failed:', error);
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────

export type OTPMethod = 'email' | 'sms';

export interface SendOTPResult {
  success: boolean;
  message: string;
  isDemoMode: boolean;
  demoOTP?: string; // Only in demo mode for testing
}

/**
 * Send OTP to the user's chosen channel
 */
export async function sendOTP(
  target: string,
  method: OTPMethod
): Promise<SendOTPResult> {
  const code = generateOTPCode();
  const config = getEmailJSConfig();
  const isDemoMode = !config;

  // Store OTP with 5-minute expiry
  currentOTP = {
    code,
    email: method === 'email' ? target : '',
    phone: method === 'sms' ? target : undefined,
    method,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
    verified: false,
  };

  if (method === 'email') {
    const sent = await sendOTPViaEmail(target, code);
    if (sent) {
      return {
        success: true,
        message: isDemoMode
          ? `Demo mode: Your OTP is ${code} (In production, this would be sent to ${target})`
          : `OTP sent successfully to ${target}`,
        isDemoMode,
        demoOTP: isDemoMode ? code : undefined,
      };
    }
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
      isDemoMode,
    };
  }

  if (method === 'sms') {
    // SMS requires a backend service (Twilio, etc.)
    // For now, demo mode
    return {
      success: true,
      message: `Demo mode: Your OTP is ${code} (SMS sending requires backend setup)`,
      isDemoMode: true,
      demoOTP: code,
    };
  }

  return {
    success: false,
    message: 'Invalid OTP method.',
    isDemoMode: false,
  };
}

/**
 * Verify the OTP entered by user
 */
export interface VerifyOTPResult {
  success: boolean;
  message: string;
}

export function verifyOTP(enteredCode: string): VerifyOTPResult {
  if (!currentOTP) {
    return {
      success: false,
      message: 'No OTP was generated. Please request a new one.',
    };
  }

  // Check expiry
  if (Date.now() > currentOTP.expiresAt) {
    currentOTP = null;
    return {
      success: false,
      message: 'OTP has expired. Please request a new one.',
    };
  }

  // Check max attempts (5)
  currentOTP.attempts += 1;
  if (currentOTP.attempts > 5) {
    currentOTP = null;
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.',
    };
  }

  // Verify
  if (enteredCode === currentOTP.code) {
    currentOTP.verified = true;
    return {
      success: true,
      message: 'OTP verified successfully!',
    };
  }

  return {
    success: false,
    message: `Incorrect OTP. ${5 - currentOTP.attempts} attempts remaining.`,
  };
}

/**
 * Check if current OTP session is verified
 */
export function isOTPVerified(): boolean {
  return currentOTP?.verified ?? false;
}

/**
 * Clear OTP state
 */
export function clearOTP(): void {
  currentOTP = null;
}

/**
 * Get time remaining for current OTP (in seconds)
 */
export function getOTPTimeRemaining(): number {
  if (!currentOTP) return 0;
  const remaining = Math.max(0, currentOTP.expiresAt - Date.now());
  return Math.ceil(remaining / 1000);
}
