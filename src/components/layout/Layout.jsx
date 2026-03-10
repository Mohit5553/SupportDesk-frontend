import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Ticket, Plus, Users, Settings, LogOut,
    ChevronLeft, ChevronRight, BarChart2, Shield, Menu, X, Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['customer', 'agent', 'manager', 'admin'] },
        { to: '/tickets', icon: Ticket, label: 'Tickets', roles: ['customer', 'agent', 'manager', 'admin'] },
        { to: '/tickets/new', icon: Plus, label: 'New Ticket', roles: ['customer', 'agent', 'admin'] },
        { to: '/admin/dashboard', icon: BarChart2, label: 'Analytics', roles: ['admin', 'manager'] },
        { to: '/admin/users', icon: Users, label: 'Users', roles: ['admin'] },
        { to: '/profile', icon: Settings, label: 'Settings', roles: ['customer', 'agent', 'manager', 'admin'] },
    ];

    const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-600/30">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="font-bold text-white text-sm leading-tight">SupportDesk</p>
                        <p className="text-xs text-slate-500">Portal</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {filteredNav.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
                        }
                        title={collapsed ? item.label : ''}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User info */}
            <div className={`border-t border-white/10 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
                {!collapsed ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <Avatar name={user?.name} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full z-50 lg:hidden bg-dark-900/95 backdrop-blur-xl border-r border-white/10 w-64 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="absolute top-4 right-4">
                    <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col h-screen sticky top-0 bg-dark-900/60 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'
                    }`}
            >
                <SidebarContent />
                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center hover:bg-primary-600 transition-colors group"
                >
                    {collapsed ? (
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    ) : (
                        <ChevronLeft className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    )}
                </button>
            </aside>
        </>
    );
};

const Layout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-xl hover:bg-white/10 text-slate-400"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-white text-sm">SupportDesk</span>
                    </div>
                    <div className="ml-auto">
                        <Bell className="w-5 h-5 text-slate-400" />
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
