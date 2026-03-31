'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '../actions'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setServerError(null)
    const result = await resetPassword(values.email)
    if ('error' in result) {
      setServerError(result.error)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_3px_rgba(20,184,166,0.4)]" />
        <span className="text-slate-900 font-semibold text-xl tracking-tight">GapPilot</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Mail className="w-6 h-6 text-teal-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-sm text-slate-500 mb-1">
              We sent a password reset link to
            </p>
            <p className="text-sm font-semibold text-slate-800 mb-6">{getValues('email')}</p>
            <p className="text-xs text-slate-400">
              Didn&apos;t receive it? Check your spam folder, or{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Reset your password</h1>
            <p className="text-sm text-slate-500 mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {serverError && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          </>
        )}
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 mt-6 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>
    </div>
  )
}
