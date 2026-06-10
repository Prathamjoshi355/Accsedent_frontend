import React from 'react'
import { saveAs } from 'file-saver'

export default function LogPanel({ logs, setLogs, alerts }: any) {
  const clear = () => setLogs([])
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ logs, alerts }, null, 2)], { type: 'application/json' })
    saveAs(blob, 'accident-logs.json')
  }
  const exportCSV = () => {
    const rows = ['type,ts,payload']
    for (const r of logs) rows.push(`"${r.type}","${r.ts}","${JSON.stringify(r.payload||'')}"`)
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    saveAs(blob, 'accident-logs.csv')
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Event Log</h3>
        <div className="flex gap-2">
          <button className="btn" onClick={exportJSON}>Export JSON</button>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
          <button className="btn bg-red-600" onClick={clear}>Clear</button>
        </div>
      </div>
      <div className="max-h-64 overflow-auto">
        {logs.map((l:any, idx:number)=> (
          <div key={idx} className="p-2 border-b border-white/5 text-sm">
            <div className="font-medium">{l.type}</div>
            <div className="text-xs text-muted">{new Date(l.ts).toLocaleString()}</div>
            <pre className="text-xs mt-1">{JSON.stringify(l.payload)}</pre>
          </div>
        ))}
        {logs.length===0 && <div className="text-sm text-muted">No logs yet</div>}
      </div>
    </div>
  )
}
