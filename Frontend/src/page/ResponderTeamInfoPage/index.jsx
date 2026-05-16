import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Edit2,
  Home,
  User,
  LifeBuoy,
  Menu,
  X,
  LogOut
} from "lucide-react";
import ResponderSidebar from "@/components/responder/ResponderSidebar";
import rescueLogo from "@/assets/logorescue.svg";
import { getAuthUser, clearAllAuth } from "@/services/auth/session";
import { getTeamDetail, getAllTeams } from "@/services/api/apiTeam";
import { getSosByTeam } from "@/services/api/apiSos";
import "./team-info-page.css";
import { getUserAvatarSrc } from "@/lib/userAvatar";

function readApiMessage(error) {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error?.code === "ECONNABORTED") return "Kết nối tới server bị timeout";
  return error?.message || "Không thể tải thông tin đội";
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatLastUpdated(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  const deltaMs = Date.now() - date.getTime();
  if (deltaMs < 60 * 1000) return "Vừa xong";
  if (deltaMs < 60 * 60 * 1000) return `${Math.floor(deltaMs / (60 * 1000))} phút trước`;
  if (deltaMs < 24 * 60 * 60 * 1000) return `${Math.floor(deltaMs / (60 * 60 * 1000))} giờ trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(date);
}

function isActiveStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  return s === "active" || s === "online";
}

const INITIAL_NOTIFICATIONS = [
  {
    id: "ti-1",
    title: "Đội của bạn đã sẵn sàng",
    description: "Bạn đang ở trạng thái có thể nhận nhiệm vụ mới.",
    time: "Vừa xong",
    unread: true,
  },
  {
    id: "ti-2",
    title: "Có nhiệm vụ cần hỗ trợ",
    description: "Một yêu cầu SOS mức độ cao đang được đẩy về khu vực của bạn.",
    time: "3 phút trước",
    unread: true,
  },
  {
    id: "ti-3",
    title: "Hồ sơ đội đã cập nhật",
    description: "Thông tin liên hệ đội cứu trợ đã được đồng bộ thành công.",
    time: "15 phút trước",
    unread: false,
  },
];

export default function ResponderTeamInfoPage() {
  const authUser = useMemo(() => getAuthUser(), []);
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState("");
  const [missionStats, setMissionStats] = useState({ total: 0, completed: 0 });
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const notificationRef = useRef(null);

  async function handleLogout() {
    try {
      await clearAllAuth();
    } catch {}
    navigate("/staff-login", { replace: true });
  }

  // ── Load team ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadTeamProfile() {
      setLoadingTeam(true);
      setTeamError("");
      try {
        const userId    = authUser?._id;
        const userEmail = String(authUser?.auth?.email || "").trim().toLowerCase();
        const userPhone = normalizePhone(authUser?.phone || authUser?.auth?.phone);

        let resolved = null;

        if (userId) {
          try {
            const res = await getTeamDetail(userId);
            resolved = res?.data?.data ?? null;
          } catch {
            resolved = null;
          }
        }

        if (!resolved) {
          const listRes = await getAllTeams();
          const teams = Array.isArray(listRes?.data?.data) ? listRes.data.data : [];
          resolved = teams.find((item) => {
            const itemEmail = String(item?.auth?.email || "").trim().toLowerCase();
            const itemPhone = normalizePhone(item?.phone || item?.auth?.phone);
            return (
              (userId    && String(item?._id) === String(userId))  ||
              (userEmail && itemEmail === userEmail)                ||
              (userPhone && itemPhone && userPhone === itemPhone)
            );
          }) ?? null;
        }

        if (!resolved) throw new Error("Không tìm thấy dữ liệu đội cứu trợ cho tài khoản hiện tại");
        if (!cancelled) setTeam(resolved);
      } catch (error) {
        if (!cancelled) setTeamError(readApiMessage(error));
      } finally {
        if (!cancelled) setLoadingTeam(false);
      }
    }

    loadTeamProfile();
    return () => { cancelled = true; };
  }, [authUser]);

  // ── Load thống kê nhiệm vụ ─────────────────────────────────────────
  useEffect(() => {
    if (!team?._id) return;
    let cancelled = false;

    async function loadMissionStats() {
      try {
        const res  = await getSosByTeam(team._id);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const completed = list.filter(
          (item) => String(item?.status || "").toUpperCase() === "RESOLVED",
        ).length;
        if (!cancelled) setMissionStats({ total: list.length, completed });
      } catch {
        if (!cancelled) setMissionStats({ total: 0, completed: 0 });
      }
    }

    loadMissionStats();
    return () => { cancelled = true; };
  }, [team?._id]);

  // ── Đóng notification ──────────────────────────────────────────────
  useEffect(() => {
    function onOutside(e) {
      if (notificationRef.current && !notificationRef.current.contains(e.target))
        setShowNotifications(false);
    }
    function onEscape(e) {
      if (e.key === "Escape") setShowNotifications(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  // ── Derived values ─────────────────────────────────────────────────
  const teamName         = team?.full_name                    || "Đội cứu hộ";
  const teamPhone        = team?.phone || team?.auth?.phone   || "—";
  const teamRole         = team?.role                         || "—";
  const teamStatus       = team?.status                       || "—";
  const teamAddress      = team?.profile?.address             || "Chưa cập nhật địa chỉ";
  const emergencyContact = team?.profile?.emergency_contact   || "—";
  const authEmail        = team?.auth?.email                  || "—";
  const authType         = team?.auth?.type                   || "—";
  const createdAt        = formatDateTime(team?.created_at);
  const updatedAt        = formatLastUpdated(team?.updated_at);

  const isVictim   = String(team?.role || "").toLowerCase() === "victim";
  const activeNow  = isActiveStatus(team?.status);
  const liveStatus = activeNow ? "Đang sẵn sàng nhận nhiệm vụ" : "Đang tạm ngưng nhận nhiệm vụ";
  const liveBadge  = activeNow ? "Online" : "Offline";
  const teamIdText = team?._id ? `#RS-${String(team._id).slice(-4).toUpperCase()}` : "#RS-—";
  const unreadCount = notifications.filter((n) => n.unread).length;

  function handleToggleNotifications() {
    setShowNotifications((prev) => {
      if (!prev) setNotifications((items) => items.map((n) => ({ ...n, unread: false })));
      return !prev;
    });
  }

  return (
    <>
      {/* =========================================
          DESKTOP VIEW (Giữ nguyên logic cũ 100%)
      ========================================= */}
      <div className="hidden md:block h-full">
        <div className="team-info-page">
          <ResponderSidebar active="team" />
          <div className="team-info-shell">
            <p className="team-info-mini-title">Hồ sơ cá nhân</p>

            {/* ── Topbar ── */}
            <header className="team-info-topbar">
              <Link to="/responder" className="team-info-back-btn" aria-label="Quay lại bảng nhiệm vụ">
                <ArrowLeft size={16} />
              </Link>

              <div className="team-info-topbar-user">
                <div className="team-info-notification-wrap" ref={notificationRef}>
                  <button
                    type="button"
                    className="team-info-bell-btn"
                    aria-label="Thông báo"
                    onClick={handleToggleNotifications}
                    aria-expanded={showNotifications}
                    aria-haspopup="menu"
                  >
                    <Bell size={14} />
                    {unreadCount > 0 && <span className="team-info-bell-dot">{unreadCount}</span>}
                  </button>

                  {showNotifications && (
                    <ul className="team-info-notification-menu" role="menu" aria-label="Thông báo đội cứu trợ">
                      {notifications.map((item) => (
                        <li key={item.id} className={`team-info-notification-item ${item.unread ? "is-unread" : ""}`}>
                          <div className="team-info-notification-head">
                            <strong>{item.title}</strong>
                            <span>{item.time}</span>
                          </div>
                          <p>{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="team-info-user-meta">
                  <p>{authEmail !== "—" ? authEmail : "Sentinel Admin"}</p>
                  <span>Sẵn trực</span>
                </div>

                <div className="team-info-avatar">
                  <img
                    src={getUserAvatarSrc(team)}
                    alt={teamName}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
              </div>
            </header>

            {/* ── Content ── */}
            <div className="team-info-content">
              <div className="team-info-main-col">

                {loadingTeam && <p className="team-info-loading">Đang tải dữ liệu đội từ API...</p>}
                {teamError   && <p className="team-info-error">{teamError}</p>}

                {/* ── Card: thông tin chính ── */}
                <section className="team-card">
                  <div className="team-card-top">
                    <div className="team-card-left">
                      <div className="team-card-avatar-box">
                        <img
                          src={getUserAvatarSrc(team)}
                          alt={teamName}
                          className="team-card-avatar-img"
                        />
                      </div>
                      <div>
                        <h2>{teamName}</h2>
                        <p><MapPin size={13} /> {teamAddress}</p>
                        <span className="team-id-chip">{teamIdText}</span>
                      </div>
                    </div>
                    <div className="team-card-top-actions">
                      <span className="team-status-pill">{liveBadge}</span>
                    </div>
                  </div>

                  <div className="team-card-kpis team-card-kpis-compact">
                    {/* userSchema */}
                    <article>
                      <p>Số điện thoại</p>
                      <strong>{teamPhone}</strong>
                    </article>
                    <article>
                      <p>Vai trò</p>
                      <strong>{teamRole}</strong>
                    </article>
                    <article>
                      <p>Trạng thái</p>
                      <strong>{teamStatus}</strong>
                    </article>

                    {/* auth */}
                    <article>
                      <p>Email</p>
                      <strong>{authEmail}</strong>
                    </article>
                  </div>

                  <div className="team-card-actions team-card-actions-left">
                    <Link to="/responder/team-info/edit" className="edit-info-btn">
                      Chỉnh sửa thông tin
                    </Link>
                  </div>
                </section>

                {/* ── Card: thông tin y tế (chỉ Victim) ── */}
                {isVictim && (
                  <section className="team-card">
                    <div className="team-card-section-title">Thông tin y tế</div>
                    <div className="team-card-kpis">
                      <article>
                        <p>Nhóm máu</p>
                        <strong>{team?.profile?.blood_type || "—"}</strong>
                      </article>
                      <article>
                        <p>Chiều cao</p>
                        <strong>{team?.profile?.height ? `${team.profile.height} cm` : "—"}</strong>
                      </article>
                      <article>
                        <p>Cân nặng</p>
                        <strong>{team?.profile?.weight ? `${team.profile.weight} kg` : "—"}</strong>
                      </article>
                      <article>
                        <p>Dị ứng</p>
                        <strong>{team?.profile?.allergies || "—"}</strong>
                      </article>
                      {Array.isArray(team?.profile?.medical_history) && team.profile.medical_history.length > 0 && (
                        <article style={{ gridColumn: "span 2" }}>
                          <p>Tiền sử bệnh</p>
                          <div className="team-medical-tags">
                            {team.profile.medical_history.map((item, i) => (
                              <span key={i} className="team-medical-tag">{item}</span>
                            ))}
                          </div>
                        </article>
                      )}
                    </div>
                  </section>
                )}

                {/* ── Thống kê nhiệm vụ ── */}
                <section className="team-bottom-stats">
                  <article>
                    <div className="icon-wrap success">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <strong>{missionStats.completed}</strong>
                      <p>Nhiệm vụ đã hoàn thành</p>
                    </div>
                  </article>
                  <article>
                    <div className="icon-wrap info">
                      <Clock3 size={18} />
                    </div>
                    <div>
                      <strong>{missionStats.total}</strong>
                      <p>Tổng nhiệm vụ đã nhận</p>
                    </div>
                  </article>
                </section>
              </div>

              {/* ── Sidebar ── */}
              <aside className="team-info-side-col">
                <section className="team-state-card">
                  <p className="state-title">Trạng thái hoạt động</p>
                  <h3>{liveStatus}</h3>
                  <div className="state-check">
                    <Check size={18} />
                  </div>
                  <p className="state-note">
                    Khi bật trạng thái này, vị trí của bạn sẽ được cập nhật thời gian thực trên bản đồ cứu trợ.
                  </p>
                  <div className="state-meta">
                    <p>
                      <span>Trạng thái gần nhất:</span>
                      <strong>{liveBadge}</strong>
                    </p>
                    <p>
                      <span>Cập nhật cuối:</span>
                      <strong>{updatedAt}</strong>
                    </p>
                  </div>
                </section>

                <section className="team-map-card" aria-label="Vị trí hiện tại">
                  <div className="team-map-grid" aria-hidden="true" />
                  <p>Vị trí hiện tại</p>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          MOBILE VIEW (Premium App UI)
      ========================================= */}
      <div className="md:hidden bg-slate-50 min-h-screen pb-28 font-sans [&_*]:font-[family-name:var(--font-sans,inherit)]">
        
        {/* Mobile Top App Bar */}
        <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="text-gray-800 active:scale-95 transition-transform"><Menu size={24} strokeWidth={2.5} /></button>
            <img src={rescueLogo || "/vite.svg"} alt="SOSGo" className="h-[48px] w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-700 relative active:scale-95 transition-transform">
              <Bell size={20} strokeWidth={2.5} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white"></span>
            </button>
            <img src={getUserAvatarSrc(team)} alt="avatar" className="w-8 h-8 rounded-full object-cover bg-gray-100 shadow-sm" />
          </div>
        </div>

        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/responder" 
              className="w-10 h-10 bg-white rounded-[0.8rem] shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Hồ sơ cá nhân</h1>
          </div>
        </div>

        <div className="px-5 space-y-4">
          {loadingTeam && <div className="py-10 text-center text-gray-500 font-bold text-sm">Đang tải dữ liệu đội...</div>}
          {teamError && <div className="py-10 text-center text-red-500 font-bold text-sm">{teamError}</div>}
          
          {!loadingTeam && !teamError && (
            <>
              {/* Profile Card */}
              <section className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getUserAvatarSrc(team)} 
                      alt="avatar" 
                      className="w-16 h-16 rounded-[1.25rem] object-cover bg-gray-100 border border-gray-50 shadow-sm" 
                    />
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight tracking-tight mb-1">{teamName}</h2>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin size={12} className="shrink-0" />
                        <span className="text-[11px] font-bold truncate max-w-[140px]">{teamAddress}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${activeNow ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {activeNow ? "ONLINE" : "OFFLINE"}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-black rounded-md">{teamIdText}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Số điện thoại</p>
                    <p className="text-[13px] font-black text-gray-900">{teamPhone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Vai trò</p>
                    <p className="text-[13px] font-black text-gray-900 capitalize">{teamRole}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Trạng thái</p>
                    <p className="text-[13px] font-black text-gray-900 capitalize">{teamStatus}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 overflow-hidden">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</p>
                    <p className="text-[11px] font-black text-gray-900 truncate">{authEmail}</p>
                  </div>
                </div>

                <Link 
                  to="/responder/team-info/edit" 
                  className="w-full py-3.5 bg-[#C81E1E] hover:bg-red-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md shadow-red-100"
                >
                  <Edit2 size={16} /> Chỉnh sửa thông tin
                </Link>
              </section>
              
              {/* Operation Status */}
              <section className="bg-[#F6FAF7] rounded-[2rem] p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                
                <div className="text-center mb-5 relative z-10">
                  <p className="text-[10px] font-black text-gray-600 tracking-[0.15em] uppercase mb-1.5">Trạng thái hoạt động</p>
                  <h3 className={`text-[17px] font-black tracking-tight ${activeNow ? "text-emerald-600" : "text-gray-500"}`}>{liveStatus}</h3>
                  
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto my-4 ${activeNow ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-gray-300 text-white"}`}>
                    <Check size={24} strokeWidth={3} />
                  </div>
                  
                  <p className="text-[11px] font-bold text-gray-500 px-4 leading-relaxed">
                    Khi bật trạng thái này, vị trí của bạn sẽ được cập nhật thời gian thực trên bản đồ cứu trợ.
                  </p>
                </div>

                <div className="border-t border-emerald-100/60 pt-4 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500">Trạng thái gần nhất:</span>
                    <span className="text-[11px] font-black text-gray-900">{liveBadge}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500">Cập nhật cuối:</span>
                    <span className="text-[11px] font-black text-gray-900">{updatedAt}</span>
                  </div>
                </div>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900 leading-none mb-1">{missionStats.completed}</p>
                    <p className="text-[9px] font-bold text-gray-500 leading-tight">Nhiệm vụ đã hoàn thành</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Clock3 size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900 leading-none mb-1">{missionStats.total}</p>
                    <p className="text-[9px] font-bold text-gray-500 leading-tight">Tổng nhiệm vụ đã nhận</p>
                  </div>
                </div>
              </section>

              {/* Map Placeholder */}
              <section className="bg-[#F8F9FA] rounded-[2rem] h-40 flex flex-col items-center justify-center border border-gray-100 text-gray-400 relative overflow-hidden">
                {/* Fake map grid pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                
                <div className="z-10 flex flex-col items-center">
                  <MapPin size={32} className="mb-2 opacity-40" strokeWidth={1.5} />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Vị trí hiện tại</p>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 py-2 flex items-center justify-between z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] pb-safe">
          <Link to="/responder" className="flex-1 flex flex-col items-center gap-1.5 py-2 text-gray-400 hover:text-gray-900 transition-colors">
            <Home size={22} strokeWidth={2} />
            <span className="text-[9px] font-black tracking-wide">Trang chủ</span>
          </Link>
          <div className="flex-1 flex flex-col items-center gap-1.5 py-2 text-emerald-600 bg-emerald-50 rounded-[1.25rem] mx-1">
            <User size={22} strokeWidth={2.5} />
            <span className="text-[9px] font-black tracking-wide">Thông tin cá nhân</span>
          </div>
          <Link to="/responder/history" className="flex-1 flex flex-col items-center gap-1.5 py-2 text-gray-400 hover:text-gray-900 transition-colors">
            <Clock3 size={22} strokeWidth={2} />
            <span className="text-[9px] font-black tracking-wide">Lịch sử</span>
          </Link>
          <button 
            onClick={() => setShowSupportModal(true)} 
            className="flex-1 flex flex-col items-center gap-1.5 py-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <LifeBuoy size={22} strokeWidth={2} />
            <span className="text-[9px] font-black tracking-wide">Hỗ trợ</span>
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] md:hidden transition-opacity duration-300">
          <div className="w-72 h-full bg-white shadow-2xl flex flex-col animate-slide-in-left">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <img src={rescueLogo} alt="SOSGo" className="h-[48px] w-auto object-contain" />
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
              <Link to="/responder" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-bold text-sm">
                <Home size={18} /> Trang chủ
              </Link>
              <Link to="/responder/team-info" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm">
                <User size={18} /> Thông tin cá nhân
              </Link>
              <Link to="/responder/history" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-bold text-sm">
                <Clock3 size={18} /> Lịch sử
              </Link>
            </nav>

            <div className="p-6 border-t border-gray-50 flex flex-col gap-3">
              <button onClick={() => { setMobileMenuOpen(false); setShowSupportModal(true); }} className="flex items-center gap-3 text-gray-600 hover:text-red-600 font-bold text-sm transition">
                <LifeBuoy size={18} /> Hỗ trợ
              </button>
              <button onClick={handleLogout} className="flex items-center gap-3 text-gray-600 hover:text-red-600 font-bold text-sm transition">
                <LogOut size={18} /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT MODAL (Responder) */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] p-4" onClick={() => setShowSupportModal(false)} style={{ zIndex: 999999 }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Hướng dẫn (Đội Cứu Hộ)</h3>
              <button onClick={() => setShowSupportModal(false)} className="text-white/80 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">1</span> 
                  Trang chủ (Nhiệm vụ)
                </h4>
                <p className="text-xs text-gray-600 pl-8 leading-relaxed">Tiếp nhận và xử lý các yêu cầu SOS được hệ thống phân bổ. Xác nhận bắt đầu và hoàn thành nhiệm vụ tại đây.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">2</span> 
                  Thông tin cá nhân
                </h4>
                <p className="text-xs text-gray-600 pl-8 leading-relaxed">Cập nhật hồ sơ năng lực của đội cứu hộ (số điện thoại, địa bàn hoạt động, trạng thái sẵn sàng).</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">3</span> 
                  Lịch sử
                </h4>
                <p className="text-xs text-gray-600 pl-8 leading-relaxed">Tra cứu các nhiệm vụ cứu trợ bạn đã tham gia hoặc đã hủy để làm báo cáo.</p>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <button onClick={() => setShowSupportModal(false)} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition">Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}