import { useState, useCallback } from 'react'

interface Toast {
  visible: boolean
  message: string
}

export function useToast() {
  const [toast, setToast] = useState<Toast>({ visible: false, message: '' })

  const showToast = useCallback((message: string, duration = 2200) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
  }, [])

  return { toast, showToast }
}