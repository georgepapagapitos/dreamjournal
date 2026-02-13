interface ToastProps {
  toast: {
    visible: boolean
    message: string
  }
}

export function Toast({ toast }: ToastProps) {
  return (
    <div className={`toast${toast.visible ? ' visible' : ''}`}>
      {toast.message}
    </div>
  )
}