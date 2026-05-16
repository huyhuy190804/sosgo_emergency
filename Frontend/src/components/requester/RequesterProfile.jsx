import { useState, useEffect, useRef  } from "react";
import { auth } from "@/lib/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getVictimProfile,
  updateVictimProfile,
  addEmergencyContact,
  deleteEmergencyContact,
} from "@/services/api/apiSos";
import contactList from "@/assets/contact_list.svg";
import call from "@/assets/call.svg";
import contactIcon from "@/assets/contact.svg";
import medicalIcon from "@/assets/medical.svg";
import historyIcon from "@/assets/history.svg";
import homeIcon from "@/assets/home.svg";
import Header from "./Header";
import { getUserAvatarSrc } from "@/lib/userAvatar";
import {
  logoutVictimFirebase,
  clearVictimProfile,
} from '@/services/auth/session';

const HomeIcon = () => (
  <img src={homeIcon} alt="home" className="w-4 h-4" />
);
const HistoryIcon = () => (
  <img src={historyIcon} alt="history" className="w-4 h-4" />
);
const IconProfile = () => (
  <svg
    className="w-4.5 h-4.5 text-[#475569]"  
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const sidebarItems = [
  { label: "Trang chủ", icon: <HomeIcon />, path: "/" },
  { label: "Thông tin cá nhân", icon: <IconProfile />, path: "/profile" },
  { label: "Lịch sử", icon: <HistoryIcon />, path: "/history" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showRelDropdown, setShowRelDropdown] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const location = useLocation();
  const [editForm, setEditForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    address: "",
    blood_type: "",
    height: "",
    weight: "",
    allergies: "",
    medical_history: [],
  });

  const handleOpenEdit = () => {
    setEditForm({
      full_name: user?.full_name || "",
      date_of_birth: user?.profile?.date_of_birth
        ? new Date(user.profile.date_of_birth).toISOString().split("T")[0]
        : "",
      gender: user?.profile?.gender || "",
      address: user?.profile?.address || "",
      blood_type: user?.profile?.blood_type || "",
      height: user?.profile?.height || "",
      weight: user?.profile?.weight || "",
      allergies: user?.profile?.allergies || "",
      medical_history: user?.profile?.medical_history || [],
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    try {
      const res = await updateVictimProfile({
        full_name: editForm.full_name,
        profile: {
          date_of_birth: editForm.date_of_birth || null,
          gender: editForm.gender || "",
          address: editForm.address || "",
          blood_type: editForm.blood_type || undefined,
          height: editForm.height ? Number(editForm.height) : null,
          weight: editForm.weight ? Number(editForm.weight) : null,
          allergies: editForm.allergies || "",
          medical_history: editForm.medical_history || [],
        },
      });
      if (res.data.success) {
        setUser(res.data.data);
        setShowEdit(false);
      }
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
    }
  };

  const [diseaseInput, setDiseaseInput] = useState("");

  const handleAddDisease = () => {
    const value = diseaseInput.trim();
    if (!value) return;
  
    if (editForm.medical_history.includes(value)) {
      setDiseaseInput("");
      return;
    }
  
    setEditForm({
      ...editForm,
      medical_history: [...editForm.medical_history, value]
    });
  
    setDiseaseInput("");
  };

  const removeTag = (tag) =>
    setEditForm((f) => ({
      ...f,
      medical_history: f.medical_history.filter((t) => t !== tag),
    }));

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (!fbUser) {
        setLoading(false);
        return;
      }
      try {
        const res = await getVictimProfile();
        if (res.data.success) {
          const d = res.data.data;
          setUser(d);
          setEditForm({
            full_name: d.full_name || "",
            date_of_birth: d.profile?.date_of_birth
              ? new Date(d.profile.date_of_birth).toISOString().split("T")[0]
              : "",
            gender: d.profile?.gender || "",
            address: d.profile?.address || "",
            blood_type: d.profile?.blood_type || "",
            height: d.profile?.height || "",
            weight: d.profile?.weight || "",
            allergies: d.profile?.allergies || "",
            medical_history: d.profile?.medical_history || [],
          });
          console.log("medical history:", d.profile?.medical_history);
        }
      } catch (err) {
        console.error("Fetch user error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", relation: "" });
  const [contactLoading, setContactLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  const handleAddContact = async () => {
    if (!contactForm.name || !contactForm.phone) return;
    setContactLoading(true);
    try {
      const res = await addEmergencyContact(contactForm);
      if (res.data.success) {
        setUser(res.data.data);                     
        setContactForm({ name: "", phone: "", relation: "" });
        setOpen(false);
      }
    } catch (err) {
      console.error("Add contact error:", err.response?.data || err.message);
    } finally {
      setContactLoading(false);
    }
  };

  const fileInputRef = useRef(null);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('userAvatar') || null);

  const handleSetAvatar = (url) => {
    if (url) {
      localStorage.setItem('userAvatar', url);
    } else {
      localStorage.removeItem('userAvatar');
    }
    setAvatar(url);
  };

  const [selectedContact, setSelectedContact] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutVictim = async () => {
    try {
      await logoutVictimFirebase();
    } finally {
      clearVictimProfile();
      setUser(null);
      navigate('/', { state: { toast: 'Đã đăng xuất' } });
    }
  };  

  return (
  <div className="h-screen overflow-hidden flex flex-col" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

    {/* HEADER */}
    <header className="bg-white border-b border-gray-100 w-full sticky top-0 z-30">
      <Header clearVictimProfile={clearVictimProfile} logoutVictimFirebase={logoutVictimFirebase} />
    </header>

    <div className="flex flex-1 overflow-hidden min-h-0">

      {/* SIDEBAR */}
      <aside className="w-52 bg-white border-r border-gray-100 hidden md:flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="px-5 py-5">
            <div className="text-emerald-700 font-bold text-base leading-tight">RescuePortal</div>
            <div className="text-[10px] text-emerald-500 font-semibold tracking-widest uppercase">Emergency Support</div>
          </div>
          <nav className="px-3 flex flex-col gap-0.5">
            {sidebarItems.map(({ label, icon, path }) => {
              const isActive = location.pathname === path;
              return (
                <div key={label} onClick={() => navigate(path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-500"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}>
                  <span className={isActive ? "text-emerald-600" : "text-gray-400"}>{icon}</span>
                  {label}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="px-3 pb-5 flex flex-col gap-0.5">
          <div 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 cursor-pointer hover:text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setShowSupportModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
            </svg>
            Hỗ trợ
          </div>
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 
              cursor-pointer hover:text-red-500 hover:bg-red-50 transition"
            onClick={async () => {
              setOpen(false);
              await handleLogoutVictim();
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Đăng xuất
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto" style={{ background: "rgb(244,251,244)" }}>
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-7">

          <h1 className="text-lg font-bold text-gray-700 mb-6 px-1 md:px-0">Hồ sơ cá nhân</h1>

          {/* Avatar card */}
          <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-50 mb-6 md:px-6 md:py-5 md:gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-2 ring-emerald-50 md:ring-2 md:ring-emerald-100">
                <img
                  src={getUserAvatarSrc({ profile: { avatar_url: avatar } })}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => handleSetAvatar(ev.target.result); 
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }
                }}/>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate md:text-2xl leading-tight">{user?.full_name || "—"}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                <svg className="w-4 h-4 text-[#10B981] md:text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.25 12 19.79 19.79 0 011.15 3.42 2 2 0 013.12 1.25h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.5a16 16 0 006.29 6.29l1.42-1.26a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121.5 16z"/>
                </svg>
                <span className="font-medium">{user?.phone || "—"}</span>
              </div>
            </div>
            <button onClick={handleOpenEdit}
              className="flex-shrink-0 border border-[#10B981] text-[#10B981] md:border-emerald-400 md:text-emerald-600 md:bg-[#ECFDF5] md:hover:bg-emerald-100 font-bold text-xs md:text-sm px-3 py-2 md:px-4 md:py-1 rounded-lg md:rounded-sm transition-all flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Chỉnh sửa
            </button>
          </div>

          {/* Responsive Layout Grid - Flattened for better order control */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

            {/* Thông tin cá nhân - Desktop Left Column Top */}
            <section className="md:col-span-3 order-1 px-1 md:px-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#ECFDF5] text-[#10B981] md:bg-green-100 md:text-[#047857] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-700 md:text-sm md:font-semibold md:text-gray-600">Thông tin cá nhân</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "HỌ TÊN", value: user?.full_name },
                  { label: "SỐ ĐIỆN THOẠI", value: user?.phone },
                  {
                    label: "NGÀY SINH",
                    value: user?.profile?.date_of_birth
                      ? new Date(user.profile.date_of_birth).toLocaleDateString("vi-VN") : "—"
                  },
                  { label: "GIỚI TÍNH", value: user?.profile?.gender || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 md:px-4 md:py-3 md:shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <p className="text-[10px] md:text-[9px] font-bold text-gray-400 tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-bold md:font-semibold text-gray-800">{value || "—"}</p>
                  </div>
                ))}
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-50 md:px-4 md:py-3 md:shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <p className="text-[10px] md:text-[9px] font-bold text-gray-400 tracking-wider mb-1">ĐỊA CHỈ</p>
                  <p className="text-sm font-bold md:font-semibold text-gray-800">{user?.profile?.address || "—"}</p>
                </div>
              </div>
            </section>

            {/* Liên hệ khẩn cấp - Desktop Right Column Top */}
            <section className="md:col-span-2 order-2 bg-[#FEF6F6] -mx-4 px-4 py-6 md:mx-0 md:bg-transparent md:p-0">
              <div className="flex items-center gap-2 mb-4 px-1 md:px-0">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center md:bg-transparent md:w-auto md:h-auto">
                  <img src={contactList} alt="contact" className="w-5 h-5 md:w-4 md:h-4"/>
                </div>
                <h3 className="text-base font-bold text-red-600 md:text-sm md:font-semibold md:text-gray-600">Liên hệ khẩn cấp</h3>
              </div>
              <div className="space-y-3">
                {user?.profile?.emergency_contacts?.map((contact, i) => (
                  <div key={i}
                    onClick={() => setSelectedContact({ ...contact, index: i })}
                    className="flex items-center justify-between p-4 md:p-3 rounded-2xl md:rounded-xl bg-white shadow-sm border border-transparent hover:border-red-100 md:hover:border-emerald-100 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-red-100 md:bg-transparent flex items-center justify-center text-red-600 font-bold">
                        <img src={contactIcon} alt="contact" className="w-full h-full rounded-full object-cover"/>
                      </div>
                      <div>
                        <p className="text-base md:text-sm font-bold md:font-semibold text-gray-800 leading-tight">{contact.name}</p>
                        <p className="text-sm md:text-xs text-[#10B981] md:text-emerald-600 font-bold md:font-medium mt-0.5">{contact.relation}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        window.location.href = `tel:${contact.phone}`;
                      }}
                      className="w-10 h-10 md:w-9 md:h-9 bg-red-600 md:bg-transparent rounded-lg flex items-center justify-center md:shadow-none shadow-md shadow-red-200 active:scale-95 transition">
                      <img src={call} alt="call" className="w-5 h-5 md:w-9 md:h-9"/>
                    </button>
                  </div>
                ))}

                <button onClick={() => setOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 md:py-3 text-sm font-bold md:font-medium text-gray-400 hover:text-emerald-600 border-2 md:border border-dashed border-gray-200 md:border-gray-300 hover:border-emerald-300 rounded-2xl md:rounded-xl bg-white/60 transition">
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Thêm liên hệ mới
                </button>
              </div>
            </section>

            {/* Thông tin y tế - Desktop Left Column Bottom */}
            <section className="md:col-span-3 order-4 md:order-none pb-10 md:pb-0">
              <div className="rounded-2xl border border-red-100 p-6 shadow-sm md:px-6 md:py-5" style={{ background: "#fff5f5" }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center md:w-7 md:h-7">
                    <img src={medicalIcon} alt="medical" className="w-5 h-5 md:w-4 md:h-4"/>
                  </div>
                  <h3 className="text-base font-bold text-red-600 md:text-sm md:font-semibold md:text-red-500">Thông tin y tế</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-6 md:flex md:gap-3 md:mb-5">
                  <div className="bg-white rounded-2xl p-3 shadow-sm border border-red-50 flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-3 md:px-4 md:py-3 md:flex-1 md:rounded-xl md:border-red-50">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2 md:mb-0 md:w-9 md:h-9 md:rounded-xl md:flex-shrink-0">
                      <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div className="md:block">
                      <p className="text-[9px] md:text-[8px] font-bold text-gray-400 mb-1 md:mb-0 md:tracking-widest">NHÓM MÁU</p>
                      <p className="text-lg md:text-lg font-black md:font-bold text-red-600 leading-tight">{user?.profile?.blood_type || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-3 shadow-sm border border-red-50 flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-3 md:px-4 md:py-3 md:flex-1 md:rounded-xl md:border-red-50">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2 md:mb-0 md:w-9 md:h-9 md:rounded-xl md:flex-shrink-0">
                      <svg className="w-5 h-5 md:w-4 md:h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 8v8M9 11l3-3 3 3"/>
                      </svg>
                    </div>
                    <div className="md:block">
                      <p className="text-[9px] md:text-[8px] font-bold text-gray-400 mb-1 md:mb-0 md:tracking-widest">CHIỀU CAO</p>
                      <p className="text-lg md:text-lg font-black md:font-bold text-gray-800 leading-tight">{user?.profile?.height ? `${user.profile.height} cm` : "—"}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3 shadow-sm border border-red-50 flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-3 md:px-4 md:py-3 md:flex-1 md:rounded-xl md:border-red-50">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 md:mb-0 md:w-9 md:h-9 md:rounded-xl md:flex-shrink-0">
                      <svg className="w-5 h-5 md:w-4 md:h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </div>
                    <div className="md:block">
                      <p className="text-[9px] md:text-[8px] font-bold text-gray-400 mb-1 md:mb-0 md:tracking-widest">CÂN NẶNG</p>
                      <p className="text-lg md:text-lg font-black md:font-bold text-gray-800 leading-tight">{user?.profile?.weight ? `${user.profile.weight} kg` : "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 px-1 md:px-0 md:space-y-4">
                  {(() => {
                    const list = user?.profile?.allergies
                      ? user.profile.allergies.split(",").map(s => s.trim()).filter(Boolean)
                      : [];
                    return (
                      <div>
                        <p className="text-[10px] md:text-[9px] font-bold text-gray-400 tracking-wider mb-2 uppercase">Dị ứng</p>
                        <div className="flex flex-wrap gap-2">
                          {list.length > 0 ? list.map((a) => (
                            <span key={a} className="text-xs font-bold md:font-medium px-4 py-2 md:px-3 md:py-1 bg-white border border-gray-200 rounded-lg md:rounded-full text-gray-700 md:text-gray-600">{a}</span>
                          )) : <span className="text-sm text-gray-400 italic">Không có dữ liệu</span>}
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <p className="text-[10px] md:text-[9px] font-bold text-red-400 tracking-wider mb-2 uppercase">Bệnh nền quan trọng</p>
                    <div className="flex flex-wrap gap-2">
                      {(user?.profile?.medical_history || []).length > 0 ? (user?.profile?.medical_history || []).map((b) => (
                        <span key={b} className="inline-flex items-center gap-1.5 text-xs font-black md:font-semibold px-4 py-2 md:px-3 md:py-1.5 bg-red-600 text-white rounded-lg md:rounded-full shadow-sm md:shadow-none">
                          <svg className="w-3.5 h-3.5 md:w-3 md:h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          {b.toUpperCase()}
                        </span>
                      )) : <span className="text-sm text-gray-400 italic">Không có dữ liệu</span>}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Security notice card - Desktop Right Column Bottom */}
            <section className="md:col-span-2 order-3 md:order-none px-4 md:px-0">
              <div className="rounded-2xl p-5 bg-[#121914] md:bg-[#162118] text-white">
                <div className="w-10 h-10 md:w-8 md:h-8 rounded-xl bg-white/5 md:bg-white/10 border border-white/10 flex items-center justify-center mb-4 md:mb-3">
                  <svg className="w-5 h-5 md:w-4 md:h-4 text-[#10B981] md:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed font-medium md:font-normal">
                  Dữ liệu y tế của bạn được mã hoá đầu cuối và chỉ chia sẻ với đội cứu hộ trong tình huống khẩn cấp.
                </p>
                <button className="mt-3 text-sm md:text-xs text-[#10B981] md:text-emerald-400 font-bold md:font-semibold hover:underline md:hover:text-emerald-300 transition">
                  Tìm hiểu thêm →
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

    {/* ── POPUP XEM CHI TIẾT LIÊN HỆ ── */}
    {selectedContact && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        onClick={() => setSelectedContact(null)}>
        <div className="w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="bg-gradient-to-r from-[#275F13] to-[#1C6E1B] px-5 py-5 flex items-center gap-4">
            <img src={contactIcon} alt="contact" className="w-14 h-14 rounded-full object-cover border-2 border-white/40"/>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight">{selectedContact.name}</p>
              <p className="text-emerald-100 text-xs font-medium mt-0.5">{selectedContact.relation}</p>
            </div>
            <button onClick={() => setSelectedContact(null)} className="text-white/70 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Info */}
          <div className="px-5 py-5">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.25 12 19.79 19.79 0 011.15 3.42 2 2 0 013.12 1.25h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.5a16 16 0 006.29 6.29l1.42-1.26a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121.5 16z"/>
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 tracking-widest">SỐ ĐIỆN THOẠI</p>
                <p className="text-sm font-semibold text-gray-800">{selectedContact.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 tracking-widest">MỐI QUAN HỆ</p>
                <p className="text-sm font-semibold text-gray-800">{selectedContact.relation || "—"}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={() => { window.location.href = `tel:${selectedContact.phone}`; }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1C6E1B] hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition">
              <img src={call} alt="call" className="w-5 h-5 mt-1"/>
              Gọi ngay
            </button>
            <button
              onClick={() => {
                setContactToDelete(selectedContact);
                setShowConfirm(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold text-sm transition border border-red-100"
            >
              Xoá liên hệ
            </button>
          </div>
        </div>
      </div>
    )}

    {/* CONFIRM XOÁ LIÊN HỆ */}
    {showConfirm && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Xác nhận xoá</h3>
          <p className="text-sm text-gray-600 mb-5">
            Bạn có chắc muốn xoá liên hệ{" "}
            <span className="font-semibold text-red-500">"{contactToDelete?.name}"</span>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 rounded-xl border text-gray-600 hover:bg-gray-100">
              Huỷ
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await deleteEmergencyContact(contactToDelete.index);
                  if (res.data.success) {
                    setUser(res.data.data);
                    setSelectedContact(null);
                    setShowConfirm(false);
                  }
                } catch (err) {
                  console.error("Delete contact error:", err.response?.data || err.message);
                }
              }}
              className="flex-1 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600">
              Xoá
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal thêm liên hệ */}
    {open && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="px-4 py-1.5 bg-[#B7141B] text-white rounded-full text-sm font-semibold">
              Thêm liên hệ khẩn cấp
            </span>
            <button onClick={() => { setOpen(false); setContactForm({ name: "", phone: "", relation: "" }); }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>
          <hr className="mb-4"/>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Họ và tên</label>
              <input type="text" placeholder="Nhập tên người liên hệ"
                className="w-full mt-1 p-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-red-200 text-sm"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
              <input type="text" placeholder="Nhập số điện thoại"
                className="w-full mt-1 p-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-red-200 text-sm"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mối quan hệ</label>
              <div className="relative mt-1">
                <button
                  type="button"
                  onClick={() => setShowRelDropdown(!showRelDropdown)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-red-200 text-sm transition-all text-left"
                >
                  <span className={contactForm.relation ? "text-gray-800 font-medium" : "text-gray-400"}>
                    {contactForm.relation || "Chọn mối quan hệ"}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showRelDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {showRelDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[60] overflow-hidden animate-in fade-in zoom-in duration-200">
                    {["Bố", "Mẹ", "Vợ/Chồng", "Anh/Chị/Em", "Bạn bè", "Khác"].map((rel) => (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => {
                          setContactForm({ ...contactForm, relation: rel });
                          setShowRelDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-sm text-left hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors ${
                          contactForm.relation === rel ? "text-red-600 font-bold bg-red-50/30" : "text-gray-600"
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleAddContact}
              disabled={contactLoading || !contactForm.name || !contactForm.phone}
              className="flex-1 py-3 bg-[#B7141B] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition text-sm">
              {contactLoading ? "Đang lưu..." : "Thêm liên hệ"}
            </button>
            <button onClick={() => { setOpen(false); setContactForm({ name: "", phone: "", relation: "" }); }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition">
              Hủy
            </button>
          </div>
        </div>
      </div>
    )}

    {/* EDIT MODAL */}
    {showEdit && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={() => setShowEdit(false)}>
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-bold text-gray-900 text-lg">Chỉnh sửa hồ sơ</h3>
            <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Thông tin cá nhân</span>
              <div className="flex-1 h-px bg-emerald-100"/>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Họ và tên</label>
              <input className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-gray-50"
                value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ngày sinh</label>
                <input type="date" className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-gray-50"
                  value={editForm.date_of_birth} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}/>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Giới tính</label>
                <select className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-gray-50"
                  value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                  <option value="">Chọn...</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ</label>
              <textarea rows={2} className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 bg-gray-50 resize-none"
                value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}/>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Thông tin y tế</span>
              <div className="flex-1 h-px bg-red-100"/>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Nhóm máu</label>
              <div className="flex gap-2">
                {["A", "B", "AB", "O"].map((bt) => (
                  <button key={bt} onClick={() => setEditForm({ ...editForm, blood_type: bt })}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition ${
                      editForm.blood_type === bt ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                    }`}>{bt}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Chiều cao (cm)</label>
                <input type="number" className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 bg-gray-50"
                  value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}/>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cân nặng (kg)</label>
                <input type="number" className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 bg-gray-50"
                  value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}/>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Dị ứng</label>
              <input className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 bg-gray-50"
                placeholder="VD: Tôm, Cá biển... (phân cách bằng dấu phẩy)"
                value={editForm.allergies} onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}/>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Bệnh nền</label>
              <div className="mt-1 flex flex-wrap gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[44px] cursor-text"
                onClick={() => document.getElementById("tagInputEl").focus()}>
                {editForm.medical_history.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700">
                    {tag}
                    <button className="text-red-400 hover:text-red-600 leading-none ml-0.5" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
                <input id="tagInputEl" type="text" placeholder="Nhập bệnh và nhấn Enter"
                  value={diseaseInput} onChange={(e) => setDiseaseInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDisease(); } }}
                  className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"/>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
            <button onClick={handleSave}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition text-sm">
              Lưu thay đổi
            </button>
            <button onClick={() => setShowEdit(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition text-sm">
              Hủy
            </button>
          </div>
        </div>
      </div>
    )}

    {/* SUPPORT MODAL (Nạn nhân) */}
    {showSupportModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] p-4" onClick={() => setShowSupportModal(false)} style={{ zIndex: 999999 }}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Hướng dẫn sử dụng</h3>
            <button onClick={() => setShowSupportModal(false)} className="text-white/80 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">1</span> 
                Trang chủ (Gửi SOS)
              </h4>
              <p className="text-xs text-gray-600 pl-8 leading-relaxed">Nhấn nút SOS khẩn cấp khi gặp sự cố. Hệ thống sẽ tự động xác định vị trí và phân phối tín hiệu đến đội cứu hộ gần nhất.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">2</span> 
                Thông tin cá nhân
              </h4>
              <p className="text-xs text-gray-600 pl-8 leading-relaxed">Nơi bạn cập nhật hồ sơ y tế (bệnh nền, dị ứng, nhóm máu) và liên hệ khẩn cấp. Dữ liệu này giúp cứu hộ phản ứng hiệu quả hơn.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">3</span> 
                Lịch sử cứu trợ
              </h4>
              <p className="text-xs text-gray-600 pl-8 leading-relaxed">Xem lại danh sách các tình huống khẩn cấp bạn đã tạo, đánh giá và theo dõi trạng thái xử lý.</p>
            </div>
          </div>
          <div className="px-6 pb-6 pt-2">
            <button onClick={() => setShowSupportModal(false)} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition">Đã hiểu</button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}