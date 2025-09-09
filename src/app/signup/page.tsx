'use client'

import { useState, useEffect } from 'react'
import { useSignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

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

export default function SignUpPage() {
    const [currentTestimonial, setCurrentTestimonial] = useState(0)
    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

    const { isLoaded, signUp, setActive } = useSignUp()

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
        }, 4000) // Change testimonial every 4 seconds

        return () => clearInterval(interval)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        if (!isLoaded) {
            setError('Authentication is not loaded yet')
            setIsLoading(false)
            return
        }

        if (!agreeToTerms) {
            setError('Please agree to the Terms of Service and Privacy Policy to continue')
            setIsLoading(false)
            return
        }

        try {
            await signUp.create({
                emailAddress: email,
                password,
                firstName,
                lastName,
            })

            // If successful, prepare for email verification
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
            router.push('/verify-email')

        } catch (err: any) {
            console.error('Signup error:', err)
            setError(err.errors?.[0]?.message || 'An error occurred during signup')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        setError('')
        if (!isLoaded) {
            setError('Authentication is not loaded yet')
            return
        }

        try {
            await signUp.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/',
            })
        } catch (err: any) {
            console.error('Google signup error:', err)
            setError(err.errors?.[0]?.message || 'Failed to sign up with Google')
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Sign Up Form */}
            <div className="flex-[11] flex flex-col items-center bg-white px-8 py-8 pt-16">
                <div className="max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-35">
                        <div className="flex-shrink-0">
                            <Image
                                src="/images/logo/logo.png"
                                alt="FeedBird Logo"
                                width={127}
                                height={20}
                                className="h-5 w-auto"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/landing')}
                            className="text-drakGrey hover:text-black"
                        >
                            ← Back to home
                        </Button>
                    </div>


                    {/* Title*/}
                    <h1 className="text-3xl font-semibold text-black mb-8">
                        Create an account
                    </h1>

                    {/* Custom Sign Up Form */}
                    <div className="">
                        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-black font-normal">
                            {/* Email Field - First Line */}
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full rounded-md"
                                disabled={isLoading}
                            />

                            {/* Name Fields - Second Line */}
                            <div className="flex gap-4">
                                <Input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="First name"
                                    required
                                    className="w-full rounded-md"
                                    disabled={isLoading}
                                />
                                <Input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Last name"
                                    required
                                    className="w-full rounded-md"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password Field - Third Line */}
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
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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

                            {/* Error Message */}
                            {error && (
                                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

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

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                                disabled={isLoading || !isLoaded || !agreeToTerms}
                            >
                                {isLoading ? 'Signing Up...' : 'Sign Up'}
                            </Button>
                        </form>

                        {/* Google Sign Up Button */}
                        <Button
                            onClick={handleGoogleSignUp}
                            variant="outline"
                            className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 mt-4 py-2 px-4 rounded-md font-medium flex items-center justify-center gap-3"
                            disabled={isLoading || !isLoaded}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign up with Google
                        </Button>

                        {/* Sign In Link */}
                        <div className="mt-8 text-center">
                            <span className="text-darkGrey text-sm font-normal">
                                Already have an account?{' '}
                                <button
                                    onClick={() => router.push('/signin')}
                                    className="text-main hover:text-blue-700 font-semibold leading-tight"
                                    disabled={isLoading}
                                >
                                    Sign in
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Testimonials and Platform Image */}
            <div className="flex-[14] flex flex-col pl-12 pt-10 bg-[#F8F8F8]">
                {/* Testimonials Section */}
                    <div className="pr-12 mb-10">
                        <div className="relative overflow-hidden">
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className={`transition-all duration-1000 transform ${index === currentTestimonial
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-4 absolute inset-0'
                                        }`}
                                >
                                    {/* Quote - max 3 lines with ellipsis */}
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

                                    {/* Author Info with Avatar and Stars */}
                                    <div className="flex items-center justify-between">
                                        {/* Left side - Avatar and Author Info */}
                                        <div className="flex items-center space-x-2">
                                            {/* Avatar */}
                                            <img
                                                src={testimonial.avatar}
                                                alt={testimonial.author}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />

                                            {/* Author Info - Two lines */}
                                            <div className="text-sm space-y-1">
                                                <div className="font-semibold text-black">
                                                    {testimonial.author.split(' ').map((name, index) =>
                                                        index === 0 ? `${name.charAt(0)}.` : name
                                                    ).join(' ')}
                                                </div>
                                                <div className="font-normal text-darkGrey">
                                                    {testimonial.role} at {testimonial.company}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right side - Stars */}
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

                {/* Platform Preview Image */}
                <div className="flex-1 flex justify-center">
                    <div className="w-full h-full">
                        <div className="w-full h-full rounded-tl-lg overflow-hidden border-l-5 border-t-5 border-elementStroke">
                            <img
                                src="/images/logo/preview.png"
                                alt="FeedBird Dashboard Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
