import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  MapPin,
  Phone,
  X,
  Menu,
  Home,
  User,
  LifeBuoy,
  LogOut,
  Clock3
} from "lucide-react";
import { getAuthUser, clearAllAuth } from "@/services/auth/session";
import ResponderSidebar from "@/components/responder/ResponderSidebar";
import { getAllTeams, getTeamDetail } from "@/services/api/apiTeam";
import { getSosByTeam, updateSosStatus } from "@/services/api/apiSos";
import { getUserAvatarSrc } from "@/lib/userAvatar";
import rescueLogo from "@/assets/logorescue.svg";
import "./activity-history.css";

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function readApiMessage(error) {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error?.code === "ECONNABORTED") return "Kết nối tới server bị timeout";
  return error?.message || "Không thể tải lịch sử hoạt động";
}

async function resolveTeamFromUser(authUser) {
  const userId = authUser?._id;
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
        (userId && String(item?._id) === String(userId)) ||
        (userEmail && itemEmail === userEmail) ||
        (userPhone && itemPhone && userPhone === itemPhone)
      );
    }) ?? null;
  }

  return resolved;
}

function getStatusDisplay(status) {
  const value = normalizeStatus(status);
  if (value === "RESOLVED") return { label: "Đã hoàn thành", className: "status-resolved" };
  if (value === "INPROGRESS" || value === "IN_PROGRESS") return { label: "Đang xử lý", className: "status-inprogress" };
  if (value === "ASSIGNED") return { label: "Đã chấp nhận", className: "status-assigned" };
  if (value === "PENDING") return { label: "Chờ chấp nhận", className: "status-pending" };
  if (value === "CANCELLED") return { label: "Đã hủy", className: "status-cancelled" };
  return { label: value || "Không xác định", className: "status-unknown" };
}

function normalizeStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "IN_PROGRESS") return "INPROGRESS";
  return value;
}

function getIncidentTypeBadge(type) {
  const mapping = {
    "Thiên tai": "🌊",
    "Cháy nổ": "🔥",
    "Tai nạn giao thông": "🚗",
    "Sức khỏe": "🏥",
    "Sức khỏe khẩn cấp": "🚑",
    "Lạc đường": "🗺️",
    "Sự cố phương tiện": "🔧",
    "Khác": "📌",
  };
  return mapping[type] || "📌";
}

