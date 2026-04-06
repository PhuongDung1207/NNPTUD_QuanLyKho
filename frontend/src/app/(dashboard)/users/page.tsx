'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  X,
  Shield,
  Mail,
  User as UserIcon,
  Key,
  Lock,
  Unlock,
  Upload,
  Send,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  lockUser,
  unlockUser,
  resendInvite,
  importUsers,
  ImportResponse,
} from '@/api/users';
import { getRoles } from '@/api/roles';
import { User, Role } from '@/types/auth';
import { format } from 'date-fns';

// ─── Toast ───────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error';
interface Toast { id: number; message: string; type: ToastType }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-2 duration-300 ${
            t.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Import Result Modal ──────────────────────────────────────────────────────
function ImportResultModal({
  result,
  onClose,
}: {
  result: ImportResponse | null;
  onClose: () => void;
}) {
  if (!result) return null;
  const { summary, warnings = [], failures = [] } = result.data ?? {};

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={20} />
              <h3 className="font-bold text-slate-800">Kết quả Import</h3>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {/* Message */}
            <p className="text-sm text-slate-600">{result.message}</p>

            {/* Stats chips */}
            {summary && (
              <div className="flex flex-wrap gap-2">
                {summary.sheetName && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    Sheet: {summary.sheetName}
                  </span>
                )}
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                  Tổng: {summary.totalRows} dòng
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  ✓ Thành công: {summary.createdCount}
                </span>
                <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium">
                  ✗ Thất bại: {summary.failedCount}
                </span>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Lưu ý ({warnings.length})
                </h4>
                <ul className="space-y-1">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Failures */}
            {failures.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-600 uppercase flex items-center gap-1.5">
                  <XCircle size={13} /> Dòng lỗi ({failures.length})
                </h4>
                <ul className="space-y-1">
                  {failures.map((f, i) => {
                    const identity = [f.username, f.email].filter(Boolean).join(' / ');
                    return (
                      <li key={i} className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg">
                        <strong>Dòng {f.row}{identity ? ` (${identity})` : ''}: </strong>
                        {f.reason || 'Không rõ lỗi'}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({
  label, value, color, icon,
}: {
  label: string; value: number; color: string; icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const queryClient = useQueryClient();
  const { toasts, show: toast } = useToast();

  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    avatarUrl: '',
    password: '',
    role: '',
    status: 'inactive' as 'active' | 'inactive' | 'locked',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: usersResponse, isLoading, isFetching } = useQuery({
    queryKey: ['users', { search, status: statusFilter }],
    queryFn: () => getUsers({ search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined } as any),
  });
  const { data: rolesResponse } = useQuery({ queryKey: ['roles'], queryFn: getRoles });

  const users = usersResponse?.data || [];
  const roles = rolesResponse?.data || [];
  const stats = usersResponse?.stats;
  const total = stats?.total ?? users.length;
  const activeCount = stats?.active ?? users.filter(u => u.status === 'active').length;
  const lockedCount = stats?.locked ?? users.filter(u => u.status === 'locked').length;

  // Mutations
  const mutationCreate = useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseForm();
      toast(res.message || 'Tạo tài khoản và gửi email kích hoạt thành công!');
    },
    onError: (e: any) => toast(e?.response?.data?.message || e.message || 'Tạo tài khoản thất bại.', 'error'),
  });

  const mutationUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseForm();
      toast(res.message || 'Cập nhật người dùng thành công!');
    },
    onError: (e: any) => toast(e?.response?.data?.message || e.message || 'Cập nhật thất bại.', 'error'),
  });

  const mutationDelete = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('Xóa người dùng thành công!');
    },
    onError: (e: any) => toast(e?.response?.data?.message || e.message || 'Xóa thất bại.', 'error'),
  });

  const mutationLock = useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
      locked ? unlockUser(id) : lockUser(id),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast(res.message || (vars.locked ? 'Mở khóa thành công!' : 'Khóa tài khoản thành công!'));
    },
    onError: (e: any) => toast(e?.response?.data?.message || e.message || 'Thao tác thất bại.', 'error'),
  });

  const mutationResend = useMutation({
    mutationFn: (id: string) => resendInvite(id),
    onSuccess: (res) => toast(res.message || 'Gửi lại email kích hoạt thành công!'),
    onError: (e: any) => toast(e?.response?.data?.message || e.message || 'Gửi email thất bại.', 'error'),
  });

  // Handlers
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormError(null);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      phone: (user as any).phone || '',
      avatarUrl: (user as any).avatarUrl || '',
      password: '',
      role: typeof user.role === 'object' ? (user.role as Role).code : (user.role || ''),
      status: user.status,
    });
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormError(null);
    setFormData({ username: '', email: '', fullName: '', phone: '', avatarUrl: '', password: '', role: '', status: 'inactive' });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setFormError(null);
    setFormData({ username: '', email: '', fullName: '', phone: '', avatarUrl: '', password: '', role: '', status: 'inactive' });
  };

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8 || pw.length > 64) return 'Mật khẩu phải dài từ 8 đến 64 ký tự.';
    if (!/[A-Z]/.test(pw)) return 'Mật khẩu phải có ít nhất 1 chữ in hoa.';
    if (!/[a-z]/.test(pw)) return 'Mật khẩu phải có ít nhất 1 chữ thường.';
    if (!/[0-9]/.test(pw)) return 'Mật khẩu phải có ít nhất 1 chữ số.';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt.';
    if (/\s/.test(pw)) return 'Mật khẩu không được chứa khoảng trắng.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const isEditing = Boolean(editingUser);
    const fullName = formData.fullName.trim();
    const username = formData.username.trim();
    const email = formData.email.trim();
    const role = formData.role.trim();
    const password = formData.password;

    // Validation
    if (!fullName) {
      setFormError('Họ tên không được để trống.');
      return;
    }
    if (!isEditing && !username) {
      setFormError('Tên đăng nhập không được để trống.');
      return;
    }
    if (!isEditing && !email) {
      setFormError('Email không được để trống khi tạo tài khoản.');
      return;
    }
    if (!role) {
      setFormError('Vui lòng chọn vai trò cho tài khoản.');
      return;
    }
    if (isEditing && password) {
      const pwError = validatePassword(password);
      if (pwError) { setFormError(pwError); return; }
    }

    if (isEditing) {
      // Edit payload: fullName, phone, avatarUrl, email, status, role + optional password
      const payload: any = {
        fullName,
        phone: formData.phone.trim(),
        avatarUrl: formData.avatarUrl.trim(),
        email,
        status: formData.status,
        role,
      };
      if (password) payload.password = password;
      mutationUpdate.mutate({ id: editingUser!._id || editingUser!.id, data: payload });
    } else {
      // Create payload: fullName, username, email, role — NO password (set via activation email)
      const payload: any = {
        fullName,
        username,
        email,
        role,
        phone: formData.phone.trim(),
        avatarUrl: formData.avatarUrl.trim(),
      };
      mutationCreate.mutate(payload);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast('Chỉ hỗ trợ file Excel .xlsx hoặc .xls.', 'error');
      e.target.value = '';
      return;
    }
    setIsImporting(true);
    try {
      const res = await importUsers(file);
      setImportResult(res);
      const created = res.data?.summary?.createdCount ?? 0;
      const failed = res.data?.summary?.failedCount ?? 0;
      toast(res.message || 'Import hoàn tất.', created === 0 && failed > 0 ? 'error' : 'success');
      if (created > 0) queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast(err?.response?.data?.message || err.message || 'Import thất bại.', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const getRoleLabel = (role: string | Role | undefined) => {
    if (!role) return '';
    if (typeof role === 'object') return (role as Role).code || (role as Role).name || '';
    return role;
  };

  const isPending = mutationCreate.isPending || mutationUpdate.isPending;

  return (
    <>
      <ToastContainer toasts={toasts} />
      <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />

      {/* Hidden file input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="flex h-full gap-6 animate-in fade-in duration-500">
        {/* ── Main Column ── */}
        <div className={`flex-1 space-y-5 transition-all duration-300 min-w-0`}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" />
                Quản lý Người dùng
              </h1>
              <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản nhân sự và phân quyền truy cập hệ thống.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Import Excel button */}
              <button
                onClick={() => !isImporting && importInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting
                  ? <RefreshCw size={16} className="animate-spin" />
                  : <Upload size={16} />
                }
                {isImporting ? 'Đang import...' : 'Import Excel'}
              </button>
              {/* Add User button */}
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={18} />
                Thêm người dùng
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Tổng người dùng"
              value={total}
              color="bg-blue-50"
              icon={<Users size={20} className="text-blue-600" />}
            />
            <StatCard
              label="Đang hoạt động"
              value={activeCount}
              color="bg-emerald-50"
              icon={<CheckCircle2 size={20} className="text-emerald-600" />}
            />
            <StatCard
              label="Đang bị khóa"
              value={lockedCount}
              color="bg-rose-50"
              icon={<Lock size={20} className="text-rose-500" />}
            />
          </div>

          {/* Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm theo tên, tài khoản, email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 shrink-0">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="locked">Bị khóa</option>
                  <option value="inactive">Chưa kích hoạt</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
                className="p-2 text-slate-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Tài khoản & Email</th>
                  <th className="px-6 py-4 text-center">Vai trò</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-16 bg-gray-50/20" />
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Users size={36} strokeWidth={1.2} />
                        <span className="text-sm italic">Không tìm thấy người dùng nào.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const userId = u._id || u.id;
                    const isLocked = u.status === 'locked';
                    const canResend = Boolean((u as any).email) && !(u as any).emailVerifiedAt;
                    return (
                      <tr key={userId} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm shrink-0">
                              {u.avatarUrl
                                ? <img src={u.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                                : (u.fullName?.charAt(0) || u.username.charAt(0)).toUpperCase()
                              }
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 truncate">{u.fullName || 'Chưa cập nhật tên'}</span>
                              <span className="text-[10px] text-slate-400">
                                {(u as any).createdAt ? format(new Date((u as any).createdAt), 'dd/MM/yyyy') : '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-700 font-semibold flex items-center gap-1.5 text-sm">
                              <UserIcon size={12} className="text-slate-400 shrink-0" />
                              {u.username}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <Mail size={12} className="shrink-0" />
                              {u.email || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                            <Shield size={12} />
                            {getRoleLabel(u.role) || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : u.status === 'locked'
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {u.status === 'active' ? <CheckCircle2 size={12} /> : u.status === 'locked' ? <Lock size={12} /> : <XCircle size={12} />}
                            {u.status === 'active' ? 'Hoạt động' : u.status === 'locked' ? 'Bị khóa' : 'Chưa kích hoạt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(u)}
                              title="Chỉnh sửa"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={15} />
                            </button>
                            {/* Resend invite */}
                            {canResend && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Gửi lại email kích hoạt cho "${u.email}"?`)) {
                                    mutationResend.mutate(userId);
                                  }
                                }}
                                title="Gửi lại email kích hoạt"
                                className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              >
                                <Send size={15} />
                              </button>
                            )}
                            {/* Lock / Unlock */}
                            <button
                              onClick={() => {
                                const action = isLocked ? 'mở khóa' : 'khóa';
                                if (window.confirm(`Bạn có chắc muốn ${action} tài khoản "${u.username}"?`)) {
                                  mutationLock.mutate({ id: userId, locked: isLocked });
                                }
                              }}
                              title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              className={`p-2 rounded-lg transition-colors ${isLocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                            >
                              {isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa người dùng "${u.username}"? Hành động này không thể hoàn tác.`)) {
                                  mutationDelete.mutate(userId);
                                }
                              }}
                              title="Xóa tài khoản"
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Side Form ── */}
        {isFormOpen && (
          <div className="w-80 shrink-0 bg-white rounded-3xl border border-gray-100 shadow-xl p-7 sticky top-0 h-fit space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <h2 className="text-base font-bold text-slate-800">
                {editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
              </h2>
              <button onClick={handleCloseForm} className="p-1.5 text-slate-400 hover:bg-gray-50 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Mode notice */}
            <div className={`rounded-xl px-3 py-2.5 text-xs border ${
              editingUser
                ? 'bg-slate-50 border-slate-100 text-slate-600'
                : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              {editingUser
                ? 'Có thể cập nhật thông tin, vai trò, trạng thái và đặt lại mật khẩu khi cần.'
                : (<>Tài khoản mới sẽ ở trạng thái <strong>chưa kích hoạt</strong>. Hệ thống gửi email để người dùng tự đặt mật khẩu và kích hoạt tài khoản.</>)
              }
            </div>

            {/* Form error */}
            {formError && (
              <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              {/* Username — chỉ nhập khi tạo mới, readonly khi edit */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Tên đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  disabled={!!editingUser}
                  type="text"
                  placeholder="van_a"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 ml-1">
                  {editingUser ? 'Username không thể thay đổi sau khi tạo.' : 'Username sẽ không thể thay đổi sau khi tạo.'}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Email {!editingUser && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="email"
                    placeholder="a@company.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Vai trò */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Vai trò <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="">Chọn vai trò...</option>
                    {roles.map(r => <option key={r._id} value={r.code}>{r.code} - {r.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Chọn một vai trò hệ thống cho tài khoản này.</p>
              </div>

              {/* Mật khẩu — CHỈ hiện khi EDIT, không hiện khi CREATE */}
              {editingUser && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                    Đổi mật khẩu
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="password"
                      placeholder="Để trống nếu không đổi mật khẩu"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1">Để trống nếu không đổi. Nếu có đổi, mật khẩu phải gồm 8–64 ký tự, có chữ hoa, thường, số và ký tự đặc biệt.</p>
                </div>
              )}

              {/* Trạng thái — CHỈ hiện khi EDIT, không hiện khi CREATE */}
              {editingUser && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Trạng thái</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['active', 'inactive', 'locked'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={`text-[10px] font-bold py-2 rounded-xl border transition-all ${
                          formData.status === s
                            ? s === 'active'
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : s === 'locked'
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'bg-amber-400 text-white border-amber-400'
                            : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        {s === 'active' ? 'Hoạt động' : s === 'locked' ? 'Khóa' : 'Inactive'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Khi CREATE: thông báo về password */}
              {!editingUser && (
                <p className="text-[10px] text-slate-400 ml-1">
                  Người dùng sẽ tự đặt mật khẩu thông qua email kích hoạt được gửi đến địa chỉ email trên.
                </p>
              )}

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isPending ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  {editingUser ? 'Lưu người dùng' : 'Tạo & Gửi kích hoạt'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
