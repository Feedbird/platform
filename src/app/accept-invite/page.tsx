'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PlatformPreview from '@/components/platform-preview/platform-preview'
import { ClientOnboardingModal } from '@/components/workspace/client-onboarding-modal'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp()

  const [view, setView] = useState<'signup'|'signin'>('signup')
  const [openOnboarding, setOpenOnboarding] = useState(false)

  const role = (searchParams.get('role') as 'client'|'team' | null) || 'team'
  const workspaceId = searchParams.get('workspaceId') || undefined

  // If already authenticated, go to workspace directly
  useEffect(() => {
    if (!authLoaded) return
    if (isSignedIn) {
      if (workspaceId) router.replace(`/${workspaceId}`)
      else router.replace('/')
    }
  }, [authLoaded, isSignedIn, workspaceId, router])

  // Form state (only used in signin variant)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const title = "You've been invited to join workspace on Feedbird"

  const handleGoogle = async () => {
    setError('')
    if (view === 'signup') {
      if (!signUpLoaded) return
      await signUp.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/sso-callback', redirectUrlComplete: '/' })
    } else {
      if (!signInLoaded) return
      await signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/sso-callback', redirectUrlComplete: '/' })
    }
  }

  const handleSignupEmailPwd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      if (!signUpLoaded) throw new Error('Auth not ready')
      await signUp.create({ emailAddress: email, password, firstName, lastName })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      // After email signup, open onboarding for client immediately
      if (role === 'client') setOpenOnboarding(true)
      else router.push('/verify-email')
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      if (!signInLoaded) throw new Error('Auth not ready')
      const res = await signIn.create({ identifier: email, password })
      if (res.status === 'complete') {
        await setActiveSignIn({ session: res.createdSessionId })
        if (workspaceId) router.replace(`/${workspaceId}`)
        else router.replace('/')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const LeftContent = () => {
    if (view === 'signup') {
      if (role === 'team') {
        return (
          <>
            <h1 className="text-3xl font-semibold text-black mb-8">{title}</h1>
            <form onSubmit={handleSignupEmailPwd} className="space-y-4 text-sm text-black font-normal">
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter your email" required className="w-full rounded-md" />
              <div className="flex gap-4">
                <Input type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder="First name" required className="w-full rounded-md" />
                <Input type="text" value={lastName} onChange={(e)=>setLastName(e.target.value)} placeholder="Last name" required className="w-full rounded-md" />
              </div>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" required minLength={8} className="w-full rounded-md" />
              {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium" disabled={isLoading}>{isLoading?'Signing Up...':'Sign Up'}</Button>
            </form>
            <Button onClick={handleGoogle} variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 mt-4 py-2 rounded-md font-medium flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </Button>
            <p className="mt-6 text-xs text-darkGrey">
              By continuing, you agree to the Terms of Service and Privacy Policy.
            </p>
            <div className="mt-8 text-center text-sm">
              Already have an account? <button onClick={()=>setView('signin')} className="text-main font-semibold">Login</button>
            </div>
          </>
        )
      }
      // client
      return (
        <>
          <h1 className="text-3xl font-semibold text-black mb-8">{title}</h1>
          <Button onClick={()=>setOpenOnboarding(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium">Sign up with email & password</Button>
          <div className="my-4 flex items-center gap-2 text-grey text-sm"><span className="flex-1 h-px bg-gray-200"/>or<span className="flex-1 h-px bg-gray-200"/></div>
          <Button onClick={handleGoogle} variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 py-2 rounded-md font-medium flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </Button>
          <p className="mt-6 text-xs text-darkGrey">
            By continuing, you agree to the Terms of Service and Privacy Policy.
          </p>
          <div className="mt-8 text-center text-sm">
            Already have an account? <button onClick={()=>setView('signin')} className="text-main font-semibold">Login</button>
          </div>
        </>
      )
    }

    // signin case
    return (
      <>
        <h1 className="text-3xl font-semibold text-black mb-8">{title}</h1>
        <form onSubmit={handleSignin} className="space-y-4 text-sm text-black font-normal">
          <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter your email" required className="w-full rounded-md" />
          <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" required className="w-full rounded-md" />
          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium" disabled={isLoading}>{isLoading?'Signing In...':'Sign In'}</Button>
        </form>
        <Button onClick={handleGoogle} variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 mt-4 py-2 rounded-md font-medium flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </Button>
      </>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="flex-[11] flex flex-col items-center bg-white px-8 py-8 pt-16">
        <div className="max-w-md w-full">
          {/* Header Logo */}
          <div className="flex items-center justify-start mb-35">
            <button onClick={() => router.push('/landing')} className="flex-shrink-0">
              <Image src="/images/logo/logo(1).svg" alt="FeedBird Logo" width={127} height={20} className="h-5 w-auto" />
            </button>
          </div>

          <LeftContent />
        </div>
      </div>

      {/* Right Side - reuse same as signin/signup */}
      <div className="flex-[14] flex flex-col pl-12 pt-10 bg-[#F8F8F8]">
        <div className="flex-1 flex justify-center">
          <div className="w-full h-full">
            <div className="w-full h-full rounded-tl-lg overflow-hidden border-l-5 border-t-5 border-elementStroke">
              <PlatformPreview />
            </div>
          </div>
        </div>
      </div>

      {/* Client onboarding modal */}
      {role === 'client' && (
        <ClientOnboardingModal
          open={openOnboarding}
          onClose={() => setOpenOnboarding(false)}
          workspaceId={workspaceId}
        />
      )}
    </div>
  )
}


