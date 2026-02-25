import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import {
  Mail, Phone, CheckCircle, AlertCircle, Loader2, ArrowRight,
  RefreshCw, Shield, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

// OTP Input Component
const OTPInput = ({ length = 6, value, onChange, disabled }) => {
  const inputRefs = useRef([]);
  const [otp, setOtp] = useState(new Array(length).fill(''));

  useEffect(() => {
    if (value === '') {
      setOtp(new Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Move to next input
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(new Array(length - pastedData.length).fill(''));
      setOtp(newOtp);
      onChange(newOtp.join(''));
      inputRefs.current[Math.min(pastedData.length, length - 1)].focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 focus:border-gold focus:ring-gold"
          data-testid={`otp-input-${index}`}
        />
      ))}
    </div>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ seconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <span className="font-mono text-gold">
      {minutes}:{secs.toString().padStart(2, '0')}
    </span>
  );
};

const VerifyAccountPage = () => {
  const { user, getAuthHeaders, refreshUser } = useApp();
  const navigate = useNavigate();

  const [emailOtp, setEmailOtp] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [canResendEmail, setCanResendEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEmailVerified(user.email_verified || false);
    setPhoneVerified(user.phone_verified || false);

    // If already verified, redirect to account
    if (user.email_verified) {
      toast.success('Email already verified!');
      navigate('/account');
    }
  }, [user, navigate]);

  const handleVerifyEmail = async () => {
    if (emailOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingEmail(true);
    try {
      await axios.post(`${API}/auth/verify-email`, { otp: emailOtp }, { headers: getAuthHeaders() });
      setEmailVerified(true);
      toast.success('Email verified successfully!');
      await refreshUser?.();
      // Redirect after short delay
      setTimeout(() => navigate('/account'), 1500);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid OTP');
      setEmailOtp('');
    }
    setVerifyingEmail(false);
  };

  const handleResendEmailOtp = async () => {
    setResendingEmail(true);
    try {
      await axios.post(`${API}/auth/resend-email-otp`, {}, { headers: getAuthHeaders() });
      toast.success('New OTP sent to your email!');
      setCanResendEmail(false);
      setResendCooldown(30);
      setEmailOtp('');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to resend OTP');
    }
    setResendingEmail(false);
  };

  if (!user) return null;

  // Mask email for display
  const maskedEmail = user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-gold">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-navy">Verify Account</span>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
              <Shield className="h-10 w-10 text-gold" />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-2">Verify Your Account</h1>
            <p className="text-muted-foreground">
              Complete the verification to unlock all features and place orders.
            </p>
          </div>

          {/* Email Verification Card */}
          <Card className={`mb-6 ${emailVerified ? 'border-green-500 bg-green-50/50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${emailVerified ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                    <Mail className={`h-6 w-6 ${emailVerified ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Email Verification</CardTitle>
                    <CardDescription>{maskedEmail}</CardDescription>
                  </div>
                </div>
                {emailVerified ? (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-4 w-4 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    <AlertCircle className="h-4 w-4 mr-1" /> Pending
                  </Badge>
                )}
              </div>
            </CardHeader>

            {!emailVerified && (
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the 6-digit code sent to your email
                  </p>
                  <OTPInput
                    value={emailOtp}
                    onChange={setEmailOtp}
                    disabled={verifyingEmail}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-gold hover:bg-gold-dark text-navy-dark font-semibold h-12"
                    onClick={handleVerifyEmail}
                    disabled={verifyingEmail || emailOtp.length !== 6}
                    data-testid="verify-email-btn"
                  >
                    {verifyingEmail ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>Verify Email <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="sm:w-auto"
                    onClick={handleResendEmailOtp}
                    disabled={resendingEmail || !canResendEmail}
                    data-testid="resend-email-otp-btn"
                  >
                    {resendingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : canResendEmail ? (
                      <><RefreshCw className="h-4 w-4 mr-2" /> Resend OTP</>
                    ) : (
                      <>Resend in <CountdownTimer seconds={resendCooldown} onComplete={() => setCanResendEmail(true)} /></>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  OTP expires in 5 minutes. Didn't receive the email? Check your spam folder.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Phone Verification Card (Coming Soon) */}
          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-500">Phone Verification</CardTitle>
                    <CardDescription>Coming Soon</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">Optional</Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Continue Button */}
          {emailVerified && (
            <div className="mt-6 text-center">
              <Link to="/account">
                <Button className="bg-gold hover:bg-gold-dark text-navy-dark font-semibold h-12 px-8">
                  Continue to My Account <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Having trouble? <Link to="/contact" className="text-gold hover:underline">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccountPage;