export default function ResponderActivityHistoryPage() {
  const navigate = useNavigate();
  const authUser = useMemo(() => getAuthUser(), []);
  const userId = authUser?._id;
  const PAGE_SIZE = 5;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("RESOLVED");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  async function handleLogout() {
    try {
      await clearAllAuth();
    } catch {}
    navigate("/staff-login", { replace: true });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      setLoading(true);
      setError("");
      try {
        const team = await resolveTeamFromUser(authUser);
        if (!team?._id) throw new Error("Không tìm thấy dữ liệu đội cứu trợ");

        const res = await getSosByTeam(team._id);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];

        const scoped = list.filter((item) => {
          const assignedRescueId = item?.assigned_rescue_id?._id || item?.assigned_rescue_id;
          if (!userId) return true;
          return !assignedRescueId || String(assignedRescueId) === String(userId);
        });

        if (!cancelled) {
          setActivities(scoped.sort((a, b) => {
            const timeA = new Date(a?.updated_at || a?.created_at || 0).getTime();
            const timeB = new Date(b?.updated_at || b?.created_at || 0).getTime();
            return timeB - timeA;
          }));
        }
      } catch (err) {
        if (!cancelled) setError(readApiMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!authUser) {
      setError("Không thể xác định người dùng hiện tại");
      setLoading(false);
      return () => { cancelled = true; };
    }

    loadActivities();
    return () => { cancelled = true; };
  }, [authUser, userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, activities.length]);

  async function handleCancelRequest(sosId) {
    if (!sosId) return;
    setCancelLoading(sosId);
    try {
      await updateSosStatus(sosId, "CANCELLED", { reason: "Cancelled by responder" });
      setActivities((prev) =>
        prev.map((item) =>
          String(item._id) === String(sosId) ? { ...item, status: "CANCELLED" } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to cancel request:", err);
    } finally {
      setCancelLoading(null);
    }
  }

  const filteredActivities = useMemo(() => {
    const filterValue = normalizeStatus(filter);
    return activities.filter((item) => {
      const status = normalizeStatus(item?.status);
      return status === filterValue;
    });
  }, [activities, filter]);

  const stats = useMemo(() => {
    return {
      total: activities.length,
      completed: activities.filter((x) => normalizeStatus(x?.status) === "RESOLVED").length,
      cancelled: activities.filter((x) => normalizeStatus(x?.status) === "CANCELLED").length,
    };
  }, [activities]);

  const totalItems = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const paginatedActivities = useMemo(
    () => filteredActivities.slice(startIndex, endIndex),
    [filteredActivities, startIndex, endIndex],
  );
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  return (
    <>
      {/* =========================================
          DESKTOP VIEW (Giữ nguyên logic cũ 100%)
      ========================================= */}
      <div className="hidden md:block h-full">
        <div className="activity-history-page">
          <ResponderSidebar active="history" />

          <div className="activity-history-shell">
            <header className="activity-history-topbar">
              <div className="activity-history-title-group">
                <button
                  type="button"
                  className="activity-history-back-btn"
                  onClick={() => navigate("/responder")}
                  aria-label="Quay lại trang chủ"
                >
                  <ArrowLeft size={16} />
                </button>
                <h1>Lịch sử hoạt động</h1>
              </div>

              <div className="activity-history-topbar-user">
                <button type="button" className="activity-history-bell-btn">
                  <Bell size={14} />
                </button>
                <div className="activity-history-user-meta">
                  <p>{authUser?.auth?.email || "Sentinel Admin"}</p>
                  <span>Đang trực</span>
                </div>
              </div>
            </header>

            <main className="activity-history-content">
              <section className="activity-history-stats">
                <article>
                  <div className="stat-icon success">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong>{stats.completed}</strong>
                    <p>Hoàn thành</p>
                  </div>
                </article>
                <article>
                  <div className="stat-icon danger">
                    <X size={20} />
                  </div>
                  <div>
                    <strong>{stats.cancelled}</strong>
                    <p>Đã hủy</p>
                  </div>
                </article>
              </section>

              <section className="activity-history-filter">
                <button
                  type="button"
                  className={`filter-btn ${filter === "RESOLVED" ? "is-active" : ""}`}
                  onClick={() => setFilter("RESOLVED")}
                >
                  Hoàn thành
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filter === "CANCELLED" ? "is-active" : ""}`}
                  onClick={() => setFilter("CANCELLED")}
                >
                  Đã hủy
                </button>
              </section>

              {loading && <p className="activity-history-loading">Đang tải dữ liệu hoạt động...</p>}
              {error && <p className="activity-history-error">{error}</p>}

              <div className="activity-history-list">
                {!loading && !error && totalItems === 0 && (
                  <div className="activity-history-empty">
                    <p>Chưa có hoạt động nào</p>
                  </div>
                )}

                {paginatedActivities.map((item) => {
                  const status = getStatusDisplay(item?.status);
                  const incidentIcon = getIncidentTypeBadge(item?.incident_type_name);
                  const victim = item?.victim_id;
                  const victimName = typeof victim === "object" ? victim?.full_name : item?.victim_name || "Không xác định";
                  const victimPhone = typeof victim === "object" ? victim?.phone : item?.victim_phone || "—";
                  const createdAt = formatDateTime(item?.created_at || item?.createdAt);
                  const updatedAt = formatDateTime(item?.updated_at || item?.updatedAt);

                  return (
                    <article key={item._id} className="activity-history-card">
                      <div className="activity-card-top">
                        <div className="activity-card-left">
                          <span className="activity-incident-icon">{incidentIcon}</span>
                          <div>
                            <h3>{victimName}</h3>
                            <p className="activity-meta">
                              <Phone size={13} /> {victimPhone}
                            </p>
                          </div>
                        </div>
                        <span className={`activity-status-badge ${status.className}`}>{status.label}</span>
                      </div>

                      <p className="activity-incident-type">Loại sự cố: {item?.incident_type_name || "Khác"}</p>
                      <p className="activity-address">
                        <MapPin size={13} /> {item?.address || "Chưa có địa chỉ"}
                      </p>
                      <p className="activity-description">{item?.description || "Không có mô tả"}</p>

                      <div className="activity-card-footer">
                        <div className="activity-times">
                          <span>Tạo: {createdAt}</span>
                          {updatedAt !== createdAt && <span>Cập nhật: {updatedAt}</span>}
                        </div>
                        {normalizeStatus(item?.status) !== "CANCELLED" && (
                          <button
                            type="button"
                            className="activity-cancel-btn"
                            onClick={() => handleCancelRequest(item._id)}
                            disabled={cancelLoading === item._id}
                            title="Hủy yêu cầu này"
                          >
                            {cancelLoading === item._id ? "Hủy..." : <X size={14} />}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {!loading && !error && totalItems > 0 && (
                <div className="activity-pagination">
                  <button
                    type="button"
                    className="page-nav-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePage === 1}
                  >
                    Trước
                  </button>

                  <div className="activity-pagination-pages">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`page-btn ${pageNumber === safePage ? "is-active" : ""}`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="page-nav-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePage === totalPages}
                  >
                    Sau
                  </button>

                  <span className="activity-pagination-info">
                    Hiển thị {startIndex + 1}-{endIndex} / {totalItems}
                  </span>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* =========================================
          MOBILE VIEW (Premium App UI)
      ========================================= */}
      <div className="md:hidden bg-[#FCFCFC] min-h-screen pb-28 font-sans [&_*]:font-[family-name:var(--font-sans,inherit)]">
        
        <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-[60] border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileMenuOpen(true);
              }} 
              className="text-gray-800 active:scale-95 transition-transform p-1 -ml-1 relative z-[70]"
              aria-label="Mở menu"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <img src={rescueLogo || "/vite.svg"} alt="SOSGo" className="h-[80px] w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-700 relative active:scale-95 transition-transform">
              <Bell size={20} strokeWidth={2.5} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white"></span>
            </button>
            <img src={getUserAvatarSrc(authUser)} alt="avatar" className="w-8 h-8 rounded-full object-cover bg-gray-100 shadow-sm" />
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Title Group */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate("/responder")} className="w-10 h-10 bg-white rounded-[0.8rem] shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Lịch sử hoạt động</h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex items-center gap-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} strokeWidth={2.5} />
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-black text-gray-900 leading-none mb-0.5">{stats.completed}</p>
                <p className="text-[10px] font-bold text-gray-500 leading-tight tracking-wide">Hoàn thành</p>
              </div>
            </div>
            
            <div className="bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex items-center gap-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                <X size={20} strokeWidth={2.5} />
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-black text-gray-900 leading-none mb-0.5">{stats.cancelled}</p>
                <p className="text-[10px] font-bold text-gray-500 leading-tight tracking-wide">Đã hủy</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter("RESOLVED")}
              className={`px-5 py-2.5 rounded-[0.8rem] text-xs font-black transition-all duration-200 ${filter === "RESOLVED" ? "bg-[#C81E1E] text-white shadow-lg shadow-red-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
            >
              Hoàn thành
            </button>
            <button 
              onClick={() => setFilter("CANCELLED")}
              className={`px-5 py-2.5 rounded-[0.8rem] text-xs font-black transition-all duration-200 ${filter === "CANCELLED" ? "bg-[#C81E1E] text-white shadow-lg shadow-red-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
            >
              Đã hủy
            </button>
          </div>

          {/* List Content */}
          <div className="space-y-4">
            {loading && <p className="text-center text-sm font-bold text-gray-500 py-10">Đang tải...</p>}
            {error && <p className="text-center text-sm font-bold text-red-500 py-10">{error}</p>}
            {!loading && !error && totalItems === 0 && (
              <div className="text-center text-sm font-bold text-gray-500 py-10 bg-white rounded-[2rem] border border-gray-100 border-dashed">
                Chưa có hoạt động nào
              </div>
            )}

            {paginatedActivities.map((item) => {
              const status = getStatusDisplay(item?.status);
              const incidentIcon = getIncidentTypeBadge(item?.incident_type_name);
              const victim = item?.victim_id;
              const victimName = typeof victim === "object" ? victim?.full_name : item?.victim_name || "Không xác định";
              const victimPhone = typeof victim === "object" ? victim?.phone : item?.victim_phone || "—";
              const createdAt = formatDateTime(item?.created_at || item?.createdAt);
              const updatedAt = formatDateTime(item?.updated_at || item?.updatedAt);
              
              const isResolved = normalizeStatus(item?.status) === "RESOLVED";
              const isCancelled = normalizeStatus(item?.status) === "CANCELLED";
              const badgeBg = isResolved ? "bg-emerald-100 text-emerald-700" : isCancelled ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700";

              return (
                <article key={item._id} className="bg-white rounded-[1.5rem] p-5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[22px] shrink-0 border border-red-100">
                        {incidentIcon}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-black text-gray-900 leading-tight mb-1">{victimName}</h3>
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 tracking-wide">
                          <Phone size={11} strokeWidth={3} /> {victimPhone}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shrink-0 ${badgeBg}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="pt-1 pb-1">
                    <p className="text-xs font-black text-gray-900 mb-1.5">
                      Loại sự cố: <span className="text-gray-600 font-bold">{item?.incident_type_name || "Khác"}</span>
                    </p>
                    <p className="flex items-start gap-1.5 text-[11px] font-bold text-gray-600 leading-relaxed mb-1.5">
                      <MapPin size={13} className="shrink-0 mt-[3px] text-gray-400" strokeWidth={2.5} />
                      {item?.address || "Chưa có địa chỉ"}
                    </p>
                    <p className="text-[11px] font-bold text-gray-500">
                      {item?.description || "Không có mô tả"}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-gray-200 mt-2 pt-3 flex items-end justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tạo: {createdAt}</span>
                      {updatedAt !== createdAt && <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Cập nhật: {updatedAt}</span>}
                    </div>
                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelRequest(item._id)}
                        disabled={cancelLoading === item._id}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                      >
                        {cancelLoading === item._id ? (
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <X size={14} strokeWidth={3} />
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {!loading && !error && totalItems > 0 && (
            <div className="flex flex-col items-center gap-3 mt-8 pb-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="px-4 py-2 rounded-[0.8rem] bg-gray-50 text-[11px] font-black text-gray-400 disabled:opacity-50 active:bg-gray-100 transition-colors"
                >
                  Trước
                </button>

                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-9 h-9 rounded-[0.8rem] text-[11px] font-black transition-all ${pageNumber === safePage ? "bg-[#C81E1E] text-white shadow-md shadow-red-200 scale-105" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                  className="px-4 py-2 rounded-[0.8rem] bg-white border border-gray-200 text-[11px] font-black text-gray-600 disabled:opacity-50 active:bg-gray-50 transition-colors"
                >
                  Sau
                </button>
              </div>
              
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                Hiển thị {startIndex + 1}-{endIndex} / {totalItems}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 py-2 flex items-center justify-between z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] pb-safe">
          <Link to="/responder" className="flex-1 flex flex-col items-center gap-1.5 py-2 text-gray-400 hover:text-gray-900 transition-colors">
            <Home size={22} strokeWidth={2} />
            <span className="text-[9px] font-black tracking-wide">Trang chủ</span>
          </Link>
          <Link to="/responder/team-info" className="flex-1 flex flex-col items-center gap-1.5 py-2 text-gray-400 hover:text-gray-900 transition-colors">
            <User size={22} strokeWidth={2} />
            <span className="text-[9px] font-black tracking-wide">Thông tin cá nhân</span>
          </Link>
          <div className="flex-1 flex flex-col items-center gap-1.5 py-2 text-emerald-600 bg-emerald-50 rounded-[1.25rem] mx-1">
            <Clock3 size={22} strokeWidth={2.5} />
            <span className="text-[9px] font-black tracking-wide">Lịch sử</span>
          </div>
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
              <Link to="/responder/team-info" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-bold text-sm">
                <User size={18} /> Thông tin cá nhân
              </Link>
              <Link to="/responder/history" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm">
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
