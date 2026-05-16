import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  History,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearAllAuth } from '@/services/auth/session';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/incidents', label: 'Quản lý sự cố', icon: AlertTriangle, end: true },
  { to: '/admin/users', label: 'Quản lý người dùng', icon: Users, end: false },
  { to: '/admin/history', label: 'Lịch sử', icon: History, end: false },
];

function AdminSupportModal({ open, onClose }) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-support-title"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4">
          <h3 id="admin-support-title" className="text-lg font-bold text-white">
            Hướng dẫn quản trị (Admin)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 transition hover:text-white"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">
                1
              </span>
              Dashboard
            </h4>
            <p className="pl-8 text-xs leading-relaxed text-gray-600">
              Bảng điều khiển trung tâm hiển thị các số liệu tổng quan về hệ thống: số lượng người
              dùng, đội cứu hộ, và các yêu cầu khẩn cấp đang diễn ra.
            </p>
          </div>
          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">
                2
              </span>
              Quản lý sự cố
            </h4>
            <p className="pl-8 text-xs leading-relaxed text-gray-600">
              Nơi theo dõi và điều phối tất cả các tín hiệu SOS trên bản đồ thời gian thực. Hỗ trợ
              điều hướng và phân bổ đội cứu hộ gần nhất.
            </p>
          </div>
          <div>
            <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">
                3
              </span>
              Quản lý người dùng
            </h4>
            <p className="pl-8 text-xs leading-relaxed text-gray-600">
              Cấp quyền, phê duyệt hồ sơ đội cứu hộ mới, quản lý tài khoản nạn nhân, và xử lý các
              trường hợp vi phạm nền tảng.
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SidebarPanel({ onNavClick, onSupportClick, showClose, onClose }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await clearAllAuth();
    navigate('/staff-login', { replace: true });
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center border-b border-[#E8E8EC] px-3 py-4',
          showClose ? 'justify-between' : 'justify-start',
        )}
      >
        <img
          src="https://res.cloudinary.com/dgbtibqno/image/upload/v1777905987/e070vnndeaw9aravqhsx.png"
          alt="SOSGo EMERGENCY SUPPORT"
          className="h-auto w-auto max-w-[120px] object-contain object-left"
        />
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#525252] transition hover:bg-brand-gray-bg"
            aria-label="Đóng menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to + label}
            to={to}
            end={end}
            onClick={() => onNavClick?.()}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 border-l-4 py-2.5 pr-3 pl-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-brand-blue bg-brand-blue-surface text-brand-blue'
                  : 'border-transparent text-[#525252] hover:bg-brand-gray-bg hover:text-[#525252]',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#E8E8EC] p-3">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onSupportClick?.()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#525252] hover:bg-brand-gray-bg hover:text-[#525252]"
          >
            <HelpCircle className="size-4 shrink-0" aria-hidden />
            Hỗ trợ
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#525252] hover:bg-brand-gray-bg hover:text-[#525252]"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }) {
  const location = useLocation();
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đóng drawer khi đổi route
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const openSupport = () => setShowSupportModal(true);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-[#E8E8EC] bg-[#FAFAFA] lg:flex">
        <SidebarPanel onSupportClick={openSupport} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Đóng menu"
            onClick={onMobileClose}
          />
          <aside
            className="relative z-10 flex h-full w-[min(100%,16rem)] max-w-[85vw] flex-col bg-[#FAFAFA] shadow-2xl animate-[slide-in-left_0.3s_cubic-bezier(0,0,0.2,1)]"
            aria-label="Menu điều hướng"
          >
            <SidebarPanel
              showClose
              onClose={onMobileClose}
              onNavClick={onMobileClose}
              onSupportClick={() => {
                openSupport();
                onMobileClose?.();
              }}
            />
          </aside>
        </div>
      )}

      <AdminSupportModal open={showSupportModal} onClose={() => setShowSupportModal(false)} />

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-[90] flex items-stretch justify-around border-t border-[#E8E8EC] bg-white px-1 py-1 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden pb-[max(0.25rem,env(safe-area-inset-bottom))]"
        aria-label="Điều hướng chính"
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={`bottom-${to}`}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-2 text-[10px] font-semibold leading-tight transition-colors',
                isActive ? 'bg-rose-50 text-brand-red' : 'text-[#757575]',
              )
            }
          >
            <Icon className="size-[22px] shrink-0" aria-hidden />
            <span className="max-w-full truncate px-0.5 text-center">{label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
