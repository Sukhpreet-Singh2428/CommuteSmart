import React, { useState, useRef, useEffect } from 'react'
import api from '../lib/api'

type Step = 'email' | 'otp' | 'newpass'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

// ── Shared Tailwind classes copied from Login.tsx ────────────────────────────
const INPUT_CLASS = 'w-full bg-surface-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all'
const BTN_CLASS = 'w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl btn-glow transition-all flex items-center justify-center gap-2'

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep]               = useState<Step>('email')
  const [email, setEmail]             = useState('')
  const [otp, setOtp]                 = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken]   = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [cooldown, setCooldown]       = useState(0)
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const otpRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ]

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep('email'); setEmail(''); setOtp(['','','','','',''])
        setResetToken(''); setNewPassword(''); setConfirmPassword('')
        setError(''); setSuccess(''); setCooldown(0)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const cooldownDisplay = cooldown > 0
    ? `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
    : null

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email) return
    setError(''); setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setStep('otp')
      setCooldown(120)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to send OTP.')
    } finally { setLoading(false) }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0) return
    setError(''); setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setCooldown(120)
      setOtp(['','','','','',''])
      otpRefs[0].current?.focus()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to resend OTP.')
    } finally { setLoading(false) }
  }

  // ── OTP digit input handlers ───────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpRefs[index + 1].current?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    const focusIndex = Math.min(pasted.length, 5)
    otpRefs[focusIndex].current?.focus()
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError(''); setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otp: otp.join('') })
      setResetToken(res.data.resetToken)
      setStep('newpass')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Invalid OTP.')
    } finally { setLoading(false) }
  }

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(''); setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { resetToken, newPassword })
      setSuccess('Password updated successfully! You can now log in.')
      setTimeout(() => onClose(), 2000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Password reset failed.')
    } finally { setLoading(false) }
  }

  // ── Password strength ─────────────────────────────────────────────────────
  const getStrength = (p: string) => {
    if (!p) return { pct: 0, color: 'transparent', label: '' }
    if (p.length < 8) return { pct: 25, color: '#ef4444', label: 'Weak' }
    if (!/[0-9]/.test(p)) return { pct: 50, color: '#f97316', label: 'Fair' }
    if (!/[^a-zA-Z0-9]/.test(p)) return { pct: 75, color: '#eab308', label: 'Good' }
    return { pct: 100, color: '#00C853', label: 'Strong' }
  }
  const strength = getStrength(newPassword)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Modal box */}
        <div
          onClick={e => e.stopPropagation()}
          className="bg-background-dark border border-white/10"
          style={{
            width: '100%', maxWidth: '420px',
            borderRadius: '12px',
            padding: '32px',
            position: 'relative',
            margin: '16px',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'transparent', border: 'none',
              color: '#9ca3af', cursor: 'pointer', fontSize: '20px', lineHeight: 1,
            }}
          >✕</button>

          {/* ── STEP 1: Email ── */}
          {step === 'email' && (
            <>
              <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>
                Reset Password
              </h2>
              <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px' }}>
                Enter your registered email to receive an OTP.
              </p>

              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                placeholder="name@example.com"
                autoFocus
                className={INPUT_CLASS}
              />

              {error && (
                <div className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${error.includes('sign-in') ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  <span className="material-symbols-outlined text-sm mt-0.5">{error.includes('sign-in') ? 'info' : 'error'}</span>
                  <p className="text-[13px] leading-tight">{error}</p>
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={!email || loading}
                className={BTN_CLASS}
                style={{ marginTop: '16px', opacity: (!email || loading) ? 0.6 : 1 }}
              >
                <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
                <span className="material-symbols-outlined text-lg">mail</span>
              </button>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <>
              <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>
                Enter OTP
              </h2>
              <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px' }}>
                6-digit code sent to <span style={{ color: '#0fb880' }}>{email}</span>
              </p>

              {/* 6-digit OTP boxes */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="bg-surface-dark/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    style={{
                      width: '44px', height: '52px',
                      textAlign: 'center', fontSize: '22px', fontWeight: 700,
                      color: '#fff',
                      borderColor: digit ? '#0fb880' : undefined,
                    }}
                  />
                ))}
              </div>

              {/* Resend */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                {cooldownDisplay
                  ? <span style={{ color: '#6b7280', fontSize: '13px' }}>Resend OTP in {cooldownDisplay}</span>
                  : <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      style={{ background: 'transparent', border: 'none', color: '#0fb880', fontSize: '13px', cursor: 'pointer' }}
                    >Resend OTP</button>
                }
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join('').length !== 6 || loading}
                className={BTN_CLASS}
                style={{ opacity: (otp.join('').length !== 6 || loading) ? 0.6 : 1 }}
              >
                <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
                <span className="material-symbols-outlined text-lg">verified</span>
              </button>

              <button
                onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']) }}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', display: 'block', margin: '12px auto 0' }}
              >← Back</button>
            </>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 'newpass' && (
            <>
              <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>
                New Password
              </h2>
              <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px' }}>
                Choose a strong password for your account.
              </p>

              <label className="block text-sm font-medium text-gray-400 mb-2">
                New Password
              </label>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px' }}
                >{showPass ? '🙈' : '👁'}</button>
              </div>

              {/* Strength bar */}
              {newPassword && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ height: '4px', background: '#1f2937', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <span style={{ color: strength.color, fontSize: '11px' }}>{strength.label}</span>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm Password
              </label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  placeholder="Repeat password"
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px' }}
                >{showConfirm ? '🙈' : '👁'}</button>
              </div>

              {error   && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
              {success && <p style={{ color: '#0fb880', fontSize: '13px', margin: '0 0 12px' }}>{success}</p>}

              <button
                onClick={handleResetPassword}
                disabled={!newPassword || !confirmPassword || loading}
                className={BTN_CLASS}
                style={{ opacity: (!newPassword || !confirmPassword || loading) ? 0.6 : 1 }}
              >
                <span>{loading ? 'Updating...' : 'Update Password'}</span>
                <span className="material-symbols-outlined text-lg">lock_reset</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ForgotPasswordModal
