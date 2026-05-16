import { useState, useMemo, useEffect } from "react";
import { ChevronDown, Filter, Phone, MapPin, Clock, Navigation, Car } from "lucide-react";
import FireIcon from "@/assets/fire.svg?react";
import WaveIcon from "@/assets/wave.svg?react";
import MedicalIcon from "@/assets/medical.svg?react";
import LostIcon from "@/assets/lost.svg?react";
import CarIcon from "@/assets/car.svg?react";
import MoreIcon from "@/assets/more.svg?react";

const PAGE_SIZE = 5;

function resolveIncidentDisplay(incidentType) {
  const type = String(incidentType || "").toLowerCase();

  if (type.includes("vehicle") || type.includes("xe") || type.includes("sự cố phương tiện")) {
    return { Icon: CarIcon, label: "Sự cố phương tiện", color: "text-blue-500" };
  }
  if (type.includes("fire") || type.includes("cháy") || type.includes("cháy nổ")) {
    return { Icon: FireIcon, label: "Cháy nổ", color: "text-orange-500" };
  }
  if (type.includes("flood") || type.includes("lụt") || type.includes("thiên tai")) {
    return { Icon: WaveIcon, label: "Thiên tai", color: "text-orange-600" };
  }
  if (type.includes("medical") || type.includes("y tế") || type.includes("sức khỏe") || type.includes("cấp cứu")) {
    return { Icon: MedicalIcon, label: "Sức khỏe", color: "text-red-500" };
  }
  if (type.includes("lost") || type.includes("lạc") || type.includes("mất tích")) {
    return { Icon: LostIcon, label: "Lạc đường", color: "text-emerald-500" };
  }
  return { Icon: MoreIcon, label: "Khác", color: "text-gray-500" };
}

const LEVEL_STYLES = {
  critical: {
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-700",
    mobileBadge: "bg-red-50 text-red-600 border border-red-200",
    selectedBg: "bg-red-50 border-red-200",
  },
  high: {
    border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-700",
    mobileBadge: "bg-orange-50 text-orange-600 border border-orange-200",
    selectedBg: "bg-orange-50 border-orange-200",
  },
  medium: {
    border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700",
    mobileBadge: "bg-amber-50 text-amber-600 border border-amber-200",
    selectedBg: "bg-amber-50 border-amber-200",
  },
  low: {
    border: "border-l-green-500",
    badge: "bg-green-100 text-green-700",
    mobileBadge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    selectedBg: "bg-green-50 border-green-200",
  },
};

