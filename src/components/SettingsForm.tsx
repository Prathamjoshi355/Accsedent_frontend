import React, { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

export default function SettingsForm({ user, onUserUpdate, addLog }: any) {
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '')
  const [address, setAddress] = useState(user?.address || '')
  const [contacts, setContacts] = useState<any[]>(user?.contacts || [])
  const [newContact, setNewContact] = useState({ name: '', relationship: '', email: '', phone: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
    setBloodGroup(user?.bloodGroup || '')
    setAddress(user?.address || '')
    setContacts(user?.contacts || [])
  }, [user])

  const saveProfile = async () => {
    try {
      const result = await apiFetch('/users/update', { method: 'POST', body: { name, phone, bloodGroup, address } })
      onUserUpdate(result.user)
      setMessage('Profile updated successfully')
      addLog({ type: 'Profile Updated', payload: result.user, ts: new Date().toISOString() })
    } catch (err: any) {
      setMessage(err.error || 'Profile save failed')
    }
  }

  const loadContacts = async () => {
    try {
      const result = await apiFetch('/contacts')
      setContacts(result.contacts || [])
    } catch (err: any) {
      setMessage(err.error || 'Unable to load contacts')
    }
  }

  useEffect(() => { loadContacts() }, [])

  const saveContact = async () => {
    if (!newContact.name || !newContact.email) {
      setMessage('Name and email are required for emergency contacts')
      return
    }
    try {
      const result = await apiFetch('/contacts/add', { method: 'POST', body: newContact })
      setContacts(result.contacts || [])
      onUserUpdate({ ...user, contacts: result.contacts || [] })
      setNewContact({ name: '', relationship: '', email: '', phone: '' })
      setMessage('Emergency contact added')
      addLog({ type: 'Contact Added', payload: newContact, ts: new Date().toISOString() })
    } catch (err: any) {
      setMessage(err.error || 'Unable to add contact')
    }
  }

  const updateContact = async (index: number, values: any) => {
    try {
      const result = await apiFetch(`/contacts/update/${index}`, { method: 'POST', body: values })
      setContacts(result.contacts || [])
      onUserUpdate({ ...user, contacts: result.contacts || [] })
      setMessage('Contact updated')
      addLog({ type: 'Contact Updated', payload: values, ts: new Date().toISOString() })
    } catch (err: any) {
      setMessage(err.error || 'Unable to update contact')
    }
  }

  const deleteContact = async (index: number) => {
    try {
      const result = await apiFetch(`/contacts/delete/${index}`, { method: 'POST' })
      setContacts(result.contacts || [])
      setMessage('Contact removed')
      addLog({ type: 'Contact Deleted', payload: { index }, ts: new Date().toISOString() })
    } catch (err: any) {
      setMessage(err.error || 'Unable to delete contact')
    }
  }

  const sendTestEmail = async () => {
    try {
      await apiFetch('/test-email', { method: 'POST' })
      setMessage('Test email sent successfully')
      addLog({ type: 'Test Email Sent', payload: { email: user.email }, ts: new Date().toISOString() })
    } catch (err: any) {
      setMessage(err.error || 'Unable to send test email')
    }
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-3">Profile & Emergency Contacts</h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Full Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
          <label className="block text-sm font-medium">Phone Number</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile Number" />
          <label className="block text-sm font-medium">Blood Group</label>
          <input className="input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="Blood Group" />
          <label className="block text-sm font-medium">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          <button className="btn w-full" onClick={saveProfile}>Save Profile</button>
        </div>

        <div className="border-t border-slate-200/50 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Emergency Contacts</h4>
            <button className="btn text-sm" onClick={loadContacts}>Refresh</button>
          </div>
          <div className="space-y-2">
            {contacts.map((contact: any, index: number) => (
              <div key={index} className="rounded border border-slate-200/70 p-3 dark:border-slate-700">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-semibold">{contact.name || 'Unnamed'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{contact.relationship || 'Relationship'}</div>
                  </div>
                  <button className="btn bg-red-600 text-sm" onClick={() => deleteContact(index)}>Delete</button>
                </div>
                <div className="text-xs mt-2 text-slate-600 dark:text-slate-400">{contact.email} · {contact.phone}</div>
              </div>
            ))}
            {contacts.length === 0 && <div className="text-sm text-slate-500">No emergency contacts added yet.</div>}
          </div>

          <div className="mt-3 space-y-2">
            <h4 className="font-semibold">Add Contact</h4>
            <input className="input" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Contact Name" />
            <input className="input" value={newContact.relationship} onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })} placeholder="Relationship" />
            <input className="input" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="Email Address" />
            <input className="input" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Phone Number" />
            <button className="btn w-full" onClick={saveContact}>Add Contact</button>
          </div>
        </div>

        <button className="btn w-full bg-emerald-600" onClick={sendTestEmail}>Send Test Email</button>
        {message && <div className="text-sm text-slate-600 dark:text-slate-300">{message}</div>}
      </div>
    </div>
  )
}
