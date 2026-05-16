import { useEffect, useState } from "react";
import api from "@/services/api/apiSos";

import StatsCards from "@/components/users/StatsCards";
import UserFilter from "@/components/users/UserFilter";
import UserTable from "@/components/users/UserTable";
import UserPagination from "@/components/users/UserPagination";
import CreateUserDrawer from "@/components/users/CreateUserDrawer";
import UserDetail from "@/components/users/UserDetail";

/** API GET /api/users trả { success, data: User[] } */
function extractUserList(res) {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  return [];
}

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
      keyword: "",
      role: "",
      ward: "",
    });
  
    const [loading, setLoading] = useState(true);
  
    // pagination 
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    //drawer
    const [openDrawer, setOpenDrawer] = useState(false);

    //dùng 1 state
    const [selectedUser, setSelectedUser] = useState(null);
  
    useEffect(() => {
      api
        .get("/users")
        .then((res) => setUsers(extractUserList(res)))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, []);
  
    // FILTER
    const filteredUsers = (Array.isArray(users) ? users : []).filter((user) => {
      const name = user?.name || user?.full_name || "";
  
      const matchKeyword =
        name.toLowerCase().includes(filters.keyword.toLowerCase());
  
      const matchRole =
        !filters.role || user?.role === filters.role;
  
        const matchWard =
        !filters.ward ||
        user?.profile?.address?.includes(filters.ward);
  
      return matchKeyword && matchRole && matchWard;
    });
  
    // PAGINATION LOGIC
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
  
    const paginatedUsers = filteredUsers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

    const statsData = [
      {
        title: "TỔNG CỘNG (DN)",
        value: users.length,
      },
      {
        title: "LỰC LƯỢNG",
        value: users.filter((u) => u.role === "Rescue").length,
      },
      {
        title: "ĐANG HOẠT ĐỘNG",
        value: users.filter((u) => String(u.status || "").toLowerCase() === "active").length,
      },
      {
        title: "NGƯNG HOẠT ĐỘNG",
        value: users.filter((u) => String(u.status || "").toLowerCase() !== "active").length,
      },
    ];

    const handleToggleStatus = async (user) => {
      const roleKey = String(user?.role || "").trim().toLowerCase();
      if (roleKey !== "victim" && roleKey !== "rescue") {
        window.alert("Chỉ khóa/mở khóa được tài khoản Nạn nhân và Cứu hộ.");
        return;
      }
      try {
        const isActive = String(user.status || "").toLowerCase() === "active";

        const confirm = window.confirm(
          isActive
            ? "Xác nhận KHÓA tài khoản này? Người dùng sẽ không thể đăng nhập hoặc dùng ứng dụng."
            : "Xác nhận MỞ KHÓA tài khoản này?"
        );

        if (!confirm) return;

        const res = await api.patch(`/users/${user._id}/toggle-active`);
        const updated = res?.data?.data;
        if (updated?._id) {
          setUsers((prev) =>
            prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u))
          );
          setSelectedUser((prev) =>
            prev && prev._id === updated._id ? { ...prev, ...updated } : prev
          );
        }
      } catch (err) {
        console.error(err);
        window.alert(
          err?.response?.data?.message ||
            "Không cập nhật được trạng thái. Đảm bảo bạn đã đăng nhập quản trị."
        );
      }
    };

    return (
      <div className="min-h-screen space-y-4 bg-gray-50 px-4 py-4 sm:p-6 sm:space-y-6">
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-950 sm:text-2xl">
              <span className="sm:hidden">Quản lý người dùng</span>
              <span className="hidden sm:inline">Quản lý Người dùng Đà Nẵng</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500 sm:hidden">
              Đà Nẵng
            </p>
            <p className="mt-1 hidden text-sm text-gray-500 sm:block">
              Giám sát và phân quyền lực lượng tham gia cứu hộ tại địa bàn thành phố.
            </p>
          </div>
  
          <div className="flex gap-3 sm:shrink-0">
          
            <button
              onClick={() => setOpenDrawer(true)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 sm:w-auto sm:py-2"
              >
              + Thêm người dùng
            </button>
          </div>
        </div>
  
        <StatsCards stats={statsData} />
  
        <UserFilter
          onFilter={(data) => {
          setFilters(data);
          setCurrentPage(1); // reset page khi filter
        }}
      />
  
        <UserTable
          users={paginatedUsers}
          loading={loading}
          onView={(user) => setSelectedUser(user)}
          onToggleStatus={handleToggleStatus}
      />
  
        <UserPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            if (page < 1 || page > totalPages) return;
            setCurrentPage(page);
          }}
        />

        <CreateUserDrawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          onSubmit={async () => {
            setCurrentPage(1);
            try {
              setLoading(true);

              const res = await api.get("/users");
              
              setUsers(extractUserList(res));
              
              setOpenDrawer(false);
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          }}
        />

        <UserDetail
          user={selectedUser}
          open={!!selectedUser}
          onClose={() =>  setSelectedUser(null)}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    );
  };
  
  export default UsersPage;
