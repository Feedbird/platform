'use client'

import { useEffect, useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import PlatformPreview from '@/components/platform-preview/platform-preview'
import { Eye, EyeOff } from 'lucide-react'

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

export default function ForgotPasswordPage() {
    const [currentTestimonial, setCurrentTestimonial] = useState(0)
    const [previousTestimonial, setPreviousTestimonial] = useState(4)
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [emailSent, setEmailSent] = useState(false)
    const router = useRouter()
    const { isLoaded, signIn, setActive } = useSignIn()

    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        if (!isLoaded) {
            setError('Authentication is not loaded yet')
            setIsLoading(false)
            return
        }

        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            })
            setEmailSent(true)
        } catch (err: any) {
            setError(err?.errors?.[0]?.message || 'Failed to send reset link')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!isLoaded) {
            setError('Authentication is not loaded yet')
            return
        }
        if (!code) {
            setError('Please enter the code sent to your email')
            return
        }
        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields')
            return
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords don't match")
            return
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long')
            return
        }

        setIsLoading(true)
        try {
            const res = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password: newPassword,
            })

            if (res.status === 'complete') {
                await setActive({ session: res.createdSessionId as any })
                router.replace('/');
            } else {
                setError('Unable to reset password. Please try again.')
            }
        } catch (err: any) {
            setError(err?.errors?.[0]?.longMessage || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="h-screen grid grid-cols-[11fr_14fr] w-full">
            {/* Left Side - Forgot Password */}
            <div className="flex flex-col items-center bg-white min-w-[500px] relative">
                <div className="flex flex-col w-[60%] h-full relative">
                    {/* Header */}
                    <div className="flex items-center justify-start pt-16">
                        <button
                            onClick={() => router.push('/landing')}
                            className="flex-shrink-0 cursor-pointer"
                        >
                            <Image
                                src="/images/logo/logo(1).svg"
                                alt="FeedBird Logo"
                                width={127}
                                height={20}
                                className="h-5 w-auto"
                            />
                        </button>
                    </div>

                    {/* Centered Content */}
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-semibold text-black mb-3">
                                Forgot your password?
                            </h1>
                            {emailSent ? (
                                <p className="text-sm font-normal text-darkGrey">
                                    Enter the 6-digit code sent to your email and choose a new password.
                                </p>
                            ) : (
                                <p className="text-sm font-normal text-darkGrey">
                                    To reset your password, please enter the email address of your Feedbird account
                                </p>
                            )}
                        </div>

                        {!emailSent ? (
                            <form onSubmit={handleSend} className="space-y-6 text-sm text-black font-normal">

                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full rounded-[6px] border-buttonStroke px-3.5 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
                                    disabled={isLoading}
                                />

                                {error && (
                                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-main hover:bg-main/80 text-white py-2.5 px-4.5 h-11.5 rounded-[6px] text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
                                    disabled={isLoading || !isLoaded}
                                >
                                    {isLoading ? 'Sending…' : 'Send'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-4 text-sm text-black font-normal">
                                <Input
                                    id="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter code"
                                    required
                                    className="w-full rounded-[6px] border-buttonStroke px-3.5 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
                                    disabled={isLoading}
                                />

                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password"
                                        required
                                        className="w-full rounded-[6px] border-buttonStroke pr-11 px-3.5 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-darkGrey hover:text-black"
                                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                        className="w-full rounded-[6px] border-buttonStroke pr-11 px-3.5 py-[13px] h-11.5 placeholder:!text-black focus:!border-main focus:outline-none focus:ring-0 focus-visible:ring-0"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-darkGrey hover:text-black"
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-main hover:bg-main/80 text-white py-2.5 px-4.5 h-11.5 rounded-[6px] text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
                                    disabled={isLoading || !isLoaded}
                                >
                                    {isLoading ? 'Resetting…' : 'Reset password'}
                                </Button>
                            </form>
                        )}
                        <div className="text-start">
                            <span className="text-darkGrey text-sm font-normal">
                                Go back to{' '}
                                <button
                                    onClick={() => router.push('/signin')}
                                    className="text-main hover:text-blue-700 font-semibold leading-tight cursor-pointer"
                                    disabled={isLoading}
                                >
                                    Login
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Testimonials and Platform Image (same as Sign In) */}
            <div className="flex flex-col pl-12 pt-10 bg-[#F8F8F8] overflow-y-auto">
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
                                                {testimonial.author.split(' ').map((name, idx) =>
                                                    idx === 0 ? `${name.charAt(0)}.` : name
                                                ).join(' ')}
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

                <div className="flex-1 flex justify-center">
                    <div className="w-full h-full">
                        <div className="w-full h-full rounded-tl-lg overflow-hidden border-l-5 border-t-5 border-elementStroke">
                            <PlatformPreview />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


