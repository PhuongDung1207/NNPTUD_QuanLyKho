'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getActivationPreview, activateAccount } from '@/api/auth';
import { format } from 'date-fns';
import Link from 'next/link';

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [dataPreview, setDataPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreview() {
      if (!token) {
        setPreviewError('Activation token is missing. Please use the link from your activation email.');
        setIsLoadingMenu(false);
        return;
      }

      try {
        const response = await getActivationPreview(token);
        setDataPreview(response.data);
      } catch (err: any) {
        setPreviewError(err?.response?.data?.message || err.message || 'Activation link is invalid or expired.');
      } finally {
        setIsLoadingMenu(false);
      }
    }

    loadPreview();
  }, [token]);

  const validatePasswordPolicy = (pw: string) => {
    if (pw.length < 8 || pw.length > 64) {
      return 'Password must be between 8 and 64 characters.';
    }
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least 1 uppercase letter.';
    if (!/[a-z]/.test(pw)) return 'Password must contain at least 1 lowercase letter.';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least 1 number.';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least 1 special character.';
    if (/\s/.test(pw)) return 'Password cannot contain spaces.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError('Activation token is missing.');
      return;
    }

    const pwdErr = validatePasswordPolicy(password);
    if (pwdErr) {
      setFormError(pwdErr);
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activateAccount({ token, password });
      setSuccessMsg(`${res.message || 'Account activated successfully. You can now sign in.'} Redirecting to login...`);
      setTimeout(() => {
        router.push('/login');
      }, 1800);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Failed to activate account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingMenu) {
    return (
      <div className="text-center p-6 text-slate-500 font-medium animate-pulse">
        Loading activation details...
      </div>
    );
  }

  return (
    <>
      {dataPreview && !previewError && !successMsg && (
        <div className="flex flex-col gap-1 mt-4 mb-6 p-4 rounded-[18px] bg-blue-600/5 border border-blue-600/15">
          <p className="m-0 text-slate-500 text-[0.78rem] tracking-wider uppercase">Invitation for</p>
          <strong className="text-[1.1rem] text-slate-800">
            {dataPreview.fullName || dataPreview.username || '-'}
          </strong>
          <span className="text-slate-500 text-sm">{dataPreview.email || '-'}</span>
          <small className="text-slate-400 text-xs mt-1">
            Link expires: {dataPreview.expiresAt ? format(new Date(dataPreview.expiresAt), 'dd MMM yyyy, HH:mm') : '-'}
          </small>
        </div>
      )}

      {previewError && (
        <div className="mt-4 p-4 rounded-xl text-rose-600 bg-rose-50 border border-rose-500/10 leading-relaxed text-sm">
          {previewError}
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-4 rounded-xl text-emerald-600 bg-emerald-50 border border-emerald-500/10 leading-relaxed text-sm font-medium text-center">
          {successMsg}
        </div>
      )}

      {formError && !successMsg && (
        <div className="mt-4 mb-4 p-4 rounded-xl text-rose-600 bg-rose-50 border border-rose-500/10 leading-relaxed text-sm">
          {formError}
        </div>
      )}

      {!previewError && !successMsg && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-800">New password</label>
            <input
              type="password"
              placeholder="Enter new password"
              required
              minLength={8}
              maxLength={64}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[50px] px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-800">Confirm password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              required
              minLength={8}
              maxLength={64}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full min-h-[50px] px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 text-sm"
            />
          </div>

          <p className="m-0 text-slate-500 text-[0.92rem] leading-relaxed">
            Password must be 8-64 characters and include uppercase, lowercase, number, and special character.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full min-h-[52px] border-0 rounded-2xl text-white font-bold bg-gradient-to-br from-blue-600 to-indigo-700 shadow-[0_18px_32px_rgba(47,102,246,0.24)] cursor-pointer transition-opacity disabled:opacity-70 disabled:cursor-wait hover:opacity-90 active:scale-[0.98]"
          >
            {isSubmitting ? 'Activating...' : 'Activate account'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link href="/login" className="text-blue-600 font-bold hover:underline text-sm">
          Back to login
        </Link>
      </div>
    </>
  );
}

export default function ActivateAccountPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6 text-slate-800 bg-[#edf3ff] bg-[radial-gradient(circle_at_top_left,rgba(47,102,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,145,77,0.12),transparent_28%)]">
      <main className="w-full max-w-[520px] p-6 sm:p-8 rounded-[26px] bg-white/95 border border-blue-100/50 shadow-[0_28px_60px_rgba(30,48,85,0.16)] backdrop-blur-md">
        <div>
          <p className="m-0 text-[0.8rem] font-bold tracking-[0.16em] uppercase text-blue-600">
            Warehouse Management
          </p>
          <h1 className="m-0 mt-1 mb-2.5 font-serif text-3xl sm:text-4xl text-slate-900">
            Activate your account
          </h1>
          <p className="m-0 text-slate-500 leading-relaxed">
            Set your password to finish account activation. Your account will remain inactive until this step is completed.
          </p>
        </div>

        <Suspense fallback={<div className="text-center p-8 text-slate-500 animate-pulse">Loading...</div>}>
          <ActivateAccountContent />
        </Suspense>
      </main>
    </div>
  );
}
