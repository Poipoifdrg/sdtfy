import React, { useState, useEffect, useRef } from "react";
import { Send, Image, X, ArrowLeft, Loader2, RefreshCw, Paperclip } from "lucide-react";
import { ChatMessage } from "../types";

interface LiveChatProps {
  userPhone: string;
  userName: string;
  onBack: () => void;
  primaryColor: string;
}

export default function LiveChat({
  userPhone,
  userName,
  onBack,
  primaryColor
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history
  const loadChat = async () => {
    try {
      const response = await fetch(`/api/chat/messages/${userPhone}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Chat loading failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
    // Poll chat messages every 1.5 seconds for instant chat update (เมื่อแอดมินตอบแชท หน้าเว็ยเราจะเปลี่ยนทันที)
    const interval = setInterval(loadChat, 1500);
    return () => clearInterval(interval);
  }, [userPhone]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle local image uploads via file input reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachedImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    setSending(true);
    try {
      const payload = {
        userPhone,
        senderId: "usr_" + userPhone,
        senderName: userName,
        text: inputText,
        imageUrl: attachedImage || undefined,
        isFromAdmin: false
      };

      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setInputText("");
        clearAttachedImage();
        // Load latest messages
        await loadChat();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      id="live-chat-panel"
      className="flex flex-col h-[600px] bg-slate-55 relative rounded-3xl overflow-hidden border border-slate-150 animate-slide-up"
    >
      {/* Header */}
      <div 
        id="chat-header"
        className="px-4 py-3.5 text-white flex items-center justify-between shadow-md shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          <button 
            id="chat-back-btn"
            onClick={onBack} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 id="chat-title" className="font-bold text-sm leading-tight">ฝ่ายบริการลูกค้าออนไลน์</h3>
            <span id="chat-subtitle" className="text-[10px] opacity-80 font-medium">สนทนากับเจ้าหน้าที่แอดมินออนไลน์</span>
          </div>
        </div>

        <button 
          id="chat-manual-refresh"
          onClick={loadChat}
          className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer"
        >
          <RefreshCw size={14} className="animate-spin-slow text-white" />
        </button>
      </div>

      {/* Messages Stage */}
      <div 
        id="chat-messages-stage"
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 flex flex-col"
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-sky-500" size={24} />
            <span className="text-xs">กำลังติดต่อฝ่ายบริการ...</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = !msg.isFromAdmin;
            return (
              <div
                id={`chat-msg-row-${msg.id}`}
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                {/* Sender Tag */}
                <span className="text-[9px] text-slate-400 mb-0.5 px-1">{msg.senderName}</span>
                
                {/* Bubble */}
                <div
                  id={`chat-msg-bubble-${msg.id}`}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs space-y-1.5 shadow-xs border ${
                    isMe 
                      ? "bg-slate-900 border-slate-950 text-white rounded-tr-none" 
                      : "bg-white border-slate-100 text-slate-800 rounded-tl-none"
                  }`}
                >
                  {msg.text && <p className="leading-relaxed break-all whitespace-pre-line">{msg.text}</p>}
                  
                  {msg.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-100 max-w-[180px] bg-slate-50">
                      <img 
                        src={msg.imageUrl} 
                        alt="แนบไฟล์" 
                        loading="lazy"
                        className="w-full object-cover max-h-[160px]"
                      />
                    </div>
                  )}
                </div>

                {/* Date stamp */}
                <span className="text-[8px] text-slate-350 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached Image Tray Preview */}
      {attachedImage && (
        <div 
          id="chat-image-preview-tray"
          className="absolute bottom-16 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-100 flex items-center justify-between animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <img 
              src={attachedImage} 
              alt="Preview" 
              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">แนบรูปภาพแล้ว</p>
              <p className="text-[10px] text-slate-400">รูปภาพจะถูกส่งเมื่อกดปุ่มส่งข้อความ</p>
            </div>
          </div>
          <button 
            id="clear-attach-btn"
            onClick={clearAttachedImage} 
            className="p-1 hover:bg-slate-150 text-slate-500 rounded-full cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input controller */}
      <form 
        id="chat-input-form"
        onSubmit={handleSendMessage} 
        className="p-3 bg-white border-t border-slate-100 shrink-0 flex items-center gap-2 shadow-inner"
      >
        <button
          id="trigger-file-upload-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-all cursor-pointer bg-slate-50 rounded-xl"
          title="แนบรูปภาพหลักฐานฝากเงิน"
        >
          <Paperclip size={18} />
        </button>
        
        <input 
          id="upload-image-input"
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />

        <input
          id="chat-text-input"
          type="text"
          placeholder="พิมพ์ข้อความติดต่อแอดมิน..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-200 focus:bg-white"
        />

        <button
          id="chat-send-btn"
          type="submit"
          disabled={sending || (!inputText.trim() && !attachedImage)}
          className="p-2.5 text-white rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send size={15} />
          )}
        </button>
      </form>
    </div>
  );
}
