'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import PlatformPreview from '@/components/platform-preview/platform-preview'

type LeftContentProps = {
  view: 'signup' | 'signin'
  role: 'client' | 'team'
  title: string
  email: string
  setEmail: (v: string) => void
  agreeToTerms: boolean
  setAgreeToTerms: (v: boolean) => void
  password: string
  setPassword: (v: string) => void
  firstName: string
  setFirstName: (v: string) => void
  lastName: string
  setLastName: (v: string) => void
  isLoading: boolean
  error: string
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  onForgotPassword: () => void
  onSignupSubmit: (e: React.FormEvent) => void
  onSigninSubmit: (e: React.FormEvent) => void
  onGoogle: () => void
  onSwitchToSignIn: () => void
  onSwitchToSignUp: () => void
}

function ErrorBanner({ error }: { error: string }) {
  if (!error) return null
  return (
    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md mb-4">{error}</div>
  )
}

function LeftContent(props: LeftContentProps) {
  const {
    view,
    role,
    title,
    email,
    setEmail,
    agreeToTerms,
    setAgreeToTerms,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    isLoading,
    error,
    showPassword,
    setShowPassword,
    onForgotPassword,
    onSignupSubmit,
    onSigninSubmit,
    onGoogle,
    onSwitchToSignIn,
    onSwitchToSignUp,
  } = props

  if (view === 'signup') {
    if (role === 'team') {
      return (
        <div className='max-w-[380px]'>
          <div className="flex justify-center mb-8">
            <h1 className="text-2xl font-semibold text-black text-center max-w-[380px]">{title}</h1>
          </div>
          <ErrorBanner error={error} />
          <form onSubmit={onSignupSubmit} className="space-y-4 text-sm text-black font-normal">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full rounded-md" />
            <div className="flex gap-4">
              <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required className="w-full rounded-md" />
              <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required className="w-full rounded-md" />
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={8}
                className="w-full rounded-md pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.05 8.05m1.829 1.829l4.242 4.242M12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.563 3.029m-5.858-.908a3 3 0 01-4.243-4.243" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {/* Terms of Service Agreement */}
            <div className="flex items-start text-sm text-darkGrey font-normal pt-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="mt-0.5 mr-3 flex-shrink-0"
              />
              <div className="leading-relaxed break-words">
                I have read and agree to the{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                  onClick={() => window.open('/terms-of-service', '_blank')}
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                  onClick={() => window.open('/privacy-policy', '_blank')}
                >
                  Privacy Policy
                </button>
                .
              </div>
            </div>

            {/* Clerk CAPTCHA Element */}
            <div id="clerk-captcha" className="flex justify-center"></div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium cursor-pointer" disabled={isLoading || !agreeToTerms}>{isLoading ? 'Signing Up...' : 'Sign Up'}</Button>
          </form>
          <Button onClick={onGoogle} variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 mt-4 py-2 rounded-md font-medium flex items-center justify-center gap-3 cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </Button>
          <div className="mt-8 text-center text-sm">
            Already have an account? <button onClick={onSwitchToSignIn} className="text-main font-semibold cursor-pointer">Login</button>
          </div>
        </div>
      )
    }
    // client
    return (
      <div className='max-w-[380px]'>
        <div className="flex justify-center mb-8">
          <h1 className="text-2xl font-semibold text-black text-center">{title}</h1>
        </div>
        <ErrorBanner error={error} />
        <div className="rounded-xl border border-elementStroke shadow-sm p-5">
          <Button onClick={() => location.assign('/client-onboarding' + (typeof window !== 'undefined' && window.location.search ? window.location.search : ''))} className="w-full bg-main hover:bg-main/80 text-white py-2.5 text-white text-sm font-medium rounded-md cursor-pointer">Sign up with email & password</Button>
          <div className="flex items-center gap-4 text-darkGrey text-sm font-normal my-6"><span className="flex-1 h-px bg-elementStroke" />or<span className="flex-1 h-px bg-elementStroke" /></div>
          {/* Clerk CAPTCHA Element */}
          <div id="clerk-captcha" className="flex justify-center"></div>
          <Button onClick={onGoogle} variant="outline" className="w-full border-1 border-buttonStroke hover:border-gray-400 hover:bg-gray-50 py-2 rounded-md font-medium text-sm text-black flex items-center justify-center gap-3 cursor-pointer">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </Button>
          <div className="leading-relaxed break-words text-sm text-darkGrey font-normal text-center px-5 my-6">
            By continuing, you agree to the{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
              onClick={() => window.open('/terms-of-service', '_blank')}
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
              onClick={() => window.open('/privacy-policy', '_blank')}
            >
              Privacy Policy
            </button>
            .
          </div>
          <div className="text-center text-sm font-normal text-slate-600">
            Already have an account? <button onClick={onSwitchToSignIn} className="text-main font-semibold cursor-pointer">Login</button>
          </div>
        </div>
      </div>
    )
  }

  // signin case
  return (
    <div className='max-w-[380px]'>
      <div className="flex justify-center mb-8">
        <h1 className="text-2xl font-semibold text-black text-center">{title}</h1>
      </div>
      <ErrorBanner error={error} />
      <div className="rounded-xl border border-elementStroke shadow-sm p-5">
        <form onSubmit={onSigninSubmit} className="space-y-4 text-sm text-black font-normal">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full rounded-md text-black text-sm font-normal" />
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-md pr-10 text-black text-sm font-normal"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-darkGrey hover:text-darkGrey/80 cursor-pointer"
              disabled={isLoading}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.05 8.05m1.829 1.829l4.242 4.242M12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-1.563 3.029m-5.858-.908a3 3 0 01-4.243-4.243" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-main hover:text-main/80 font-medium text-sm cursor-pointer"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>
          <div id="clerk-captcha" className="flex justify-center"></div>
          <Button type="submit" className="w-full bg-main hover:bg-main/80 text-white text-sm font-medium py-2 rounded-md cursor-pointer" disabled={isLoading}>{isLoading ? 'Signing In...' : 'Sign In'}</Button>
        </form>
        <Button onClick={onGoogle} variant="outline" className="w-full border-1 border-buttonStroke hover:border-gray-400 hover:bg-gray-50 mt-4 py-2 rounded-md font-medium flex items-center justify-center gap-3 cursor-pointer">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </Button>
        <div className="mt-6 text-center">
          <span className="text-darkGrey text-sm font-normal">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-main hover:text-main/80 font-semibold leading-tight cursor-pointer"
              disabled={isLoading}
            >
              Sign up
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  console.log("@@@@@@@@@@@@@@@@@@@@@@@accept-invite")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp()

  const [view, setView] = useState<'signup' | 'signin'>('signup')

  const testimonials = [
    {
      quote: "FeedBird transformed how we manage our social media. The scheduling feature alone saved us hours every week! It's incredibly intuitive and has streamlined our entire content workflow.",
      author: "Sarah Chen",
      role: "Social Media Manager",
      company: "TechStart Inc.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      quote: "The analytics insights are incredible. We've seen a 40% increase in engagement since switching to FeedBird. The detailed reports help us understand what content resonates with our audience.",
      author: "Mike Johnson",
      role: "Marketing Director",
      company: "GrowthCo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      quote: "Finally, a tool that makes team collaboration on social media content seamless and efficient. Multiple team members can work together without any conflicts or confusion.",
      author: "Emma Rodriguez",
      role: "Content Creator",
      company: "Creative Studios",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      quote: "The automation features are game-changing. I can focus on creating great content instead of posting it. The smart scheduling has improved our posting consistency significantly.",
      author: "David Kim",
      role: "Brand Manager",
      company: "Fashion Forward",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5
    },
    {
      quote: "Customer support is outstanding, and the platform just keeps getting better with each update. The team is responsive and genuinely cares about user experience.",
      author: "Lisa Thompson",
      role: "CEO",
      company: "Local Business Network",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      rating: 5
    }
  ]
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [previousTestimonial, setPreviousTestimonial] = useState(4)

  const role = (searchParams.get('role') as 'client' | 'team' | null) || 'team'
  const workspaceId = searchParams.get('workspaceId') || undefined
  const ticket = searchParams.get('__clerk_ticket') || searchParams.get('ticket') || searchParams.get('invitation_token')
  const status = searchParams.get('__clerk_status') || searchParams.get('status')
  // If already authenticated, go to workspace directly
  useEffect(() => {
    const handleAcceptInvite = async () => {
    if (!authLoaded || !signIn || !ticket) return
    if (isSignedIn) {
      try {
        // Try to complete via sign-in ticket first
        const resIn: any = await signIn.create({ strategy: 'ticket', ticket })
        if (resIn?.status === 'complete' && resIn?.createdSessionId) {
          await setActiveSignIn({ session: resIn.createdSessionId })
        }
      } catch {}
      if (workspaceId) {
        router.replace(`/${workspaceId}`)
      }
      else router.replace('/')
    }
  }
  handleAcceptInvite()
  }, [authLoaded, isSignedIn, workspaceId, router, signIn, setActiveSignIn])

  // Form state (only used in signin variant)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const title = "You've been invited to join workspace on Feedbird"

  const handleGoogle = async () => {
    setError('')
    const roleParam = role ? `&role=${encodeURIComponent(role)}` : ''
    const wsParam = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''
    
    const ticketParam = ticket ? `&__clerk_ticket=${encodeURIComponent(ticket)}` : ''
    const statusParam = status ? `&__clerk_status=${encodeURIComponent(status)}` : ''
    const redirectUrl = `/sso-callback?from=accept-invite&flow=${view}${roleParam}${wsParam}${ticketParam}${statusParam}`;

    if (view === 'signup') {
      if (!signUpLoaded) return
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: redirectUrl,
        redirectUrlComplete: redirectUrl,
      })
    } else {
      if (!signInLoaded) return
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: redirectUrl,
        redirectUrlComplete: redirectUrl,
      })
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
      // After email signup, redirect to the corresponding workspace or verify email
      const roleParam = `?role=${encodeURIComponent('team')}`
      const wsParam = workspaceId ? `${roleParam ? '&' : '?'}workspaceId=${encodeURIComponent(workspaceId)}` : ''
      router.push(`/verify-email${roleParam}${wsParam}`)
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Failed to sign up')
      // On failure, stay on accept-invite page with signup view and team role
      const roleParam = `role=${encodeURIComponent('team')}`
      const wsParam = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''
      const viewParam = '&view=signup'
      router.replace(`/accept-invite?${roleParam}${wsParam}${viewParam}`)
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => {
        const next = (prev + 1) % testimonials.length
        setPreviousTestimonial(prev)
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Read view and notice from query params to control UI and show friendly errors
  useEffect(() => {
    const v = searchParams.get('view')
    if (v === 'signin' || v === 'signup') {
      setView(v)
    }
    const notice = searchParams.get('notice')
    if (notice === 'already-registered') {
      setError('This email is already registered. Please sign in instead.')
    } else if (notice === 'not-registered') {
      setError('You are not registered. Please sign up to continue.')
    }
  }, [searchParams])



  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="flex-[11] flex flex-col items-center bg-white px-8 py-8 pt-16">
        <div className="w-full">
          {/* Header Logo */}
          <div className="flex items-center justify-start mb-35">
            <button onClick={() => router.push('/landing')} className="flex-shrink-0">
              <Image src="/images/logo/logo(1).svg" alt="FeedBird Logo" width={127} height={20} className="h-5 w-auto" />
            </button>
          </div>
          <div className="flex justify-center">
            <LeftContent
              view={view}
              role={role}
              title={title}
              email={email}
              setEmail={setEmail}
              agreeToTerms={agreeToTerms}
              setAgreeToTerms={setAgreeToTerms}
              password={password}
              setPassword={setPassword}
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              isLoading={isLoading}
              error={error}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onForgotPassword={() => router.push('/forgot-password')}
              onSignupSubmit={handleSignupEmailPwd}
              onSigninSubmit={handleSignin}
              onGoogle={handleGoogle}
              onSwitchToSignIn={() => { setError(''); setView('signin') }}
              onSwitchToSignUp={() => { setError(''); setView('signup') }}
            />
          </div>
        </div>
      </div>

      {/* Right Side - same as signin page */}
      <div className="flex-[14] flex flex-col pl-12 pt-10 bg-[#F8F8F8]">
        {/* Testimonials Section */}
        <div className="pr-12 mb-10">
          <div className="relative overflow-hidden min-h-[160px]">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`transition-all duration-1000 transform absolute inset-0 ${index === currentTestimonial
                  ? 'opacity-100 translate-x-0 z-10'
                  : index === previousTestimonial
                    ? 'opacity-0 translate-x-full z-0'
                    : 'opacity-0 -translate-x-full z-0'
                  }`}
              >
                <blockquote
                  className="h-25 text-xl font-semibold text-black mb-4 leading-relaxed overflow-hidden"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const,
                    lineHeight: '1.625'
                  }}
                >
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="text-sm space-y-1">
                      <div className="font-semibold text-black">
                        {testimonial.author.split(' ').map((name, i) => i === 0 ? `${name.charAt(0)}.` : name).join(' ')}
                      </div>
                      <div className="font-normal text-darkGrey">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating ? 'text-main fill-current' : 'text-darkGrey'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Indicators */}
          <div className="flex justify-start space-x-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                  ? 'bg-blue-600 w-6'
                  : 'bg-gray-300'
                  }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Platform Preview Component */}
        <div className="flex-1 flex justify-center">
          <div className="w-full h-full">
            <div className="w-full h-full rounded-tl-lg overflow-hidden border-l-5 border-t-5 border-elementStroke">
              <PlatformPreview />
            </div>
          </div>
        </div>
      </div>

      {/* Client onboarding moved to a dedicated page */}
    </div>
  )
}


