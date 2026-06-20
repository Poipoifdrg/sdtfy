import React, { useState, useEffect } from "react";
import { 
  X, Settings, Users, Wallet, ClipboardList, MessageSquare, 
  Search, ShieldAlert, ArrowLeftRight, UserPlus, FileEdit, Check, AlertTriangle, Trash2, Send
} from "lucide-react";
import { 
  User, SystemSettings, PromotionSlide, DepositRecord, 
  WithdrawalRecord, ChatRoom, OrderItem, ChatMessage 
} from "../types";

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
  primaryColor: string;
  onRefreshSettings: () => void;
}

export default function AdminPanel({
  currentUser,
  onClose,
  primaryColor,
  onRefreshSettings
}: AdminPanelProps) {
  // Navigation
  const [activeMenu, setActiveMenu] = useState<string>("settings"); // settings, finance, users, admin-mgmt, trades, chat-admin

  // Site Settings States
  const [siteSettings, setSiteSettings] = useState<SystemSettings | null>(null);
  const [siteTitle, setSiteTitle] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [slides, setSlides] = useState<PromotionSlide[]>([]);
  const [newSlideImg, setNewSlideImg] = useState<string>("");
  const [newSlideCaption, setNewSlideCaption] = useState<string>("");

  // Users States
  const [users, setUsers] = useState<User[]>([]);
  const [searchUser, setSearchUser] = useState<string>("");
  const [newUserOpen, setNewUserOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserPhone, setNewUserPhone] = useState<string>("");
  const [newUserPwd, setNewUserPwd] = useState<string>("");
  const [editUserTarget, setEditUserTarget] = useState<User | null>(null);

  // Finance States
  const [depositList, setDepositList] = useState<DepositRecord[]>([]);
  const [withdrawalList, setWithdrawalList] = useState<WithdrawalRecord[]>([]);
  const [searchFinPhone, setSearchFinPhone] = useState<string>("");
  const [depositPhoneInput, setDepositPhoneInput] = useState<string>("");
  const [depositAmountInput, setDepositAmountInput] = useState<string>("");
  const [depositNoteInput, setDepositNoteInput] = useState<string>("");
  const [deductPhoneInput, setDeductPhoneInput] = useState<string>("");
  const [deductAmountInput, setDeductAmountInput] = useState<string>("");
  const [deductNoteInput, setDeductNoteInput] = useState<string>("");
  const [withdrawNoteInput, setWithdrawNoteInput] = useState<Record<string, string>>({});

  // Admin management list (Super settings)
  const [newAdminPhone, setNewAdminPhone] = useState<string>("");
  const [newAdminName, setNewAdminName] = useState<string>("");
  const [newAdminPwd, setNewAdminPwd] = useState<string>("");
  const [superPhoneInput, setSuperPhoneInput] = useState<string>("");
  const [superPwdInput, setSuperPwdInput] = useState<string>("");
  const [superNameInput, setSuperNameInput] = useState<string>("");

  // Trade logs
  const [tradeLogs, setTradeLogs] = useState<OrderItem[]>([]);
  const [searchTradePhone, setSearchTradePhone] = useState<string>("");

  // Chat Admin States
  const [chatRoomsList, setChatRoomsList] = useState<ChatRoom[]>([]);
  const [selectedChatPhone, setSelectedChatPhone] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>("");

  // Feedback notifications
  const [successToast, setSuccessToast] = useState<string>("");
  const [errorToast, setErrorToast] = useState<string>("");

  // Palette of 100 Colors
  const colorsPalette = [
    "#0284c7", "#0ea5e9", "#2563eb", "#3b82f6", "#1d4ed8", "#4f46e5", "#6366f1", "#4338ca", "#581c87", "#7c3aed",
    "#8b5cf6", "#a855f7", "#c084fc", "#d946ef", "#db2777", "#ec4899", "#f43f5e", "#e11d48", "#be123c", "#9f1239",
    "#dc2626", "#ef4444", "#f87171", "#f97316", "#ea580c", "#ffedd5", "#b45309", "#d97706", "#eab308", "#facc15",
    "#eab308", "#ca8a04", "#854d0e", "#16a34a", "#22c55e", "#4ade80", "#15803d", "#14532d", "#10b981", "#059669",
    "#047857", "#064e3b", "#0d9488", "#14b8a6", "#2dd4bf", "#115e59", "#0891b2", "#06b6d4", "#22d3ee", "#155e75",
    "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#78879f", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9",
    "#5c2d91", "#13a10e", "#ff8c00", "#e60012", "#006400", "#800000", "#008080", "#000080", "#808000", "#800080",
    "#4682b4", "#5f9ea0", "#6495ed", "#7b68ee", "#b0c4de", "#afeeee", "#1e90ff", "#3949ab", "#283593", "#1a237e",
    "#311b92", "#4a148c", "#880e4f", "#b71c1c", "#4e342e", "#3e2723", "#1b5e20", "#004d40", "#01579b", "#acb334",
    "#c62828", "#ad1457", "#6a1b9a", "#4527a0", "#283593", "#1565c0", "#00838f", "#00695c", "#2e7d32", "#111111"
  ];

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };
  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(""), 3000);
  };

  // 1. Fetch site settings & Admin contents
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSiteSettings(data);
      setSiteTitle(data.siteTitle);
      setLogoUrl(data.logoUrl);
      setSelectedColor(data.primaryColor);
      setSlides(data.promotionSlides || []);
    } catch {
      showError("ไม่สามารถดึงข้อมูลตั้งค่าระบบได้");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch {
      showError("โหลดรายชื่อผู้ใช้ล้มเหลว");
    }
  };

  const fetchFinance = async () => {
    try {
      const resDep = await fetch("/api/admin/finance/deposits");
      const depData = await resDep.json();
      setDepositList(depData);

      const resWith = await fetch("/api/admin/finance/withdrawals");
      const withData = await resWith.json();
      setWithdrawalList(withData);
    } catch {
      showError("โหลดประวัติการฝากถอนล้มเหลว");
    }
  };

  const fetchTrades = async () => {
    try {
      const res = await fetch("/api/admin/logs/trades");
      const data = await res.json();
      setTradeLogs(data);
    } catch {
      showError("โหลดประวัติการซื้อขายล้มเหลว");
    }
  };

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/admin/chats");
      const data = await res.json();
      setChatRoomsList(data);
    } catch {
      showError("โหลดห้องแชตล้มเหลว");
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchFinance();
    fetchTrades();
    fetchChats();

    // Setup chat polling inside admin interface
    const chatInterval = setInterval(() => {
      fetchChats();
      if (selectedChatPhone) {
        fetchChatMessages(selectedChatPhone);
      }
    }, 2000);

    return () => clearInterval(chatInterval);
  }, [selectedChatPhone]);

  const [activeChatRoom, setActiveChatRoom] = useState<ChatRoom | null>(null);
  const fetchChatMessages = async (phone: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${phone}`);
      if (res.ok) {
        const data = await res.json();
        setActiveChatRoom(data);
      }
    } catch {}
  };

  // 2. Action: Save Site Settings (Title, Logo, Color)
  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteTitle,
          logoUrl,
          primaryColor: selectedColor,
          promotionSlides: slides
        })
      });
      if (response.ok) {
        showSuccess("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว แฟลตฟอร์มเปลี่ยนสีคุมโทนทันที!");
        onRefreshSettings();
        document.documentElement.style.setProperty('--primary-color', selectedColor);
      } else {
        showError("เกิดข้อผิดพลาดในการเซฟ");
      }
    } catch {
      showError("เกิดข้อผิดพลาดในการอัปเดตเซตติ้ง");
    }
  };

  // Slide carousel controls
  const handleAddSlide = () => {
    if (!newSlideImg) return showError("กรุณาเลือกรูปสไลด์โปรโมชั่น");
    const item: PromotionSlide = {
      id: "slide_" + Math.random().toString(36).substr(2, 9),
      imageUrl: newSlideImg,
      caption: newSlideCaption || "โปรโมชั่นเด็ดจาก MiTrade"
    };

    const updated = [...slides, item];
    setSlides(updated);
    setNewSlideImg("");
    setNewSlideCaption("");
    showSuccess("เพิ่มรูปสไลด์ สำรองกดปุ่มเซฟเพื่อบันทึก");
  };

  const handleDeleteSlide = (id: string) => {
    const updated = slides.filter(s => s.id !== id);
    setSlides(updated);
    showSuccess("ลบรูปสลับ สำรองกดปุ่มเซฟเพื่อบันทึก");
  };

  // 3. Action: Create User Directly
  const handleCreateUserDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserPhone || !newUserPwd) {
      return showError("กรุณากรอกข้อมูลสมัครสมาชิกใหม่ให้ครบ");
    }
    if (newUserPhone.length !== 10) {
      return showError("เบอร์โทรศัพท์ยูสเซอร์ต้องมี 10 หลัก");
    }

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          phone: newUserPhone,
          password: newUserPwd
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess(`สร้างบัญชียูสเซอร์ ${newUserName} สำเร็จ!`);
      setNewUserName("");
      setNewUserPhone("");
      setNewUserPwd("");
      setNewUserOpen(false);
      fetchUsers();
    } catch (err: any) {
      showError(err.message || "สมัครสมาชิกล้มเหลว");
    }
  };

  // 4. Action: Save Edited User profile completely
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserTarget) return;

    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUserTarget)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess(`เซฟข้อมูลยูสเซอร์ ${editUserTarget.username} เรียบร้อย`);
      setEditUserTarget(null);
      fetchUsers();
    } catch (err: any) {
      showError(err.message || "ปรับปรุงข้อมูลยูสเซอร์ล้มเหลว");
    }
  };

  // 5. Action: Suspend / Ban User accounts
  const handleUpdateUserStatus = async (id: string, status: 'active' | 'frozen' | 'banned') => {
    try {
      const response = await fetch("/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (response.ok) {
        showSuccess(`ปรับเปลี่ยนสถานะผู้ใช้เป็น: ${status === "active" ? "ปกติ" : status === "frozen" ? "อายัดบัญชี" : "แบนตลอดชีพ"}`);
        fetchUsers();
      }
    } catch {
      showError("เปลี่ยนสถานะยูสเซอร์ล้มเหลว");
    }
  };

  // 6. Action: Inject Deposits cash manual
  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositPhoneInput || !depositAmountInput) {
      return showError("กรุณากรอกเบอร์โทรและระบุจำนวนเงินที่ต้องการเติม");
    }

    try {
      const response = await fetch("/api/admin/finance/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: depositPhoneInput,
          amount: parseFloat(depositAmountInput),
          note: depositNoteInput || "เติมเงินผ่านระบบจัดการหลังบ้านแอดมิน"
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess(`เติมเงินให้เบอร์โทร ${depositPhoneInput} จำนวน ฿${parseFloat(depositAmountInput).toLocaleString()} เรียบร้อยแล้ว`);
      setDepositPhoneInput("");
      setDepositAmountInput("");
      setDepositNoteInput("");
      fetchFinance();
      fetchUsers();
    } catch (err: any) {
      showError(err.message || "เพิ่มเงินเข้าระบบล้มเหลว");
    }
  };

  const handleManualDeduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductPhoneInput || !deductAmountInput) {
      return showError("กรุณากรอกเบอร์โทรและระบุจำนวนเงินที่ต้องการลบออก");
    }

    try {
      const response = await fetch("/api/admin/finance/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: deductPhoneInput,
          amount: parseFloat(deductAmountInput),
          note: deductNoteInput || "แอดมินหักยอดเงินโดยตรงผ่านระบบ"
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess(`ลดยอดเงินเบอร์โทร ${deductPhoneInput} จำนวน ฿${parseFloat(deductAmountInput).toLocaleString()} เรียบร้อยแล้ว`);
      setDeductPhoneInput("");
      setDeductAmountInput("");
      setDeductNoteInput("");
      fetchFinance();
      fetchUsers();
    } catch (err: any) {
      showError(err.message || "หักเงินจากระบบล้มเหลว");
    }
  };

  // 7. Action: Approve/Reject withdrawal requests
  const handleWithApproval = async (recordId: string, decision: 'approve' | 'reject') => {
    const note = withdrawNoteInput[recordId] || "";

    try {
      const response = await fetch("/api/admin/finance/approve-withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, decision, note })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess(`${decision === 'approve' ? 'อนุมัติการถอนถอน' : 'ปฏิเสธคำขอการถอนถอน'} และอัปเดตประวัติการเงินเรียบร้อย`);
      fetchFinance();
      fetchUsers();
    } catch (err: any) {
      showError(err.message || "จัดการคำถอนเงินล้มเหลว");
    }
  };

  // 8. Action: Admin to User responses typing (Live chat support)
  const handleAdminChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatPhone) return;

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhone: selectedChatPhone,
          senderId: "admin",
          senderName: currentUser.username || "แอดมิน MiTrade",
          text: adminReplyText,
          isFromAdmin: true
        })
      });

      if (response.ok) {
        setAdminReplyText("");
        fetchChatMessages(selectedChatPhone);
        fetchChats();
      }
    } catch {
      showError("ส่งแชตตอบกลับล้มเหลว");
    }
  };

  // 9. Action: Super Admin credentials updating and sub admins creation
  const handleSelfAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!superPhoneInput && !superPwdInput && !superNameInput) {
      return showError("กรุณาระบุข้อมูลที่ต้องการแก้ไขของแอดมินสูงสุด");
    }

    try {
      const response = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-super",
          newPhone: superPhoneInput || undefined,
          newPassword: superPwdInput || undefined,
          newUsername: superNameInput || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess("อัปเดตข้อมูลบัญชีแอดมินสูงสุดเรียบร้อย!");
      setSuperPhoneInput("");
      setSuperPwdInput("");
      setSuperNameInput("");
      fetchUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminPhone || !newAdminPwd) {
      return showError("โปรดกรอกรายละเอียดแอดมินผู้ช่วยให้ครบครัน");
    }

    try {
      const response = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-sub",
          newPhone: newAdminPhone,
          newUsername: newAdminName,
          newPassword: newAdminPwd
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess(`แต่งตั้งผู้ช่วยแอดมิน: ${newAdminName} สำเร็จ`);
      setNewAdminName("");
      setNewAdminPhone("");
      setNewAdminPwd("");
      fetchUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleDeleteSubAdmin = async (phone: string) => {
    if (!window.confirm("คุณเบอร์โทรต้องการถอดถอนผู้ช่วยแอดมินรายนี้ใช่หรือไม่?")) return;

    try {
      const response = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-sub",
          targetPhone: phone
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showSuccess("ถอดถอนผู้ช่วยแอดมินพ้นจากตำแหน่งแล้ว");
      fetchUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Filters helpers
  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.phone.includes(searchUser) || 
    u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredDeposits = depositList.filter(d => d.phone.includes(searchFinPhone));
  const filteredWithdrawals = withdrawalList.filter(w => w.phone.includes(searchFinPhone));
  const filteredTrades = tradeLogs.filter(t => t.phone.includes(searchTradePhone) || t.stockSymbol.toLowerCase().includes(searchTradePhone.toLowerCase()));

  return (
    <div 
      id="admin-dashboard-root"
      className="absolute inset-0 z-50 bg-slate-100 flex flex-col w-full h-full text-slate-800 font-sans"
    >
      {/* Top Controls Nav */}
      <div 
        id="admin-dashboard-header"
        className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-rose-400" />
          <div>
            <h2 className="text-sm font-bold leading-tight">แผงจัดการหลังบ้าน</h2>
            <p className="text-[10px] text-slate-400">ควบคุมและตั้งค่าเซิร์ฟเวอร์ระบบรวม</p>
          </div>
        </div>
        <button 
          id="btn-close-admin-dashboard"
          onClick={onClose} 
          className="p-1 hover:bg-white/10 rounded-full cursor-pointer text-slate-300 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Admin Menu Tabs */}
      <div 
        id="admin-tabs"
        className="flex items-center gap-1 bg-white border-b border-slate-200 p-1 overflow-x-auto shrink-0 scrollbar-none"
      >
        {[
          { id: "settings", label: "ตั้งค่าเว็บ", icon: Settings },
          { id: "users", label: "สมาชิก", icon: Users },
          { id: "finance", label: "การเงิน", icon: Wallet },
          { id: "trades", label: "ประวัติเทรด", icon: ClipboardList },
          { id: "chat-admin", label: "กล่องแชต", icon: MessageSquare },
          { id: "admin-mgmt", label: "ดูแลผู้ดูแล", icon: ShieldAlert },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeMenu === tab.id;
          return (
            <button
              id={`tab-admin-${tab.id}`}
              key={tab.id}
              onClick={() => {
                setActiveMenu(tab.id);
                setSelectedChatPhone(null);
                setActiveChatRoom(null);
              }}
              className={`flex items-center gap-1 shrink-0 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isSelected 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Viewport contents */}
      <div id="admin-viewport" className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
        
        {/* VIEW 1: Site settings & Palette */}
        {activeMenu === "settings" && (
          <div id="admin-settings-subview" className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200/50 space-y-4">
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">แอนท์มีธีมการคุมโทนและอัตลักษณ์</h3>

              {/* Site Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">ชื่อเว็บไซต์โบรกเกอร์ (ส่งผลต่อทุกหน้า):</label>
                <input 
                  id="admin-site-title-input"
                  type="text" 
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-250 font-bold focus:ring-1 focus:ring-slate-400 text-xs"
                />
              </div>

              {/* Site Logo Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">อัปโหลดรูปภาพโลโก้เว็บไซต์ (จากเครื่องคอมพิวเตอร์/ไฟล์มือถือ):</label>
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Preview" className="w-12 h-12 rounded-xl object-contain border bg-white shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">ไม่มีโลโก้</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <input 
                      id="admin-site-logo-input-file"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                    />
                    {logoUrl && (
                      <button 
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="text-[10px] text-rose-500 hover:underline mt-1 font-bold block"
                      >
                        ลบโลโกปัจจุบัน
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 100 HTML color selector code */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">จานจุ่มสีเมคหลัก (เลือกจาก 100 เฉดสีเว็บ):</label>
                <div 
                  id="color-picker-grid"
                  className="grid grid-cols-10 gap-1.5 max-h-[140px] overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200"
                >
                  {colorsPalette.map((col, index) => {
                    const isPicked = selectedColor.toLowerCase() === col.toLowerCase();
                    return (
                      <button
                        id={`btn-palette-color-${index}`}
                        key={index}
                        title={col}
                        onClick={() => setSelectedColor(col)}
                        style={{ backgroundColor: col }}
                        type="button"
                        className="w-6 h-6 rounded-full flex items-center justify-center border border-black/10 active:scale-90 transition-transform cursor-pointer relative"
                      >
                        {isPicked && <Check size={10} className="text-white drop-shadow-md font-bold" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-slate-600">รหัสรหัสสีที่เลือก:</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border bg-white" style={{ color: selectedColor }}>{selectedColor}</span>
                </div>
              </div>

              <button
                id="btn-save-site-settings"
                onClick={handleSaveSettings}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                บันทึกการตั้งค่าทั้งหมด
              </button>
            </div>

            {/* Slides Promotions Panel */}
            <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 space-y-4">
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">แผงรูปภาพสไลด์แบนเนอร์เด่น</h3>
              
              <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600 block">เพิ่มแบนเนอร์ใหม่ (อัปโหลดรูปจากเครื่อง):</span>
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 text-left">
                  {newSlideImg ? (
                    <img src={newSlideImg} alt="New Banner Preview" className="w-12 h-10 rounded-lg object-cover border bg-slate-50 shrink-0" />
                  ) : (
                    <div className="w-12 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-[9px] text-slate-400 font-bold shrink-0">ไม่มีแบนเนอร์</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <input 
                      id="admin-new-slide-image-file"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewSlideImg(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                    />
                    {newSlideImg && (
                      <button 
                        type="button"
                        onClick={() => setNewSlideImg("")}
                        className="text-[10px] text-rose-500 hover:underline mt-1 font-bold block"
                      >
                        ล้างรูปที่เลือก
                      </button>
                    )}
                  </div>
                </div>
                <input 
                  id="admin-new-slide-caption"
                  type="text" 
                  placeholder="คำพาดหัวโปรโมชั่นหลัก..." 
                  value={newSlideCaption}
                  onChange={(e) => setNewSlideCaption(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                />
                <button
                  id="btn-add-carousel-slide"
                  onClick={handleAddSlide}
                  className="w-full py-2.5 bg-sky-550 text-white bg-sky-600 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  เพิ่มเข้าสู่ตารางด้านล่าง
                </button>
              </div>

              {/* Slide rows */}
              <div id="slides-list" className="space-y-2">
                <span className="text-xs font-bold text-slate-500">ตารางแบนเนอร์ที่ทำงานดักหน้าเว็ย:</span>
                {slides.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">ยังไม่มีแบนเนอร์โปรโมชั่น</p>
                ) : (
                  slides.map((s) => (
                    <div key={s.id} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 justify-between">
                      <img src={s.imageUrl} alt="Slide Preview" className="w-12 h-10 rounded-lg object-cover" />
                      <div className="flex-1 text-left min-w-0 pr-2">
                        <p className="text-[10px] font-bold text-slate-800 line-clamp-1">{s.caption}</p>
                        <span className="text-[8px] font-mono text-slate-400 block truncate">{s.imageUrl}</span>
                      </div>
                      <button 
                        id={`btn-delete-slide-${s.id}`}
                        onClick={() => handleDeleteSlide(s.id)}
                        className="p-1 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3.0 border border-slate-900 hover:bg-slate-50 text-slate-900 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                กดเซฟเพื่อบันทึกสไลด์
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Users Management */}
        {activeMenu === "users" && (
          <div id="admin-users-subview" className="space-y-4 animate-fade-in">
            {/* Search and direct registration button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-search-users-input"
                  type="text"
                  placeholder="ค้นหาลูกค้าด้วย เบอร์โทร หรือ ID..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-4 py-3.0 bg-white border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-slate-305 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <button
                id="btn-open-create-user-modal"
                onClick={() => setNewUserOpen(!newUserOpen)}
                className="bg-slate-900 text-white px-3 py-3 rounded-2xl hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold shrink-0 cursor-pointer"
              >
                <UserPlus size={14} />
                <span>สมัครสมาชิก</span>
              </button>
            </div>

            {/* Direct registration drawer */}
            {newUserOpen && (
              <form 
                id="admin-create-user-form"
                onSubmit={handleCreateUserDirect} 
                className="bg-slate-900 text-white rounded-3xl p-4 shadow-lg space-y-3 animate-slide-up"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300">สมัครสมาชิกด่วนแอดมินสร้างให้</span>
                  <button type="button" onClick={() => setNewUserOpen(false)} className="text-slate-400 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  <input
                    id="admin-new-user-name"
                    type="text"
                    placeholder="ชื่อชื่อเล่นผู้ใช้งาน..."
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="bg-slate-850 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs w-full text-white"
                  />
                  <input
                    id="admin-new-user-phone"
                    type="text"
                    maxLength={10}
                    placeholder="เบอร์โทรสมัครรับ (10 หลักเท่านั้น)..."
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="bg-slate-850 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs w-full text-white"
                  />
                  <input
                    id="admin-new-user-password"
                    type="passowrd"
                    placeholder="รหัสผ่านเข้าสู่ระบบ (8 ตัวขึ้นไป)..."
                    value={newUserPwd}
                    onChange={(e) => setNewUserPwd(e.target.value)}
                    className="bg-slate-850 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs w-full text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-550 bg-blue-600 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  ยืนยันการตั้งบัญชี
                </button>
              </form>
            )}

            {/* Editing Targets overrides pop */}
            {editUserTarget && (
              <form 
                id="admin-edit-user-form"
                onSubmit={handleSaveUserEdit} 
                className="bg-white border-2 border-slate-900 rounded-3xl p-4 shadow-xl space-y-3 animate-slide-up"
              >
                <h4 className="font-bold text-xs text-slate-600 border-b pb-2">แก้ไขข้อมูลและจัดการสิทธิ์: {editUserTarget.username}</h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">ชื่อผู้ใช้ / นามสมมุติ:</label>
                    <input 
                      id="edit-user-username"
                      type="text" 
                      value={editUserTarget.username} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, username: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">เบอร์โทรศัพท์ (ล็อกอินหลัก):</label>
                    <input 
                      id="edit-user-phone"
                      type="text" 
                      value={editUserTarget.phone} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">รหัสผ่านทางระบบ:</label>
                    <input 
                      id="edit-user-login-pwd"
                      type="text" 
                      value={editUserTarget.loginPassword || ""} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, loginPassword: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">รหัสยืนยันธุรกรรม (Tx Pwd):</label>
                    <input 
                      id="edit-user-tx-pwd"
                      type="text" 
                      value={editUserTarget.txPassword || ""} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, txPassword: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">ชื่อ-นามสกุลจริงผู้เล่น:</label>
                    <input 
                      id="edit-user-realname"
                      type="text" 
                      value={editUserTarget.realName || ""} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, realName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">ธนาคาร:</label>
                    <input 
                      id="edit-user-bankname"
                      type="text" 
                      value={editUserTarget.bankName || ""} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, bankName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 font-mono">เลขที่บัญชีธนาคารผู้ใช้:</label>
                    <input 
                      id="edit-user-bank-account"
                      type="text" 
                      value={editUserTarget.bankAccountNum || ""} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, bankAccountNum: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">ระดับเลเวล VIP (1 - 5):</label>
                    <select 
                      id="edit-user-vip"
                      value={editUserTarget.vipLevel}
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, vipLevel: parseInt(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5 text-xs bg-white"
                    >
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>VIP {v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">ยอดบาลานซ์ (THB):</label>
                    <input 
                      id="edit-user-balance"
                      type="number" 
                      step="0.01"
                      value={editUserTarget.balance} 
                      onChange={(e) => setEditUserTarget({ ...editUserTarget, balance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 border rounded-lg mt-0.5 font-bold font-mono text-emerald-600" 
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    id="btn-save-user-edit"
                    type="submit" 
                    className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-xs font-bold cursor-pointer"
                  >
                    กดอัปเดตข้อมูล
                  </button>
                  <button 
                    id="btn-cancel-user-edit"
                    type="button" 
                    onClick={() => setEditUserTarget(null)} 
                    className="flex-1 border text-slate-500 rounded-xl py-2.5 text-xs font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            )}

            {/* List user directories accounts cards list */}
            <div id="users-directory-list" className="space-y-2">
              <span className="text-xs font-bold text-slate-500">บัญชีลูกค้าทั้งหมดในระบบ ({filteredUsers.length}):</span>
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border text-slate-400 text-xs">ไม่พบเบอร์โทรคีย์นี้ในเซิร์ฟเวอร์</div>
              ) : (
                filteredUsers.map((user) => (
                  <div 
                    id={`user-card-${user.id}`}
                    key={user.id} 
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-xs text-left text-xs space-y-2 relative overflow-hidden"
                  >
                    {/* Top strip banner */}
                    <div className="flex justify-between items-center bg-slate-50/40 p-2 -m-3.5 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span className="text-blue-600">VIP {user.vipLevel}</span>
                        <span className="text-slate-400">•</span>
                        <span>{user.username} {user.isAdmin && <strong className="text-rose-500">[แอดมิน]</strong>}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-600">
                      <div>เบอร์โทรเล่น: <strong className="text-slate-800">{user.phone}</strong></div>
                      <div>บาลานซ์ THB: <strong className="text-emerald-600 font-mono">฿{user.balance.toLocaleString()}</strong></div>
                      <div>ชื่อจริงในแบงก์: <span className="font-semibold">{user.realName || "ยังไม่บันทึก"}</span></div>
                      <div>บัญชี: <span className="font-mono">{user.bankName} {user.bankAccountNum || "ยังไม่กรอก"}</span></div>
                    </div>

                    {/* Controls Actions lines */}
                    <div id={`user-actions-${user.id}`} className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed border-slate-100 items-center justify-between">
                      {/* Security details overlay display */}
                      <span className="text-[9px] text-slate-400 font-mono">
                        Pwd: {user.loginPassword} | Tx: {user.txPassword}
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          id={`btn-edit-user-${user.id}`}
                          onClick={() => setEditUserTarget(user)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                        >
                          <FileEdit size={10} />
                          <span>แก้ไขประวัติ</span>
                        </button>

                        {/* Freeze toggle */}
                        {user.status === "frozen" ? (
                          <button
                            id={`btn-unfreeze-user-${user.id}`}
                            onClick={() => handleUpdateUserStatus(user.id, "active")}
                            className="bg-yellow-10 border border-yellow-300 text-yellow-700 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            ปลดอายัดบัญชี
                          </button>
                        ) : (
                          <button
                            id={`btn-freeze-user-${user.id}`}
                            onClick={() => handleUpdateUserStatus(user.id, "frozen")}
                            className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            อายัดบัญชี
                          </button>
                        )}

                        {/* Ban toggle */}
                        {user.status === "banned" ? (
                          <button
                            id={`btn-unban-user-${user.id}`}
                            onClick={() => handleUpdateUserStatus(user.id, "active")}
                            className="bg-rose-10 border border-rose-300 text-rose-700 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            ปลดแบนยูส
                          </button>
                        ) : (
                          <button
                            id={`btn-ban-user-${user.id}`}
                            onClick={() => handleUpdateUserStatus(user.id, "banned")}
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            แบนตลอดชีพ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: Finance controller */}
        {activeMenu === "finance" && (
          <div id="admin-finance-subview" className="space-y-4 animate-fade-in">
            {/* Search user finance history */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="admin-search-finance-input"
                type="text"
                placeholder="ป้อนเบอร์โทรศัพท์ เพื่อกรองตารางประวัติธุรกรรม..."
                value={searchFinPhone}
                onChange={(e) => setSearchFinPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs"
              />
            </div>

            {/* CAPITAL INJECTIONS DEPOSITS MANUAL */}
            <form 
              id="admin-inject-deposit-form"
              onSubmit={handleManualDeposit} 
              className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 text-left space-y-3"
            >
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={14} className="text-sky-500" />
                <span>เติมเงินเข้าบัญชี (แอดมินอัดฉีดทุนตรง)</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500">ค้นหาเบอร์โทรผู้เล่น:</label>
                  <input
                    id="inject-deposit-phone"
                    type="text"
                    placeholder="เบอร์โทรผู้รับเงิน..."
                    value={depositPhoneInput}
                    onChange={(e) => setDepositPhoneInput(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl mt-0.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">จำนวนเงิน THB:</label>
                  <input
                    id="inject-deposit-amount"
                    type="number"
                    placeholder="ใส่ยอดบาท..."
                    value={depositAmountInput}
                    onChange={(e) => setDepositAmountInput(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl mt-0.5 text-xs font-bold font-mono text-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500">ข้อความบันทึกเติมเงินเพิ่มเติม:</label>
                <input
                  id="inject-deposit-note"
                  type="text"
                  placeholder="เช่น โอนเงินผ่านระบบ, เติมผิด, แอดมินแจกทุนโปรฯ..."
                  value={depositNoteInput}
                  onChange={(e) => setDepositNoteInput(e.target.value)}
                  className="w-full px-2.5 py-2 border rounded-xl mt-0.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                ยืนยันการเพิ่มยอดเงินเข้าระบบผู้รับ
              </button>
            </form>

            {/* DIRECT CASH BALANCE DEDUCTIONS BY ADMINS */}
            <form 
              id="admin-deduct-balance-form"
              onSubmit={handleManualDeduct} 
              className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 text-left space-y-3"
            >
              <h4 className="font-bold text-xs text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={14} className="text-rose-500" />
                <span>หักลดยอดเงินในบัญชี (แอดมินนำเงินออกโดยตรง)</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">เบอร์โทรศัพท์ผู้ใช้:</label>
                  <input
                    id="inject-deduct-phone"
                    type="text"
                    required
                    maxLength={10}
                    placeholder="เบอร์โทรผู้ถูกหักออก..."
                    value={deductPhoneInput}
                    onChange={(e) => setDeductPhoneInput(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl mt-0.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">จำนวนเงิน THB:</label>
                  <input
                    id="inject-deduct-amount"
                    type="number"
                    required
                    placeholder="ใส่ยอดต้องการหัก..."
                    value={deductAmountInput}
                    onChange={(e) => setDeductAmountInput(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl mt-0.5 text-xs font-bold font-mono text-rose-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">หมายเหตุการหักยอดเงิน:</label>
                <input
                  id="inject-deduct-note"
                  type="text"
                  required
                  placeholder="ระบุสาเหตุ เช่น ถอนสำเร็จนอกระบบ, หักออฟไลน์, และอื่นๆ..."
                  value={deductNoteInput}
                  onChange={(e) => setDeductNoteInput(e.target.value)}
                  className="w-full px-2.5 py-2 border rounded-xl mt-0.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                ยืนยันการลบเงินออกจากบัญชีผู้ใช้
              </button>
            </form>

            {/* WITHDRAWALS PENDING RESOLUTION REQUESTS */}
            <div id="pending-withdrawals-section" className="space-y-2">
              <span className="text-xs font-bold text-slate-500">คำขอถอนเงินรอแอดมินโอนออก ({filteredWithdrawals.filter(w => w.status === "pending").length}):</span>
              {filteredWithdrawals.filter(w=>w.status === "pending").length === 0 ? (
                <div className="bg-white rounded-2xl p-4 text-center border text-[11px] text-slate-400">ยังไม่มีรายการเงินสดโอนออกค้างอยู่</div>
              ) : (
                filteredWithdrawals.filter(w => w.status === "pending").map((rec) => (
                  <div key={rec.id} className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-3.5 space-y-2 text-left">
                    <div className="flex justify-between font-bold text-amber-800 text-[11px]">
                      <span>เบอร์โทร: {rec.phone} ({rec.username})</span>
                      <span className="font-mono text-xs">฿{rec.amount.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-amber-900 bg-amber-100/25 p-2 rounded-xl">
                      <strong>ข้อมูลรับเงิน:</strong> {users.find(u => u.phone === rec.phone)?.bankName || "-"} บัญชี: {users.find(u => u.phone === rec.phone)?.bankAccountNum || "-"} (ชื่อเบอร์ธนาคาร: {users.find(u => u.phone === rec.phone)?.realName || "-"})
                    </div>
                    
                    {/* Add note input for this row specifically */}
                    <div className="flex gap-1.5">
                      <input 
                        type="text"
                        placeholder="เขียนหมายเหตุเพิ่มเติม เช่น โอนเรียบร้อย..."
                        value={withdrawNoteInput[rec.id] || ""}
                        onChange={(e) => setWithdrawNoteInput({ ...withdrawNoteInput, [rec.id]: e.target.value })}
                        className="flex-1 px-2.5 py-1 border bg-white rounded-lg text-[10px]"
                      />
                      <button
                        onClick={() => handleWithApproval(rec.id, "approve")}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <Check size={10} />
                        <span>อนุมัติ</span>
                      </button>
                      <button
                        onClick={() => handleWithApproval(rec.id, "reject")}
                        className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* WITHDRAWAL & DEPOSIT HISTORY LOGS */}
            <div id="finance-history-section" className="grid grid-cols-1 gap-3 text-xs text-left">
              {/* Deposits historic */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 text-[11px] block border-b pb-1">ประวัติการฝากเงิน ({filteredDeposits.length})</span>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5">
                  {filteredDeposits.map((d) => (
                    <div key={d.id} className="flex justify-between text-[10px] py-1 border-b border-dashed">
                      <div>
                        <p className="font-bold text-slate-800">{d.phone} • {d.username}</p>
                        <span className="text-slate-400 text-[9px]">{d.note || "-"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-600 font-bold font-mono">฿{d.amount.toLocaleString()}</span>
                        <p className="text-[8px] text-slate-400">{new Date(d.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Withdrawals historic */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 text-[11px] block border-b pb-1">ประวัติการถอนเงิน ({filteredWithdrawals.length})</span>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5">
                  {filteredWithdrawals.map((w) => (
                    <div key={w.id} className="flex justify-between text-[10px] py-1 border-b border-dashed">
                      <div>
                        <p className="font-bold text-slate-850">{w.phone} • {w.username}</p>
                        <span className="text-slate-400 text-[9px]">{w.note || "-"}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold font-mono ${w.status === "approved" ? "text-blue-500" : w.status === "rejected" ? "text-rose-500" : "text-amber-500"}`}>
                          ฿{w.amount.toLocaleString()} ({w.status === "approved" ? "สำเร็จ" : w.status === "rejected" ? "ถูกปฏิเสธ" : "รออนุมัติ"})
                        </span>
                        <p className="text-[8px] text-slate-400">{new Date(w.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: Trades historic records */}
        {activeMenu === "trades" && (
          <div id="admin-trades-subview" className="space-y-4 animate-fade-in text-left">
            {/* Search trade phone symbol */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="admin-search-trades-input"
                type="text"
                placeholder="ค้นประวัติตามเบอร์โทร หรือ สัญลักษณ์หุ้น..."
                value={searchTradePhone}
                onChange={(e) => setSearchTradePhone(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs"
              />
            </div>

            <div className="bg-white rounded-3xl p-3.5 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-500 block">ประวัติสรุปการลงทุนผู้ใช้งานคละเหรียญ ({filteredTrades.length}):</span>
              
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {filteredTrades.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">ไม่พบบันทึกธุรกรรมเทรนดิ้งตามคำสำคัญ</p>
                ) : (
                  filteredTrades.map((t) => {
                    const isWin = t.status === "win";
                    const isLoss = t.status === "lose";
                    return (
                      <div key={t.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-800">{t.phone} ({t.stockSymbol})</span>
                          <span className={`${isWin ? "text-sky-500" : isLoss ? "text-rose-500" : "text-amber-500"}`}>
                            {t.type} • ฿{t.amount.toLocaleString()} ➔ {isWin ? "ชนะ (+85%)" : isLoss ? "แพ้ (-100%)" : `กำลังรัน (${t.timeRemaining}s)`}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[9px]">
                          <span>ราคาเข้า: ฿{t.entryPrice.toLocaleString()} | {t.closePrice ? `ปิด: ฿${t.closePrice.toLocaleString()}` : 'รอมาร์เก็ต'}</span>
                          <span className="font-mono">{new Date(t.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold">
                          <span>ผลกำไรพอร์ตจริง:</span>
                          <span className={t.profitLoss >= 0 ? "text-sky-500" : "text-rose-500"}>
                            ฿{t.profitLoss >= 0 ? "+" : ""}{t.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: Live Chat admin list responding */}
        {activeMenu === "chat-admin" && (
          <div id="admin-chat-subview" className="space-y-4 animate-fade-in text-left">
            {/* Split layout: Inbox directory or Active single chat panel */}
            {selectedChatPhone ? (
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col h-[400px]">
                <div className="bg-slate-900 text-white px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button onClick={() => setSelectedChatPhone(null)} className="p-1 hover:bg-white/10 rounded-full cursor-pointer">
                      <ArrowLeftRight size={14} className="rotate-180" />
                    </button>
                    <span>คุยกลับ: {selectedChatPhone} ({activeChatRoom?.userName})</span>
                  </div>
                  <button onClick={() => setSelectedChatPhone(null)} className="text-slate-400 cursor-pointer">
                    <X size={15} />
                  </button>
                </div>

                {/* Sub chat messages stream */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[11px] bg-slate-50 flex flex-col">
                  {activeChatRoom?.messages.map((m, idx) => {
                    const isMe = m.isFromAdmin;
                    return (
                      <div 
                        key={m.id || idx} 
                        className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                      >
                        <span className="text-[8px] text-slate-400 px-1">{m.senderName}</span>
                        <div className={`px-2.5 py-1.5 rounded-xl ${isMe ? "bg-slate-900 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"}`}>
                          <p className="break-all whitespace-pre-wrap">{m.text}</p>
                          {m.imageUrl && (
                            <img src={m.imageUrl} alt="User upload" className="rounded mt-1.5 max-h-[140px] max-w-[150px] object-cover" />
                          )}
                        </div>
                        <span className="text-[7px] text-slate-350 mt-0.5 px-1">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Reply bar */}
                <form onSubmit={handleAdminChatReply} className="p-2.5 bg-white border-t flex gap-1.5 shrink-0">
                  <input
                    type="text"
                    placeholder="พิมพ์ตอบกลับลูกค้าสปีดด่วน..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 rounded-xl border text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white py-1.5 px-3 rounded-xl hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-3.5 border border-slate-200/60 space-y-3">
                <span className="text-xs font-bold text-slate-500 block">ห้องสนทนาช่วยเหลือลูกค้าทั้งหมด:</span>
                {chatRoomsList.length === 0 ? (
                  <p className="text-slate-400 text-xs py-4 text-center">ไม่มีลูกค้าส่งข้อความแชตติดต่อเข้ามา</p>
                ) : (
                  <div className="space-y-1.5">
                    {chatRoomsList.map((room) => {
                      const lastMsg = room.messages[room.messages.length - 1];
                      return (
                        <button
                          key={room.id}
                          onClick={() => {
                            setSelectedChatPhone(room.userPhone);
                            fetchChatMessages(room.userPhone);
                          }}
                          className="w-full text-left bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border flex justify-between items-center transition-all cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 leading-tight">เบอร์โทร: {room.userPhone} ({room.userName})</p>
                            <span className="text-[9px] text-slate-400 block truncate mt-0.5">{lastMsg ? lastMsg.text : "ยังไม่มีแชทคุย"}</span>
                          </div>
                          {room.unreadCount > 0 && (
                            <span className="w-4 h-4 bg-sky-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center animate-bounce">
                              {room.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: Administrator Management */}
        {activeMenu === "admin-mgmt" && (
          <div id="admin-mgmt-subview" className="space-y-4 animate-fade-in text-left">
            {/* Super Admin credential change */}
            <form onSubmit={handleSelfAdminUpdate} className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-rose-500 uppercase tracking-widest flex items-center gap-1">
                <ShieldAlert size={14} />
                <span>แก้ไขบัญชี Super Admin (เจ้าของสูงสุด)</span>
              </h4>
              <p className="text-[10px] text-slate-400 -mt-1 font-medium">แอดมินเบ้าหมายเลข ‘0984412389’ สามารถเปลี่ยนหัวข้อและพาสเวิร์ดตัวเองด่วน</p>
              
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">เบอร์โทรศัพท์เจ้าของหลักใหม่ (เบอร์เดิมคือ 0984412389):</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="ป้อนเบอร์โทรติดต่อหลักใหม่..."
                    value={superPhoneInput}
                    onChange={(e) => setSuperPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">รหัสผ่านล็อกอินสูงสุดใหม่ (เดิมคือ PachaiMiTrade):</label>
                  <input
                    type="text"
                    placeholder="รหัสผ่านใหม่ที่ปลอดภัย..."
                    value={superPwdInput}
                    onChange={(e) => setSuperPwdInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">ชื่อฉายาแสดงผล (เดิมคือ ผู้ร่วมก่อตั้ง Super Admin):</label>
                  <input
                    type="text"
                    placeholder="ป้อนชื่อเล่นตำแหน่ง..."
                    value={superNameInput}
                    onChange={(e) => setSuperNameInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl mt-0.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                อัปเดตข้อมูลบัญชีหลักสูงสุด
              </button>
            </form>

            {/* Sub-Admins Creation / Removal Section */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/70 space-y-3">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">จัดการสิทธิแอดมินผู้ดูแลระดับรอง (Sub Admin)</h4>
              
              <form onSubmit={handleCreateSubAdmin} className="space-y-2 bg-slate-50 p-3 rounded-2xl border">
                <span className="text-[10px] font-bold text-slate-600 block">แต่งตั้งแอดมินผู้ช่วยเพิ่มใหม่:</span>
                <input
                  type="text"
                  placeholder="ชื่อแอดมินรอง..."
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                />
                <input
                  type="text"
                  maxLength={10}
                  placeholder="เบอร์โทรล็อกอิน..."
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="รหัสผ่านเข้าสู่ระบบ..."
                  value={newAdminPwd}
                  onChange={(e) => setNewAdminPwd(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  แต่งตั้งเป็นแอดมินผู้ช่วย
                </button>
              </form>

              {/* List existing sub admins */}
              <div id="subadmins-list" className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-500">แอดมินผู้ช่วยปัจจุบัน:</span>
                {users.filter(u => u.isAdmin && !u.isSuperAdmin).length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-1">ยังไม่มีแอดมินระดับผู้ดูแลรองในระบบ</p>
                ) : (
                  users.filter(u => u.isAdmin && !u.isSuperAdmin).map((adm) => (
                    <div key={adm.id} className="flex justify-between items-center bg-slate-100 p-2 rounded-xl text-[10px]">
                      <div>
                        <strong className="text-slate-800">{adm.username}</strong>
                        <p className="text-slate-400 font-mono text-[9px]">{adm.phone} (Pwd: {adm.loginPassword})</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSubAdmin(adm.phone)}
                        className="bg-rose-50 text-rose-600 p-1.5 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        title="ถอดถอนออกจากระบบ"
                      >
                        <Trash2 size={12} fill="#ef4444" className="text-white" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* TOAST SYSTEM ALERTS FEEDBACKS NOTIFICATIONS */}
      {successToast && (
        <div id="toast-success" className="fixed bottom-20 left-4 right-4 z-50 bg-emerald-600 text-white text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2 shadow-xl border border-emerald-500 justify-between animate-fade-in">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast("")} className="font-bold opacity-80 cursor-pointer">X</button>
        </div>
      )}
      {errorToast && (
        <div id="toast-error" className="fixed bottom-20 left-4 right-4 z-50 bg-rose-600 text-white text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2 shadow-xl border border-rose-500 justify-between animate-fade-in">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={15} />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast("")} className="font-bold opacity-80 cursor-pointer">X</button>
        </div>
      )}
    </div>
  );
}
