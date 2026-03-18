import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Shield, CheckCircle, XCircle } from 'lucide-react';
import API from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PasswordStrength = ({ password }) => {
    const checks = [
        { label: 'At least 6 characters', pass: password.length >= 6 },
        { label: 'Contains a number', pass: /\d/.test(password) },
        { label: 'Contains uppercase letter', pass: /[A-Z]/.test(password) },
        { label: 'Contains special character', pass: /[!@#$%^&*]/.test(password) },
    ];
    const score = checks.filter(c => c.pass).length;
    const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2">
            <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-white/10'}`}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {checks.map((c, i) => (
                        <span key={i} className={`flex items-center gap-1 text-[10px] ${c.pass ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {c.pass ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {c.label}
                        </span>
                    ))}
                </div>
                {score > 0 && (
                    <span className={`text-xs font-bold ${['','text-red-400','text-amber-400','text-yellow-400','text-emerald-400'][score]}`}>
                        {labels[score]}
                    </span>
                )}
            </div>
        </div>
    );
};

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login: setUser } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const res = await API.post(`/auth/reset-password/${token}`, { password });
            // Auto login after reset
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setSuccess(true);
            toast.success('Password reset successfully! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md animate-slide-up relative">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">SupportDesk</h1>
                </div>

                <div className="glass-card p-8">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Password Reset!</h2>
                            <p className="text-slate-400 text-sm">Redirecting you to your dashboard...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white">Set New Password</h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Choose a strong password for your account.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="form-label">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            className="form-input pl-10 pr-12"
                                            placeholder="Enter new password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                        >
                                            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                </div>

                                <div>
                                    <label className="form-label">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            className="form-input pl-10 pr-12"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                        >
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                            <XCircle className="w-3 h-3" /> Passwords do not match
                                        </p>
                                    )}
                                    {confirmPassword && password === confirmPassword && (
                                        <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Passwords match
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                    disabled={loading || password !== confirmPassword || password.length < 6}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Resetting...
                                        </span>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Reset Password
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-4 border-t border-white/10 text-center">
                                <Link to="/forgot-password" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
                                    Request a new reset link
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
