import { useState } from "react";

import { DA_NANG_WARDS } from "@/constants/wards";

export default function UserFilter({ onFilter }) {
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [ward, setWard] = useState(""); 
  const handleFilter = () => {
    if (onFilter) {
      onFilter({ keyword, role, ward });
    } // gửi ra ngoài
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:rounded-lg">
      
      {/* SEARCH */}
      <input
        type="text"
        placeholder="Tìm kiếm theo tên hoặc số điện thoại"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64 sm:py-2"
      />

      {/* ROLE */}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto sm:py-2"
      >
        <option value="">Tất cả vai trò</option>
        <option value="Admin">Admin</option>
        <option value="Rescue">Rescue</option>
        <option value="Victim">Victim</option>

      </select>

      {/* WARD FILTER */}
      <select
        value={ward}
        onChange={(e) => setWard(e.target.value)}
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto sm:py-2"
      >
        <option value="">Tất cả Phường</option>

        {(DA_NANG_WARDS || []).map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>

      {/* BUTTON */}
      <button
        onClick={handleFilter}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto sm:py-2"
      >
        Lọc
      </button>
    </div>
  );
}
