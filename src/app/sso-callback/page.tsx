'use client'

import { useEffect } from 'react'
import { useSignUp, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function SSOCallbackPage() {
  const { signUp, isLoaded } = useSignUp()
  const { getToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      if (!isLoaded) return

      try {
        // Handle the OAuth callback
        const signUpAttempt = await signUp.handleRedirectCallback()

        if (signUpAttempt.status === 'complete') {
          // Set the active session
          await signUp.setActive({ session: signUpAttempt.createdSessionId })
          router.push('/')
        } else {
          console.error('OAuth callback failed')
          router.push('/signup')
        }
      } catch (err) {
        console.error('SSO callback error:', err)
        router.push('/signup')
      }
    }

    handleCallback()
  }, [isLoaded, signUp, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Sign Up
        </h2>
        <p className="text-gray-600">
          Please wait while we finish setting up your account...
        </p>
      </div>
    </div>
  )
}
