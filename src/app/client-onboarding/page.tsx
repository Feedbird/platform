'use client'

import * as React from 'react'
import { useAuth, useSignIn, useSignUp, useClerk } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimezonePicker } from '@/components/ui/timezone-picker'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { getUserFromDatabase, syncUserToDatabase } from '@/lib/supabase/user-sync'
import { workspaceApi, inviteApi } from '@/lib/api/api-service'
import { X, ChevronLeft, User, Plus } from 'lucide-react'
import PlatformPreview from '@/components/platform-preview/platform-preview'
import { ChannelIcons } from '@/components/content/shared/content-post-ui'
import { cn } from '@/lib/utils'

const STEPS = [
    { id: 1, title: 'Set up your profile', description: 'Basic information' },
    { id: 2, title: 'Choose your time area', description: 'Timezone and preferences' },
    { id: 3, title: 'Connect socials', description: 'Link your accounts' },
    { id: 4, title: 'Invite your team', description: 'Add collaborators' }
]

const PLATFORMS = [
    "facebook", "instagram", "linkedin", "pinterest", "youtube", "tiktok", "google"
] as const

// Platform-specific connect options
const PLATFORM_CONNECT_OPTIONS = {
    facebook: [{ title: "Add Facebook Page", method: "facebook" }],
    instagram: [
        { title: "Add Instagram Professional Account", method: "instagram_business" },
        { title: "Add Instagram Account via Facebook", method: "instagram_facebook" }
    ],
    tiktok: [
        { title: "Add TikTok Business Account", method: "tiktok_business" },
        { title: "Add TikTok Account", method: "tiktok" }
    ],
    pinterest: [{ title: "Add Pinterest Account", method: "pinterest" }],
    google: [{ title: "Add Google Business Profile", method: "google" }],
    linkedin: [
        { title: "Add LinkedIn Personal Profile", method: "linkedin_personal" },
        { title: "Add LinkedIn Company Page", method: "linkedin_company" }
    ],
    youtube: [{ title: "Add YouTube Channel", method: "youtube" }]
}

