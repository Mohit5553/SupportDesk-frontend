import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = 'Select an option', 
    label, 
    error, 
    disabled = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.name === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionName) => {
        onChange(optionName);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="space-y-1.5" ref={containerRef}>
            {label && <label className="form-label">{label}</label>}
            
            <div className="relative">
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`form-input flex items-center justify-between cursor-pointer min-h-[46px] ${
                        disabled ? 'opacity-50 cursor-not-allowed bg-white/5' : 'hover:border-white/20'
                    } ${isOpen ? 'ring-2 ring-primary-500/50 border-primary-500/50' : ''}`}
                >
                    <span className={`block truncate ${!value ? 'text-slate-500' : 'text-slate-100'}`}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-dark-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-white/5 bg-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    autoFocus
                                    className="w-full bg-dark-950 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary-500/50"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelect(option.name)}
                                        className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors"
                                    >
                                        <span>{option.name}</span>
                                        {value === option.name && <Check className="w-4 h-4 text-primary-400" />}
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                    No results found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default SearchableSelect;
