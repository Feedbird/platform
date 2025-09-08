'use client'

import { useEffect } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function SSOCallbackPage() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { signIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for all auth resources to be loaded
      if (!authLoaded || !signInLoaded || !signUpLoaded) return

      try {
        // Check if user is signed in after OAuth redirect
        if (isSignedIn) {
          // User successfully authenticated, redirect to home
          router.push('/')
        } else {
          // Authentication failed, redirect to signup
          console.error('OAuth authentication failed')
          router.push('/signup')
        }
      } catch (err) {
        console.error('SSO callback error:', err)
        router.push('/signup')
      }
    }

    handleCallback()
  }, [authLoaded, signInLoaded, signUpLoaded, isSignedIn, router])

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
