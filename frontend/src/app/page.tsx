'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!email.endsWith('@iimb.ac.in')) {
      setMessage('Please use your @iimb.ac.in email address.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the magic link!')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#B91C1C] text-white">
      <div className="w-full max-w-md space-y-8 text-center">

        {/* Logo Placeholder - Replace with actual IIMB Logo if available */}
        <div className="mx-auto h-24 w-24 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl font-bold">IIMB</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold leading-tight">
            Indian Institute of Management Bangalore
          </h1>
        </div>

        <div className="space-y-4 pt-8">
          <h2 className="text-4xl font-bold leading-tight">
            Connect with your Batchmates
          </h2>
          <p className="text-white/80 text-lg">
            Automated networking to help you meet someone new every week.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-2 text-left">
            <label htmlFor="email" className="block text-sm font-medium text-white/90">
              Your IIMB Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
              placeholder="name.lastname.xx@iimb.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className={`text-sm font-medium rounded-lg p-3 ${message.includes('Check') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#B91C1C] shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Get Magic Link'}
            </button>
          </div>

          <p className="text-xs text-white/70 px-4">
            We'll send a secure login link to your IIMB email. No password required.
          </p>
        </form>
      </div>
    </div>
  )
}
