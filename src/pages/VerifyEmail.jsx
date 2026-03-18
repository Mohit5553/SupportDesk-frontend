import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import API from '../lib/axios';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await API.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(res.data.message);
                
                // Update local storage if user is currently logged in
                const userObj = JSON.parse(localStorage.getItem('user'));
                if (userObj) {
                    userObj.isVerified = true;
                    localStorage.setItem('user', JSON.stringify(userObj));
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md animate-slide-up relative">
                <div className="glass-card p-8 text-center">
                    {status === 'verifying' && (
                        <div className="py-8">
                            <Loader2 className="w-16 h-16 text-primary-400 animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
                            <p className="text-slate-400">Please wait while we confirm your email address.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-4">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Email Verified!</h2>
                            <p className="text-slate-400 mb-8">{message}</p>
                            
                            <Link 
                                to="/dashboard" 
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                Go to Dashboard <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-4">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Verification Failed</h2>
                            <p className="text-slate-400 mb-8">{message}</p>
                            
                            <div className="space-y-3">
                                <p className="text-sm text-slate-500">
                                    The link might have expired or has already been used.
                                </p>
                                <Link 
                                    to="/login" 
                                    className="btn-secondary w-full"
                                >
                                    Return to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
