'use client'

import { useState, useEffect } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyEmailPage() {
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const router = useRouter()

  const { isLoaded, signUp, setActive } = useSignUp()

  useEffect(() => {
    if (!isLoaded) return

    // If the user is already verified, redirect to home
    if (signUp.status === 'complete') {
      setActive({ session: signUp.createdSessionId })
      router.push('/')
      return
    }
  }, [isLoaded, signUp, setActive, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!isLoaded) {
      setError('Authentication is not loaded yet')
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
      } else {
        setError('Invalid verification code. Please try again.')
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.errors?.[0]?.message || 'Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setError('')

    if (!isLoaded) {
      setError('Authentication is not loaded yet')
      setResendLoading(false)
      return
    }

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setError('Verification code sent! Check your email.')
    } catch (err: any) {
      console.error('Resend error:', err)
      setError(err.errors?.[0]?.message || 'Failed to resend code.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 text-sm">
              We've sent a verification code to your email address. Please enter it below.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                className="w-full text-center text-lg tracking-widest"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className={`text-sm text-center p-3 rounded-md ${
                error.includes('sent') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
              disabled={isLoading || !isLoaded || verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              Didn't receive the code?{' '}
              <button
                onClick={handleResendCode}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            </span>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/signup')}
              className="text-gray-600 hover:text-gray-700 text-sm"
            >
              ← Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
