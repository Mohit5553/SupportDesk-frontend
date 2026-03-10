import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../lib/axios';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    department: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

const Profile = () => {
    const { user } = useAuth();
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const { register: profileReg, handleSubmit: handleProfile, formState: { errors: profileErr } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name, department: user?.department || '' }
    });

    const { register: passReg, handleSubmit: handlePassword, reset, formState: { errors: passErr } } = useForm({
        resolver: zodResolver(passwordSchema)
    });

    const onProfileSubmit = async (data) => {
        setUpdatingProfile(true);
        try {
            await API.put('/auth/profile', data);
            toast.success('Profile updated successfully (refresh to see changes globally)');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const onPasswordSubmit = async (data) => {
        setUpdatingPassword(true);
        try {
            await API.put('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success('Password changed successfully');
            reset();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="w-6 h-6 text-primary-400" />
                    My Profile
                </h1>
                <p className="text-slate-400 text-sm mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="glass-card p-6 border-t-4 border-t-primary-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-primary-500/20">
                        {user?.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user?.email}</span>
                            <span className="flex items-center gap-1.5 capitalize text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-md border border-primary-500/20"><ShieldCheck className="w-4 h-4" /> {user?.role}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4 max-w-md">
                    <h3 className="font-semibold text-white border-b border-white/10 pb-2 mb-4">Personal Information</h3>

                    <div>
                        <label className="form-label">Full Name</label>
                        <input {...profileReg('name')} className="form-input" />
                        {profileErr.name && <p className="text-red-400 text-xs mt-1">{profileErr.name.message}</p>}
                    </div>

                    {['agent', 'manager', 'admin'].includes(user?.role) && (
                        <div>
                            <label className="form-label">Department</label>
                            <input {...profileReg('department')} className="form-input" placeholder="e.g. IT Support, Billing" />
                        </div>
                    )}

                    <div className="pt-2 border-t border-white/10">
                        <button type="submit" disabled={updatingProfile} className="btn-primary">
                            {updatingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-card p-6 border-t-4 border-t-amber-500">
                <form onSubmit={handlePassword(onPasswordSubmit)} className="space-y-4 max-w-md">
                    <h3 className="font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                        <Lock className="w-4 h-4 text-amber-500" />
                        Security
                    </h3>

                    <div>
                        <label className="form-label">Current Password</label>
                        <input type="password" {...passReg('currentPassword')} className="form-input" />
                        {passErr.currentPassword && <p className="text-red-400 text-xs mt-1">{passErr.currentPassword.message}</p>}
                    </div>

                    <div>
                        <label className="form-label">New Password</label>
                        <input type="password" {...passReg('newPassword')} className="form-input" />
                        {passErr.newPassword && <p className="text-red-400 text-xs mt-1">{passErr.newPassword.message}</p>}
                    </div>

                    <div>
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" {...passReg('confirmPassword')} className="form-input" />
                        {passErr.confirmPassword && <p className="text-red-400 text-xs mt-1">{passErr.confirmPassword.message}</p>}
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        <button type="submit" disabled={updatingPassword} className="btn-primary bg-amber-600 hover:bg-amber-500 shadow-amber-600/20">
                            {updatingPassword ? 'Updating...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
