import {
  Activity,
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  MapPin,
  Search,
  Siren,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatSosCode, getIncidentTypeDisplay } from '@/constants/incidentMeta';
import {
  deriveIncidentPriority,
  incidentPriorityTableBadgeClass,
} from './incidentPriority';

export const MOBILE_STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'ASSIGNED', label: 'Đã phân công' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả mức độ' },
  { value: 'urgent', label: 'Cực kì cao' },
  { value: 'high', label: 'Cao' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Thấp' },
  { value: 'unclassified', label: 'Chưa phân loại' },
];

const TIME_FILTER_OPTIONS = [
  { value: '', label: 'Mọi lúc' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày qua' },
  { value: 'month', label: '30 ngày qua' },
];

function formatIncidentDateTimeMobile(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} • ${time}`;
}

function normalizeStatusKey(raw) {
  const x = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (x === 'pending') return 'PENDING';
  if (x === 'assigned') return 'ASSIGNED';
  if (x === 'in_progress' || x === 'inprogress') return 'IN_PROGRESS';
  if (x === 'resolved') return 'RESOLVED';
  if (x === 'cancelled' || x === 'canceled') return 'CANCELLED';
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function statusRow(raw) {
  const s = normalizeStatusKey(raw);
  switch (s) {
    case 'PENDING':
      return { text: 'Đang chờ', dot: 'bg-brand-muted' };
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return { text: 'Đang xử lý', dot: 'bg-brand-red' };
    case 'RESOLVED':
      return { text: 'Hoàn thành', dot: 'bg-brand-blue' };
    case 'CANCELLED':
      return { text: 'Đã hủy', dot: 'bg-brand-muted/60' };
    default:
      return { text: raw || '—', dot: 'bg-brand-muted' };
  }
}

function IncidentMobileCard({ sos, onView }) {
  const { label: typeLabel, Icon, emoji: typeEmoji } = getIncidentTypeDisplay(sos.incident_type);
  const victimName =
    typeof sos.victim_id === 'object' && sos.victim_id?.full_name
      ? sos.victim_id.full_name
      : '—';
  const pr = deriveIncidentPriority(sos);
  const st = statusRow(sos.status);

  return (
    <article className="relative rounded-2xl border border-[#E8E8EC] bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => onView(sos)}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-gray-bg hover:text-brand-brown"
        aria-label="Xem chi tiết"
      >
        <Eye className="size-4" />
      </button>

      <div className="flex gap-3 pr-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-gray-bg">
          {typeEmoji ? (
            <span className="text-xl leading-none" aria-hidden>
              {typeEmoji}
            </span>
          ) : (
            <Icon className="size-5 text-brand-red" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2 pr-2">
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-brand-red">
                {formatSosCode(sos._id)}
              </p>
              <h3 className="text-base font-bold leading-snug text-black">{typeLabel}</h3>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                incidentPriorityTableBadgeClass(pr.key),
              )}
            >
              {pr.label}
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-sm text-brand-brown">
            <User className="size-3.5 shrink-0 text-brand-muted" aria-hidden />
            <span className="truncate">{victimName}</span>
          </p>
          <p className="flex items-start gap-1.5 text-sm text-brand-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-red" aria-hidden />
            <span className="line-clamp-2">{sos.address || '—'}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-brand-muted">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {formatIncidentDateTimeMobile(sos.created_at)}
          </p>

          <div className="flex justify-end pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-brown">
              <span className={cn('size-2 rounded-full', st.dot)} />
              {st.text}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function IncidentManagementMobileSection({
  activeCount,
  systemLoad,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  timeFilter,
  onTimeFilterChange,
  showFilters,
  onShowFiltersChange,
  onApplyFilters,
  loading,
  error,
  pageSlice,
  filteredLength,
  safePage,
  totalPages,
  pagesArr,
  onPageChange,
  pageSize,
  onViewIncident,
}) {
  return (
    <>
      <div className="space-y-4 lg:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            Quản lý sự cố khẩn cấp
          </h1>
          <p className="mt-1 text-sm text-brand-brown">
            Theo dõi và điều phối các yêu cầu cứu hộ thời gian thực.
          </p>
        </div>

        <div className="rounded-2xl border border-rose-100/80 bg-gradient-to-br from-rose-50 via-white to-rose-50/40 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Siren className="size-5 text-brand-red" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-red">
                Đang hoạt động
              </p>
              <p className="text-lg font-bold leading-tight text-black">
                {activeCount}{' '}
                <span className="text-sm font-semibold text-brand-brown">sự cố khẩn cấp</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-brand-red transition-all duration-300"
                  style={{ width: `${systemLoad}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Activity className="ml-auto size-5 text-brand-red" aria-hidden />
              <p className="mt-1 text-[11px] font-medium text-brand-brown">Tải hệ thống</p>
              <p className="text-sm font-bold text-black tabular-nums">{systemLoad}%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <input
              type="search"
              placeholder="Tìm kiếm sự cố, địa chỉ hoặc mã số..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#E8E8EC] bg-white pl-10 pr-3 text-sm text-brand-brown shadow-sm outline-none placeholder:text-brand-muted focus-visible:ring-2 focus-visible:ring-brand-red/20"
            />
          </div>
          <button
            type="button"
            onClick={() => onShowFiltersChange(true)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#E8E8EC] bg-white px-3 text-sm font-semibold text-brand-brown shadow-sm"
          >
            <Filter className="size-4" />
            Bộ lọc
          </button>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOBILE_STATUS_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => onStatusFilterChange(tab.value)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                statusFilter === tab.value
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'border border-[#E8E8EC] bg-white text-brand-brown',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
            aria-label="Khoảng thời gian"
            className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[#E8E8EC] bg-white py-2 pl-10 pr-9 text-sm font-medium text-brand-brown shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
          >
            {TIME_FILTER_OPTIONS.map((o) => (
              <option key={o.value || 'allt'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {loading && (
            <p className="py-12 text-center text-sm text-brand-muted">Đang tải dữ liệu...</p>
          )}
          {!loading && error && (
            <p className="py-12 text-center text-sm text-brand-red">{error}</p>
          )}
          {!loading &&
            !error &&
            pageSlice.map((sos) => (
              <IncidentMobileCard key={sos._id} sos={sos} onView={onViewIncident} />
            ))}
          {!loading && !error && pageSlice.length === 0 && (
            <p className="py-12 text-center text-sm text-brand-muted">
              Không có sự cố nào phù hợp bộ lọc.
            </p>
          )}
        </div>

        {!loading && !error && filteredLength > 0 && (
          <div className="flex flex-col items-center gap-3 border-t border-[#E8E8EC] pt-4">
            <p className="text-center text-xs text-brand-brown">
              Hiển thị {(safePage - 1) * pageSize + 1} -{' '}
              {Math.min(safePage * pageSize, filteredLength)} của {filteredLength} sự cố
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => onPageChange(Math.max(1, safePage - 1))}
                className="min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-muted hover:bg-white disabled:opacity-40"
                aria-label="Trang trước"
              >
                {'<'}
              </button>
              {pagesArr.map((item, i) =>
                item === 'ellipsis' ? (
                  <span
                    key={`m-ellipsis-${i}`}
                    className="min-w-9 px-1 text-center text-sm text-brand-muted select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`m-${item}`}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={cn(
                      'min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium transition',
                      item === safePage
                        ? 'bg-brand-red text-white'
                        : 'text-brand-muted hover:bg-white',
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
                className="min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-muted hover:bg-white disabled:opacity-40"
                aria-label="Trang sau"
              >
                {'>'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showFilters && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Đóng bộ lọc"
            onClick={() => onShowFiltersChange(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl lg:hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-black">Bộ lọc</h2>
              <button
                type="button"
                onClick={() => onShowFiltersChange(false)}
                className="rounded-lg p-2 text-brand-muted hover:bg-brand-gray-bg"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-brown">
                Trạng thái
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className="h-11 rounded-xl border border-[#E8E8EC] bg-brand-gray-bg px-3 text-sm font-normal text-brand-brown outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
                >
                  {STATUS_FILTER_OPTIONS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-brown">
                Mức độ ưu tiên
                <select
                  value={priorityFilter}
                  onChange={(e) => onPriorityFilterChange(e.target.value)}
                  className="h-11 rounded-xl border border-[#E8E8EC] bg-brand-gray-bg px-3 text-sm font-normal text-brand-brown outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
                >
                  {PRIORITY_FILTER_OPTIONS.map((o) => (
                    <option key={o.value || 'allp'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-brand-brown">
                Khoảng thời gian
                <select
                  value={timeFilter}
                  onChange={(e) => onTimeFilterChange(e.target.value)}
                  className="h-11 rounded-xl border border-[#E8E8EC] bg-brand-gray-bg px-3 text-sm font-normal text-brand-brown outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
                >
                  {TIME_FILTER_OPTIONS.map((o) => (
                    <option key={o.value || 'allt'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                className="h-11 w-full gap-2 bg-brand-red text-white hover:bg-brand-red/90"
                onClick={() => {
                  onApplyFilters();
                  onShowFiltersChange(false);
                }}
              >
                <Filter className="size-4" />
                Áp dụng lọc
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