export default function ResponderRequestList({
  requests,
  selectedRequestId,
  levelMeta,
  apiMessage,
  emptyMessage,
  onSelectRequest,
  onAcceptRequest,
  acceptLoading,
  currentUserId,
  proximitySort,
  urgencyLevel,
  onProximitySortChange,
  onUrgencyLevelChange,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileDetailItem, setMobileDetailItem] = useState(null);

  const proximityLabelMap = {
    nearest: "Gần nhất",
    farthest: "Xa nhất",
    latest: "Mới nhất",
  };

  const urgencyLabelMap = {
    all:      "Tất cả mức độ",
    critical: "Mức độ: Cực cao",
    high:     "Mức độ: Cao",
    medium:   "Mức độ: Trung bình",
    low:      "Mức độ: Thấp",
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [requests.length, proximitySort, urgencyLevel]);

  const totalPages = Math.ceil(requests.length / PAGE_SIZE);
  const pagedRequests = requests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function isRequestAlreadyAccepted(item) {
    const assignedRescueId =
      item.source?.assigned_rescue_id?._id || item.source?.assigned_rescue_id;
    if (assignedRescueId && String(assignedRescueId) !== String(currentUserId)) {
      return true;
    }
    const status = String(item.source?.status || "PENDING").toUpperCase();
    return status !== "PENDING";
  }

  function handleAcceptRequest(item) {
    if (isRequestAlreadyAccepted(item)) return;
    onAcceptRequest?.(item);
  }

  const pageItems = useMemo(() => {
    const items = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (currentPage <= 4) {
        items.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        items.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return items;
  }, [currentPage, totalPages]);

  return (
    // font-[600] base weight — dùng DM Sans hoặc Nunito nếu đã import, fallback sans-serif
    <div className="flex flex-col gap-4 [&_*]:font-[family-name:var(--font-sans,inherit)] pb-24 md:pb-0">

      {/* =========================================
          1. DESKTOP HEADER & FILTERS 
      ========================================= */}
      <div className="hidden md:flex items-start justify-between gap-4">
        {/* Title + live */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black">
            NHẬN YÊU CẦU CỨU TRỢ
          </h1>
          <p className="flex items-center gap-2 mt-1 text-sm font-semibold text-black">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Đang giám sát thời gian thực
            {apiMessage && (
              <span className="ml-2 text-blue-500">{apiMessage}</span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Proximity dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-black hover:border-blue-400 transition-colors"
              onClick={() => setOpenMenu((prev) => (prev === "proximity" ? null : "proximity"))}
              aria-expanded={openMenu === "proximity"}
              aria-haspopup="menu"
            >
              <Filter size={12} />
              {proximityLabelMap[proximitySort] || "Mới nhất"}
              <ChevronDown
                size={14}
                className={`transition-transform ${openMenu === "proximity" ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu === "proximity" && (
              <ul
                className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1"
                role="menu"
                aria-label="Sắp xếp khoảng cách"
              >
                {[
                  { value: "nearest", label: "Gần nhất" },
                  { value: "farthest", label: "Xa nhất" },
                  { value: "latest", label: "Mới nhất" },
                ].map(({ value, label }) => (
                  <li key={value} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                        proximitySort === value ? "text-blue-600 bg-blue-50" : "text-black"
                      }`}
                      onClick={() => { onProximitySortChange?.(value); setOpenMenu(null); }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Urgency dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-black hover:border-blue-400 transition-colors"
              onClick={() => setOpenMenu((prev) => (prev === "urgency" ? null : "urgency"))}
              aria-expanded={openMenu === "urgency"}
              aria-haspopup="menu"
            >
              <Filter size={12} />
              {urgencyLabelMap[urgencyLevel] || "Tất cả mức độ"}
              <ChevronDown
                size={14}
                className={`transition-transform ${openMenu === "urgency" ? "rotate-180" : ""}`}
              />
            </button>

            {openMenu === "urgency" && (
              <ul
                className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1"
                role="menu"
                aria-label="Lọc mức độ khẩn cấp"
              >
                {[
                  { value: "all",      label: "Tất cả" },
                  { value: "critical", label: "🔴 Cực cao" },
                  { value: "high",     label: "Cao" },
                  { value: "medium",   label: "Trung bình" },
                  { value: "low",      label: "Thấp" },
                ].map(({ value, label }) => (
                  <li key={value} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                        urgencyLevel === value ? "text-blue-600 bg-blue-50" : "text-black"
                      }`}
                      onClick={() => { onUrgencyLevelChange?.(value); setOpenMenu(null); }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* =========================================
          2. MOBILE HEADER & FILTERS 
      ========================================= */}
      <div className="md:hidden flex flex-col px-1 gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">NHẬN YÊU CẦU CỨU TRỢ</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[12px] font-bold text-gray-800">Đang giám sát thời gian thực</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "m-prox", label: proximityLabelMap[proximitySort] || "Mới nhất", options: ["latest", "nearest", "farthest"], map: proximityLabelMap, onChange: onProximitySortChange },
            { id: "m-urg", label: urgencyLabelMap[urgencyLevel].replace("Mức độ: ", ""), options: ["all", "critical", "high", "medium", "low"], map: urgencyLabelMap, onChange: onUrgencyLevelChange },
            { id: "m-team", label: "Trạng thái đội", options: [], map: {}, onChange: () => {} }
          ].map(f => (
            <div key={f.id} className="relative shrink-0">
              <button onClick={() => setOpenMenu(openMenu === f.id ? null : f.id)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-xs font-bold text-gray-700">
                {f.id !== "m-team" && <Filter size={12} />} {f.label}
                <ChevronDown size={14} className={openMenu === f.id ? "rotate-180" : ""} />
              </button>
              {openMenu === f.id && f.options.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2">
                  {f.options.map(v => (
                    <button key={v} onClick={() => { f.onChange?.(v); setOpenMenu(null); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-600 hover:bg-gray-50">{f.map[v] || v}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* =========================================
          3. CARD LIST (DUAL RENDER)
      ========================================= */}
      <div className="flex flex-col gap-3 md:gap-4">
        {!requests.length ? (
          <article className="py-12 text-center text-black text-sm font-semibold bg-white rounded-2xl border border-gray-100">
            {emptyMessage || "Chưa có yêu cầu SOS để hiển thị"}
          </article>
        ) : pagedRequests.map((item) => {
          const meta = levelMeta[item.level] || levelMeta.medium || levelMeta.high;
          const levelStyle = LEVEL_STYLES[item.level] || LEVEL_STYLES.medium;
          const incidentDisplay = resolveIncidentDisplay(item.incidentType);
          const selected = String(item.id) === String(selectedRequestId);

          return (
            <div key={item.id}>
              {/* --- DESKTOP CARD --- */}
              <article
                className={[
                  "hidden md:block bg-white rounded-2xl border border-l-4 border-gray-100 px-5 py-4 transition-shadow cursor-pointer",
                  levelStyle.border,
                  selected ? `${levelStyle.selectedBg} shadow-md` : "hover:shadow-md",
                ].join(" ")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${levelStyle.badge}`}>
                      {meta.label}
                    </span>
                    <span className="text-sm font-semibold text-black">
                      {item.distanceKm != null ? `${item.distanceKm}km` : "—"}
                      {item.receivedAt ? ` • ${item.receivedAt}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5" aria-label={incidentDisplay.label}>
                    <incidentDisplay.Icon className="w-5 h-5 shrink-0 text-black" aria-hidden="true" />
                    <span className="text-sm font-semibold text-black">{incidentDisplay.label}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-black mb-2">{item.victimName || item.title}</h3>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-black">
                    <span>📞</span>{item.victimPhone || "Chưa có số điện thoại"}
                  </p>
                </div>

                {item.description && <p className="text-sm font-semibold text-black mb-1">Mô tả nguyên nhân: {item.description}</p>}

                <p className="flex items-start gap-1.5 text-xs font-semibold text-black mb-3">
                  <span className="mt-0.5 shrink-0">📍</span>{item.address}
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-black bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors"
                    onClick={() => onSelectRequest?.(String(item.id))}
                  >
                    Xem chi tiết
                  </button>
                  {!isRequestAlreadyAccepted(item) && (
                    <button
                      type="button"
                      disabled={!onAcceptRequest || acceptLoading}
                      className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      onClick={() => handleAcceptRequest(item)}
                    >
                      {acceptLoading ? "ĐANG XỬ LÝ..." : "Nhận →"}
                    </button>
                  )}
                </div>
              </article>

              {/* --- MOBILE CARD --- */}
              <article className="md:hidden bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 relative">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${levelStyle.mobileBadge}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      {item.distanceKm != null ? `${item.distanceKm}km` : "—"} • {item.receivedAt || "22:06"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                    <incidentDisplay.Icon className={`w-4 h-4 ${incidentDisplay.color}`} />
                    <span className="text-[10px] font-black text-gray-600">{incidentDisplay.label}</span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-gray-900 leading-tight">{item.victimName || item.title}</h3>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-red-500" />
                  <span className="text-sm font-bold text-gray-800">{item.victimPhone || "Chưa có số ĐT"}</span>
                </div>

                {item.description && (
                  <p className="text-xs font-bold text-gray-500">Mã tình nguyện nhân: <span className="text-gray-800">{item.description}</span></p>
                )}

                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed line-clamp-2">{item.address}</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50 mt-1">
                  <button 
                    onClick={() => setMobileDetailItem(item)}
                    className="px-5 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-black text-gray-700 active:bg-gray-50 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                  {!isRequestAlreadyAccepted(item) && (
                    <button 
                      onClick={() => handleAcceptRequest(item)}
                      disabled={acceptLoading}
                      className="px-6 py-2.5 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-md shadow-blue-200 active:scale-95 transition-transform"
                    >
                      {acceptLoading ? "Đang xử lý" : "Nhận →"}
                    </button>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {/* =========================================
          4. DESKTOP PAGINATION
      ========================================= */}
      {requests.length > PAGE_SIZE && (
        <nav className="hidden md:flex items-center justify-between pt-2" aria-label="Phân trang yêu cầu">
          <p className="text-sm font-semibold text-black">
            Trang {currentPage}/{totalPages}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-semibold text-black border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 transition-colors"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>

            <div className="flex items-center gap-1">
              {pageItems.map((item, index) =>
                typeof item === "number" ? (
                  <button
                    key={item}
                    type="button"
                    className={`w-8 h-8 text-sm font-semibold rounded-lg transition-colors ${
                      item === currentPage ? "bg-blue-600 text-white" : "text-black border border-gray-200 hover:border-blue-400 hover:text-blue-600"
                    }`}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={`${item}-${index}`} className="w-8 h-8 flex items-center justify-center text-black text-sm font-semibold">...</span>
                )
              )}
            </div>

            <button
              type="button"
              className="px-3 py-1.5 text-sm font-semibold text-black border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 transition-colors"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        </nav>
      )}

      {/* =========================================
          5. MOBILE DETAIL MODAL (POPUP)
      ========================================= */}
      {mobileDetailItem && (
        <div className="md:hidden fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setMobileDetailItem(null)} />
          
          <div className="relative w-full bg-white rounded-t-[2rem] p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
            
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-black text-gray-500 tracking-[0.1em] uppercase">Trạng thái đội</h4>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Sẵn sàng</span>
            </div>

            {/* Dark Map Banner */}
            <div className="relative h-40 bg-[#1A1C23] rounded-[1.5rem] overflow-hidden mb-6 flex flex-col justify-end p-5">
              {/* Fake circles for design */}
              <div className="absolute top-0 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
              <div className="absolute -top-10 right-0 w-40 h-40 bg-white/5 rounded-full blur-xl" />
              
              <div className="z-10">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tọa độ mục tiêu</p>
                <p className="text-2xl font-black text-white tracking-tight">
                  {mobileDetailItem.source?.lat?.toFixed(4) || "16.0690"}° N, {mobileDetailItem.source?.lng?.toFixed(4) || "108.2032"}° E
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[11px] font-bold text-gray-500 mb-1">Yêu cầu lúc: {mobileDetailItem.receivedAt || "21:53"}</p>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">Yêu cầu cứu hộ</h3>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[13px] font-black text-red-600 leading-snug">{mobileDetailItem.address}</p>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Chi tiết</p>
                <p className="text-sm font-bold text-gray-800">{mobileDetailItem.description || "Ngất xỉu rồi"}</p>
              </div>
              
              <p className="text-xs font-bold text-gray-500">Đội gần nhất (10km): 1</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Khoảng cách</p>
                 <p className="text-xl font-black text-gray-900">{mobileDetailItem.distanceKm || "2.2"} km</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Thời gian tới</p>
                 <p className="text-xl font-black text-gray-900">~9 phút</p>
              </div>
            </div>

            {/* Action Button */}
            {!isRequestAlreadyAccepted(mobileDetailItem) ? (
               <button 
                 disabled={acceptLoading}
                 onClick={() => {
                   handleAcceptRequest(mobileDetailItem);
                   if (!acceptLoading) setMobileDetailItem(null);
                 }}
                 className="w-full py-4 bg-[#C81E1E] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
               >
                 {acceptLoading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <Car size={18} />
                 )}
                 {acceptLoading ? "Đang xử lý..." : "Nhận nhiệm vụ"}
               </button>
            ) : (
               <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center">
                 Đã có đội nhận
               </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          6. MOBILE STATS BAR (Fixed bottom)
      ========================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-3 flex items-center justify-between z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col items-center gap-1">
          <Filter size={18} className="text-gray-400" />
          <p className="text-[9px] font-black text-gray-400 uppercase">Tổng đội</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock size={18} className="text-gray-400" />
          <p className="text-[9px] font-black text-gray-400 uppercase">SOS chờ</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Navigation size={18} className="text-gray-400" />
          <p className="text-[9px] font-black text-gray-400 uppercase">Đội gần nhất</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
