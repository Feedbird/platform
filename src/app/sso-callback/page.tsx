'use client'

import { useEffect } from 'react'
import { useAuth, useSignIn, useSignUp, AuthenticateWithRedirectCallback  } from '@clerk/nextjs'
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
        // Check if user is signed in after OAuth redirect
        if (isSignedIn) {
          const workspaceId = searchParams?.get('workspaceId')
          const ticket = searchParams?.get('__clerk_ticket') || searchParams?.get('ticket') || searchParams?.get('invitation_token')

          console.log('ticket', ticket)

          if (ticket && (signInLoaded || signUpLoaded)) {
            try {
              const resIn: any = await signIn.create({ strategy: 'ticket', ticket })
              console.log('resIn', resIn)
              if (resIn?.status === 'complete' && resIn?.createdSessionId) {
                await setActiveSignIn({ session: resIn.createdSessionId })
              }
            } catch {}

            try {
              const resUp: any = await signUp.create({ strategy: 'ticket', ticket })
              console.log('resUp', resUp)
              if (resUp?.status === 'complete' && resUp?.createdSessionId) {
                await setActiveSignUp({ session: resUp.createdSessionId })
              }
            } catch {}
          }

          router.push(workspaceId ? `/${encodeURIComponent(workspaceId)}` : '/')
        } else {
          console.log('Authentication failed, route based on originating flow')
          // Authentication failed, route based on originating flow
          const from = searchParams?.get('from')
          const flow = searchParams?.get('flow')
          const role = searchParams?.get('role')
          const workspaceId = searchParams?.get('workspaceId')

          if (from === 'accept-invite') {
            console.log('from', from)
            console.log('flow', flow)
            console.log('role', role)
            console.log('workspaceId', workspaceId)

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
