import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading...', fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-dark-950 flex items-center justify-center z-50">
                <div className="text-center animate-fade-in">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-primary-600/20 animate-pulse-slow" />
                        <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
                    </div>
                    <p className="text-slate-400 text-sm">{text}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">{text}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
