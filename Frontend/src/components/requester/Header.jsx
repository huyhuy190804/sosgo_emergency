import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import Logo from "@/assets/logo.svg";
import {
    getVictimProfile,
    saveVictimProfile,
  } from '@/services/auth/session';

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const navItems = [
  { label: "Trang chủ", icon: <HomeIcon />, path: "/" },
  { label: "Thông tin cá nhân", icon: <ProfileIcon />, path: "/profile" },
  { label: "Lịch sử", icon: <HistoryIcon />, path: "/history" },
];

export default function Header({
  clearVictimProfile,
  logoutVictimFirebase,
  showToast,
  staffSession,
  handleStaffLogout,
}) {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef();
  const drawerRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getVictimProfile());
  const activeSosId = localStorage.getItem("active_sos_id");

  // Đóng menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
      if (mobileMenuOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, mobileMenuOpen]);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogoutVictim = async () => {
    if (clearVictimProfile) clearVictimProfile();
    try {
      if (logoutVictimFirebase) await logoutVictimFirebase();
    } catch {}
    setUser(null);
    setOpen(false);
    setMobileMenuOpen(false);
    if (showToast) showToast("Đã đăng xuất", "warning");
    navigate("/");
  };

  return (
    <>
      <header className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="mx-auto px-5 h-[64px] flex items-center justify-between">
          
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="SOSGo" className="h-[48px] w-auto object-contain" />
            </Link>
            <Link to="/" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang chủ
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {activeSosId && (
              <button
                onClick={() => navigate(`/tracking/${activeSosId}`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 
                  border border-amber-200 rounded-xl text-amber-700 text-xs font-bold
                  hover:bg-amber-100 transition-colors hidden sm:flex"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Đang cứu hộ
              </button>
            )}
            {/* Bell */}
            <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] md:hidden transition-opacity duration-300">
          <div 
            ref={drawerRef}
            className="w-72 h-full bg-white shadow-2xl flex flex-col animate-slide-in-left"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-center justify-between mb-2">
                <img src={Logo} alt="SOSGo" className="h-8" />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">SOSGo Emergency</p>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {navItems.map(({ label, icon, path }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className={isActive ? "text-emerald-600" : "text-gray-400"}>
                      {icon}
                    </span>
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-50">
              <button 
                onClick={handleLogoutVictim}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for drawer animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s cubic-bezier(0, 0, 0.2, 1);
        }
      `}} />
    </>
  );
}