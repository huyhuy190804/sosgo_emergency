import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Clock3,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  UploadCloud,
  ChevronRight,
  Home,
  User,
  LifeBuoy
} from "lucide-react";
import ResponderSidebar from "@/components/responder/ResponderSidebar";
import { getAllTeams, getTeamDetail, updateTeam } from "@/services/api/apiTeam";
import { getAuthUser } from "@/services/auth/session";
import "./team-edit-page.css";
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
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Chưa có dữ liệu";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function ResponderTeamEditPage() {
  const navigate = useNavigate();
  const authUser = useMemo(() => getAuthUser(), []);
  const [team, setTeam] = useState(authUser || null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastAlerts, setToastAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const notificationRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimersRef = useRef(new Map());

  const [form, setForm] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    avatarUrl: "",
  });

  const [notifications, setNotifications] = useState([
    {
      id: "te-1",
      title: "Có nhiệm vụ mới",
      description: "Hệ thống vừa ghi nhận một yêu cầu SOS ưu tiên cao gần bạn.",
      time: "Vừa xong",
      unread: true,
    },
    {
      id: "te-2",
      title: "Chỉnh sửa hồ sơ",
      description: "Bạn có thể cập nhật số điện thoại và khu vực hoạt động ngay tại đây.",
      time: "5 phút trước",
      unread: true,
    },
    {
      id: "te-3",
      title: "Đồng bộ dữ liệu",
      description: "Thông tin đội đã được đồng bộ với bảng nhiệm vụ responder.",
      time: "18 phút trước",
      unread: false,
    },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadTeamProfile() {
      setLoadingTeam(true);
      setTeamError("");

      try {
        const userId = authUser?._id;
        const userEmail = String(authUser?.auth?.email || "").trim().toLowerCase();
        const userPhone = normalizePhone(authUser?.phone || authUser?.auth?.phone);

        let resolvedTeam = null;

        if (userId) {
          try {
            const detailRes = await getTeamDetail(userId);
            resolvedTeam = detailRes?.data?.data || null;
          } catch {
            // Fallback to list API below when direct detail lookup is unavailable.
            resolvedTeam = null;
          }
        }

        if (!resolvedTeam) {
          const listRes = await getAllTeams();
          const teams = Array.isArray(listRes?.data?.data) ? listRes.data.data : [];

          resolvedTeam = teams.find((item) => {
            const itemEmail = String(item?.auth?.email || "").trim().toLowerCase();
            const itemPhone = normalizePhone(item?.phone || item?.auth?.phone);
            return (
              (userId && String(item?._id) === String(userId)) ||
              (userEmail && itemEmail === userEmail) ||
              (userPhone && itemPhone && userPhone === itemPhone)
            );
          }) || null;
        }

        if (!resolvedTeam) {
          throw new Error("Không tìm thấy dữ liệu đội cứu trợ cho tài khoản hiện tại");
        }

        if (!cancelled) {
          setTeam(resolvedTeam);
          setForm({
            name: resolvedTeam?.full_name || "",
            code: resolvedTeam?._id ? `#RS-${String(resolvedTeam._id).slice(-4).toUpperCase()}` : "#RS-—",
            phone: resolvedTeam?.phone || resolvedTeam?.auth?.phone || "",
            email: resolvedTeam?.auth?.email || "",
            address: resolvedTeam?.profile?.address || resolvedTeam?.address || "",
            emergencyContact: resolvedTeam?.profile?.emergency_contact || "",
            avatarUrl: resolvedTeam?.profile?.avatar_url || "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setTeamError(readApiMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingTeam(false);
        }
      }
    }

    loadTeamProfile();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  useEffect(() => {
    function handleOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  function dismissToast(toastId) {
    setToastAlerts((prev) => prev.filter((item) => item.toastId !== toastId));
    const activeTimer = toastTimersRef.current.get(toastId);
    if (activeTimer) {
      window.clearTimeout(activeTimer);
      toastTimersRef.current.delete(toastId);
    }
  }

  function pushToast(message, type = "error") {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const alert = {
      toastId,
      message,
      type,
    };
    setToastAlerts((prev) => [alert, ...prev].slice(0, 3));
    const timer = window.setTimeout(() => {
      dismissToast(toastId);
    }, 4500);
    toastTimersRef.current.set(toastId, timer);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAvatarSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      pushToast("Ảnh quá lớn. Vui lòng chọn file dưới 3MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setForm((prev) => ({ ...prev, avatarUrl: url }));
    };
    reader.readAsDataURL(file);
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!team?._id || saving) return;

    const teamNameValue = String(form.name || "").trim();
    if (!teamNameValue) {
      pushToast("Vui lòng nhập tên đội.", "error");
      return;
    }

    if (teamNameValue.length > 100) {
      pushToast("Tên đội không được vượt quá 100 ký tự.", "error");
      return;
    }

    const teamNamePattern = /^[\p{L}\d\s]+$/u;
    if (!teamNamePattern.test(teamNameValue)) {
      pushToast("Tên đội không được chứa ký tự đặc biệt.", "error");
      return;
    }

    setSaving(true);
    try {
      const nextProfile = {
        ...(team?.profile || {}),
        address: form.address,
        emergency_contact: form.emergencyContact,
        avatar_url: form.avatarUrl,
      };

      const payload = {
        full_name: form.name,
        phone: form.phone,
        profile: nextProfile,
      };

      const res = await updateTeam(team._id, payload);
      const updatedTeam = res?.data?.data;
      if (updatedTeam) {
        setTeam(updatedTeam);
        try {
          localStorage.setItem("auth_user", JSON.stringify(updatedTeam));
        } catch {
          /* ignore */
        }
      }
      pushToast("Đã lưu thay đổi thông tin đội.", "success");
      setTimeout(() => {
        navigate("/responder/team-info");
      }, 500);
    } catch (error) {
      pushToast(readApiMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = form.avatarUrl || team?.profile?.avatar_url || "";
  const avatarDisplaySrc = getUserAvatarSrc({
    profile: { avatar_url: avatarUrl },
  });
  const teamName = team?.full_name || "Đội cứu hộ";
  const normalizedStatus = String(team?.status || "").trim().toLowerCase();
  const statusSummary =
    normalizedStatus === "active" || normalizedStatus === "online"
      ? "Đang hoạt động"
      : normalizedStatus
        ? "Đang tạm ngưng"
        : "Chưa có dữ liệu";
  const updatedSummary = formatLastUpdated(team?.updated_at || team?.updatedAt);
  const securitySummary = team?.auth?.email || authUser?.auth?.email || "Mã hóa chuẩn quốc tế";
  const unreadCount = notifications.filter((item) => item.unread).length;

  function handleToggleNotifications() {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) {
        setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
      }
      return next;
    });
  }

  return (
    <>
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block">
        <div className="team-edit-page">
          <ResponderSidebar active="team" />

      <div className="team-edit-shell">
        <header className="team-edit-topbar team-edit-topbar--simple">
          <div className="team-edit-title-group">
            <h1>Cài đặt Đội cứu hộ</h1>
            <Link to="/responder/team-info" className="team-edit-back-btn" aria-label="Quay lại thông tin đội">
              <ArrowLeft size={16} />
            </Link>
          </div>

          <div className="team-edit-topbar-user">
            <div className="team-edit-notification-wrap" ref={notificationRef}>
              <button
                type="button"
                className="team-edit-bell-btn"
                aria-label="Thông báo"
                onClick={handleToggleNotifications}
                aria-expanded={showNotifications}
                aria-haspopup="menu"
              >
                <Bell size={14} />
                {unreadCount > 0 ? <span className="team-edit-bell-dot">{unreadCount}</span> : null}
              </button>

              {showNotifications ? (
                <ul className="team-edit-notification-menu" role="menu" aria-label="Thông báo đội cứu trợ">
                  {notifications.map((item) => (
                    <li key={item.id} className={`team-edit-notification-item ${item.unread ? "is-unread" : ""}`}>
                      <div className="team-edit-notification-head">
                        <strong>{item.title}</strong>
                        <span>{item.time}</span>
                      </div>
                      <p>{item.description}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="team-edit-user-meta">
              <p>{team?.auth?.email || authUser?.auth?.email || "Sentinel Admin"}</p>
              <span>Đang trực</span>
            </div>
            <div className="team-edit-avatar">
              <img src={avatarDisplaySrc} alt={teamName} className="team-edit-avatar-img" />
            </div>
          </div>
        </header>

        <main className="team-edit-content">
          <p className="team-edit-subtitle">Cập nhật hồ sơ công khai và các thông tin liên hệ khẩn cấp.</p>

          {loadingTeam ? <p className="team-edit-loading">Đang tải dữ liệu đội...</p> : null}
          {teamError ? <p className="team-edit-error">{teamError}</p> : null}

          <div className="team-edit-toasts-container">
            {toastAlerts.map((alert) => (
              <div key={alert.toastId} className={`team-edit-toast team-edit-toast--${alert.type}`}>
                <span>{alert.message}</span>
                <button
                  type="button"
                  className="team-edit-toast-close"
                  onClick={() => dismissToast(alert.toastId)}
                  aria-label="Đóng thông báo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <section className="team-edit-card">
            <div className="team-edit-card-banner" />

            <div className="team-edit-card-head">
              <div className="team-badge-avatar-wrap">
                <div className="team-badge-avatar">
                  <img src={avatarDisplaySrc} alt={teamName} className="team-badge-avatar-img" />
                </div>
                <button
                  type="button"
                  className="team-avatar-edit"
                  aria-label="Đổi ảnh đại diện"
                  onClick={handleAvatarClick}
                >
                  <Pencil size={12} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarSelect}
                />
              </div>

              <div className="team-head-meta">
                <h2>{teamName}</h2>
                <span>{form.code || "#RS-—"}</span>
              </div>
            </div>

            <form className="team-edit-form" onSubmit={handleSubmit}>
              <div className="team-field-grid">
                <label className="team-field">
                  <span>Tên đội cứu trợ</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Nhập tên đội cứu trợ"
                  />
                </label>

                <label className="team-field">
                  <span>Mã định danh (ID)</span>
                  <div className="field-with-icon is-readonly">
                    <input type="text" value={form.code} readOnly />
                    <Lock size={13} />
                  </div>
                </label>

                <label className="team-field">
                  <span>Email liên hệ</span>
                  <div className="field-with-icon is-readonly">
                    <Mail size={13} />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      readOnly
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="email@team.com"
                    />
                  </div>
                </label>

                <label className="team-field">
                  <span>Số điện thoại</span>
                  <div className="field-with-icon">
                    <Phone size={13} />
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="090 123 4567"
                    />
                  </div>
                </label>

                <label className="team-field">
                  <span>Khu vực hoạt động</span>
                  <div className="field-with-icon">
                    <MapPin size={13} />
                    <input
                      type="text"
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      placeholder="Quận 1, TP. Hồ Chí Minh"
                    />
                  </div>
                </label>

                <div className="team-field">
                  <span>Ảnh đại diện mới</span>
                  <button type="button" className="upload-box-btn" onClick={handleAvatarClick}>
                    <UploadCloud size={16} />
                    <div>
                      <strong>Tải lên ảnh mới</strong>
                      <p>{avatarUrl ? "Ảnh đã chọn sẵn sàng lưu" : "PNG, JPG tối đa 5MB"}</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="team-form-actions">
                <button type="button" className="btn-cancel" onClick={() => navigate("/responder/team-info")}>
                  Hủy
                </button>
                <button type="submit" className="btn-save" disabled={saving || loadingTeam || !team?._id}>
                  <Save size={14} /> {saving ? "Đang lưu" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </section>

          <section className="team-edit-footnotes">
            <article>
              <h3>Trạng thái xác thực</h3>
              <p>{statusSummary}</p>
            </article>
            <article>
              <h3>Lần cuối cập nhật</h3>
              <p>{updatedSummary}</p>
            </article>
            <article>
              <h3>Bảo mật dữ liệu</h3>
              <p>{securitySummary}</p>
            </article>
          </section>
        </main>
      </div>
    </div>
    </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden flex flex-col min-h-screen bg-[#F8F9FA] font-sans pb-[80px]">
        
        {/* Mobile Top Bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/responder/team-info" className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Cài đặt Đội cứu hộ</h1>
          </div>
          <div className="flex items-center gap-3 relative">
            <button className="relative text-gray-600 p-1" onClick={handleToggleNotifications}>
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <img src={avatarDisplaySrc} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                <div className="text-xs font-bold text-gray-500 uppercase px-2 mb-1">Thông báo</div>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {notifications.map(item => (
                    <div key={item.id} className={`p-2 rounded-xl ${item.unread ? 'bg-blue-50' : 'bg-transparent'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <strong className="text-sm text-gray-900">{item.title}</strong>
                        <span className="text-[10px] text-gray-500">{item.time}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Toasts */}
        <div className="fixed top-20 left-4 right-4 z-50 flex flex-col gap-2">
          {toastAlerts.map((alert) => (
            <div key={alert.toastId} className={`px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-sm font-bold text-white ${alert.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              <span>{alert.message}</span>
              <button onClick={() => dismissToast(alert.toastId)}>×</button>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
          <p className="text-sm text-gray-600 mb-4 px-1">
            Cập nhật hồ sơ công khai và các thông tin liên hệ khẩn cấp.
          </p>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="h-28 bg-gradient-to-r from-red-700 to-red-600 relative rounded-t-3xl" />
            
            <div className="px-5 pb-5 relative -mt-12">
              <div className="flex justify-between items-end mb-5">
                <div className="relative shrink-0">
                  <div className="w-[84px] h-[84px] rounded-[20px] border-4 border-white bg-white overflow-hidden shadow-md">
                    <img src={avatarDisplaySrc} alt={teamName} className="w-full h-full object-cover" />
                  </div>
                  <button onClick={handleAvatarClick} className="absolute -bottom-2 -right-2 w-[26px] h-[26px] bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-red-500 z-10">
                    <Pencil size={12} />
                  </button>
                </div>
                <div className="pb-1.5 text-right flex-1 ml-3 h-[84px] flex flex-col justify-between items-end relative -top-[35px]">
                  <h2 className="text-[17px] font-bold text-white drop-shadow-md truncate w-full">{teamName}</h2>
                  <span className="inline-flex px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                    {form.code || "#RS-—"}
                  </span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">Tên đội cứu trợ</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => updateField("name", e.target.value)}
                    placeholder="Nhập tên đội cứu trợ"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">Mã định danh (ID)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.code}
                      readOnly
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500"
                    />
                    <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">Email liên hệ</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={form.email}
                        readOnly
                        placeholder="email@team.com"
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs sm:text-sm text-gray-500 truncate"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">Số điện thoại</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={form.phone}
                        onChange={e => updateField("phone", e.target.value)}
                        placeholder="090 123 4567"
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition truncate"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">Khu vực hoạt động</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.address}
                      onChange={e => updateField("address", e.target.value)}
                      className="w-full pl-9 pr-8 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs sm:text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                    >
                      <option value="">Chọn khu vực</option>
                      <option value="Quận Hải Châu, Thành Phố Đà Nẵng">Quận Hải Châu, Thành Phố Đà Nẵng</option>
                      <option value="Quận Thanh Khê, Thành Phố Đà Nẵng">Quận Thanh Khê, Thành Phố Đà Nẵng</option>
                      <option value="Quận Sơn Trà, Thành Phố Đà Nẵng">Quận Sơn Trà, Thành Phố Đà Nẵng</option>
                      <option value="Quận Ngũ Hành Sơn, Thành Phố Đà Nẵng">Quận Ngũ Hành Sơn, Thành Phố Đà Nẵng</option>
                      <option value="Quận Liên Chiểu, Thành Phố Đà Nẵng">Quận Liên Chiểu, Thành Phố Đà Nẵng</option>
                      <option value="Quận Cẩm Lệ, Thành Phố Đà Nẵng">Quận Cẩm Lệ, Thành Phố Đà Nẵng</option>
                      <option value="Huyện Hòa Vang, Thành Phố Đà Nẵng">Huyện Hòa Vang, Thành Phố Đà Nẵng</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <ChevronRight size={14} className="text-gray-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">Ảnh đại diện mới</label>
                  <button type="button" onClick={handleAvatarClick} className="w-full flex items-center gap-3 p-4 border border-dashed border-blue-300 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition text-left">
                    <UploadCloud size={20} className="text-blue-500" />
                    <div>
                      <h4 className="text-[13px] font-bold text-blue-700">Tải lên ảnh mới</h4>
                      <p className="text-[11px] text-blue-500 mt-0.5">{avatarUrl ? "Ảnh đã chọn sẵn sàng lưu" : "PNG, JPG tối đa 5MB"}</p>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button type="button" onClick={() => navigate("/responder/team-info")} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-[14px] text-sm transition">
                    Hủy
                  </button>
                  <button type="submit" disabled={saving || loadingTeam || !team?._id} className="flex-1 py-3.5 bg-[#D91F26] hover:bg-red-700 text-white font-bold rounded-[14px] text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={16} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-3 pb-6">
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-500 font-medium">Trạng thái xác thực</p>
                <p className="text-[13px] font-bold text-gray-900">{statusSummary}</p>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Clock3 size={18} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-500 font-medium">Lần cuối cập nhật</p>
                <p className="text-[13px] font-bold text-gray-900">{updatedSummary}</p>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">Bảo mật dữ liệu</p>
                <p className="text-[13px] font-bold text-gray-900 truncate">{securitySummary}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center pb-safe z-40 px-2 py-1">
          <Link to="/responder" className="flex flex-col items-center p-2 text-gray-500 hover:text-emerald-600 transition gap-1 flex-1">
            <Home size={20} />
            <span className="text-[10px] font-medium">Trang chủ</span>
          </Link>
          <Link to="/responder/team-info" className="flex flex-col items-center p-2 bg-emerald-50 text-emerald-600 rounded-xl transition gap-1 flex-1 mx-1">
            <User size={20} />
            <span className="text-[10px] font-medium">Thông tin cá nhân</span>
          </Link>
          <Link to="/responder/history" className="flex flex-col items-center p-2 text-gray-500 hover:text-emerald-600 transition gap-1 flex-1">
            <Clock3 size={20} />
            <span className="text-[10px] font-medium">Lịch sử</span>
          </Link>
          <button onClick={() => setShowSupportModal(true)} className="flex flex-col items-center p-2 text-gray-500 hover:text-emerald-600 transition gap-1 flex-1">
            <LifeBuoy size={20} />
            <span className="text-[10px] font-medium">Hỗ trợ</span>
          </button>
        </nav>
      </div>

      {/* SUPPORT MODAL (Responder) */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] p-4" onClick={() => setShowSupportModal(false)} style={{ zIndex: 999999 }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Hướng dẫn (Đội Cứu Hộ)</h3>
              <button onClick={() => setShowSupportModal(false)} className="text-white/80 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
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
