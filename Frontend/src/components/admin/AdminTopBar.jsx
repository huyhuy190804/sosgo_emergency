import { useMemo } from 'react';
import { Bell, Menu } from 'lucide-react';

function loadStaffUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminTopBar({ onMenuClick }) {
  const staff = useMemo(() => loadStaffUser(), []);
  const subtitle = staff?.auth?.email || staff?.role || '—';
  const name = staff?.full_name?.trim() || staff?.auth?.email || '—';
  const metaLine =
    staff?.role === 'Admin'
      ? subtitle
      : `${staff?.role === 'Rescue' ? 'Cứu hộ' : 'Tài khoản'} · ${subtitle}`;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E8E8EC] bg-white px-4 sm:px-6 lg:justify-end">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-brand-muted transition hover:bg-brand-gray-bg hover:text-brand-brown lg:hidden"
        aria-label="Mở menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4 lg:flex-initial">
        <button
          type="button"
          className="relative rounded-lg p-2 text-brand-muted transition hover:bg-brand-gray-bg hover:text-brand-brown"
          aria-label="Thông báo"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-red ring-2 ring-white" />
        </button>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="size-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-blue to-[#152a66] ring-2 ring-white sm:size-10" />
          <div className="hidden min-w-0 text-right leading-tight sm:block">
            <p className="truncate text-sm font-semibold text-brand-brown">{name}</p>
            <p className="truncate text-xs text-brand-muted">{metaLine}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
