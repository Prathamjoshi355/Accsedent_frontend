import React, { useEffect, useState } from 'react'
import LoginPanel from './components/LoginPanel'
import BLEPanel from './components/BLEPanel'
import AlertModal from './components/AlertModal'
import SettingsForm from './components/SettingsForm'
import { loadState, saveState, clearState } from './utils/storage'
import { apiFetch, clearToken, clearUser } from './utils/api'

export default function App() {
  const [dark, setDark] = useState(() => loadState('theme') === 'dark')
  const [alerts, setAlerts] = useState<any[]>(() => loadState('alerts') || [])
  const [alertActive, setAlertActive] = useState(false)
  const [lastAlert, setLastAlert] = useState<any>(null)
  const [user, setUser] = useState<any>(() => loadState('user'))
  const [emailTestMode, setEmailTestMode] = useState(() => loadState('emailTestMode') !== false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    saveState('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => saveState('alerts', alerts), [alerts])
  useEffect(() => saveState('user', user), [user])
  useEffect(() => saveState('emailTestMode', emailTestMode), [emailTestMode])

  const logEvent = (entry: any) => console.debug('App log:', entry)

  const handleAlert = async (payload: any) => {
    const a = { ...payload, timestamp: new Date().toISOString() }
    setAlerts((s) => [a, ...s])
    setLastAlert(a)
    setAlertActive(true)

    if (emailTestMode) {
      logEvent({ type: 'SOS Test Mode', payload: a, ts: new Date().toISOString() })
      return
    }

    try {
      await apiFetch('/send-alert', { method: 'POST', body: { lat: a.location?.lat, lng: a.location?.lng, alertText: a.raw || a.alert } })
      logEvent({ type: 'Email Sent', payload: { alert: a.alert }, ts: new Date().toISOString() })
    } catch (e: any) {
      logEvent({ type: 'Email Error', payload: e.error || e.message || 'Unable to send email', ts: new Date().toISOString() })
    }
  }

  const handleLogin = (userData: any) => {
    setUser(userData)
  }

  const logout = () => {
    clearToken()
    clearUser()
    clearState('user')
    setUser(null)
  }

  if (!user) {
    return <LoginPanel onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen p-4 bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-3xl font-semibold">Accident Guardian</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Secure BLE accident monitoring with emergency workflows.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{user.name || user.email}</span>
          <button className="btn" onClick={() => setDark((d) => !d)}>{dark ? 'Light' : 'Dark'}</button>
          <button className={`btn ${emailTestMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-700'}`} onClick={() => setEmailTestMode((v) => !v)}>{emailTestMode ? 'Test Mode' : 'Live Email'}</button>
          <button className="btn bg-red-600" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <BLEPanel onLog={logEvent} onAlert={handleAlert} />
        </section>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">User Information</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Profile data</span>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">Name:</span> {user.name || 'Not set'}</div>
              <div><span className="font-semibold">Email:</span> {user.email}</div>
              <div><span className="font-semibold">Phone:</span> {user.phone || 'Not set'}</div>
              <div><span className="font-semibold">Blood Group:</span> {user.bloodGroup || 'Optional'}</div>
            </div>
          </div>

          <SettingsForm user={user} onUserUpdate={setUser} addLog={logEvent} />

          <div className="card p-4">
            <h3 className="font-semibold mb-2">Alert History</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {alerts.map((a, i) => (
                <div key={i} className="rounded border border-slate-200/50 p-3 bg-slate-50 dark:bg-slate-900">
                  <div className="font-semibold">{a.alert || a.raw || 'Emergency event'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(a.timestamp).toLocaleString()}</div>
                  <div className="text-xs">{a.location?.fullAddress || `${a.location?.lat}, ${a.location?.lng}`}</div>
                </div>
              ))}
              {alerts.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No alert history yet.</div>}
            </div>
          </div>
        </aside>
      </main>

      <AlertModal active={alertActive} alert={lastAlert} onClose={() => setAlertActive(false)} />
    </div>
  )
}
