import React, { useState } from 'react'
import { apiFetch, saveToken } from '../utils/api'
import { saveState } from '../utils/storage'

export default function LoginPanel({ onLogin }: any) {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email')
  const [message, setMessage] = useState('')
  const [otp, setOtp] = useState('')

  const requestOtp = async () => {
    if (!email) return setMessage('Enter an email address')
    try {
      const data = await apiFetch('/auth/request-otp', {
        method: 'POST',
        body: { email, debug: true }
      })
      setStep('verify')
      setOtp(data.debugCode || '')
      setMessage(data.debugCode ? `Test OTP: ${data.debugCode}` : 'OTP sent. Check your inbox.')
    } catch (err: any) {
      setMessage(err?.error || 'Unable to send OTP')
    }
  }

  const verifyOtp = async () => {
    if (!otp) return setMessage('Enter the OTP code')
    try {
      const data = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: { email, code: otp }
      })
      saveToken(data.token)
      saveState('user', data.user)
      onLogin(data.user)
    } catch (err: any) {
      setMessage(err?.error || 'OTP verification failed')
    }
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
