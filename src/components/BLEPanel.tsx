import React, { useState, useRef } from 'react'
import { loadState, saveState } from '../utils/storage'

export default function BLEPanel({ onLog, onAlert }: any) {
  const [device, setDevice] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const keywords = useRef<string[]>(loadState('keywords') || ['ACCIDENT','SOS','EMERGENCY','CRASH','1'])
  const [rssi, setRssi] = useState<number | null>(null)
  const [location, setLocation] = useState<any>(null)
  const [lastData, setLastData] = useState<string>('')
  const [lastActivity, setLastActivity] = useState<string>('')

  const requestDevice = async () => {
    try {
      onLog({ type: 'Scan Started', ts: new Date().toISOString() })
      const d: any = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [] })
      setDevice(d)
      onLog({ type: 'Device Selected', payload: { name: d.name, id: d.id }, ts: new Date().toISOString() })
      await connect(d)
    } catch (err: any) { onLog({ type: 'Scan Error', payload: err.message, ts: new Date().toISOString() }) }
  }

  const connect = async (d: any) => {
    try {
      const server = await d.gatt.connect()
      setConnected(true)
      onLog({ type: 'Device Connected', payload: { name: d.name, id: d.id }, ts: new Date().toISOString() })

      const svcs = await server.getPrimaryServices()
      const discovered = []
      for (const s of svcs) {
        const ch = await s.getCharacteristics()
        discovered.push({ uuid: s.uuid, characteristics: ch.map((c:any)=>({uuid:c.uuid, properties:c.properties})) })
      }
      setServices(discovered)
      onLog({ type: 'Services Discovered', payload: discovered, ts: new Date().toISOString() })

      // subscribe to all notify characteristics
      for (const s of svcs) {
        const chs = await s.getCharacteristics()
        for (const c of chs) {
          if (c.properties.notify) {
            try {
              await c.startNotifications()
              c.addEventListener('characteristicvaluechanged', (ev:any)=> handleValue(ev.target.value))
            } catch(e:any){/*ignore*/}
          }
        }
      }

      d.addEventListener('gattserverdisconnected', onDisconnected)
    } catch (err:any) { onLog({ type: 'Connect Error', payload: err.message, ts: new Date().toISOString() }) }
  }

  const onDisconnected = (e:any) => {
    setConnected(false)
    onLog({ type: 'Device Disconnected', ts: new Date().toISOString() })
  }

  const handleValue = (dataView: DataView) => {
    try {
      const decoder = new TextDecoder()
      const text = decoder.decode(dataView.buffer)
      const timestamp = new Date().toISOString()
      setLastData(text)
      setLastActivity(timestamp)
      onLog({ type: 'Data Received', payload: text, ts: timestamp })
      // detection
      const t = text.toUpperCase()
      for (const k of keywords.current) {
        if (t.includes(k.toUpperCase())) {
          const alert = { alert: k, raw: text, device: { name: device?.name, id: device?.id }, location }
          onAlert(alert)
          break
        }
      }
    } catch (e:any) { onLog({ type: 'Decode Error', payload: e.message, ts: new Date().toISOString() }) }
  }

  const gatherLocation = () => {
    return new Promise<any>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition((pos)=>{
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(loc)
        resolve(loc)
      }, (err)=> reject(err))
    })
  }

  const sendSOS = async () => {
    try {
      const loc = location || await gatherLocation()
      setLocation(loc)
      const alert = { alert: 'SOS', raw: 'SOS button pressed', device: { name: device?.name, id: device?.id }, location: loc }
      onAlert(alert)
    } catch (err: any) {
      console.error('SOS error', err)
      onLog?.({ type: 'SOS Error', payload: err.message || err, ts: new Date().toISOString() })
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Connection</h2>
        <div className="text-sm">Status: <span className={`font-semibold ${connected? 'text-green-400':'text-yellow-400'}`}>{connected? 'Connected':'Disconnected'}</span></div>
      </div>
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn flex-1" onClick={requestDevice}>Connect Device</button>
          <button className="btn flex-1" onClick={() => { gatherLocation().then((loc) => setLocation(loc)).catch((err)=>console.error(err)) }}>Get GPS</button>
          <button className="btn bg-red-600 flex-1" onClick={sendSOS}>SOS</button>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div>Device: {device?.name || '—'}</div>
          <div>ID: {device?.id || '—'}</div>
          <div>RSSI: {rssi ?? '—'}</div>
          <div>Last Data: {lastData || 'No data yet'}</div>
          <div>Last Activity: {lastActivity ? new Date(lastActivity).toLocaleString() : 'No activity yet'}</div>
        </div>

        <div className="mt-3">
          <h3 className="font-medium">Discovered Services</h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {services.map((s,i)=> (
              <div key={i} className="p-2 bg-white/5 rounded">
                <div className="text-xs font-semibold">{s.uuid}</div>
                <div className="text-xs text-muted">Characteristics:</div>
                <ul className="text-xs list-disc list-inside">
                  {s.characteristics.map((c:any,ci:number)=>(<li key={ci}>{c.uuid} {JSON.stringify(c.properties)}</li>))}
                </ul>
              </div>
            ))}
            {services.length===0 && <div className="text-sm text-muted">No services discovered</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
