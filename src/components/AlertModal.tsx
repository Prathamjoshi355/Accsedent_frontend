import React, { useEffect } from 'react'

export default function AlertModal({ active, alert, onClose }: any) {
  useEffect(()=>{
    let audio: AudioContext|undefined
    if (active) {
      audio = new AudioContext()
      const o = audio.createOscillator()
      const g = audio.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      o.connect(g)
      g.connect(audio.destination)
      g.gain.value = 0.2
      o.start()
      const id = setInterval(()=>{ g.gain.value = g.gain.value>0?0:0.2 }, 500)
      const stop = ()=>{ clearInterval(id); o.stop(); audio?.close() }
      return stop
    }
  }, [active])

  if (!active || !alert) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 flex items-start">
        <div className="w-full p-6 text-center text-white">
          <div className="text-4xl font-bold mb-4">EMERGENCY</div>
          <div className="text-xl">{alert.alert || 'Accident detected'}</div>
          <div className="mt-4">{alert.raw}</div>
          <div className="mt-6">
            <button className="btn bg-white text-black" onClick={onClose}>Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  )
}
