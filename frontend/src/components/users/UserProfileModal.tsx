import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { updateMe } from '@/api/users';
import { X, User as UserIcon, Lock, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const setUserStore = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

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
    setError(null);
    setSuccessMsg(null);

    const payload: Partial<User> & { password?: string } = {
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    if (password) {
      const pwdErr = validatePasswordPolicy(password);
      if (pwdErr) {
        setError(pwdErr);
        return;
      }
      if (password !== confirmPassword) {
        setError('Password confirmation does not match.');
        return;
      }
      payload.password = password;
    }

    setIsLoading(true);
    try {
      const res = await updateMe(payload);
      setSuccessMsg('Profile updated successfully.');
      // Update global store
      setUserStore({ ...user, ...res.data });
      // Close automatically after 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Edit Profile</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-600 border border-green-100">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  disabled
                  value={user.username || ''}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Username cannot be changed.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name</label>
              <input
                type="text"
                required
                maxLength={160}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-shadow"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-shadow"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">New Password <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
              <div className="relative mb-3">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-shadow"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              {password && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required={!!password}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-shadow"
                    placeholder="Confirm new password"
                  />
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
