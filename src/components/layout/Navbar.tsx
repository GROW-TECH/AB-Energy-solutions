import React, { useState } from 'react';
import { 
  Search, Bell, Plus, Sun, ShieldCheck, User, 
  RotateCcw, CheckCircle2, AlertTriangle, X, Menu, LogOut
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Role } from '../../types';

interface NavbarProps {
  onOpenNewLead: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewLead, onOpenSearch, onOpenMobileMenu }) => {
  const { 
    currentUser,
    logout,
    activeRole, 
    setActiveRole, 
    previewRole,
    setDemoPreviewRole,
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    resetAllDemoData,
    automationRules
  } = useCrm();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const activeRulesCount = automationRules.filter(r => r.isActive).length;

  const isCustomer = activeRole === 'Customer';
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const canCreateLead = isSuperAdmin || activeRole === 'Sales Manager' || activeRole === 'Sales Executive';

  const roles: Role[] = [
    'Super Admin',
    'Sales Manager',
    'Sales Executive',
    'Survey Engineer',
    'Project Manager',
    'Purchase Team',
    'Installation Team',
    'Accounts',
    'Service Team',
    'Customer',
  ];

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-2.5 sm:px-6 shadow-xs">
      {/* Left: Search Bar Trigger or Customer Branding */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {isCustomer ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sun className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">AB Energy Solutions</div>
              <div className="text-[10px] text-emerald-600 font-semibold">Homeowner Solar Portal</div>
            </div>
          </div>
        ) : (
          <>
            <button 
              onClick={onOpenSearch}
              className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors w-36 xs:w-48 sm:w-64 md:w-80 text-left group shrink-0"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              <span className="flex-1 truncate">Search leads...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                ⌘K
              </kbd>
            </button>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Add Lead */}
        {canCreateLead && (
          <button
            onClick={onOpenNewLead}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title="New Solar Lead"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">New Lead</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${!notif.isRead ? 'bg-emerald-50/40' : ''}`}
                    >
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-emerald-500' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-semibold text-slate-800 truncate">{notif.title}</span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Demo Preview Mode Indicator */}
        {currentUser?.role === 'Super Admin' && previewRole && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 shadow-2xs">
            <span className="font-bold text-[10px] tracking-wide uppercase text-amber-700 bg-amber-200/80 px-1.5 py-0.5 rounded">
              DEMO PREVIEW
            </span>
            <span className="font-semibold text-slate-800 truncate">{previewRole}</span>
            <button
              onClick={() => setDemoPreviewRole(null)}
              className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded transition-colors shadow-2xs ml-1"
              title="Exit presentation preview and return to Super Admin dashboard"
            >
              Exit Preview
            </button>
          </div>
        )}

        {/* Role Identity Badge / Switcher */}
        {currentUser?.role === 'Super Admin' ? (
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
                previewRole 
                  ? 'border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100/60' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title="Super Admin: Preview UI as another role (Presentation only)"
            >
              <div className="w-5 h-5 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                {activeRole.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left leading-tight hidden md:block">
                <span className="font-bold block">{activeRole}</span>
                {previewRole && (
                  <span className="text-[9px] text-amber-600 font-semibold block uppercase tracking-wider">Preview Mode</span>
                )}
              </div>
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 animate-in fade-in duration-150">
                <div className="px-3 py-2 bg-slate-50/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Demo Preview Mode
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    UI presentation only. Actions remain securely authorized as Super Admin.
                  </p>
                </div>
                <div className="py-1">
                  {roles.map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                        activeRole === r ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{r}</span>
                      {activeRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
                {previewRole && (
                  <div className="p-1.5 bg-amber-50">
                    <button
                      onClick={() => {
                        setDemoPreviewRole(null);
                        setShowRoleDropdown(false);
                      }}
                      className="w-full text-center py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 rounded transition-colors"
                    >
                      Exit Preview Mode
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs text-slate-700 font-medium cursor-default">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              {currentUser?.role?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="hidden md:inline font-bold text-slate-900">{currentUser?.name || currentUser?.username}</span>
              <span className="text-[10px] text-slate-500 font-semibold">{currentUser?.role}</span>
            </div>
          </div>
        )}

        {/* Demo Data Reset Button (Super Admin only) */}
        {isSuperAdmin && (
          <button
            onClick={() => setShowResetConfirm(true)}
            title="Reset Demo Data to Initial State"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Sign Out Button */}
        <button
          onClick={logout}
          title="Sign Out of Workspace"
          className="flex items-center gap-1 p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold ml-1"
        >
          <LogOut className="w-4 h-4 text-slate-400 hover:text-red-600" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-amber-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">Reset All Demo Data?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This will restore all 20 Leads, 10 Customers, 10 Quotations, Projects, Inventory and live automations back to their pristine Indian business demonstration state.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllDemoData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
