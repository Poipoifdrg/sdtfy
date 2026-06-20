import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, TrendingDown, Wallet, ReceiptText, UserCircle, 
  ChevronRight, ArrowUpRight, ArrowDownRight, CreditCard, ShieldCheck, 
  MessageCircle, History, UserCheck, HelpCircle, Gift, LogOut, Phone, Lock, Eye, EyeOff, CheckCircle2, RefreshCw, Upload, Sparkles, PlusCircle, AlertCircle, X
} from "lucide-react";
import { User, StockItem, SystemSettings, OrderItem } from "./types";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CandlestickChart from "./components/CandlestickChart";
import TradingPopup from "./components/TradingPopup";
import LiveChat from "./components/LiveChat";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Mobile app States
  const [activeTab, setActiveTab] = useState<string>("quotes"); // quotes, assets, trading, profile
  const [tradingSubTab, setTradingSubTab] = useState<'active' | 'history'>('active');
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Forms inputs
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [txPasswordInput, setTxPasswordInput] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authSuccess, setAuthSuccess] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Real-time site & asset settings Sync online
  const [siteSettings, setSiteSettings] = useState<SystemSettings>({
    siteTitle: "MiTrade",
    logoUrl: "",
    primaryColor: "#3B82F6",
    promotionSlides: []
  });
  const [assetsList, setAssetsList] = useState<StockItem[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [tradePopupMeta, setTradePopupMeta] = useState<{ symbol: string, type: 'BUY' | 'SELL' } | null>(null);

  // User transactional portfolios
  const [myBalance, setMyBalance] = useState<number>(0);
  const [activeOrders, setActiveOrders] = useState<OrderItem[]>([]);
  const [tradeHistory, setTradeHistory] = useState<OrderItem[]>([]);
  const [runningPnl, setRunningPnl] = useState<number>(0);

  // Navigation aux overlays
  const [personalInfoOpen, setPersonalInfoOpen] = useState<boolean>(false);
  const [liveChatOpen, setLiveChatOpen] = useState<boolean>(false);
  const [depHistoryOpen, setDepHistoryOpen] = useState<boolean>(false);
  const [withHistoryOpen, setWithHistoryOpen] = useState<boolean>(false);
  const [paymentGuideOpen, setPaymentGuideOpen] = useState<boolean>(false);
  const [promotionsOpen, setPromotionsOpen] = useState<boolean>(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState<boolean>(false);

  // Personal account fields
  const [tempNickname, setTempNickname] = useState<string>("");
  const [tempBirthday, setTempBirthday] = useState<string>("");
  const [realNameInput, setRealNameInput] = useState<string>("");
  const [bankNameInput, setBankNameInput] = useState<string>("");
  const [bankAccountInput, setBankAccountInput] = useState<string>("");

  // Cash withdrawal inputs
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawTxPassword, setWithdrawTxPassword] = useState<string>("");
  const [withdrawError, setWithdrawError] = useState<string>("");
  const [withdrawSuccess, setWithdrawSuccess] = useState<string>("");

  // System toast alerts
  const [globalMessage, setGlobalMessage] = useState<{ type: 'ok' | 'err', msg: string } | null>(null);

  // Carousel timer
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Image Upload Profile Avatar local state
  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (type: 'ok' | 'err', msg: string) => {
    setGlobalMessage({ type, msg });
    setTimeout(() => setGlobalMessage(null), 3500);
  };

  // 1. Initial Load Cache checking
  useEffect(() => {
    // Initial fetch of system settings & color setup
    fetchSettings();
    fetchPrices();

    const cachedUser = localStorage.getItem("mitrade_user");
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        // Sync full info with backend
        fetchUserProfile(u.id);
      } catch {
        localStorage.removeItem("mitrade_user");
      }
    }

    // Avatar profile picture check
    const cachedAvatar = localStorage.getItem("mitrade_avatar");
    if (cachedAvatar) {
      setProfileAvatar(cachedAvatar);
    }

    // Fast polling for asset prices (1.5 seconds)
    const priceInterval = setInterval(fetchPrices, 1500);

    return () => {
      clearInterval(priceInterval);
    };
  }, []);

  // 2. Fetch User Profile & Orders when logged in
  const fetchUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/profile/${userId}`);
      if (res.ok) {
        const fullUser = await res.json();
        
        // Block if banned or frozen live
        if (fullUser.status === "frozen" || fullUser.status === "banned") {
          handleLogout();
          triggerToast("err", fullUser.status === "frozen" ? "บัญชีคุณถูกอายัด โปรดติดต่อฝ่ายบริการลูกค้า" : "คุณถูกแบน โปรดติดต่อฝ่ายบริการลูกค้า");
          return;
        }

        setUser(fullUser);
        setMyBalance(fullUser.balance);
        setTempNickname(fullUser.username);
        setTempBirthday(fullUser.birthday || "");
        setRealNameInput(fullUser.realName || "");
        setBankNameInput(fullUser.bankName || "");
        setBankAccountInput(fullUser.bankAccountNum || "");
        
        localStorage.setItem("mitrade_user", JSON.stringify(fullUser));
        
        // Fetch users running trades
        fetchUserTrades(userId);
      }
    } catch {
      console.error("Profile sync failed");
    }
  };

  // Fetch active and historical orders
  const fetchUserTrades = async (userId: string) => {
    try {
      const res = await fetch(`/api/trade/orders/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveOrders(data.active);
        setTradeHistory(data.history);

        // Calculate floating profit sum
        const sum = data.active.reduce((acc: number, curr: any) => acc + curr.profitLoss, 0);
        setRunningPnl(sum);
      }
    } catch {}
  };

  // Dynamic values sync
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data);
        if (data.primaryColor) {
          document.documentElement.style.setProperty('--primary-color', data.primaryColor);
        }
      }
    } catch {}
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/stocks");
      if (res.ok) {
        const list = await res.json();
        setAssetsList(list);

        // Keep current selected stock data updated
        if (selectedStock) {
          const fresh = list.find((s: any) => s.symbol === selectedStock.symbol);
          if (fresh) setSelectedStock(fresh);
        }
      }

      // Sync user profile stats on ticks if user is active
      const cached = localStorage.getItem("mitrade_user");
      if (cached) {
        const u = JSON.parse(cached);
        fetchUserTrades(u.id);

        // Fast update balance in view without heavy profile reload
        fetch(`/api/users/profile/${u.id}`)
          .then(r => r.json())
          .then(fu => {
            if (fu.balance !== undefined) setMyBalance(fu.balance);
          }).catch(() => {});
      }
    } catch {}
  };

  // Slideshow interval
  useEffect(() => {
    if (siteSettings.promotionSlides.length > 1) {
      const timer = setInterval(() => {
        setActiveSlideIndex((prev) => (prev + 1) % siteSettings.promotionSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [siteSettings.promotionSlides]);

  // Auth Operations
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!phone || phone.length !== 10) {
      setAuthError("กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลักเท่านั้น");
      return;
    }
    if (!password || password.length < 8) {
      setAuthError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });
      
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        const isHtml = text.trim().startsWith("<");
        throw new Error(isHtml ? `รหัสข้อผิดพลาด ${response.status}: เส้นทาง API หรือเซิร์ฟเวอร์ขัดข้อง (กรุณาเปิดบริการเซิร์ฟเวอร์ Node.js ด้วย start script)` : text);
      }
      
      if (!response.ok) {
        throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ โปรดลองอีกครั้ง");
      }

      setAuthSuccess("เข้าสู่ระบบเรียบร้อยแล้ว กำลังดึงฐานข้อมูล...");
      setTimeout(() => {
        setUser(data.user);
        setMyBalance(data.user.balance);
        localStorage.setItem("mitrade_user", JSON.stringify(data.user));
        
        // Load initial info
        fetchUserProfile(data.user.id);
        triggerToast("ok", "ยินดีต้อนรับกลับสู่ MiTrade!");
        setPhone("");
        setPassword("");
      }, 1000);

    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!usernameInput) {
      setAuthError("กรุณากรอกชื่อสำหรับแสดงผลในระบบ");
      return;
    }
    if (!phone || phone.length !== 10) {
      setAuthError("กรุณาระบุกลุ่มเบอร์โทรติดต่อ 10 หลักเท่านั้น");
      return;
    }
    if (!txPasswordInput || txPasswordInput.length < 4) {
      setAuthError("กรุณาระบุรหัสผ่านธุรกรรมการเงินอย่างน้อย 4 หลัก");
      return;
    }
    if (!password || password.length < 8) {
      setAuthError("รหัสผ่านเข้าสู่ระบบอย่างน้อย 8 ตัวขึ้นไป");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("รหัสผ่านเข้าสู่ระบบทั้งสองช่องไม่ตรงกัน");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          username: usernameInput,
          loginPassword: password,
          txPassword: txPasswordInput
        })
      });
      
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        const isHtml = text.trim().startsWith("<");
        throw new Error(isHtml ? `รหัสข้อผิดพลาด ${response.status}: เส้นทาง API หรือเซิร์ฟเวอร์ขัดข้อง (กรุณาเปิดบริการเซิร์ฟเวอร์ Node.js ด้วย start script)` : text);
      }

      if (!response.ok) {
        throw new Error(data.error || "สมัครสมาชิกล้มเหลว โปรดตรวจสอบข้อมูล");
      }

      setAuthSuccess("สมัครสมาชิกสำเร็จเรียบร้อย! สามารถล็อคอินเข้าสู่ระบบได้ทันที");
      setTimeout(() => {
        setAuthMode('login');
        setConfirmPassword("");
        setAuthSuccess("");
      }, 2000);

    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("mitrade_user");
    setActiveTab("quotes");
    triggerToast("ok", "ออกจากระบบสำเร็จแล้ว");
  };

  // Change Profile image local cache handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileAvatar(base64String);
        localStorage.setItem("mitrade_avatar", base64String);
        triggerToast("ok", "อัปเดตรูปภาพโปรไฟล์ใหม่สำเร็จแล้ว!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Update profile details
  const handlePersonalInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: tempNickname,
          birthday: tempBirthday,
          realName: realNameInput || undefined,
          bankName: bankNameInput || undefined,
          bankAccountNum: bankAccountInput || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      triggerToast("ok", "บันทึกข้อมูลส่วนบุคคลของท่านเรียบร้อย!");
      fetchUserProfile(user.id);
      setPersonalInfoOpen(false);
    } catch (err: any) {
      triggerToast("err", err.message || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // Capital withdrawal request submission
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");

    if (!user) return;
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 100) {
      setWithdrawError("จำนวนเงินถอนขั้นต่ำสุดเริ่มต้นที่ 100 บาทขึ้นไป");
      return;
    }
    if (amt > myBalance) {
      setWithdrawError("ยอดเงินในระบบของคุณไม่เพียงพอสำหรับการถอนในครั้งนี้");
      return;
    }
    if (!withdrawTxPassword) {
      setWithdrawError("กรุณากรอกรหัสผ่านธุรกรรมทางการเงินเพื่อยืนยันสิทธิ์");
      return;
    }

    try {
      const response = await fetch("/api/transactions/withdraw-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: amt,
          txPassword: withdrawTxPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ส่งคำขอถอนเงินล้มเหลว โปรดตรวจสอบรหัสผ่านธุรกรรม");
      }

      setWithdrawSuccess(`ส่งคำขอถอนเงินจำนวน ฿${amt.toLocaleString()} สำเร็จ! รอการประมวลผลด่วนของแอดมิน`);
      setWithdrawAmount("");
      setWithdrawTxPassword("");
      fetchUserProfile(user.id);
    } catch (err: any) {
      setWithdrawError(err.message);
    }
  };

  // High precision stock vector asset generator
  const renderStockLogo = (symbol: string, color: string) => {
    const symbolsMap: Record<string, { bg: string, text: string }> = {
      "BTC": { bg: "bg-amber-500", text: "₿" },
      "ETH": { bg: "bg-indigo-600", text: "Ξ" },
      "BNB": { bg: "bg-amber-400", text: "B" },
      "LTC": { bg: "bg-slate-400", text: "Ł" },
      "SOL": { bg: "bg-purple-600", text: "S" },
      "ADA": { bg: "bg-blue-600", text: "A" },
      "XRP": { bg: "bg-cyan-600", text: "X" },
      "DOGE": { bg: "bg-yellow-500", text: "D" },
      "USDT": { bg: "bg-emerald-500", text: "T" },
      "AAPL": { bg: "bg-gray-700", text: "" },
      "GOOG": { bg: "bg-red-500", text: "G" },
      "TSLA": { bg: "bg-rose-600", text: "T" },
      "MSFT": { bg: "bg-sky-600", text: "M" },
      "AMZN": { bg: "bg-neutral-800", text: "a" },
      "NVDA": { bg: "bg-lime-600", text: "N" },
      "META": { bg: "bg-blue-500", text: "M" },
      "NFLX": { bg: "bg-red-600", text: "N" },
      "NKE": { bg: "bg-black", text: "N" },
      "SBUX": { bg: "bg-emerald-800", text: "S" },
      "COIN": { bg: "bg-blue-600", text: "C" },
    };

    const logoUrls: Record<string, string> = {
      "BTC": "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=032",
      "ETH": "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=032",
      "BNB": "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=032",
      "LTC": "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=032",
      "SOL": "https://cryptologos.cc/logos/solana-sol-logo.svg?v=032",
      "ADA": "https://cryptologos.cc/logos/cardano-ada-logo.svg?v=032",
      "XRP": "https://cryptologos.cc/logos/ripple-xrp-logo.svg?v=032",
      "DOGE": "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=032",
      "USDT": "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=032",
      "AAPL": "https://upload.wikimedia.org/wikipedia/commons/3/fa/Apple_logo_black.svg",
      "GOOG": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
      "TSLA": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.svg",
      "MSFT": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
      "AMZN": "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.svg",
      "NVDA": "https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg",
      "META": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
      "NFLX": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      "NKE": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
      "SBUX": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Starbucks_Corporation_Logo_2011.svg",
      "COIN": "https://cryptologos.cc/logos/coinbase-coin-logo.svg?v=032"
    };

    const details = symbolsMap[symbol] || { bg: "bg-blue-500", text: symbol.charAt(0) };
    const imageUrl = logoUrls[symbol];

    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm select-none bg-white shadow-xs border border-slate-100 p-1.5 shrink-0 relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={symbol} 
            className="w-full h-full object-contain" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className={`w-full h-full rounded-full flex items-center justify-center text-white ${details.bg}`}>
            {details.text}
          </div>
        )}
      </div>
    );
  };

  return (
    <main 
      id="root-smartphone-shell"
      className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-sky-100 relative w-full"
    >
      {/* Dynamic Theme Color variables sync */}
      <style>{`
        :root {
          --primary-color: ${siteSettings.primaryColor || '#3B82F6'};
        }
      `}</style>

      {/* Full-width responsive container */}
      <section 
        id="device-frame"
        className="w-full max-w-7xl mx-auto bg-white min-h-screen relative flex flex-col pb-16 shadow-xs border-x border-slate-100 transition-all duration-300 flex-1"
      >
        {/* Header displays */}
        <Header 
          siteTitle={siteSettings.siteTitle}
          logoUrl={siteSettings.logoUrl}
          user={user}
          primaryColor={siteSettings.primaryColor}
          onOpenAdmin={() => setAdminPanelOpen(true)}
        />

        {/* Dynamic page streams */}
        {!user ? (
          /* AUTHENTICATION VIEW */
          <div id="auth-view-container" className="flex-1 overflow-y-auto px-6 py-8 bg-linear-to-b from-blue-50 to-white flex flex-col justify-center">
            
            {/* Logo Brand Title bar */}
            <div className="text-center mb-8">
              {siteSettings.logoUrl ? (
                <div className="w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-slate-900 border border-slate-850 p-1">
                  <img 
                    src={siteSettings.logoUrl} 
                    alt={siteSettings.siteTitle || "MiTrade Logo"} 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg"
                  style={{ backgroundColor: siteSettings.primaryColor }}
                >
                  <Sparkles size={32} />
                </div>
              )}
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{siteSettings.siteTitle || "MiTrade"}</h2>
              <p className="text-xs text-slate-400 mt-1">โมเดิร์นโบรกเกอร์ คุมความเสี่ยงเพื่อความมั่งคั่งอย่างมั่นคง</p>
            </div>

            {/* Login registration card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-50">
              <div className="flex bg-slate-50 p-1 rounded-2xl mb-6">
                <button
                  id="tab-auth-login"
                  onClick={() => { setAuthMode('login'); setAuthError(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'login' 
                      ? "bg-white text-slate-800 shadow-xs" 
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  id="tab-auth-register"
                  onClick={() => { setAuthMode('register'); setAuthError(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'register' 
                      ? "bg-white text-slate-800 shadow-xs" 
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  สมัครสมาชิก
                </button>
              </div>

              {authError && (
                <div id="auth-error" className="bg-rose-50 text-rose-605 text-rose-600 text-[11px] font-semibold p-3 rounded-xl mb-4 text-left flex items-start gap-1.5 border border-rose-100">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div id="auth-success" className="bg-emerald-50 text-emerald-600 text-[11px] font-semibold p-3 rounded-xl mb-4 text-left flex items-start gap-1.5 border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {authMode === 'login' ? (
                /* LOGIN FORM */
                <form id="auth-login-form" onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">เบอร์โทรศัพท์ (10 หลัก):</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="login-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="0xxxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-350 text-xs text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-500">รหัสผ่านบัญชี:</label>
                      <button 
                        type="button" 
                        onClick={() => triggerToast("ok", "กรณีลืมพาสเวิร์ด โปรดติดต่อแอดมินฝ่ายบริการลูกค้าออนไลน์ค่ะ")}
                        className="text-[10px] text-sky-600 font-semibold cursor-pointer"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="กรอกรหัสผ่าน 8 ตัวอักษรขึ้นไป"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-slate-150 focus:outline-none focus:ring-1 focus:ring-slate-350 text-xs text-slate-800"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-submit-login"
                    type="submit"
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer mt-2"
                    style={{ backgroundColor: siteSettings.primaryColor }}
                  >
                    ยืนยันเข้าสู่ระบบ
                  </button>
                </form>
              ) : (
                /* ACTION REGISTER FORM */
                <form id="auth-register-form" onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">ชื่อผู้ใช้งาน (ชื่อเล่น):</label>
                    <input
                      id="register-username"
                      type="text"
                      placeholder="ใส่ชื่อผู้เล่น..."
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-150 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">เบอร์โทรศัพท์ (10 หลัก):</label>
                    <input
                      id="register-phone"
                      type="tel"
                      maxLength={10}
                      placeholder="ป้อนเบอร์ 10 หลัก..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-150 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">รหัสผ่านยืนยันธุรกรรมการเงิน (4-6 หลัก):</label>
                    <input
                      id="register-txpassword"
                      type="password"
                      maxLength={8}
                      placeholder="เพื่อใช้ยืนยันเวลายื่นถอนเงิน..."
                      value={txPasswordInput}
                      onChange={(e) => setTxPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-150 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">รหัสผ่านเข้าสู่ระบบ (8 ตัวขึ้นไป):</label>
                    <input
                      id="register-password"
                      type="password"
                      placeholder="รหัสผ่านเข้าเล่น..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-150 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">ยืนยันรหัสผ่านเข้าสู่ระบบอีกครั้ง:</label>
                    <input
                      id="register-confirm-password"
                      type="password"
                      placeholder="รหัสผ่านช่องเดิมอีกครั้ง..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-150 text-xs"
                      required
                    />
                  </div>

                  <button
                    id="btn-submit-register"
                    type="submit"
                    className="w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md mt-4 cursor-pointer"
                    style={{ backgroundColor: siteSettings.primaryColor }}
                  >
                    ยืนยันการสมัครบัญชีใหม่
                  </button>
                </form>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 mt-6 text-center italic">
              *ข้อมูลการเทรดมีความแม่นยำสูงอ้างอิงราคาตลาดสากลแบบ Real-ticker <br />
              MiTrade @ 2026 สงวนลิขสิทธิ์ความปลอดภัยสูงสุด
            </p>
          </div>
        ) : (
          /* MULTI-TAB FRONTEND LAYOUT */
          <div id="frontend-content" className="flex-1 overflow-hidden flex flex-col relative bg-slate-50">

            {/* TAB 1: Quotes ราคา */}
            {activeTab === "quotes" && (
              <div id="quotes-tabv" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                
                {/* PROMOTION CAROUSEL SLIDE */}
                {siteSettings.promotionSlides.length > 0 && (
                  <div 
                    id="carousel-slider"
                    className="w-full h-32 rounded-3xl overflow-hidden relative shadow-lg bg-cover bg-center border border-slate-100 flex items-end text-left p-3"
                    style={{
                      backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%), url(${siteSettings.promotionSlides[activeSlideIndex]?.imageUrl})`
                    }}
                  >
                    <div className="space-y-0.5">
                      <span className="bg-amber-500 text-[8px] font-bold text-white px-2 py-0.5 rounded-full select-none">HOT EVENT</span>
                      <p className="text-white text-xs font-bold leading-tight">{siteSettings.promotionSlides[activeSlideIndex]?.caption}</p>
                    </div>
                    {/* Indicators dots */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      {siteSettings.promotionSlides.map((_, i) => (
                        <span 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full transition-all ${activeSlideIndex === i ? 'bg-white scale-125' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 RECOMMEND CARDS row (BTC, ETH, XEM) */}
                <div id="top-three-cards" className="grid grid-cols-3 gap-2">
                  {["BTC", "ETH", "XEM"].map((symbol) => {
                    const item = assetsList.find(s => s.symbol === symbol);
                    if (!item) return null;
                    const isUp = item.changePercent >= 0;
                    return (
                      <button
                        id={`card-recommend-${symbol}`}
                        key={symbol}
                        onClick={() => setSelectedStock(item)}
                        className={`p-3 rounded-2xl bg-white border text-left flex flex-col justify-between shadow-xs transition-transform active:scale-95 duration-100 cursor-pointer ${
                          selectedStock?.symbol === symbol ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{symbol}</span>
                          <span className={`text-[9px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isUp ? '+' : ''}{item.changePercent}%
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <span className="text-[10px] text-slate-400 block -mb-0.5">ปัจจุบัน:</span>
                          <span className="font-mono text-[11px] font-semibold text-slate-800">
                             ฿{item.priceInThb.toLocaleString(undefined, { maximumFractionDigits: symbol === "XEM" ? 2 : 0 })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* CANDLESTICK CONTAINER IF SELECTED */}
                {selectedStock ? (
                  <div id="active-chart-portal" className="space-y-4 animate-fade-in">
                    <CandlestickChart 
                      symbol={selectedStock.symbol}
                      stockName={selectedStock.name}
                      currentPrice={selectedStock.priceInThb}
                      changePercent={selectedStock.changePercent}
                      highPrice={selectedStock.highThb}
                      lowPrice={selectedStock.lowThb}
                      primaryColor={siteSettings.primaryColor}
                    />

                    {/* Order action button bars */}
                    <div id="popup-order-actions-bar" className="grid grid-cols-2 gap-3 bg-white p-3 rounded-2.5xl shadow-sm border border-slate-100/65">
                      <button
                        id="chart-order-buy-btn"
                        onClick={() => setTradePopupMeta({ symbol: selectedStock.symbol, type: 'BUY' })}
                        className="py-3 bg-sky-505 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ArrowUpRight size={15} />
                        <span>ซื้อขึ้น (Call Option)</span>
                      </button>
                      <button
                        id="chart-order-sell-btn"
                        onClick={() => setTradePopupMeta({ symbol: selectedStock.symbol, type: 'SELL' })}
                        className="py-3 bg-rose-600 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ArrowDownRight size={15} />
                        <span>ขายลง (Put Option)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 rounded-2xl p-4 text-center border border-dashed border-slate-200 text-xs text-slate-400 flex items-center gap-2 justify-center py-5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                    <span>จิ้มคลิกแผงเหรียญหรือหุ้น เพื่อขยายเปรียบเทียบแนวโน้มประวัติ</span>
                  </div>
                )}

                {/* TABS OF 20 GENERAL STOCKS LIST */}
                <div id="general-stocks-box" className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="font-bold text-xs text-slate-5 py-0.5">ตราสารทุนและห่วงโซ่หลัก ({assetsList.length})</span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin-slow text-sky-500" />
                      <span>อัปเดตวิแนริบเรียลไทม์</span>
                    </span>
                  </div>

                  <div id="stocks-directories-rows" className="space-y-2.5 max-h-[300px] overflow-y-auto">
                    {assetsList.map((st) => {
                      const isUp = st.changePercent >= 0;
                      return (
                        <button
                          id={`row-stock-item-${st.symbol}`}
                          key={st.symbol}
                          onClick={() => setSelectedStock(st)}
                          className={`w-full flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer text-left ${
                            selectedStock?.symbol === st.symbol ? 'bg-slate-50/80 ring-1 ring-slate-100' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {renderStockLogo(st.symbol, siteSettings.primaryColor)}
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs text-slate-800">{st.symbol}</span>
                                <span className="text-[10px] text-slate-400 font-mono leading-none">/ THB</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[120px]">{st.name}</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className="font-mono text-xs font-bold block text-slate-800">
                                ฿{st.priceInThb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">H: {st.highThb.toLocaleString()} | L: {st.lowThb.toLocaleString()}</span>
                            </div>

                            <span 
                              className={`w-14 text-center py-1.5 rounded-lg text-xs font-bold font-mono text-white ${
                                isUp ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            >
                              {isUp ? '+' : ''}{st.changePercent}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Asset สินทรัพย์ */}
            {activeTab === "assets" && (
              <div id="assets-tabv" className="flex-1 overflow-y-auto px-5 py-6 space-y-5 animate-fade-in text-left">
                
                {/* Balance overview card */}
                <div 
                  className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${siteSettings.primaryColor}, #1d4ed8)`
                  }}
                >
                  <span className="text-xs opacity-90 font-bold block">มูลค่ากระเป๋าเงินหลัก (THB)</span>
                  <h3 id="asset-cash-balance" className="text-3xl font-extrabold font-mono tracking-tight mt-1">
                    ฿{myBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="opacity-70 block text-[10px]">เลเวลลูกค้า VIP</span>
                      <strong className="font-bold">VIP {user?.vipLevel}</strong>
                    </div>
                    <div>
                      <span className="opacity-70 block text-[10px]">ไอดีของฉัน</span>
                      <strong className="font-mono">{user?.id}</strong>
                    </div>
                  </div>
                </div>

                {/* Short deposit withdrawal transactions trigger blocks */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <button
                    id="btn-trigger-quick-deposit"
                    onClick={() => {
                      triggerToast("ok", "โปรดติดต่อแอดมินฝ่ายบริการลูกค้าผ่านกล่องแชตเพื่อฝากเงินค่ะ");
                      setLiveChatOpen(true);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-slate-150 rounded-2.5xl hover:bg-slate-50 transition-all cursor-pointer group active:scale-95"
                  >
                    <PlusCircle size={24} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-700 mt-1.5">ฝากเงินเข้าระบบ</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">ติดต่อเจ้าหน้าที่แอดมิน</span>
                  </button>

                  <button
                    id="btn-trigger-quick-withdraw"
                    onClick={() => {
                      setPersonalInfoOpen(true);
                      triggerToast("ok", "กรุณาใส่ชื่อบัญชีธนาคารในข้อมูลส่วนบุคคลก่อนทำการถอนเงินค่ะ");
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-slate-150 rounded-2.5xl hover:bg-slate-50 transition-all cursor-pointer group active:scale-95"
                  >
                    <ArrowDownRight size={24} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-700 mt-1.5">ถอนเงินออก</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">ตรวจสอบบัญชีถอนด่วน</span>
                  </button>
                </div>

                {/* SUBMIT WITHDRAW FORM */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/70 space-y-4">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={14} className="text-sky-500" />
                    <span>คำขอถอนเงินสด (Withdrawal Interface)</span>
                  </h4>

                  {/* Warning label if no bank details registered */}
                  {(!user?.realName || !user?.bankAccountNum) && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 font-semibold">
                      ⚠ ข้อมูลเลขธนาคารเป้าหมายว่างอยู่! กรุณากดปุ่ม <b>"ข้อมูลส่วนบุคคล"</b> ในแถบของฉัน เพื่อตั้งธนาคารรับเงินก่อนถอนครั้งแรก
                    </div>
                  )}

                  {withdrawError && (
                    <div id="withdraw-error-p" className="bg-rose-50 text-rose-600 text-[10px] p-2.5 rounded-xl font-semibold border border-rose-100">
                      {withdrawError}
                    </div>
                  )}

                  {withdrawSuccess && (
                    <div id="withdraw-success-p" className="bg-emerald-50 text-emerald-600 text-[10px] p-2.5 rounded-xl font-semibold border border-emerald-100">
                      {withdrawSuccess}
                    </div>
                  )}

                  <form onSubmit={handleWithdrawalRequest} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">จำนวนเงินบาทที่ต้องการเบิกถอน (THB):</label>
                      <input
                        id="input-withdraw-amount"
                        type="number"
                        placeholder="ถอนขั้นต่ำ 100 บาท..."
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-3.5 py-3 border rounded-xl text-xs font-bold"
                        disabled={!user?.realName || !user?.bankAccountNum}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500">รหัสยืนยันธุรกรรม (รหัส 4-6 หลัก):</label>
                        <span className="text-[9px] text-slate-350">บังคับป้อนทุกครั้งก่อนยืนยัน</span>
                      </div>
                      <input
                        id="input-withdraw-tx-pwd"
                        type="password"
                        placeholder="ป้อนรหัสธุรกรรมทางการเงิน..."
                        value={withdrawTxPassword}
                        onChange={(e) => setWithdrawTxPassword(e.target.value)}
                        className="w-full px-3.5 py-3 border rounded-xl text-xs"
                        disabled={!user?.realName || !user?.bankAccountNum}
                      />
                    </div>

                    <button
                      id="btn-submit-withdraw-request"
                      type="submit"
                      disabled={!user?.realName || !user?.bankAccountNum}
                      className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      ส่งคำร้องคำขอขอการถอนถอนเงิน
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* TAB 3: Trading Record บันทึกเทรด */}
            {activeTab === "trading" && (
              <div id="trading-tabv" className="flex-1 overflow-y-auto px-4 py-6 space-y-4 animate-fade-in text-left pb-24">
                
                {/* 2-Tab Segmented Selector Buttons */}
                <div id="trading-tabs-bar" className="flex bg-slate-100 p-1.5 rounded-2xl w-full border border-slate-150 shadow-xs">
                  <button
                    id="trading-subtab-active"
                    onClick={() => setTradingSubTab('active')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tradingSubTab === 'active' 
                        ? 'bg-white text-slate-800 shadow-xs scale-[1.01]' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                    }`}
                  >
                    <TrendingUp size={14} className={tradingSubTab === 'active' ? 'text-sky-500 animate-pulse' : 'text-slate-400'} />
                    <span>คำสั่งซื้อขาย ({activeOrders.length})</span>
                  </button>
                  <button
                    id="trading-subtab-history"
                    onClick={() => setTradingSubTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tradingSubTab === 'history' 
                        ? 'bg-white text-slate-800 shadow-xs scale-[1.01]' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                    }`}
                  >
                    <History size={14} className={tradingSubTab === 'history' ? 'text-indigo-500' : 'text-slate-400'} />
                    <span>ประวัติการซื้อขาย ({tradeHistory.length})</span>
                  </button>
                </div>

                <div className="w-full">
                  {/* TAB 1: ACTIVE RUNNING CONTRACTS ORDERS */}
                  {tradingSubTab === 'active' && (
                    <div id="active-orders-section" className="bg-white rounded-3xl p-5 border border-slate-150 space-y-4 shadow-sm animate-fade-in">
                      <div className="flex justify-between items-center border-b pb-3">
                        <span className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-sky-500 animate-pulse" />
                          <span>คำสั่งซื้อขายที่ดำเนินการอยู่ ({activeOrders.length})</span>
                        </span>
                        <span className="text-[9px] font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">กระดานซื้อขายเรียลไทม์</span>
                      </div>

                      {activeOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                            <TrendingUp size={18} className="text-slate-300" />
                          </div>
                          <span className="font-medium">ไม่มีตราสารที่กำลังนับถอยหลังอยู่ในพอร์ตปัจจุบัน</span>
                          <span className="text-[10px] text-slate-400 block max-w-xs leading-normal">คุณสามารถเริ่มสั่งซื้อตราสารเพื่อดูผลแบบวินาทีได้ที่หน้าตลาดซื้อขายวันนี้</span>
                        </div>
                      ) : (
                        <div id="active-orders-stack" className="space-y-3">
                          {activeOrders.map((ord) => {
                            const isBuy = ord.type === 'BUY';
                            const isWinning = ord.profitLoss >= 0;
                            return (
                              <div 
                                id={`active-order-card-${ord.id}`}
                                key={ord.id} 
                                className="bg-slate-900 text-white rounded-2xl p-4 text-xs space-y-2.5 relative overflow-hidden shadow-inner border border-slate-850"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {renderStockLogo(ord.stockSymbol, siteSettings.primaryColor)}
                                    <div>
                                      <span className="font-bold text-sm tracking-tight text-white block">{ord.stockSymbol}</span>
                                      <span className="text-[9px] text-slate-400 font-mono block leading-none">{ord.stockName}</span>
                                    </div>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${isBuy ? 'bg-sky-500/25 text-sky-400 border border-sky-500/10' : 'bg-rose-500/25 text-rose-400 border border-rose-500/10'}`}>
                                      {isBuy ? 'BUY / ขึ้น' : 'SELL / ลง'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono">
                                    <span>เวลาถอยหลัง:</span>
                                    <span className="text-xs bg-slate-950 p-1 px-2 rounded-md font-extrabold border border-slate-800 text-sky-300 animate-pulse">{ord.timeRemaining} วิ</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-mono py-2 bg-slate-950/40 px-3 rounded-xl border border-slate-800/40">
                                  <div>เงินลงทุน: <strong className="text-white">฿{ord.amount.toLocaleString()}</strong></div>
                                  <div>ราคาเปิดพอร์ต: <strong className="text-white">฿{ord.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                                </div>

                                <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
                                  <span className="text-[10px] font-semibold text-slate-400">สรุปกำไรขาดทุนลอยเรียลไทม์:</span>
                                  <span 
                                    id={`active-pnl-${ord.id}`}
                                    className={`font-mono font-bold text-sm ${isWinning ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}
                                  >
                                    ฿{ord.profitLoss >= 0 ? "+" : ""}{ord.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: THE HISTORIC PAST TRADES */}
                  {tradingSubTab === 'history' && (
                    <div id="history-orders-section" className="bg-white rounded-3xl p-5 border border-slate-150 space-y-4 shadow-sm animate-fade-in">
                      <div className="flex justify-between items-center border-b pb-3">
                        <span className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <History size={14} className="text-indigo-500" />
                          <span>บันทึกการซื้อขายประวัติที่ผ่านมา ({tradeHistory.length})</span>
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">เสร็จสิ้นแล้ว</span>
                      </div>

                      {tradeHistory.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                            <History size={18} className="text-slate-300" />
                          </div>
                          <span className="font-medium">ยังไม่เคยเปิดข้อเสนอทำรายการเทรนดิ้ง</span>
                          <span className="text-[10px] text-slate-400 block max-w-xs leading-normal">เมื่อเวลาการนับถอยหลังของสัญญาเสริมหรือตราสารครบกำหนด ประวัติการปิดพอร์ตอย่างละเอียดจะถูกอัปเดตและบันทึกประวัติการทำรายการตรงนี้</span>
                        </div>
                      ) : (
                        <div id="closed-orders-stack" className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                          {tradeHistory.map((h) => {
                            const isWin = h.status === 'win';
                            return (
                              <div key={h.id} className="bg-slate-50/50 p-3.5 hover:bg-slate-50 rounded-2xl text-[10px] space-y-2 border border-slate-100 transition-colors">
                                <div className="flex justify-between items-center font-bold">
                                  <div className="flex items-center gap-2">
                                    {renderStockLogo(h.stockSymbol, siteSettings.primaryColor)}
                                    <div>
                                      <span className="text-slate-800 text-xs font-bold block">{h.stockSymbol}</span>
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">{h.stockName || h.stockSymbol}</span>
                                    </div>
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${h.type === 'BUY' ? 'bg-sky-50 text-blue-600 border border-blue-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                      {h.type === 'BUY' ? 'BUY / ขึ้น' : 'SELL / ลง'}
                                    </span>
                                  </div>
                                  <span 
                                    className={`font-mono text-xs font-bold px-2 py-1 rounded-lg ${isWin ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
                                  >
                                    {isWin ? '+฿' + h.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-฿' + Math.abs(h.profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-slate-500 text-[9px] font-mono py-1.5 border-t border-dashed border-slate-200/60">
                                  <div>ราคาเปิด: <strong className="text-slate-700">฿{h.entryPrice.toLocaleString()}</strong></div>
                                  <div>ปิดราคา: <strong className="text-slate-700">฿{h.closePrice?.toLocaleString()}</strong></div>
                                  <div>เงินจองสิทธิ์: <strong className="text-slate-700">฿{h.amount.toLocaleString()}</strong></div>
                                  <div>วันเวลาปิดแผน: <strong className="text-slate-700">{new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString()}</strong></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: Profile ของฉัน */}
            {activeTab === "profile" && (
              <div id="profile-tabv" className="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-fade-in text-left">
                
                {/* PROFILE BASIC INFO CARD BOX */}
                <div className="bg-white rounded-3xl p-5 border border-slate-205 shadow-xs flex items-center justify-between border-slate-100">
                  <div className="flex items-center gap-3.5">
                    
                    {/* Editable Upload profile avatar representation */}
                    <div className="relative group">
                      {profileAvatar ? (
                        <img 
                          src={profileAvatar} 
                          alt="Avatar" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-sky-400 shadow-md"
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full text-white text-xl font-bold flex items-center justify-center border-2 border-white/20 shadow-md"
                          style={{ backgroundColor: siteSettings.primaryColor }}
                        >
                          {user?.username ? user.username.charAt(0).toUpperCase() : "M"}
                        </div>
                      )}
                      <button
                        id="btn-upload-profile-avatar"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-0.5 -right-1 p-1 bg-slate-900 border border-slate-700 text-white rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        title="เปลี่ยนรูปโปรไฟล์"
                      >
                        <Upload size={10} />
                      </button>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </div>

                    <div>
                      <h3 id="profile-username" className="font-bold text-base text-slate-800">{user?.username}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">เบอร์โทร: {user?.phone}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span id="profile-user-id" className="text-[9px] bg-slate-50 border px-2 py-0.5 rounded-md font-mono text-slate-500">ID: {user?.id}</span>
                        <span id="profile-vip-pill" className="text-[9px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full select-none shadow-xs">VIP {user?.vipLevel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profit overlay quick overview */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block -mb-0.5">เงินทุนคงเหลือ:</span>
                    <span className="font-mono font-bold text-base text-slate-800 block">฿{myBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* AUX SPECIAL DIRECT DOUBLE-COLUMN ACTION BUTTON SHORTCUTS */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-shortcut-chat-re"
                    onClick={() => setLiveChatOpen(true)}
                    className="flex items-center gap-2.5 p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 text-xs text-slate-750 font-bold justify-center"
                  >
                    <MessageCircle size={15} className="text-sky-500 animate-pulse" />
                    <span>แชตติดต่อแอดมิน</span>
                  </button>
                  <button
                    id="btn-shortcut-withdraw"
                    onClick={() => setActiveTab("assets")}
                    className="flex items-center gap-2.5 p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 text-xs text-slate-750 font-bold justify-center"
                  >
                    <Wallet size={15} className="text-emerald-500" />
                    <span>ถอนเงินด่วน</span>
                  </button>
                </div>

                {/* AUXILIARY DETAILED LIST MENUS */}
                <div id="profile-extra-menu-list" className="bg-white rounded-3xl overflow-hidden border border-slate-150 divide-y divide-slate-100/50">
                  
                  {/* 1. Live Customer service */}
                  <button
                    id="menu-customer-chat"
                    onClick={() => setLiveChatOpen(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageCircle size={15} className="text-sky-500" />
                      <span>1) ฝ่ายบริการลูกค้าแชตสดออนไลน์ (Live Chat)</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {/* 2. Withdrawal records */}
                  <button
                    id="menu-with-logs"
                    onClick={() => setWithHistoryOpen(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <History size={15} className="text-rose-500" />
                      <span>2) บันทึกการถอนเงินสด (Withdraw Logs)</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {/* 3. Deposit records */}
                  <button
                    id="menu-dep-logs"
                    onClick={() => setDepHistoryOpen(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={15} className="text-emerald-500" />
                      <span>3) บันทึกการเติมเงินประวัติ (Deposit Logs)</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {/* 4. Complete logs shortcut link */}
                  <button
                    id="menu-trades-shortcut"
                    onClick={() => setActiveTab("trading")}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ReceiptText size={15} className="text-slate-500" />
                      <span>4) บันทึกข้อมูลและประวัติการซื้อขายทั้งหมด</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {/* 5. Personal information portal setup */}
                  <button
                    id="menu-personal-info"
                    onClick={() => setPersonalInfoOpen(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck size={15} className="text-indigo-500" />
                      <span>5) ข้อมูลส่วนบุคคลบัญชีฉัน (Personal Info)</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {/* 6. Payment structures */}
                  <button
                    id="menu-payment-info"
                    onClick={() => setPaymentGuideOpen(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle size={15} className="text-amber-500" />
                      <span>6) วิธีการชำระเงินและกติกาถอนฝาก (Payment Guide)</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {/* 7. Promotions banner details list */}
                  <button
                    id="menu-site-promos"
                    onClick={() => setPromotionsOpen(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Gift size={15} className="text-purple-500" />
                      <span>7) กิจกรรมส่งเสริมตลาดและโบนัสต่างๆ (Campaigns)</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {/* 8. Logout System button */}
                  <button
                    id="menu-systems-logout"
                    onClick={handleLogout}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-bold text-rose-600 hover:bg-rose-50/55 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut size={15} className="text-rose-500" />
                      <span>8) ออกจากระบบจากเครื่องพกพานี้ (Logout)</span>
                    </div>
                    <ChevronRight size={13} className="text-rose-400" />
                  </button>
                </div>

              </div>
            )}

            {/* SYSTEM OVERLAYS SUB-VIEWS AND DETAILS PORTALS */}

            {/* OVERLAY 1: Customer Live Chat help online */}
            {liveChatOpen && user && (
              <div id="overlay-livechat" className="absolute inset-0 z-50 bg-white">
                <LiveChat 
                  userPhone={user.phone}
                  userName={user.username}
                  primaryColor={siteSettings.primaryColor}
                  onBack={() => setLiveChatOpen(false)}
                />
              </div>
            )}

            {/* OVERLAY 2: Personal Information setup (5) */}
            {personalInfoOpen && user && (
              <div id="overlay-personalinfo" className="absolute inset-0 z-45 bg-slate-50 overflow-y-auto px-5 py-6 space-y-4 animate-slide-up pb-10">
                <div className="flex items-center justify-between border-b pb-3.5 text-slate-900">
                  <h3 className="font-bold text-sm tracking-tight">ข้อมูลส่วนบุคคลบัญชีฉัน</h3>
                  <button onClick={() => setPersonalInfoOpen(false)} className="text-slate-400 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePersonalInfoSave} className="space-y-4 text-left text-xs bg-white rounded-3xl p-5 border shadow-sm">
                  
                  {/* Nickname editable */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">ชื่อเล่น / นามแฝงผู้เทรดเดอร์ (แก้ไขได้):</label>
                    <input 
                      id="personal-nickname-input"
                      type="text"
                      placeholder="ใส่ชื่อเล่น..."
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>

                  {/* Birthday selection editable */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">วันเดือนปีเกิดของฉัน (แก้ไขได้):</label>
                    <input 
                      id="personal-birthday-input"
                      type="date"
                      value={tempBirthday}
                      onChange={(e) => setTempBirthday(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-slate-700 bg-white"
                    />
                  </div>

                  {/* PHONE COMPULSORY LOCK */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <span>เบอร์โทรศัพท์ที่ใช้ผูกบัญชี:</span>
                      <strong className="text-rose-500">[ ล็อกตายตัว - ห้ามแก้ไข ]</strong>
                    </label>
                    <input 
                      id="personal-phone-lock"
                      type="text"
                      value={user.phone}
                      disabled
                      className="w-full px-3 py-2 border bg-slate-100 text-slate-400 rounded-xl font-mono"
                    />
                  </div>

                  {/* UNIQUE ONE TIME PROFILE WRITE BANK DETAILS (ชื่อจริง, ธนาคาร, บัญชี) */}
                  <div className="pt-3 border-t border-dashed space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">ชื่อ-นามสกุลจริงผู้เล่น (บันทึกได้แค่ครั้งเดียว):</label>
                      <input 
                        id="personal-realname"
                        type="text"
                        placeholder="ป้อนชื่อและสนามสกุลจริง..."
                        value={realNameInput}
                        onChange={(e) => setRealNameInput(e.target.value)}
                        disabled={!!user.realName}
                        className={`w-full px-3 py-2 border rounded-xl font-bold ${user.realName ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">ชื่อธนาคารของไทยโอนเงิน (บันทึกได้แค่ครั้งเดียว):</label>
                      <input 
                        id="personal-bankname"
                        type="text"
                        placeholder="เช่น ไทยพาณิชย์, กสิกรไทย, กรุงเทพ..."
                        value={bankNameInput}
                        onChange={(e) => setBankNameInput(e.target.value)}
                        disabled={!!user.bankName}
                        className={`w-full px-3 py-2 border rounded-xl font-bold ${user.bankName ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 font-mono">เลขบีกที่บัญชีเงินฝาก (บันทึกได้แค่ครั้งเดียว):</label>
                      <input 
                        id="personal-bank-account"
                        type="text"
                        placeholder="เช่น 123-4-56789-0..."
                        value={bankAccountInput}
                        onChange={(e) => setBankAccountInput(e.target.value)}
                        disabled={!!user.bankAccountNum}
                        className={`w-full px-3 py-2 border rounded-xl font-bold font-mono ${user.bankAccountNum ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
                      />
                    </div>

                    {/* RED permanent warning message note label */}
                    <p id="personal-warning-note" className="text-[10px] text-rose-500 font-bold shrink-0">
                      ⚠ หมายเหตุสีแดง: ส่วนบัญชีธนาคารหากบันทึกแล้วจะคีย์ล็อกตายแก้ไขไม่ได้ หากต้องการเปลี่ยนเลขบัญชีโปรดติดต่อแอดมินหรือฝ่ายบริการลูกค้าเท่านั้น!
                    </p>
                  </div>

                  <button
                    id="btn-save-personal-info"
                    type="submit"
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md mt-4 transition-transform active:scale-95 cursor-pointer"
                    style={{ backgroundColor: siteSettings.primaryColor }}
                  >
                    ยืนยันบันทึกข้อมูลส่วนบุคคล
                  </button>
                </form>
              </div>
            )}

            {/* OVERLAY 3: Payment instructions Guide page (6) */}
            {paymentGuideOpen && (
              <div id="overlay-payment-guide" className="absolute inset-0 z-45 bg-slate-50 px-5 py-6 overflow-y-auto space-y-4 animate-slide-up">
                <div className="flex items-center justify-between border-b pb-3.5">
                  <h3 className="font-bold text-sm">คู่มือฝากเงินและชำระเงิน</h3>
                  <button onClick={() => setPaymentGuideOpen(false)} className="text-slate-400 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-5 border text-left text-xs space-y-4 text-slate-600 leading-relaxed shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 -mt-1">เครือข่ายความปลอดภัยธุรกรรมใน MiTrade</h4>
                  
                  <p>
                    เพื่อป้องกันการหลอกลวง แบล็กลิชเงิน และสปายบิล ระบบอัตโนมัติจะไม่เปิดให้ยูสเซอร์กรอกชื่อเลขบัญชีสุ่มแอดวานซ์ด้วยตัวเองบนหน้าเว็ย
                  </p>
                  
                  <blockquote className="border-l-4 border-sky-400 pl-3 py-1 bg-sky-50/50 rounded-r-lg font-bold text-slate-900 text-[11px]">
                    "การชำระเงินหรือเติมเงินและถอนเงินในเว็บไซต์นี้ ลูกค้าต้องทำการกดแจ้งแอดมินหรือติดต่อฝ่ายบริการลูกค้าผ่านระบบ Live Help หรือช่องที่ทางแอดมินระบุ เพื่อดำเนินการและยืนยันทางสลิปกระดาษเท่านั้น"
                  </blockquote>

                  <h5 className="font-bold text-slate-800 pt-2 text-[11px]">ขั้นตอนปฏิบัติการฝากเงิน:</h5>
                  <ol className="list-decimal pl-4.5 space-y-1">
                    <li>ไปที่แท็บ <b>"ของฉัน"</b> หรือ <b>"สินทรัพย์"</b></li>
                    <li>เลือกเมนูลัด <b>"แชตติดต่อแอดมิน"</b></li>
                    <li>แจ้งพนักงานว่าต้องการเติมเครดิตและจำนวนเงิน</li>
                    <li>โอนไปยัง บัญชีธนาคาร ที่จุดซัพพอร์ตกำหนด</li>
                    <li>กดปุ่ม <b>แนบไฟล์หนีบกระดาษ</b> เพื่อถ่ายภาพสติกหรืออัปโหลดสลิปจากคลังจริง ส่งเป็นหลักฐาน</li>
                    <li>แอดมินอนุมัติผ่านระบบหลังบ้าน ยอดเงินจะเพิ่มขึ้นทันที!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* OVERLAY 4: Promotional campaigns list (7) */}
            {promotionsOpen && (
              <div id="overlay-promotions" className="absolute inset-0 z-45 bg-slate-50 px-5 py-6 overflow-y-auto space-y-4 animate-slide-up">
                <div className="flex items-center justify-between border-b pb-3.5">
                  <h3 className="font-bold text-sm">โปรโมชั่นและโบนัสเว็บไซต์</h3>
                  <button onClick={() => setPromotionsOpen(false)} className="text-slate-400 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3.5 text-left text-xs">
                  {siteSettings.promotionSlides.map((p, idx) => (
                    <div key={p.id || idx} className="bg-white rounded-3xl border overflow-hidden shadow-xs">
                      <img src={p.imageUrl} alt="Promotion banner" className="w-full h-36 object-cover" />
                      <div className="p-4 space-y-1 bg-white">
                        <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2.5 py-0.5 rounded-full">ACTIVE BONUS</span>
                        <h4 className="font-bold text-slate-800 text-sm">{p.caption}</h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          ติดต่อแอดมินฝ่ายบริการลูกค้าแบบสดเพื่อแลกรับและอ่านเงื่อนไขกิจกรรมสเตปขั้นต่ำการเล่นคลาดเป้าหมายได้เลยวันนี้!
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OVERLAY 5: Withdrawal History Logs */}
            {withHistoryOpen && user && (
              <div id="overlay-with-history" className="absolute inset-0 z-45 bg-slate-50 px-5 py-6 overflow-y-auto space-y-4 animate-slide-up">
                <div className="flex items-center justify-between border-b pb-3.5">
                  <h3 className="font-bold text-sm">ประวัติการถอนเงิน</h3>
                  <button onClick={() => setWithHistoryOpen(false)} className="text-slate-400 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2 text-left">
                  {tradeHistory.length === 0 && (
                    <div id="history-ajax-loader" className="text-center py-10 opacity-0 absolute">Sync loading</div>
                  )}
                  {/* Fetch from storage request logs */}
                  <WithdrawalRecordsList userPhone={user.phone} />
                </div>
              </div>
            )}

            {/* OVERLAY 6: Deposit History Logs */}
            {depHistoryOpen && user && (
              <div id="overlay-dep-history" className="absolute inset-0 z-45 bg-slate-50 px-5 py-6 overflow-y-auto space-y-4 animate-slide-up">
                <div className="flex items-center justify-between border-b pb-3.5">
                  <h3 className="font-bold text-sm">ประวัติการเติมเครดิต</h3>
                  <button onClick={() => setDepHistoryOpen(false)} className="text-slate-400 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2 text-left">
                  <DepositRecordsList userPhone={user.phone} />
                </div>
              </div>
            )}

            {/* INTERACTIVE TRADE popup ORDER SUBMISSIONS */}
            {tradePopupMeta && user && (
              <TradingPopup 
                symbol={tradePopupMeta.symbol}
                stockName={assetsList.find(s=>s.symbol === tradePopupMeta.symbol)?.name || tradePopupMeta.symbol}
                currentPrice={assetsList.find(s=>s.symbol === tradePopupMeta.symbol)?.priceInThb || 1}
                type={tradePopupMeta.type}
                userBalance={myBalance}
                primaryColor={siteSettings.primaryColor}
                onClose={() => setTradePopupMeta(null)}
                onTradeSuccess={(newBalance) => {
                  setMyBalance(newBalance);
                  fetchUserTrades(user.id);
                }}
              />
            )}

            {/* BOTTOM NAV BAR */}
            <Footer 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              primaryColor={siteSettings.primaryColor}
            />

          </div>
        )}

        {/* OVERLAY SYSTEM BACK-END ADMIN MANAGEMENT SYSTEM */}
        {adminPanelOpen && user && user.isAdmin && (
          <AdminPanel 
            currentUser={user}
            primaryColor={siteSettings.primaryColor}
            onClose={() => setAdminPanelOpen(false)}
            onRefreshSettings={() => {
              fetchSettings();
              fetchPrices();
            }}
          />
        )}

      </section>

      {/* FIXED TOAST BAR NOTIFICATIONS */}
      {globalMessage && (
        <div 
          id="global-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 bg-slate-900 border text-white text-xs font-bold px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm w-fit border-slate-800 animate-slide-up"
        >
          <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: globalMessage.type === 'ok' ? '#10b981' : '#f43f5e' }}></div>
          <span>{globalMessage.msg}</span>
        </div>
      )}


    </main>
  );
}

// Nested records renderer for deposits logs
function DepositRecordsList({ userPhone }: { userPhone: string }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/transactions/records/${userPhone}`)
      .then(r => r.json())
      .then(data => setItems(data.deposits || []))
      .catch(() => {});
  }, [userPhone]);

  return (
    <div id="sub-deposits-history-list" className="space-y-2">
      {items.length === 0 ? (
        <p className="text-slate-400 text-xs italic text-center py-4">ไม่พบประวัติฝากเงินที่บันทึกไว้</p>
      ) : (
        items.map((i) => (
          <div key={i.id} className="bg-white p-3.5 rounded-2xl border text-xs text-left shadow-xs">
            <div className="flex justify-between items-center font-bold">
              <span className="text-emerald-600">+฿{i.amount.toLocaleString()} THB</span>
              <span className="text-[10px] text-slate-400 font-mono">ฝากเงินเรียบร้อย</span>
            </div>
            <p className="text-[10px] text-slate-450 text-slate-500 mt-1">หมายเหตุ: {i.note || "โอนผ่านแอดมิน"}</p>
            <span className="text-[8px] text-slate-400 block text-right mt-1 font-mono">{new Date(i.timestamp).toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  );
}

// Nested records renderer for withdrawals logs
function WithdrawalRecordsList({ userPhone }: { userPhone: string }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/transactions/records/${userPhone}`)
      .then(r => r.json())
      .then(data => setItems(data.withdrawals || []))
      .catch(() => {});
  }, [userPhone]);

  return (
    <div id="sub-withdraw-history-list" className="space-y-2">
      {items.length === 0 ? (
        <p className="text-slate-400 text-xs italic text-center py-4">ไม่พบประวัติคำร้องถอนเงิน</p>
      ) : (
        items.map((i) => {
          const isApp = i.status === "approved";
          const isRej = i.status === "rejected";
          return (
            <div key={i.id} className="bg-white p-3.5 rounded-2xl border text-xs text-left shadow-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-800">฿{i.amount.toLocaleString()} THB</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md ${
                  isApp ? 'bg-emerald-50 text-emerald-600' : isRej ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {isApp ? 'สำเร็จแล้ว' : isRej ? 'ถูกปฏิเสธ' : 'กำลังดำเนินการ'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">หมายเหตุ: {i.note || "ไม่มี"}</p>
              <span className="text-[8px] text-slate-400 block text-right mt-1 font-mono">{new Date(i.timestamp).toLocaleString()}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
