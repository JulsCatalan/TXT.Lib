'use client'
import { Toaster } from 'react-hot-toast'

export default function ToasterClient() {
  return <Toaster toastOptions={{ duration: 3000 }} />
}
