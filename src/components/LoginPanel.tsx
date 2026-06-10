import React, { useState } from 'react'
import { saveToken } from '../utils/api'
import { saveState } from '../utils/storage'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function LoginPanel({ onLogin }: any) {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email')
  const [message, setMessage] = useState('')
  const [otp, setOtp] = useState('')

  const requestOtp = async () => {
    if (!email) return setMessage('Enter an email address')
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, debug: true })
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'Unable to send OTP')
      return
    }
    setStep('verify')
    setOtp(data.debugCode || '')
    setMessage(data.debugCode ? `Test OTP: ${data.debugCode}` : 'OTP sent. Check your inbox.')
  }

  const verifyOtp = async () => {
    if (!otp) return setMessage('Enter the OTP code')
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: otp })
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'OTP verification failed')
      return
    }
    saveToken(data.token)
    saveState('user', data.user)
    onLogin(data.user)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
      <div className="w-full max-w-md rounded-3xl bg-slate-800 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold mb-4 text-center">Accident Guardian</h1>
        {step === 'email' ? (
          <>
            <p className="mb-4 text-sm text-slate-300">Enter your email to receive a login code.</p>
            <input className="input w-full mb-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
            <button className="btn w-full" onClick={requestOtp}>Send OTP</button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-300">Enter the 6-digit code sent to {email}.</p>
            <input className="input w-full mb-3" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP code" />
            <button className="btn w-full" onClick={verifyOtp}>Verify OTP</button>
            {otp && <p className="mt-2 text-sm text-emerald-300">Auto-filled test OTP: {otp}</p>}
          </>
        )}
        {message && <p className="mt-4 text-sm text-amber-300">{message}</p>}
      </div>
    </div>
  )
}
