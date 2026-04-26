import React, { useState, useRef, useEffect } from 'react'
import { authAPI } from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

interface EmailVerificationModalProps {
  isOpen: boolean
  email: string
  onClose: () => void
  onSuccess: () => void
}

const INPUT_CLASS = 'w-full bg-surface-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all'
const BTN_CLASS = 'w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl btn-glow transition-all flex items-center justify-center gap-2'

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ isOpen, email, onClose, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(60) // 60 seconds as per requirements
  const { updateUser } = useAuth()

  const otpRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (!isOpen) {
      setOtp(['','','','','',''])
      setError('')
      setCooldown(60)
    }
  }, [isOpen])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const cooldownDisplay = cooldown > 0
    ? `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
    : null

  const handleResendOtp = async () => {
    if (cooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await authAPI.resendVerification(email)
      setCooldown(60)
      setOtp(['','','','','',''])
      toast.success('New OTP sent to ' + email)
      otpRefs[0].current?.focus()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

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

  const handleVerifyOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.verifyEmail(email, otp.join(''))
      if (res.data.success && res.data.user) {
        // AuthContext updateUser doesn't replace the token logic, but sets the user in context.
        // Actually, since this is like a login, we should pass the whole user object to context
        // But since we can't easily call context.loginWithToken without token, 
        // we'll use updateUser and the useEffect in AuthContext will fetch /me.
        // Or better yet, we can do full page reload or onSuccess callback.
        
        // Save user to local storage manually to avoid race conditions
        localStorage.setItem('commuteSmart_user', JSON.stringify(res.data.user))
        updateUser(res.data.user)
        
        toast.success('Email verified successfully! 🎉')
        onSuccess()
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
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
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'transparent', border: 'none',
            color: '#9ca3af', cursor: 'pointer', fontSize: '20px', lineHeight: 1,
          }}
        >✕</button>

        <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>
          Verify Your Email
        </h2>
        <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px' }}>
          We sent a 6-digit code to <span style={{ color: '#0fb880' }}>{email}</span>
        </p>

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
          <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
          <span className="material-symbols-outlined text-lg">verified</span>
        </button>
      </div>
    </div>
  )
}

export default EmailVerificationModal
