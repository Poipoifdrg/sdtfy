import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, SystemSettings, StockItem, OrderItem, 
  DepositRecord, WithdrawalRecord, ChatRoom, ChatMessage 
} from "./src/types";

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data-store.json");

interface DatabaseSchema {
  users: User[];
  settings: SystemSettings;
  depositRecords: DepositRecord[];
  withdrawalRecords: WithdrawalRecord[];
  tradeHistory: OrderItem[];
  activeOrders: OrderItem[];
  chatRooms: ChatRoom[];
}

// Default initial state
const defaultDb: DatabaseSchema = {
  users: [
    {
      id: "usr_superadmin",
      phone: "0984412389",
      username: "ผู้ร่วมก่อตั้ง (Super Admin)",
      birthday: "1990-01-01",
      vipLevel: 5,
      balance: 1000000.0,
      realName: "Pachai MiTrade",
      bankName: "ธนาคารไทยพาณิชย์",
      bankAccountNum: "111-222-3333",
      loginPassword: "PachaiMiTrade",
      txPassword: "99999999",
      status: "active" as const,
      isAdmin: true,
      isSuperAdmin: true,
    },
    {
      id: "usr_1",
      phone: "0812345678",
      username: "จิรวัฒน์ เทรดเดอร์",
      birthday: "1994-05-12",
      vipLevel: 2,
      balance: 50000.0,
      realName: "จิรวัฒน์ แดงดี",
      bankName: "ธนาคารกสิกรไทย",
      bankAccountNum: "012-3-45678-9",
      loginPassword: "12345678",
      txPassword: "11223344",
      status: "active" as const,
      isAdmin: false,
    },
    {
      id: "usr_2",
      phone: "0999999999",
      username: "กิตติพงษ์ เพชรแท้",
      birthday: "1998-08-20",
      vipLevel: 1,
      balance: 5000.0,
      realName: "กิตติพงษ์ ยอดดี",
      bankName: "ธนาคารกรุงเทพ",
      bankAccountNum: "101-2-34567-8",
      loginPassword: "11112222",
      txPassword: "22334455",
      status: "active" as const,
      isAdmin: false,
    }
  ],
  settings: {
    siteTitle: "MiTrade",
    logoUrl: "",
    primaryColor: "#3B82F6", // Default polished blue theme
    promotionSlides: [
      { id: "slide_1", imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80", caption: "ต้อนรับสมาชิกใหม่ รับโบนัสฟรี 50%! ติดต่อแอดมินด่วนวันนี้" },
      { id: "slide_2", imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80", caption: "กิจกรรม VIP สุ่มรับรางวัลเงินสดสูงสุด 10,000 บาททุกสัปดาห์!" },
      { id: "slide_3", imageUrl: "https://images.unsplash.com/photo-1642390141525-4c68832a51de?auto=format&fit=crop&w=600&q=80", caption: "ระบบเทรดโมเดิร์น โหลดไว ปลอดภัย รองรับฝากถอน 24 ชั่วโมง" }
    ]
  },
  depositRecords: [
    {
      id: "dep_1",
      userId: "usr_1",
      phone: "0812345678",
      username: "จิรวัฒน์ เทรดเดอร์",
      amount: 15000,
      status: "approved" as const,
      note: "ฝากเงินครั้งแรกสำเร็จและรับโบนัส",
      timestamp: "2026-06-19T10:00:00.000Z"
    }
  ],
  withdrawalRecords: [],
  tradeHistory: [],
  activeOrders: [],
  chatRooms: []
};

// Global Store
let dbState: DatabaseSchema = { ...defaultDb };

// Load Store from file or save defaults
function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileData = fs.readFileSync(DB_PATH, "utf8");
      dbState = JSON.parse(fileData);
      
      // Ensure default super admin always exists
      const superAdminExists = dbState.users.some(u => u.phone === "0984412389");
      if (!superAdminExists) {
        dbState.users.push(dbState.users[0] || defaultDb.users[0]);
      }
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error("Failed to load state database, using in-memory default", err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbState, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write state database", err);
  }
}

loadDatabase();

// 20 stocks initial seed positions
let livePrices: Record<string, { price: number; high: number; low: number; count: number; initial: number }> = {
  "BTC": { price: 2341250.0, high: 2368000.0, low: 2315000.0, count: 0, initial: 2341250.0 },
  "ETH": { price: 112150.0, high: 114500.0, low: 110200.0, count: 0, initial: 112150.0 },
  "BNB": { price: 18450.0, high: 18900.0, low: 18100.0, count: 0, initial: 18450.0 },
  "LTC": { price: 2542.0, high: 2610.0, low: 2490.0, count: 0, initial: 2542.0 },
  "SOL": { price: 5840.0, high: 5990.0, low: 5710.0, count: 0, initial: 5840.0 },
  "ADA": { price: 13.52, high: 13.90, low: 13.10, count: 0, initial: 13.52 },
  "XRP": { price: 19.82, high: 20.30, low: 19.40, count: 0, initial: 19.82 },
  "AAPL": { price: 5824.0, high: 5890.0, low: 5740.0, count: 0, initial: 5824.0 },
  "GOOG": { price: 5952.0, high: 6020.0, low: 5880.0, count: 0, initial: 5952.0 },
  "TSLA": { price: 6112.0, high: 6240.0, low: 5980.0, count: 0, initial: 6112.0 },
  "DOGE": { price: 5.42, high: 5.68, low: 5.21, count: 0, initial: 5.42 },
  "USDT": { price: 36.70, high: 36.85, low: 36.50, count: 0, initial: 36.70 },
  "MSFT": { price: 13820.0, high: 13990.0, low: 13650.0, count: 0, initial: 13820.0 },
  "AMZN": { price: 6315.0, high: 6410.0, low: 6220.0, count: 0, initial: 6315.0 },
  "NVDA": { price: 4210.0, high: 4320.0, low: 4110.0, count: 0, initial: 4210.0 },
  "META": { price: 16530.0, high: 16750.0, low: 16220.0, count: 0, initial: 16530.0 },
  "NFLX": { price: 21450.0, high: 21850.0, low: 21100.0, count: 0, initial: 21450.0 },
  "NKE": { price: 2912.0, high: 2980.0, low: 2850.0, count: 0, initial: 2912.0 },
  "SBUX": { price: 2840.0, high: 2910.0, low: 2780.0, count: 0, initial: 2840.0 },
  "COIN": { price: 7120.0, high: 7280.0, low: 6940.0, count: 0, initial: 7120.0 }
};

// Mimic dynamic price fluctuation
function fluctuatePrices() {
  for (const sym in livePrices) {
    const data = livePrices[sym];
    const fluctuationPercent = (Math.random() - 0.5) * 0.003; // +- 0.15% change
    data.price = Number((data.price * (1 + fluctuationPercent)).toFixed(2));
    if (data.price > data.high) data.high = data.price;
    if (data.price < data.low) data.low = data.price;
    data.count += 1;
  }
}

// Background scheduler running every 1 second
setInterval(() => {
  fluctuatePrices();
  processActiveOrders();
}, 1000);

// Active orders processing
function processActiveOrders() {
  let changed = false;
  const now = Date.now();
  
  dbState.activeOrders = dbState.activeOrders.map((order: any) => {
    const timeRemaining = Math.max(0, Math.floor((order.endTime - now) / 1000));
    order.timeRemaining = timeRemaining;
    
    // Live floating estimate of profit-loss before close
    const currentPrice = livePrices[order.stockSymbol]?.price || order.entryPrice;
    const isBuy = order.type === 'BUY';
    const hasGoneUp = currentPrice > order.entryPrice;
    
    // Calculate P&L
    let profitLoss = 0;
    if (isBuy) {
      profitLoss = hasGoneUp ? order.amount * 0.85 : -order.amount;
    } else {
      profitLoss = !hasGoneUp ? order.amount * 0.85 : -order.amount;
    }
    order.profitLoss = Number(profitLoss.toFixed(2));
    
    if (timeRemaining <= 0) {
      // Settle the order
      const finalPrice = currentPrice;
      const finalWin = isBuy ? (finalPrice > order.entryPrice) : (finalPrice < order.entryPrice);
      
      const settledOrder: OrderItem = {
        ...order,
        status: finalWin ? 'win' : 'lose',
        timeRemaining: 0,
        closePrice: finalPrice,
        profitLoss: finalWin ? Number((order.amount * 0.85).toFixed(2)) : -order.amount
      };

      // Add payout to user balance if win
      const uIndex = dbState.users.findIndex(u => u.id === order.userId);
      if (uIndex !== -1) {
        if (finalWin) {
          dbState.users[uIndex].balance = Number((dbState.users[uIndex].balance + order.amount + (order.amount * 0.85)).toFixed(2));
        } else {
          // Balance was already deducted when creating order, so nothing to refund.
          // Note details if needed
        }
      }
      
      // Save order to trade history
      dbState.tradeHistory.push(settledOrder as any);
      changed = true;
      return null; // remove from active
    }
    
    return order;
  }).filter(Boolean) as any;

  if (changed) {
    saveDatabase();
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get Settings
  app.get("/api/settings", (req, res) => {
    res.json(dbState.settings);
  });

  // Update Settings (Admin Only)
  app.post("/api/settings", (req, res) => {
    const { siteTitle, logoUrl, primaryColor, promotionSlides } = req.body;
    dbState.settings = {
      siteTitle: siteTitle || dbState.settings.siteTitle,
      logoUrl: logoUrl !== undefined ? logoUrl : dbState.settings.logoUrl,
      primaryColor: primaryColor || dbState.settings.primaryColor,
      promotionSlides: promotionSlides || dbState.settings.promotionSlides
    };
    saveDatabase();
    res.json({ success: true, settings: dbState.settings });
  });

  // Get Live Prices Grid
  app.get("/api/stocks", (req, res) => {
    const list: StockItem[] = Object.keys(livePrices).map(sym => {
      const data = livePrices[sym];
      const nameMapping: Record<string, string> = {
        "BTC": "Bitcoin", "ETH": "Ethereum", "BNB": "Binance Coin (BNB)", "LTC": "Litecoin", "SOL": "Solana",
        "ADA": "Cardano", "XRP": "Ripple", "AAPL": "Apple Inc.", "GOOG": "Alphabet Inc.", "TSLA": "Tesla Motor",
        "DOGE": "Dogecoin (DOGE)", "USDT": "Tether USD (USDT)", "MSFT": "Microsoft", "AMZN": "Amazon Web",
        "NVDA": "NVIDIA Corp", "META": "Meta Platform", "NFLX": "Netflix Inc.", "NKE": "Nike Inc.",
        "SBUX": "Starbucks Corp.", "COIN": "Coinbase Exchange"
      };
      
      const changePercent = Number(((data.price - data.initial) / data.initial * 100).toFixed(2));
      
      return {
        id: sym.toLowerCase(),
        name: nameMapping[sym] || sym,
        symbol: sym,
        logo: sym, // Use matching icons
        priceInThb: data.price,
        highThb: data.high,
        lowThb: data.low,
        changePercent: changePercent
      };
    });
    res.json(list);
  });

  // Get Stock candlestick chart series
  app.get("/api/stocks/:symbol/chart", (req, res) => {
    const sym = req.params.symbol.toUpperCase();
    const range = (req.query.range as string) || "1D";
    const data = livePrices[sym];
    if (!data) {
      return res.status(404).json({ error: "Stock not found" });
    }

    // Determine number of points based on Range
    let pointsCount = 20;
    if (range === "1D") pointsCount = 24;
    else if (range === "1W") pointsCount = 7;
    else if (range === "1M") pointsCount = 30;
    else if (range === "6M") pointsCount = 26;
    else if (range === "1Y") pointsCount = 12;

    const basePrice = data.initial;
    let chartPoints = [];
    let rollingPrice = basePrice * 0.98;

    for (let i = 0; i < pointsCount; i++) {
      const completionFraction = (i + 1) / pointsCount;
      // Make the final price anchor onto the current live price
      const targetAvg = rollingPrice + (data.price - rollingPrice) * completionFraction;
      const variation = targetAvg * 0.015; // 1.5% range
      
      const open = Number((targetAvg + (Math.random() - 0.5) * variation).toFixed(2));
      const close = i === pointsCount - 1 ? data.price : Number((targetAvg + (Math.random() - 0.5) * variation).toFixed(2));
      
      const high = Number((Math.max(open, close) + Math.random() * (variation * 0.5)).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * (variation * 0.5)).toFixed(2));

      // Generate localized Thai time indicators / labels
      let timeLabel = "";
      if (range === "1D") {
        timeLabel = `${String(i).padStart(2, '0')}:00`;
      } else if (range === "1W") {
        const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์", "อาทิตย์"];
        timeLabel = days[i % 7];
      } else if (range === "1M") {
        timeLabel = `วันที่ ${i + 1}`;
      } else if (range === "6M") {
        timeLabel = `สัปดาห์ ${i + 1}`;
      } else if (range === "1Y") {
        const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        timeLabel = months[i % 12];
      }

      chartPoints.push({
        time: timeLabel,
        open,
        high,
        low,
        close
      });
      rollingPrice = close;
    }

    res.json(chartPoints);
  });

  // User Login
  app.post("/api/auth/login", (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: "โปรดป้อนเบอร์โทรและรหัสผ่าน" });
    }

    const user = dbState.users.find(u => u.phone === phone);
    if (!user) {
      return res.status(401).json({ error: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
    }

    if (user.loginPassword !== password) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    if (user.status === "frozen") {
      return res.status(403).json({ error: "บัญชีคุณถูกอายัด โปรดติดต่อฝ่ายบริการลูกค้า" });
    }

    if (user.status === "banned") {
      return res.status(403).json({ error: "คุณถูกแบน โปรดติดต่อฝ่ายบริการลูกค้า" });
    }

    res.json({ success: true, user });
  });

  // User Register (Only normal users, not admin)
  app.post("/api/auth/register", (req, res) => {
    const { phone, username, loginPassword, txPassword } = req.body;
    
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องมี 10 หลักเท่านั้น" });
    }
    if (!username) {
      return res.status(400).json({ error: "โปรดกรอกชื่อเล่น / ชื่อผู้ใช้" });
    }
    if (!loginPassword || loginPassword.length < 8) {
      return res.status(400).json({ error: "รหัสผ่านเข้าสู่ระบบต้องมีความยาว 8 ตัวอักษรขึ้นไป" });
    }
    if (!txPassword) {
      return res.status(400).json({ error: "โปรดตั้งรหัสผ่านธุรกรรมทางการเงิน" });
    }

    // Check availability
    const exists = dbState.users.some(u => u.phone === phone);
    if (exists) {
      return res.status(400).json({ error: "เบอร์โทรศัพท์นี้ลงทะเบียนไปแล้ว" });
    }

    const newUser: User = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      phone,
      username,
      birthday: "",
      vipLevel: 1,
      balance: 0.0, // Starter zero balance
      status: "active",
      isAdmin: false,
      loginPassword,
      txPassword,
      realName: "",
      bankName: "",
      bankAccountNum: ""
    };

    dbState.users.push(newUser);
    saveDatabase();

    res.json({ success: true, user: newUser });
  });

  // Get User Profile
  app.get("/api/users/profile/:userId", (req, res) => {
    const user = dbState.users.find(u => u.id === req.params.userId || u.phone === req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }
    res.json(user);
  });

  // Update Client Profile (Personal info)
  app.post("/api/users/update-profile", (req, res) => {
    const { userId, username, birthday, realName, bankName, bankAccountNum } = req.body;
    const index = dbState.users.findIndex(u => u.id === userId);
    if (index === -1) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    const currentUser = dbState.users[index];

    // Read details and check locking logic
    const oldRealName = currentUser.realName;
    const oldBankName = currentUser.bankName;
    const oldBankAccountNum = currentUser.bankAccountNum;

    // Normal text updates
    if (username !== undefined) currentUser.username = username;
    if (birthday !== undefined) currentUser.birthday = birthday;

    // For permanent write-once logic of banking/realName profile
    if (!oldRealName && realName) currentUser.realName = realName;
    if (!oldBankName && bankName) currentUser.bankName = bankName;
    if (!oldBankAccountNum && bankAccountNum) currentUser.bankAccountNum = bankAccountNum;

    saveDatabase();
    res.json({ success: true, user: currentUser });
  });

  // Finance Deposit requesting
  app.post("/api/transactions/deposit-request", (req, res) => {
    const { userId, amount } = req.body;
    const user = dbState.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    const newDep: DepositRecord = {
      id: "dep_" + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      phone: user.phone,
      username: user.username,
      amount: Number(amount),
      status: 'pending',
      note: "รอการติดต่อยืนยันทางฝ่ายบริการลูกค้า",
      timestamp: new Date().toISOString()
    };

    dbState.depositRecords.push(newDep);
    saveDatabase();
    res.json({ success: true, record: newDep });
  });

  // Finance Withdraw requesting
  app.post("/api/transactions/withdraw-request", (req, res) => {
    const { userId, amount, txPassword } = req.body;
    
    const userIndex = dbState.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    const user = dbState.users[userIndex];
    if (user.txPassword !== txPassword) {
      return res.status(400).json({ error: "รหัสผ่านธุรกรรมการเงินไม่ถูกต้อง" });
    }

    if (user.balance < Number(amount)) {
      return res.status(400).json({ error: "ยอดเงินคงเหลือไม่เพียงพอสำหรับถอน" });
    }

    // Deduct balance instantly
    dbState.users[userIndex].balance = Number((dbState.users[userIndex].balance - Number(amount)).toFixed(2));

    const newWith: WithdrawalRecord = {
      id: "with_" + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      phone: user.phone,
      username: user.username,
      amount: Number(amount),
      status: 'pending',
      note: "กำลังตรวจสอบธุรกรรมการโอนออก",
      timestamp: new Date().toISOString()
    };

    dbState.withdrawalRecords.push(newWith);
    saveDatabase();
    res.json({ success: true, record: newWith, balance: dbState.users[userIndex].balance });
  });

  // Get Finance Records for a User
  app.get("/api/transactions/records/:userId", (req, res) => {
    const userId = req.params.userId;
    const deposits = dbState.depositRecords.filter(d => d.userId === userId || d.phone === userId);
    const withdrawals = dbState.withdrawalRecords.filter(w => w.userId === userId || w.phone === userId);
    res.json({ deposits, withdrawals });
  });

  // Submit Trading Order
  app.post("/api/trade/order", (req, res) => {
    const { userId, stockSymbol, type, amount, duration } = req.body;
    
    const userIndex = dbState.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    const user = dbState.users[userIndex];
    const orderAmt = Number(amount);
    if (user.balance < orderAmt) {
      return res.status(400).json({ error: "ยอดเงินของท่านไม่เพียงพอสำหรับการเปิดคำสั่งนี้" });
    }

    const currentPrice = livePrices[stockSymbol]?.price;
    if (!currentPrice) {
      return res.status(400).json({ error: "ไม่พบข้อมูลราคาหุ้นปัจจุบัน" });
    }

    // Deduct user balance
    dbState.users[userIndex].balance = Number((dbState.users[userIndex].balance - orderAmt).toFixed(2));

    const nameMapping: Record<string, string> = {
      "BTC": "Bitcoin", "ETH": "Ethereum", "XEM": "NEM (XEM)", "LTC": "Litecoin", "SOL": "Solana",
      "ADA": "Cardano", "XRP": "Ripple", "AAPL": "Apple Inc.", "GOOG": "Alphabet Inc.", "TSLA": "Tesla Motor",
      "BCH": "Bitcoin Cash", "ECH": "EcoChain Token (ECH)", "MSFT": "Microsoft", "AMZN": "Amazon Web",
      "NVDA": "NVIDIA Corp", "META": "Meta Platform", "NFLX": "Netflix Inc.", "BABA": "Alibaba Group",
      "AMD": "AMD CPU Tech", "COIN": "Coinbase Exchange"
    };

    const newOrder: OrderItem = {
      id: "ord_" + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      phone: user.phone,
      stockSymbol,
      stockName: nameMapping[stockSymbol] || stockSymbol,
      type,
      amount: orderAmt,
      entryPrice: currentPrice,
      duration: Number(duration),
      timeRemaining: Number(duration),
      status: 'active',
      profitLoss: 0,
      timestamp: new Date().toISOString(),
      endTime: Date.now() + (Number(duration) * 1000)
    };

    dbState.activeOrders.push(newOrder);
    saveDatabase();

    res.json({ success: true, order: newOrder, balance: dbState.users[userIndex].balance });
  });

  // Read User Active Orders & History
  app.get("/api/trade/orders/:userId", (req, res) => {
    const userId = req.params.userId;
    const active = dbState.activeOrders.filter(o => o.userId === userId);
    const history = dbState.tradeHistory.filter(o => o.userId === userId);
    res.json({ active, history });
  });

  // --- REAL-TIME LIVE CHAT ENDPOINTS ---

  // Read chat room messages between user and admins
  app.get("/api/chat/messages/:userPhone", (req, res) => {
    const phone = req.params.userPhone;
    let room = dbState.chatRooms.find((r: any) => r.userPhone === phone);
    if (!room) {
      // Lazy init room
      const user = dbState.users.find(u => u.phone === phone);
      room = {
        id: phone,
        userId: user?.id || "anonymous",
        userName: user?.username || "ลูกค้าทั่วไป",
        userPhone: phone,
        messages: [
          {
            id: "system_welcome",
            senderId: "admin",
            senderName: "แอดมิน MiTrade",
            text: "สวัสดีค่ะ ยินดีต้อนรับสู่ระบบช่วยเหลือ MiTrade! หากคุณพบปัญหา มีคำถาม หรือต้องการฝากเงิน ฝากข้อความแจ้งทีมแอดมินไว้ที่นี่ได้ตลอด 24 ชั่วโมงค่ะ",
            timestamp: new Date().toISOString(),
            isFromAdmin: true
          }
        ],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };
      dbState.chatRooms.push(room as any);
      saveDatabase();
    } else {
      // Clear unread count for user access (if not from admin role)
      // We will handle client-side reset
    }
    res.json(room);
  });

  // Post chat message (Client and Admin use same endpoint structure)
  app.post("/api/chat/message", (req, res) => {
    const { userPhone, senderId, senderName, text, imageUrl, isFromAdmin } = req.body;
    if (!userPhone) {
      return res.status(400).json({ error: "โปรดระบุคู่สนทนา" });
    }

    let rIndex = dbState.chatRooms.findIndex((r: any) => r.userPhone === userPhone);
    if (rIndex === -1) {
      const user = dbState.users.find(u => u.phone === userPhone);
      const newRoom: ChatRoom = {
        id: userPhone,
        userId: user?.id || "anonymous",
        userName: user?.username || "ลูกค้าทั่วไป",
        userPhone,
        messages: [],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };
      dbState.chatRooms.push(newRoom);
      rIndex = dbState.chatRooms.length - 1;
    }

    const newMessage: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      senderId,
      senderName,
      text: text || "",
      imageUrl,
      timestamp: new Date().toISOString(),
      isFromAdmin: !!isFromAdmin
    };

    dbState.chatRooms[rIndex].messages.push(newMessage);
    dbState.chatRooms[rIndex].lastMessageTime = newMessage.timestamp;
    if (isFromAdmin) {
      dbState.chatRooms[rIndex].unreadCount = 0; // Read by admin response
    } else {
      dbState.chatRooms[rIndex].unreadCount += 1; // Mark unread for Admin
    }

    saveDatabase();
    res.json({ success: true, message: newMessage, room: dbState.chatRooms[rIndex] });
  });

  // --- ADMIN & SYSTEM MANAGEMENTS ---

  // Admin: Get all registered users
  app.get("/api/admin/users", (req, res) => {
    res.json(dbState.users);
  });

  // Admin: Create secondary user from dashboard
  app.post("/api/admin/users/create", (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: "โปรดใส่ข้อมูล ชื่อ, เบอร์โทร คีย์รหัสผ่านให้ครบถ้วน" });
    }

    const exists = dbState.users.some(u => u.phone === phone);
    if (exists) {
      return res.status(400).json({ error: "เบอร์โทรศัพท์ซ้ำ มีในระบบแล้ว" });
    }

    const newUser: User = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      phone,
      username: name,
      birthday: "",
      vipLevel: 1,
      balance: 0.0,
      status: "active",
      isAdmin: false,
      loginPassword: password,
      txPassword: "00000000", // default
      realName: "",
      bankName: "",
      bankAccountNum: ""
    };

    dbState.users.push(newUser);
    saveDatabase();
    res.json({ success: true, user: newUser });
  });

  // Admin: Full user edit
  app.post("/api/admin/users/update", (req, res) => {
    const { id, username, phone, loginPassword, txPassword, realName, bankName, bankAccountNum, vipLevel, balance } = req.body;
    const index = dbState.users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการแก้ไข" });
    }

    // Full rewrite privileges enabled for Admin
    const user = dbState.users[index];
    if (username !== undefined) user.username = username;
    if (phone !== undefined) {
      // ensure unique phone if moving
      const phoneOwner = dbState.users.find(u => u.phone === phone);
      if (phoneOwner && phoneOwner.id !== id) {
        return res.status(400).json({ error: "เบอร์โทรนี้เป็นของสมาชิกอื่นแล้ว" });
      }
      user.phone = phone;
    }
    if (loginPassword !== undefined) user.loginPassword = loginPassword;
    if (txPassword !== undefined) user.txPassword = txPassword;
    if (realName !== undefined) user.realName = realName;
    if (bankName !== undefined) user.bankName = bankName;
    if (bankAccountNum !== undefined) user.bankAccountNum = bankAccountNum;
    if (vipLevel !== undefined) user.vipLevel = Number(vipLevel);
    if (balance !== undefined) user.balance = Number(Number(balance).toFixed(2));

    saveDatabase();
    res.json({ success: true, user });
  });

  // Admin: Control state status (Frozen, Banned, Active)
  app.post("/api/admin/users/status", (req, res) => {
    const { id, status } = req.body; // 'active', 'frozen', 'banned'
    const index = dbState.users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    dbState.users[index].status = status;
    saveDatabase();
    res.json({ success: true, user: dbState.users[index] });
  });

  // Admin: Get all deposit records for auditing
  app.get("/api/admin/finance/deposits", (req, res) => {
    res.json(dbState.depositRecords);
  });

  // Admin: Deposit manual injection
  app.post("/api/admin/finance/deposit", (req, res) => {
    const { phone, amount, note } = req.body;
    const userIndex = dbState.users.findIndex(u => u.phone === phone);
    if (userIndex === -1) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้งานเบอร์นี้" });
    }

    const value = Number(amount);
    dbState.users[userIndex].balance = Number((dbState.users[userIndex].balance + value).toFixed(2));

    const newDep: DepositRecord = {
      id: "dep_" + Math.random().toString(36).substr(2, 9),
      userId: dbState.users[userIndex].id,
      phone: dbState.users[userIndex].phone,
      username: dbState.users[userIndex].username,
      amount: value,
      status: "approved",
      note: note || "สิทธิ์รับสโตร์เติมเงินแอดมินโดยตรง",
      timestamp: new Date().toISOString()
    };

    dbState.depositRecords.push(newDep);
    saveDatabase();
    res.json({ success: true, user: dbState.users[userIndex], record: newDep });
  });

  // Admin: Withdrawal direct deduction (Deduct money from account check for admin/superadmin only)
  app.post("/api/admin/finance/deduct", (req, res) => {
    const { phone, amount, note } = req.body;
    const userIndex = dbState.users.findIndex(u => u.phone === phone);
    if (userIndex === -1) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้งานเบอร์นี้" });
    }

    const value = Number(amount);
    if (isNaN(value) || value <= 0) {
      return res.status(400).json({ error: "โปรดระบุจำนวนเงินที่ถูกต้อง" });
    }

    if (dbState.users[userIndex].balance < value) {
      return res.status(400).json({ error: `ยอดเงินผู้ใช้งานมีไม่พอสำหรับหักออก (ยอดเงินปัจจุบันคือ ฿${dbState.users[userIndex].balance.toLocaleString()})` });
    }

    dbState.users[userIndex].balance = Number((dbState.users[userIndex].balance - value).toFixed(2));

    const newWith: WithdrawalRecord = {
      id: "with_" + Math.random().toString(36).substr(2, 9),
      userId: dbState.users[userIndex].id,
      phone: dbState.users[userIndex].phone,
      username: dbState.users[userIndex].username,
      amount: value,
      status: "approved",
      note: note || "แอดมินนำยอดเงินออกโดยตรง",
      timestamp: new Date().toISOString()
    };

    dbState.withdrawalRecords.push(newWith);
    saveDatabase();
    res.json({ success: true, user: dbState.users[userIndex], record: newWith });
  });

  // Admin: Get pending/all withdrawal applications list
  app.get("/api/admin/finance/withdrawals", (req, res) => {
    res.json(dbState.withdrawalRecords);
  });

  // Admin: Approve/Reject withdrawal application request
  app.post("/api/admin/finance/approve-withdraw", (req, res) => {
    const { recordId, decision, note } = req.body; // decision: 'approve' or 'reject'
    const wIndex = dbState.withdrawalRecords.findIndex(w => w.id === recordId);
    if (wIndex === -1) {
      return res.status(404).json({ error: "ไม่พบรายการถอนเงินนี้" });
    }

    const record = dbState.withdrawalRecords[wIndex];
    if (record.status !== "pending") {
      return res.status(400).json({ error: "คำขอนี้ได้รับการดำเนินการไปแล้ว" });
    }

    if (decision === "approve") {
      dbState.withdrawalRecords[wIndex].status = "approved";
      dbState.withdrawalRecords[wIndex].note = note || "อนุมัติรายการและโอนเงินแล้ว";
    } else {
      dbState.withdrawalRecords[wIndex].status = "rejected";
      dbState.withdrawalRecords[wIndex].note = note || "ปฏิเสธคำขอและคืนเงินสู่ยอดบาลานซ์";
      
      // Refund balance to client
      const uIndex = dbState.users.findIndex(u => u.id === record.userId);
      if (uIndex !== -1) {
        dbState.users[uIndex].balance = Number((dbState.users[uIndex].balance + record.amount).toFixed(2));
      }
    }

    saveDatabase();
    res.json({ success: true, record: dbState.withdrawalRecords[wIndex] });
  });

  // Admin: Chat Rooms directories lists
  app.get("/api/admin/chats", (req, res) => {
    res.json(dbState.chatRooms);
  });

  // Admin: Update own Super Admin credentials and support secondary admin creation
  app.post("/api/admin/credentials", (req, res) => {
    const { targetPhone, newPhone, newPassword, newUsername, action } = req.body;
    
    // Super-Admin Action trigger
    if (action === "update-super") {
      const superIndex = dbState.users.findIndex(u => u.isSuperAdmin === true);
      if (superIndex !== -1) {
        if (newPhone) dbState.users[superIndex].phone = newPhone;
        if (newPassword) dbState.users[superIndex].loginPassword = newPassword;
        if (newUsername) dbState.users[superIndex].username = newUsername;
        saveDatabase();
        return res.json({ success: true, superAdmin: dbState.users[superIndex] });
      } else {
        return res.status(500).json({ error: "ไม่พบสิทธิ์แอดมินสูงสุดในระบบ" });
      }
    }

    // Secondary Admin handling: Create, Delete, Update
    if (action === "create-sub") {
      if (!newPhone || !newPassword || !newUsername) {
        return res.status(400).json({ error: "กรุณาระบุ ชื่อ เบอร์โทรศัพท์ และรหัสผ่านให้ครบ" });
      }
      const phoneExists = dbState.users.some(u => u.phone === newPhone);
      if (phoneExists) {
        return res.status(400).json({ error: "เบอร์โทรนี้จดทะเบียนแอดมินหรือยูสเซอร์แล้ว" });
      }

      const newSub: User = {
        id: "usr_admin_" + Math.random().toString(36).substr(2, 9),
        phone: newPhone,
        username: newUsername,
        birthday: "",
        vipLevel: 5,
        balance: 0.0,
        status: "active",
        isAdmin: true,
        loginPassword: newPassword,
        txPassword: "00000000"
      };

      dbState.users.push(newSub);
      saveDatabase();
      return res.json({ success: true, admin: newSub });
    }

    if (action === "delete-sub") {
      const idx = dbState.users.findIndex(u => u.phone === targetPhone && u.isAdmin && !u.isSuperAdmin);
      if (idx === -1) {
        return res.status(404).json({ error: "ไม่พบบัญชีแอดมินรองนี้" });
      }
      dbState.users.splice(idx, 1);
      saveDatabase();
      return res.json({ success: true, message: "ลบบัญชีแอดมินรองสำเร็จ" });
    }

    res.status(400).json({ error: "ไม่พบ Action ที่ถูกต้อง" });
  });

  // Admin: Retrieve ALL historical trade record logs
  app.get("/api/admin/logs/trades", (req, res) => {
    // Merge active and history logs for full auditability
    const allTrades = [
      ...dbState.activeOrders,
      ...dbState.tradeHistory
    ];
    // Sort reverse chronological
    allTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(allTrades);
  });

  // --- DEV / BUILD ENVIRONMENT CONFIG ---
  app.use("/src/assets", express.static(path.join(process.cwd(), "src/assets")));

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend build
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MiTrade Full-Stack Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
