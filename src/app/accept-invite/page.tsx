'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth, useSignIn, useSignUp, useClerk } from '@clerk/nextjs'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import PlatformPreview from '@/components/platform-preview/platform-preview'
import { Eye, EyeOff } from 'lucide-react'

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
        <div>
          <div className="flex justify-center mb-8">
            <h1 className="text-2xl font-semibold text-black text-center max-w-[380px]">{title}</h1>
          </div>
          <ErrorBanner error={error} />
          <form onSubmit={onSignupSubmit} className="space-y-4 text-sm text-black font-normal">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-[6px] border-buttonStroke px-3.5 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
            />
            <div className="flex gap-4">
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name" required
                className="w-full rounded-[6px] border-buttonStroke px-3.5 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
              />
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
                className="w-full rounded-[6px] border-buttonStroke px-3.5 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
              />
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
                className="w-full rounded-[6px] border-buttonStroke pl-3.5 pr-10 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                disabled={isLoading}
              >
                {showPassword ? (
                  <Eye className="h-4.5 w-4.5 text-darkGrey" />
                ) : (
                  <EyeOff className="h-4.5 w-4.5 text-darkGrey" />
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
            <Button type="submit" className="w-full bg-main hover:bg-main/80 text-white py-2.5 px-4.5 h-11.5 rounded-[6px] text-sm font-medium cursor-pointer disabled:cursor-not-allowed" disabled={isLoading || !agreeToTerms}>{isLoading ? 'Signing Up...' : 'Sign Up'}</Button>
          </form>
          <Button onClick={onGoogle} variant="outline" className="w-full border border-buttonStroke hover:bg-gray-50 mt-4 py-2.5 px-4.5 h-11.5 rounded-[6px] text-sm font-medium text-black flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed">
            <img src="/images/icons/google.svg" alt="Google" className="w-6 h-6" />
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
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full rounded-[6px] border-buttonStroke px-3.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
          />
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-[6px] border-buttonStroke pl-3.5 pr-10 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-darkGrey hover:text-darkGrey/80 cursor-pointer"
              disabled={isLoading}
            >
              {showPassword ? (
                <Eye className="h-4.5 w-4.5 text-darkGrey" />
              ) : (
                <EyeOff className="h-4.5 w-4.5 text-darkGrey" />
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
          <Button type="submit" className="w-full bg-main hover:bg-main/80 text-white py-2.5 px-4.5 h-11.5 rounded-[6px] text-sm font-medium cursor-pointer disabled:cursor-not-allowed" disabled={isLoading}>{isLoading ? 'Signing In...' : 'Sign In'}</Button>
        </form>
        <Button onClick={onGoogle} variant="outline" className="w-full border border-buttonStroke hover:bg-gray-50 mt-4 py-2.5 px-4.5 h-11.5 rounded-[6px] text-sm font-medium text-black flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed">
          <img src="/images/icons/google.svg" alt="Google" className="w-6 h-6" />
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp()
  const { signOut } = useClerk()
  const isProcessingRef = useRef(false)

  const [view, setView] = useState<'signup' | 'signin'>('signup')

  const testimonials = [
    {
      quote: "FeedBird transformed how we manage our social media. The scheduling feature alone saved us hours every week! It's incredibly intuitive and has streamlined our entire content workflow.",
      author: "Sarah Chen",
      role: "Social Media Manager",
      company: "TechStart Inc.",
      avatar: "/images/testimonials/image1.png",
      rating: 5
    },
    {
      quote: "The analytics insights are incredible. We've seen a 40% increase in engagement since switching to FeedBird. The detailed reports help us understand what content resonates with our audience.",
      author: "Mike Johnson",
      role: "Marketing Director",
      company: "GrowthCo",
      avatar: "/images/testimonials/image2.png",
      rating: 5
    },
    {
      quote: "Finally, a tool that makes team collaboration on social media content seamless and efficient. Multiple team members can work together without any conflicts or confusion.",
      author: "Emma Rodriguez",
      role: "Content Creator",
      company: "Creative Studios",
      avatar: "/images/testimonials/image3.png",
      rating: 5
    },
    {
      quote: "The automation features are game-changing. I can focus on creating great content instead of posting it. The smart scheduling has improved our posting consistency significantly.",
      author: "David Kim",
      role: "Brand Manager",
      company: "Fashion Forward",
      avatar: "/images/testimonials/image4.png",
      rating: 5
    },
    {
      quote: "Customer support is outstanding, and the platform just keeps getting better with each update. The team is responsive and genuinely cares about user experience.",
      author: "Lisa Thompson",
      role: "CEO",
      company: "Local Business Network",
      avatar: "/images/testimonials/image5.png",
      rating: 5
    }
  ]
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [previousTestimonial, setPreviousTestimonial] = useState(4)

  const role = (searchParams.get('role') as 'client' | 'team' | null) || 'team'
  const workspaceId = searchParams.get('workspaceId') || undefined
  const ticket = searchParams.get('__clerk_ticket') || searchParams.get('ticket') || searchParams.get('invitation_token')
  const status = searchParams.get('__clerk_status') || searchParams.get('status')
  const wasSignedOutForTicket = searchParams.get('signed_out') === '1'
  // If already authenticated, go to workspace directly
  useEffect(() => {
    const handleAcceptInvite = async () => {
      if (!authLoaded || !signIn || !ticket) return
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      if (isSignedIn) {
        try {
          // Append a flag so we know to consume the ticket on reload
          const current = typeof window !== 'undefined' ? new URL(window.location.href) : null
          if (current) {
            current.searchParams.set('signed_out', '1')
            await signOut({ redirectUrl: current.toString() })
            return;
          } else {
            await signOut({ redirectUrl: window.location.href })
            return;
          }
          return
        } catch (e) {
          console.log('signOut error before ticket sign-in', e)
        }
      }

      // Only attempt ticket sign-in if we explicitly signed the user out first
      if (!wasSignedOutForTicket || isSignedIn) return

      try {
        const resIn: any = await signIn.create({ strategy: 'ticket', ticket })
        if (resIn?.status === 'complete' && resIn?.createdSessionId) {
          await setActiveSignIn({ session: resIn.createdSessionId })
        }
      } catch {
        console.log('ticket signIn.create error')
      }
      if (workspaceId) {
        window.location.replace(`/${workspaceId}`)
      } else {
        window.location.replace('/')
      }
    }

    handleAcceptInvite()
  }, [authLoaded, isSignedIn, wasSignedOutForTicket, workspaceId, router, signIn, setActiveSignIn, signOut])

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
        // If an invite ticket is present, sign out and let the ticket flow consume it
        if (ticket) {
          try {
            const current = typeof window !== 'undefined' ? new URL(window.location.href) : null
            if (current) {
              current.searchParams.set('signed_out', '1')
              await signOut({ redirectUrl: current.toString() })
              return
            } else {
              await signOut({ redirectUrl: window.location.href })
              return
            }
          } catch (e) {
            console.log('signOut error before ticket sign-in', e)
          }
        }
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



  return wasSignedOutForTicket ? (
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
  ) : (
    <div className="h-screen grid grid-cols-[11fr_14fr] w-full">
      {/* Left Side */}
      <div className="flex flex-col items-center bg-white min-w-[500px] relative">
        <div className="flex flex-col w-[60%] h-full relative">
          {/* Header Logo */}
          <div className="flex items-center justify-start pt-16">
            <button onClick={() => router.push('/landing')} className="flex-shrink-0">
              <Image src="/images/logo/logo(1).svg" alt="FeedBird Logo" width={127} height={20} className="h-5 w-auto" />
            </button>
          </div>
          {/* Centered Content */}
          <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 mx-auto">
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
      </div>

      {/* Right Side - same as signin page */}
      <div className="flex flex-col pl-12 pt-10 bg-[#F8F8F8] overflow-y-auto">
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


