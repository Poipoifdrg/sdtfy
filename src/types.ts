export interface User {
  id: string;
  phone: string;
  username: string;
  birthday: string;
  vipLevel: number; // 1 to 5
  balance: number; // THB
  realName?: string;
  bankName?: string;
  bankAccountNum?: string;
  loginPassword?: string;
  txPassword?: string;
  status: 'active' | 'frozen' | 'banned';
  isAdmin: boolean;
  isSuperAdmin?: boolean;
}

export interface PromotionSlide {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface SystemSettings {
  siteTitle: string;
  logoUrl: string;
  primaryColor: string; // Hex color selector
  promotionSlides: PromotionSlide[];
}

export interface StockItem {
  id: string;
  name: string;
  symbol: string;
  logo: string; // Predefined SVGs or public URLs
  priceInThb: number;
  highThb: number;
  lowThb: number;
  changePercent: number;
}

export interface OrderItem {
  id: string;
  userId: string;
  phone: string;
  stockSymbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  amount: number; // in THB
  entryPrice: number; // price at entry
  closePrice?: number; // price at closing
  duration: number; // in seconds (90, 120, 300)
  timeRemaining: number; // countdown
  status: 'active' | 'win' | 'lose';
  profitLoss: number; // floating or final in THB
  timestamp: string; // ISO date format string
  endTime: number; // Date.now() timestamp when it expires
}

export interface DepositRecord {
  id: string;
  userId: string;
  phone: string;
  username: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  timestamp: string;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  phone: string;
  username: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  isFromAdmin: boolean;
}

export interface ChatRoom {
  id: string; // equal to user phone
  userId: string;
  userName: string;
  userPhone: string;
  messages: ChatMessage[];
  lastMessageTime: string;
  unreadCount: number;
}