export default function ClientOnboardingPage() {
    const search = useSearchParams()
    const workspaceId = search.get('workspaceId') || undefined
    const ticket = React.useMemo(() => search.get('__clerk_ticket') || search.get('ticket') || search.get('invitation_token'), [search])
    const wasSignedOutForTicket = React.useMemo(() => search.get('signed_out') === '1', [search])
    const initialStep = React.useMemo(() => {
        const s = Number(search.get('step'))
        return Number.isFinite(s) && s >= 1 && s <= 4 ? s : 1
    }, [search])
    const [step, setStep] = React.useState(initialStep)
    const [firstName, setFirstName] = React.useState('')
    const [lastName, setLastName] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [showPassword, setShowPassword] = React.useState(false)
    const [company, setCompany] = React.useState('')

    const [timezone, setTimezone] = React.useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const [weekStart, setWeekStart] = React.useState<'monday' | 'sunday'>('monday')
    const [timeFormat, setTimeFormat] = React.useState<'24h' | '12h'>('24h')
    const [saving, setSaving] = React.useState(false)
    const [activePlatform, setActivePlatform] = React.useState<typeof PLATFORMS[number]>('facebook')
    const [connectingPlatform, setConnectingPlatform] = React.useState<typeof PLATFORMS[number] | null>(null)
    const [inviteEmails, setInviteEmails] = React.useState<string[]>(['', '', ''])
    const [inviteRoles, setInviteRoles] = React.useState<("Team" | "Client")[]>(["Team", "Team", "Team"])
    const [avatarColors, setAvatarColors] = React.useState<Record<number, string>>({})
    const [signingUp, setSigningUp] = React.useState(false)
    const [signUpError, setSignUpError] = React.useState<string>('')
    const [verificationRequired, setVerificationRequired] = React.useState(false)
    const [verificationCode, setVerificationCode] = React.useState('')
    const [verifying, setVerifying] = React.useState(false)
    const [resending, setResending] = React.useState(false)

    const setActiveWorkspace = useFeedbirdStore(s => s.setActiveWorkspace)
    const handleOAuthSuccess = useFeedbirdStore(s => s.handleOAuthSuccess)
  
  const workspaces = useFeedbirdStore(s => s.workspaces)
  const user = useFeedbirdStore(s => s.user)

    const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp()
    const { isSignedIn, isLoaded: authLoaded } = useAuth()
    const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn()
    const { signOut } = useClerk()
    const router = useRouter()
    const isProcessingRef = React.useRef(false)

    // Keep URL step param in sync when step changes (skip while in signed_out loading state)
    React.useEffect(() => {
        if (wasSignedOutForTicket) return
        const params = new URLSearchParams(Array.from(search.entries()))
        params.set('step', String(step))
        const qs = params.toString()
        router.replace(`/client-onboarding?${qs}`)
    }, [step, search, router, wasSignedOutForTicket])

    // Initialize invite emails once
    React.useEffect(() => {
        setInviteEmails(['', '', ''])
        setInviteRoles(["Team", "Team", "Team"])
        setAvatarColors({})
    }, [])

    // Ensure at least one email field exists
    React.useEffect(() => {
        if (inviteEmails.length === 0) {
            setInviteEmails([''])
        }
    }, [inviteEmails.length])

    // Assign avatar colors when emails get content
    React.useEffect(() => {
        const newColors: Record<number, string> = {}
        let hasNew = false
        inviteEmails.forEach((email, index) => {
            if (email && !avatarColors[index]) {
                newColors[index] = getAvatarColor(index, avatarColors)
                hasNew = true
            }
        })
        if (hasNew) setAvatarColors(prev => ({ ...prev, ...newColors }))
    }, [inviteEmails, avatarColors])

    const getAvatarColor = (index: number, colors: Record<number, string>) => {
        if (colors[index]) return colors[index]
        const palette = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
            'bg-red-500', 'bg-yellow-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
        ]
        return palette[index % palette.length]
    }

    // OAuth popup listener (mirror of ManageSocialsDialog simplified)
    React.useEffect(() => {
        function handler(e: MessageEvent) {
            if (e.origin !== window.location.origin) return
            if (!workspaceId) return
            if (e.data?.error) {
                setConnectingPlatform(null)
                sessionStorage.removeItem('instagram_connection_method')
                return
            }
            if (e.data?.success) {
                handleOAuthSuccess(workspaceId).finally(() => {
                    setConnectingPlatform(null)
                    sessionStorage.removeItem('instagram_connection_method')
                })
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [workspaceId, handleOAuthSuccess])

    // Open popup when a platform is set to connect
    React.useEffect(() => {
        if (!connectingPlatform || !workspaceId) return
        const w = 600; const h = 700
        const left = window.screenX + (window.outerWidth - w) / 2
        const top = window.screenY + (window.outerHeight - h) / 2
        const connectionMethod = sessionStorage.getItem('instagram_connection_method')
        const url = connectionMethod
            ? `/api/oauth/${connectingPlatform}?workspaceId=${workspaceId}&method=${connectionMethod}`
            : `/api/oauth/${connectingPlatform}?workspaceId=${workspaceId}`
        const popup = window.open(url, '_blank', `width=${w},height=${h},left=${left},top=${top}`)
        const interval = setInterval(() => {
            if (popup && popup.closed) {
                setConnectingPlatform(null)
                sessionStorage.removeItem('instagram_connection_method')
                clearInterval(interval)
            }
        }, 500)
        return () => clearInterval(interval)
    }, [connectingPlatform, workspaceId])

    const openPopup = (platform: typeof PLATFORMS[number], method?: string) => {
        if (!workspaceId) return
        setConnectingPlatform(platform)
        if (method) sessionStorage.setItem('instagram_connection_method', method)
    }

    const hasInviteEmail = React.useMemo(() => {
        return inviteEmails.some((value) => (value || '').trim() !== '')
    }, [inviteEmails])

    const next = () => setStep((s) => Math.min(4, s + 1))
    const back = () => setStep((s) => Math.max(1, s - 1))

    const canNext = () => {
        if (step === 1) return firstName && lastName && email && password && company
        return true
    }
    const handleNextFromStep1 = async () => {
        if (!canNext()) return
        setSignUpError('')
        setSigningUp(true)
        try {
            if (!signUpLoaded) throw new Error('Auth not ready')
            await signUp.create({
                emailAddress: email,
                password,
                firstName,
                lastName,
            })
            // Optional: send email verification code here if desired
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
            setVerificationRequired(true)
        } catch (err: any) {
            const code = err?.errors?.[0]?.code
            const message: string = err?.errors?.[0]?.message || ''
            // Detect already-registered case and redirect to accept-invite (client view) with notice
            if (code === 'form_identifier_exists' || message.toLowerCase().includes('already')) {
                const params = new URLSearchParams({ view: 'signup', role: 'client', notice: 'already-registered' })
                router.replace(`/accept-invite?${params.toString()}`)
                return
            }
            setSignUpError(message || 'Failed to sign up')
        } finally {
            setSigningUp(false)
        }
    }

    const handleVerifyEmailCode = async () => {
        setSignUpError('')
        setVerifying(true)
        try {
            if (!signUpLoaded) throw new Error('Auth not ready')
            const result = await signUp.attemptEmailAddressVerification({ code: verificationCode })
            if (result.status === 'complete') {
                // Ensure the user exists in Supabase before proceeding
                // const existing = await getUserFromDatabase(email)
                // if (!existing) {
                //     await syncUserToDatabase({
                //         email,
                //         first_name: firstName || undefined,
                //         last_name: lastName || undefined,
                //         image_url: undefined,
                //     }).catch(()=>{})
                // }
                if (result.createdSessionId) {
                    await setActive?.({ session: result.createdSessionId })
                }
                // After verification: if there's a ticket, sign out and come back to consume it; otherwise go to step 2 directly
                setVerificationRequired(false)
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
                        console.log('signOut error after verification', e)
                    }
                } else {
                    setStep(2)
                    const params = new URLSearchParams(Array.from(search.entries()))
                    params.set('step', '2')
                    router.replace(`/client-onboarding?${params.toString()}`)
                }
            } else {
                setSignUpError('Verification failed. Please check the code and try again.')
            }
        } catch (err: any) {
            const message: string = err?.errors?.[0]?.message || 'Invalid verification code'
            setSignUpError(message)
        } finally {
            setVerifying(false)
        }
    }

    const handleResendCode = async () => {
        if (resending) return
        setSignUpError('')
        setResending(true)
        try {
            if (!signUpLoaded) throw new Error('Auth not ready')
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        } catch (err: any) {
            const message: string = err?.errors?.[0]?.message || 'Failed to resend code'
            setSignUpError(message)
        } finally {
            setResending(false)
        }
    }

    const saveWorkspaceSettings = async () => {
        if (!workspaceId) return;
        setSaving(true)
        try {
            await workspaceApi.updateWorkspace(workspaceId, { timezone, week_start: weekStart, time_format: timeFormat })
            setActiveWorkspace(workspaceId)
        } finally {
            setSaving(false)
        }
    }

    const renderStep1 = () => (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-black">Let's set up your profile</h2>
             <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-6">
                {signUpError && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{signUpError}</div>
                )}
                {!verificationRequired ? (
                    <>
                        <div className="flex gap-4">
                            <div className="w-full">
                                <div className="text-sm font-medium text-black mb-3">First name</div>
                                <Input placeholder="Enter your first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>
                            <div className="w-full">
                                <div className="text-sm font-medium text-black mb-3">Last name</div>
                                <Input placeholder="Enter your last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-black mb-3">Email</div>
                            <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-black mb-3">Password</div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={8}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                    disabled={signingUp}
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
                        </div>
                        <div>
                            <div className="text-sm font-medium text-black mb-3">Company name</div>
                            <Input placeholder="Enter your company name" value={company} onChange={(e) => setCompany(e.target.value)} />
                        </div>
                        <div id="clerk-captcha" className="mt-2" />
                        <Button onClick={handleNextFromStep1} disabled={!canNext() || !signUpLoaded || signingUp} className="w-full bg-main hover:bg-main/80 text-sm font-medium text-white cursor-pointer">{signingUp ? 'Signing up...' : 'Next'}</Button>
                    </>
                ) : (
                    <>
                        <div>
                            <div className="text-sm font-medium text-black mb-1">Verify your email</div>
                            <div className="text-sm text-grey mb-3">We sent a 6-digit code to {email}. Enter it below to continue.</div>
                            <Input
                                inputMode="numeric"
                                placeholder="Enter verification code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                            <div onClick={handleResendCode} className="text-sm font-medium cursor-pointer text-main mt-3">{resending ? 'Resending...' : 'Resend code'}</div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleVerifyEmailCode} disabled={!verificationCode || verifying} className="w-full bg-main hover:bg-main/80 text-sm font-medium text-white cursor-pointer">{verifying ? 'Verifying...' : 'Verify'}</Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={back} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"><ChevronLeft className="w-5 h-5 text-black" /></button>
                <h2 className="text-2xl font-semibold text-black">Choose your time area</h2>
            </div>
            <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-6">
                <div>
                    <div className="text-sm font-normal text-grey mb-2.5">Workspace timezone</div>
                    <div className="w-full border border-strokeButton rounded-[6px] text-sm text-black font-normal">
                        <TimezonePicker value={timezone} onChange={setTimezone} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="text-sm font-normal text-grey mb-2.5">Start of week</div>
                        <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-[30px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setWeekStart('monday')}
                                className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${weekStart === 'monday' ? 'bg-white shadow hover:bg-white' : ''
                                    }`}
                            >
                                Monday
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setWeekStart('sunday')}
                                className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${weekStart === 'sunday' ? 'bg-white shadow hover:bg-white' : ''
                                    }`}
                            >
                                Sunday
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-normal text-grey mb-2.5">Time format</div>
                        <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-[30px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTimeFormat('24h')}
                                className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${timeFormat === '24h' ? 'bg-white shadow hover:bg-white' : ''
                                    }`}
                            >
                                24-hour
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTimeFormat('12h')}
                                className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${timeFormat === '12h' ? 'bg-white shadow hover:bg-white' : ''
                                    }`}
                            >
                                12-hour
                            </Button>
                        </div>
                    </div>
                </div>
                <Button onClick={async () => { await saveWorkspaceSettings(); next(); }} disabled={saving} className="w-full bg-main hover:bg-main/80 text-sm font-medium text-white cursor-pointer">{saving ? 'Saving...' : 'Next'}</Button>
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={back} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
                <div>
                    <h2 className="text-2xl font-semibold text-black mb-1">Connect Socials</h2>
                    <p className="text-stone-300 text-lg font-semibold">Add all your brand's content channels. You can always add more later.</p>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-6">
                {/* Platform Selection */}
                <div className="flex justify-center gap-2">
                    {PLATFORMS.map(platform => (
                        <button
                            key={platform}
                            onClick={() => setActivePlatform(platform)}
                            className={cn(
                                "w-full flex flex-col items-center text-xs px-4 py-3 rounded-[6px] transition-all cursor-pointer",
                                platform === activePlatform
                                    ? "bg-[#EDF6FF] text-blue-600 border border-feedbird"
                                    : "border border-elementStroke"
                            )}
                        >
                            <ChannelIcons channels={[platform]} size={24} />
                        </button>
                    ))}
                </div>

                {/* Connect Options */}
                <div className="flex flex-row gap-2">
                    {PLATFORM_CONNECT_OPTIONS[activePlatform].map((option, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col gap-3 items-center justify-center px-4 py-6 rounded-[6px] border border-feedbird w-full"
                        >
                            <ChannelIcons channels={[activePlatform]} size={32} />
                            <span className="text-base font-semibold text-black text-center">{option.title}</span>
                            <Button
                                onClick={() => openPopup(activePlatform, option.method)}
                                size="sm"
                                className="w-[150px] p-2 rounded-[6px] bg-white hover:bg-white cursor-pointer"
                                style={{
                                    boxShadow: "0px 0px 0px 1px rgba(33, 33, 38, 0.05), 0px 1px 1px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px 0px rgba(34, 42, 53, 0.04), 0px 24px 68px 0px rgba(47, 48, 55, 0.05), 0px 2px 3px 0px rgba(0, 0, 0, 0.04)"
                                }}
                            >
                                {connectingPlatform === activePlatform ? 'Waiting...' : '+Connect'}
                            </Button>
                        </div>
                    ))}
                </div>

                <Button onClick={next} className="w-full bg-main hover:bg-main/80 text-sm font-medium text-white cursor-pointer">Next</Button>
            </div>
        </div>
    )

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={back} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"><ChevronLeft className="w-5 h-5 text-black" /></button>
                <div>
                    <h2 className="text-2xl font-semibold text-black">Invite team</h2>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-elementStroke shadow-sm p-5 space-y-6">
                <div className="space-y-4">
                    {inviteEmails.map((email, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${email ? avatarColors[index] : 'bg-gray-200'}`}>
                                    {email ? (
                                        <span className="text-xs font-medium text-white">{email.charAt(0).toUpperCase()}</span>
                                    ) : (
                                        <User className="text-darkGrey" style={{ width: '14px', height: '14px' }} />
                                    )}
                                </div>
                            </div>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    const newEmails = [...inviteEmails]
                                    const newValue = e.target.value
                                    newEmails[index] = newValue
                                    setInviteEmails(newEmails)
                                    if (newValue && !avatarColors[index]) {
                                        setAvatarColors(prev => ({ ...prev, [index]: getAvatarColor(index, avatarColors) }))
                                    }
                                }}
                                placeholder="Enter email address"
                                className="flex-1"
                                endSelect={{
                                    value: inviteRoles[index] || "Team",
                                    onChange: (val) => {
                                        const updated = [...inviteRoles]
                                        updated[index] = val
                                        setInviteRoles(updated)
                                    },
                                    options: ["Team", "Client"]
                                }}
                            />
                            <div
                                className="flex-shrink-0 cursor-pointer"
                                onClick={() => {
                                    if (inviteEmails.length > 1) {
                                        const newEmails = inviteEmails.filter((_, i) => i !== index)
                                        const newRoles = inviteRoles.filter((_, i) => i !== index)
                                        setInviteEmails(newEmails)
                                        setInviteRoles(newRoles)
                                        setAvatarColors(prev => {
                                            const c = { ...prev }; delete c[index]; return c
                                        })
                                    } else {
                                        const newEmails = [...inviteEmails]
                                        newEmails[index] = ''
                                        setInviteEmails(newEmails)
                                        const newRoles = [...inviteRoles]
                                        newRoles[index] = "Team"
                                        setInviteRoles(newRoles)
                                    }
                                }}
                            >
                                <X className="text-darkGrey" style={{ width: '14px', height: '14px' }} />
                            </div>
                        </div>
                    ))}
                    <div
                        onClick={() => setInviteEmails([...inviteEmails, ''])}
                        className="text-sm text-main font-medium cursor-pointer flex items-center"
                    >
                        <Plus className="mr-1" style={{ width: '14px', height: '14px' }} />
                        Add more collaborators
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={async () => {
                            if (!workspaceId) return
                            setSaving(true)
                            try {
                                await saveWorkspaceSettings()
                                if (hasInviteEmail) {
                                    const emails = inviteEmails
                                        .map((e, i) => ({ email: (e || '').trim(), role: inviteRoles[i] }))
                                        .filter((e) => e.email !== '')
                                    if (emails.length > 0) {
                                        const orgId = workspaces.find(w => w.id === workspaceId)?.clerk_organization_id
                                        await Promise.all(
                                            emails.map(({ email, role }) =>
                                              (role === 'Client'
                                                ? inviteApi.inviteClient({
                                                    email,
                                                    workspaceId: workspaceId,
                                                    actorId: user?.id,
                                                    organizationId: orgId,
                                                    first_name: user?.firstName,
                                                  })
                                                : inviteApi.inviteTeam({
                                                    email,
                                                    workspaceId: workspaceId,
                                                    actorId: user?.id,
                                                    organizationId: orgId,
                                                    first_name: user?.firstName,
                                                  })
                                              )
                                            )
                                        )
                                    }
                                }
                                router.replace(workspaceId ? `/${workspaceId}` : '/')
                            } finally {
                                setSaving(false)
                            }
                        }}
                        disabled={saving}
                        className={`w-full text-sm font-medium cursor-pointer ${hasInviteEmail ? 'bg-main hover:bg-main/80 text-white' : 'bg-white hover:bg-white text-black border border-strokeButton'}`}
                    >
                        {saving ? (hasInviteEmail ? 'Inviting...' : 'Saving...') : (hasInviteEmail ? 'Invite' : 'Invite Later')}
                    </Button>
                </div>
            </div>
        </div>
    )

    const renderCurrent = () => {
        switch (step) {
            case 1: return renderStep1()
            case 2: return renderStep2()
            case 3: return renderStep3()
            case 4: return renderStep4()
            default: return renderStep1()
        }
    }

    // Accept-invite style ticket consumption flow
    React.useEffect(() => {
        const handleTicketSignIn = async () => {
            if (!authLoaded || !signIn || !ticket) return
            if (isProcessingRef.current) return
            isProcessingRef.current = true
            if (isSignedIn) {
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

            // Only attempt ticket sign-in if we explicitly signed the user out first
            if (!wasSignedOutForTicket || isSignedIn) return

            try {
                const resIn: any = await signIn.create({ strategy: 'ticket', ticket })
                if (resIn?.status === 'complete' && resIn?.createdSessionId) {
                    // Do not await – schedule redirect immediately to avoid races where the promise never resolves in this effect tick
                    setActiveSignIn({ session: resIn.createdSessionId }).catch(() => {})
                    setStep(2)
                    const params = new URLSearchParams(Array.from(search.entries()))
                    params.set('step', '2')
                    params.delete('signed_out')
                    params.delete('__clerk_ticket')
                    params.delete('ticket')
                    params.delete('invitation_token')
                    const target = `/client-onboarding?${params.toString()}`
                    if (typeof window !== 'undefined') {
                        setTimeout(() => { window.location.replace(target) }, 0)
                        return
                    }
                }
            } catch {
                console.log('ticket signIn.create error')
            }
            // Fallback: client-side navigate to step 2
            const params = new URLSearchParams(Array.from(search.entries()))
            params.set('step', '2')
            params.delete('signed_out')
            params.delete('__clerk_ticket')
            params.delete('ticket')
            params.delete('invitation_token')
            router.replace(`/client-onboarding?${params.toString()}`)
        }

        handleTicketSignIn()
    }, [authLoaded, isSignedIn, wasSignedOutForTicket, router, signIn, setActiveSignIn, signOut, ticket, search, setStep])

    // Post-activation cleanup: if session became active after ticket sign-in, advance to step 2 and clean URL
    React.useEffect(() => {
        if (!authLoaded) return
        if (!wasSignedOutForTicket) return
        if (!isSignedIn) return
        setStep(2)
        const params = new URLSearchParams(Array.from(search.entries()))

        params.set('step', '2')
        params.delete('signed_out')
        params.delete('__clerk_ticket')
        params.delete('ticket')
        params.delete('invitation_token')
        router.replace(`/client-onboarding?${params.toString()}`)
    }, [authLoaded, wasSignedOutForTicket, isSignedIn, search, router])

    if (wasSignedOutForTicket) {
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

    return (
        <div className="flex w-full h-full overflow-visible">
            {/* Left */}
            <div className="flex-[11] flex flex-col items-center bg-white px-8 pt-8">
                <div className="max-w-[480px] w-full h-full flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <Image src="/images/logo/logo(1).svg" alt="FeedBird Logo" width={127} height={20} className="h-5 w-auto" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center">
                        {renderCurrent()}
                    </div>
                    {/* Horizontal Progress */}
                    <div className="pb-8">
                        <div className="flex gap-1 justify-center">
                            {STEPS.map((s, index) => (
                                <div key={s.id} className="">
                                    <div className={`h-1 w-25 rounded-full transition-all duration-300 ease-in-out ${step > index ? 'bg-main' : 'bg-buttonStroke'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
            {/* Right */}
            <div className="flex-[14] flex flex-col pl-12 pt-36 bg-[#F8F8F8] relative">
                {/* Platform Preview Component */}
                <div className="flex-1 flex justify-center">
                    <div className="w-full h-full">
                        <div className="w-full h-full rounded-tl-lg overflow-visible border-l-5 border-t-5 border-elementStroke">
                            <PlatformPreview />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


