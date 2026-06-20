import React, { useState, useEffect } from "react";
import { X, CheckCircle, TrendingUp, TrendingDown, Coins, AlertCircle } from "lucide-react";

interface TradingPopupProps {
  symbol: string;
  stockName: string;
  currentPrice: number;
  type: 'BUY' | 'SELL'; // BUY (Call) or SELL (Put)
  onClose: () => void;
  userBalance: number;
  onTradeSuccess: (newBalance: number) => void;
  primaryColor: string;
}

export default function TradingPopup({
  symbol,
  stockName,
  currentPrice,
  type,
  onClose,
  userBalance,
  onTradeSuccess,
  primaryColor
}: TradingPopupProps) {
  const [duration, setDuration] = useState<number>(90); // default 90s
  const [amountInput, setAmountInput] = useState<string>("1000"); // default 1000 THB
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  // Computed helper details
  const amount = parseFloat(amountInput) || 0;
  const estHoldingStock = amount > 0 ? (amount / currentPrice).toFixed(6) : "0.000000";

  // Quick select preset buttons
  const presets = [500, 1000, 5000, 10000, 50000];

  const handleConfirmOrder = async () => {
    setErrorMsg("");
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) {
      setErrorMsg("โปรดระบุจำนวนเงินลงทุนขั้นต่ำมากกว่า 0 บาท");
      return;
    }

    if (amt > userBalance) {
      setErrorMsg(`ยอดเงินคงเหลือของคุณไม่เพียงพอ (คงเหลือ ฿${userBalance.toLocaleString()})`);
      return;
    }

    setLoading(true);
    try {
      const storedUser = localStorage.getItem("mitrade_user");
      if (!storedUser) {
        setErrorMsg("กรุณาเข้าสู่ระบบก่อนทำการเทรด");
        setLoading(false);
        return;
      }
      const u = JSON.parse(storedUser);

      const response = await fetch("/api/trade/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          stockSymbol: symbol,
          type: type,
          amount: amt,
          duration: duration
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเปิดออร์เดอร์");
      }

      setSuccess(true);
      onTradeSuccess(data.balance);
    } catch (err: any) {
      setErrorMsg(err.message || "การส่งคำสั่งล้มเหลว โปรดลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="trading-popup-overlay"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div 
        id="trading-popup-card"
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100 pb-6 animate-slide-up"
      >
        {/* Header Indicator */}
        <div 
          className="px-5 py-4 flex items-center justify-between border-b border-slate-50 text-white"
          style={{
            background: type === "BUY" 
              ? "linear-gradient(135deg, #0284c7, #0ea5e9)" 
              : "linear-gradient(135deg, #ef4444, #f87171)"
          }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              {type === "BUY" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <span id="popup-header-title" className="font-bold text-base leading-none">
                ส่งคำสั่ง {type === "BUY" ? "ซื้อคอล (Call)" : "ขายพุท (Put)"}
              </span>
              <p className="text-[11px] opacity-80 font-medium">{symbol} - {stockName}</p>
            </div>
          </div>
          <button 
            id="close-popup-btn"
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div id="popup-success-view" className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle size={36} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">ส่งคำสั่งซื้อสำเร็จ!</h3>
            <p className="text-sm text-slate-500 mt-1 px-4">
              คำสั่งเทรดของคุณถูกจัดเก็บในระบบและกำลังนับถอยหลัง {duration} วินาที สามารถเข้าไปดูผลลัพธ์ได้ที่เมนู <b>"บันทึกเทรด"</b>
            </p>
            <div className="mt-5 bg-slate-50 rounded-2xl p-4 text-xs text-left text-slate-600 border border-slate-100">
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span>หุ้น/สัญญา:</span>
                <span className="font-bold">{symbol}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span>เงินลงทุน:</span>
                <span className="font-bold text-slate-900">฿{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>เวลานับถอยหลัง:</span>
                <span className="font-bold text-blue-600">{duration} วินาที</span>
              </div>
            </div>
            <button
              id="success-dismiss-btn"
              onClick={onClose}
              className="mt-6 w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              รับทราบ
            </button>
          </div>
        ) : (
          <div id="popup-form-view" className="p-5">
            {/* Choose Duration */}
            <label className="text-xs font-semibold text-slate-500 block mb-2">เลือกเวลาสิ้นสุด (วินาที):</label>
            <div id="duration-toggle-row" className="grid grid-cols-3 gap-2 mb-4">
              {[90, 120, 300].map((sec) => (
                <button
                  id={`btn-duration-${sec}`}
                  key={sec}
                  type="button"
                  onClick={() => setDuration(sec)}
                  className={`py-3.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                    duration === sec 
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                      : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  {sec} วินาที
                </button>
              ))}
            </div>

            {/* Input Amount */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-500">จำนวนเงินลงทุน (THB):</label>
                <span className="text-[10px] text-slate-400 font-mono">
                  สามารถลงทุนได้: ฿{userBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative">
                <input
                  id="trade-amount-input"
                  type="number"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-10 pr-16 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-800 font-bold font-mono text-sm tracking-tight"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">฿</span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">THB</span>
              </div>

              {/* Amount Quick Presets */}
              <div id="quick-preset-row" className="flex flex-wrap gap-2 mt-2">
                {presets.map((p) => (
                  <button
                    id={`btn-preset-${p}`}
                    key={p}
                    type="button"
                    onClick={() => setAmountInput(String(p))}
                    className="bg-slate-50 border border-slate-100/50 text-[10px] font-bold text-slate-600 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    +{p.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time stock size estimate and trade stats */}
            <div id="estimated-stock-card" className="bg-blue-50/50 border border-blue-50 rounded-2xl p-4 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  <Coins size={13} className="text-sky-500" />
                  <span>คำนวณจำนวนเหรียญที่จะได้รับ (โดยประมาณ):</span>
                </span>
                <span id="popup-est-stock" className="font-mono font-bold text-sky-600">{estHoldingStock} {symbol}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-1.5 border-t border-blue-100/30">
                <span>อัตราแลกเปลี่ยน ณ ปัจจุบัน:</span>
                <span className="font-mono">1 {symbol} = ฿{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>อัตราปันผลจ่ายหากทายชนะ (Payout):</span>
                <span className="font-bold text-emerald-500">85% (+฿{(amount * 0.85).toLocaleString(undefined, { maximumFractionDigits: 2 })})</span>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div id="trade-error-msg" className="bg-rose-50 text-rose-600 text-xs font-semibold p-3.5 rounded-2xl mb-4 flex items-start gap-2 border border-rose-100">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Action buttons */}
            <button
              id="confirm-trade-btn"
              onClick={handleConfirmOrder}
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: type === "BUY" 
                  ? "linear-gradient(135deg, #0284c7, #0ea5e9)" 
                  : "linear-gradient(135deg, #ef4444, #f87171)"
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังดำเนินการส่งคำสั่ง...</span>
                </>
              ) : (
                <span>ยืนยันการทำสัญญา {type === "BUY" ? "Call" : "Put"}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
