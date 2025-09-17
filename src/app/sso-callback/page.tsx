'use client'

import { useEffect } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SSOCallbackPage() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { signIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()

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
          // Authentication failed, route based on originating flow
          const from = searchParams?.get('from')
          const flow = searchParams?.get('flow')
          const role = searchParams?.get('role')
          const workspaceId = searchParams?.get('workspaceId')

          if (from === 'accept-invite') {
            const base = `/accept-invite?view=${flow === 'signin' ? 'signin' : 'signup'}`
            const notice = flow === 'signin' ? 'not-registered' : 'already-registered'
            const roleParam = role ? `&role=${encodeURIComponent(role)}` : ''
            const wsParam = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''
            router.push(`${base}&notice=${notice}${roleParam}${wsParam}`)
          } else if (from === 'signin') {
            router.push('/signin?notice=not-registered')
          } else if (from === 'signup') {
            router.push('/signup?notice=already-registered')
          } else {
            router.push('/signin?notice=not-registered')
          }
        }
      } catch (err) {
        const from = searchParams?.get('from')
        const flow = searchParams?.get('flow')
        const role = searchParams?.get('role')
        const workspaceId = searchParams?.get('workspaceId')

        if (from === 'accept-invite') {
          const base = `/accept-invite?view=${flow === 'signin' ? 'signin' : 'signup'}`
          const notice = flow === 'signin' ? 'not-registered' : 'already-registered'
          const roleParam = role ? `&role=${encodeURIComponent(role)}` : ''
          const wsParam = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''
          router.push(`${base}&notice=${notice}${roleParam}${wsParam}`)
        } else if (from === 'signin') {
          router.push('/signin?notice=not-registered')
        } else if (from === 'signup') {
          router.push('/signup?notice=already-registered')
        } else {
          router.push('/signin?notice=not-registered')
        }
      }
    }

    handleCallback()
  }, [authLoaded, signInLoaded, signUpLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing authentication
        </h2>
        <p className="text-gray-600">
          Please wait while we finish your authentication...
        </p>
      </div>
    </div>
  )
}
