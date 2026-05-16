import UserRow from "./UserRow";
import { Info, Lock, MapPin, Phone, Unlock } from "lucide-react";
import { ROLE_CONFIG, STATUS_CONFIG } from "@/utils/userUI";
import { getUserAvatarSrc } from "@/lib/userAvatar";

function UserMobileCard({ user = {}, onView, onToggleStatus }) {
  const role = ROLE_CONFIG?.[user?.role];
  const status = STATUS_CONFIG?.[user?.status];
  const RoleIcon = role?.icon;
  const StatusIcon = status?.icon;
  const roleKey = String(user?.role || "").trim().toLowerCase();
  const canLockAccount = roleKey === "victim" || roleKey === "rescue";
  const isActive = String(user?.status || "").toLowerCase() === "active";
  const name = user?.full_name || user?.name || "Chưa có tên";
  const phone = user?.auth?.phone || "--";
  const address = user?.profile?.address || user?.location || "Chưa rõ";

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img
          src={getUserAvatarSrc(user)}
          className="size-12 shrink-0 rounded-full object-cover"
          alt=""
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-6 text-gray-950">
                {name}
              </h3>
              <div
                className={`mt-1 flex w-fit max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${role?.className || ""}`}
              >
                {RoleIcon ? <RoleIcon className="size-3 shrink-0" aria-hidden /> : null}
                <span className="truncate">{user?.role || "--"}</span>
              </div>
            </div>

            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status?.className || ""}`}
            >
              {StatusIcon ? <StatusIcon className="size-3 shrink-0" aria-hidden /> : null}
              {user?.status || "--"}
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-sm text-gray-600">
            <div className="flex min-w-0 items-center gap-2">
              <Phone className="size-4 shrink-0 text-blue-500" aria-hidden />
              <span className="truncate">{phone}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0 text-blue-500" aria-hidden />
              <span className="truncate">{address}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 pl-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
            onClick={() => onView?.(user)}
            title="Xem chi tiết"
            aria-label={`Xem chi tiết ${name}`}
          >
            <Info className="size-4" />
          </button>

          {canLockAccount && (
            <button
              type="button"
              className={`rounded-lg p-1.5 transition ${
                isActive
                  ? "text-gray-500 hover:bg-red-50 hover:text-red-500"
                  : "text-gray-500 hover:bg-green-50 hover:text-green-600"
              }`}
              onClick={() => onToggleStatus?.(user)}
              title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
              aria-label={isActive ? `Khóa ${name}` : `Mở khóa ${name}`}
            >
              {isActive ? <Lock className="size-4" /> : <Unlock className="size-4" />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const UserTable = ({ users = [], loading, onView, onToggleStatus }) => {  
  return (
    <div>
      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
        <table className="w-full text-sm">
        
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Họ tên & ID</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>SĐT</th>
              <th>Vị trí hiện tại</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-gray-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user._id || user.id}
                  user={user}
                  onView={onView}
                  onToggleStatus={onToggleStatus}
                />
              ))
            )}
          </tbody>

        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {loading ? (
          <div className="rounded-xl border bg-white py-6 text-center text-sm text-gray-400 shadow-sm">
            Đang tải dữ liệu...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border bg-white py-6 text-center text-sm text-gray-400 shadow-sm">
            Không có dữ liệu
          </div>
        ) : (
          users.map((user) => (
            <UserMobileCard
              key={user._id || user.id}
              user={user}
              onView={onView}
              onToggleStatus={onToggleStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UserTable;
