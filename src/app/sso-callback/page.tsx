'use client'

import { useEffect } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SSOCallbackPage() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn()
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      console.log('handleCallback')
      // Wait for all auth resources to be loaded
      if (!authLoaded || !signInLoaded || !signUpLoaded) return

      console.log('authLoaded', authLoaded)
      console.log('signInLoaded', signInLoaded)
      console.log('signUpLoaded', signUpLoaded)

      try {
        const workspaceId = searchParams?.get('workspaceId')
        const ticket = searchParams?.get('__clerk_ticket') || searchParams?.get('ticket') || searchParams?.get('invitation_token')
        const status = searchParams.get('__clerk_status')

        console.log('ticket', ticket)
        console.log('status', status)

        // If Clerk returned a ticket, complete the flow regardless of current sign-in state
        if (ticket) {
          if (status === 'sign_in') {
            console.log('sign_in')
            const res = await signIn.create({ strategy: 'ticket', ticket })
            if (res?.status === 'complete' && res.createdSessionId) {
              await setActiveSignIn({ session: res.createdSessionId })
            }
          } else if (status === 'sign_up') {
            console.log('sign_up')
            const res = await signUp.create({ strategy: 'ticket', ticket })
            console.log('res', res)
            if (res?.status === 'complete' && res.createdSessionId) {
              await setActiveSignUp({ session: res.createdSessionId })
            }
          } else {
            // Fallback: attempt sign-in by default
            const res = await signIn.create({ strategy: 'ticket', ticket })
            if (res?.status === 'complete' && res.createdSessionId) {
              await setActiveSignIn({ session: res.createdSessionId })
            }
          }

          router.push(workspaceId ? `/${encodeURIComponent(workspaceId)}` : '/')
          return
        }

        // No ticket present
        if (isSignedIn) {
          router.push(workspaceId ? `/${encodeURIComponent(workspaceId)}` : '/')
          return
        }

        console.log('Authentication failed, route based on originating flow')
        // Authentication failed, route based on originating flow
        const from = searchParams?.get('from')
        const flow = searchParams?.get('flow')
        const role = searchParams?.get('role')

        if (from === 'accept-invite') {
          console.log('from', from)
          console.log('flow', flow)
          console.log('role', role)

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
      } catch (err) {
        console.log('err', err)
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
    // <AuthenticateWithRedirectCallback />
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

