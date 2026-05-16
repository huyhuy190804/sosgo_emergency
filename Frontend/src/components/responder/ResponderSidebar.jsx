import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Clock3, LifeBuoy, LogOut, User } from "lucide-react";
import rescueLogo from "@/assets/logorescue.svg";
import { clearAllAuth } from "@/services/auth/session";
import "./ResponderSidebar.css";

export default function ResponderSidebar({ active = "" }) {
  const navigate = useNavigate();
  const [showSupportModal, setShowSupportModal] = useState(false);

  async function handleLogout() {
    try {
      await clearAllAuth();
    } catch {
      // ignore
    }
    navigate("/staff-login", { replace: true });
  }

  return (
    <aside className="team-page-sidebar">
      <div className="sidebar-brand">
        <img src={rescueLogo} alt="SOSGo" className="sidebar-logo" />
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        <Link
          to="/responder"
          className={`sidebar-item ${active === "home" ? "sidebar-item-active" : ""}`}
        >
          <Home size={18} /> Trang chủ
        </Link>

        <Link
          to="/responder/team-info"
          className={`sidebar-item ${active === "team" ? "sidebar-item-active" : ""}`}
        >
          <User size={18} /> Thông tin cá nhân
        </Link>

        <Link
          to="/responder/history"
          className={`sidebar-item ${active === "history" ? "sidebar-item-active" : ""}`}
        >
          <Clock3 size={18} /> Lịch sử
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-footer-btn" onClick={() => setShowSupportModal(true)}>
          <LifeBuoy size={16} /> Hỗ trợ
        </button>

        <button type="button" className="sidebar-footer-btn sidebar-footer-logout" onClick={handleLogout}>
          <LogOut size={16} /> Đăng xuất
        </button>
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
    </aside>
  );
}