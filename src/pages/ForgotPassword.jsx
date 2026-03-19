import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import API from '../lib/axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            await API.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md animate-slide-up relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">SupportDesk</h1>
                </div>

                <div className="glass-card p-8">
                    {sent ? (
                        // Success state
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Check Your Email</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                If an account exists for <span className="text-white font-medium">{email}</span>,
                                we've sent a password reset link. The link will expire in <strong className="text-amber-400">30 minutes</strong>.
                            </p>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2">
                                <p className="text-xs text-slate-400">💡 <strong className="text-slate-300">Didn't receive it?</strong></p>
                                <ul className="text-xs text-slate-500 space-y-1 ml-4">
                                    <li>• Check your spam / junk folder</li>
                                    <li>• Make sure the email is correct</li>
                                    <li>• Wait a few minutes and try again</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => { setSent(false); setEmail(''); }}
                                className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
                            >
                                Try a different email
                            </button>
                        </div>
                    ) : (
                        // Form state
                        <>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white">Forgot Password?</h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Enter your email and we'll send you a reset link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="form-label">Email address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            className="form-input pl-10"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 pt-4 border-t border-white/10">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
