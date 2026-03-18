import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

const Register = () => {
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await registerUser(data.name, data.email, data.password);
            toast.success('Account created! Welcome aboard 🎉');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md animate-slide-up relative">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="text-slate-400 mt-1">Join SupportDesk today</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="form-label">Full Name</label>
                            <input {...register('name')} className="form-input" placeholder="John Doe" />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">Email address</label>
                            <input {...register('email')} type="email" className="form-input" placeholder="you@example.com" />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">Confirm Password</label>
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
