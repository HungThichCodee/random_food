import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSignalR } from '../hooks/useSignalR';
import { useUserStore } from '../stores/useUserStore';
import logoImg from '../assert/logo.png';

interface MessageItem {
  id: string | number;
  text: string;
  sender: 'me' | 'partner';
  timestamp: string;
}

import { chatApi } from '../api/chatApi';

export default function ChatPage() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { chatHub } = useSignalR();
  const { profile } = useUserStore();
  const token = profile?.token;
  const streamRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load messages initially
  useEffect(() => {
    if (!matchId) return;
    const fetchMessages = async () => {
      try {
        const data = await chatApi.getMessages(parseInt(matchId));
        const mapped: MessageItem[] = data.map(msg => ({
          id: msg.id,
          text: msg.message,
          sender: msg.senderUserId === profile?.id ? 'me' : 'partner',
          timestamp: new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(mapped);
      } catch (err) {
        console.error('Error fetching chat messages', err);
      }
    };
    fetchMessages();
  }, [matchId, profile?.id]);

  // Listen to SignalR real-time messages
  useEffect(() => {
    if (chatHub) {
      chatHub.on('ReceiveMessage', (msg: any) => {
        const newMsg: MessageItem = {
          id: msg.id || Date.now(),
          text: msg.message,
          sender: msg.senderTempUserId === profile?.id ? 'me' : 'partner',
          timestamp: new Date(msg.sentAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, newMsg]);
      });

      return () => {
        chatHub.off('ReceiveMessage');
      };
    }
  }, [chatHub, profile?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || !matchId) return;

    setInputValue('');

    try {
      if (token) {
        const sentMsg = await chatApi.sendMessage(parseInt(matchId), text);
        // The sender receives it back either via the API response or SignalR.
        // We'll rely on the API response to append it immediately, avoiding duplication if SignalR echoes it.
        const newMsg: MessageItem = {
          id: sentMsg.id,
          text: sentMsg.message,
          sender: 'me',
          timestamp: new Date(sentMsg.sentAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        
        // Only append if it wasn't already added by SignalR
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <button
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface hover:bg-surface-container transition-colors"
              onClick={() => navigate(-1)}
              title="Quay lại"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <img
              alt="Food Match Brand Icon"
              className="h-7 w-auto object-contain cursor-pointer"
              src={logoImg}
              onClick={() => navigate('/')}
            />
            <h1 className="font-title-md text-title-md text-on-surface tracking-tight truncate max-w-[170px]">
              Real Time Chat
            </h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button 
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors"
              title="Tùy chọn"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            <div 
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-container/40 overflow-hidden cursor-pointer"
            >
              {profile?.displayName ? (
                <div className="w-full h-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img
                  alt="Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA92w28fcnzXyfesyI7ypUuEyvf1p5UPHUIovJr0yN3HicG5VCbxRdTRqP8aAwKlfnlhMLCncSiYqORv_MxWipkJB1b9n_O8sG9etzaq9kZOts8_xz3QTUL_JfdrZZbp1UV_uTJhwITx1N4bFcWMVrDw_di98xQ1cB-L3b3B0NlJwYBkMHPRk4EaGQn6Q8wDMKrfj0WCGLW-TAedGPY6d01D6SDUbgOf27W9rMwxnDGvs8VhVmGf2c7RA"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface z-10 min-h-screen">
        <div className="flex flex-col w-full relative select-none">
          
          {/* Top Background: Dimmed Map Glimpse with Pulsing Match Markers */}
          <div className="relative w-full h-44 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center filter blur-sm scale-105 brightness-50 contrast-125"
              data-location="Quận 1, Thành phố Hồ Chí Minh, Việt Nam"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCDeOOrbZEs2C5lMyxO6j0_-u2TtF1zqAKuA_UoPYtzVKtJ-etC4M2-H3xai9VcIYELQbQad1qd3w1fl2sDE3_tprbKSRGEAuZlkaGvL8IhHSMZDqRwzzd8SaI3Cx4gJOMMuTa0Mxh2Ce7s0cHAUq2kCi9EVYlnQX3B-NxcjqQ3Pnv2aF3mnEbgGDPXZfm4gNJZI-uKvpfhmJ3oNGYldflfTcgcKLmAfmP17gd6EjscwCZbDHNpi6Un6w')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-surface"></div>
            
            {/* Pulsing Radar Map Marker for Meetup Location */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-12 h-12 rounded-full bg-primary-container/30 animate-ping"></span>
                <span className="absolute w-8 h-8 rounded-full bg-primary-container/50 animate-pulse"></span>
                <div className="w-7 h-7 rounded-full bg-primary-container shadow-[0_0_16px_rgba(255,107,53,0.8)] flex items-center justify-center text-white text-[14px]">
                  <span className="material-symbols-outlined text-[16px]">soup_kitchen</span>
                </div>
              </div>
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-highest/90 backdrop-blur-md shadow-lg">
                <span className="font-label-sm text-label-sm text-primary tracking-wide uppercase">
                  Phở Thìn • 350m
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Drawer Overlay Shell: Chat Room Deck */}
          <div className="relative w-full -mt-8 flex flex-col rounded-t-xl bg-surface-container-low/95 backdrop-blur-2xl shadow-[0_-12px_44px_rgba(0,0,0,0.8)]">
            
            {/* Drag Handle Indicator */}
            <div className="w-full pt-3 pb-2 flex justify-center items-center">
              <div className="w-10 h-1 rounded-full bg-outline-variant/60"></div>
            </div>

            {/* Match Chat Header */}
            <div className="px-margin pb-3 pt-1 flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="relative flex-shrink-0">
                  <img
                    alt="Minh Trang"
                    className="w-11 h-11 rounded-full object-cover shadow-md"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwLP_fBwColVHm8QDb_kIe4LVmXcdLSZ0qS6FSXVHhcNSJJXlW71ipEz5iFUnQ8nG_le6CVaK7Jac4SI_KOCefV07wb-Z1Hd-q3BlhNkuEUSjJybJMoxhG0MrWw7M9Gnbac6rYQ1PfrUPsI1LT9_Jur4lAhhn0MOvz15vhMJDN45K5J9U_HJ3CMcVIMXUlOOPIzs_z2HNhsgb47qcAzpUL5WHYA2USBUqw_UMgHSHxHn902_x8NRBy9A"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(79,219,204,0.9)]"></span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-title-md text-title-md text-on-surface truncate">
                      Minh Trang
                    </h2>
                    <span
                      className="material-symbols-outlined text-[15px] text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    Đang trực tuyến • Cách 400m
                  </p>
                </div>
              </div>

              {/* Quick Action: Directions Button */}
              <button
                type="button"
                onClick={() => navigate('/route')}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full bg-secondary-container text-on-secondary-container shadow-[0_4px_16px_rgba(0,177,163,0.35)] active:scale-95 transition-all duration-150"
              >
                <span className="material-symbols-outlined text-[16px]">navigation</span>
                <span className="font-label-md text-label-md">Chỉ Đường</span>
              </button>
            </div>

            {/* Agreed Meeting Place Card Banner */}
            <div className="px-margin mb-3">
              <div className="w-full p-3 rounded-DEFAULT bg-surface-container/90 backdrop-blur-lg flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0 text-primary-container shadow-[0_0_12px_rgba(255,107,53,0.3)]">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      restaurant
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-label-sm text-label-sm text-primary uppercase">
                        Kèo Đã Chốt
                      </span>
                      <span className="text-on-surface-variant text-[10px]">•</span>
                      <span className="font-label-sm text-label-sm text-tertiary">
                        19:30 Tối Nay
                      </span>
                    </div>
                    <p className="font-label-lg text-label-lg text-on-surface truncate">
                      Phở Thìn Lò Đúc
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      350m • 4.8★ (420 đánh giá)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/route')}
                  className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">info</span>
                </button>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div
              ref={streamRef}
              className="flex flex-col px-margin gap-3 overflow-y-auto max-h-[380px] pb-2"
              id="chat-stream"
            >
              {/* Timestamp pill */}
              <div className="flex justify-center my-1">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm tracking-wider">
                  HÔM NAY • 19:15
                </span>
              </div>

              {/* Messages */}
              {messages.map((item) => {
                if (item.sender === 'partner') {
                  return (
                    <div key={item.id} className="flex items-end gap-2 max-w-[84%] self-start">
                      <img
                        alt="Avatar of Minh Trang smiling"
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-1"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV0RaF2eJTLy9ECU6I6cJNvXwWhCf0FlLoYJQsyp9hmcmEZG9PcIkwkbBAncvy9m6OrVRTB2NOtVB4yFzNiPsjrDi1jW3-M0bgQqTYlsfeIw8--U7fAxqhs2ZyeIcauydcylbHmyccbUFqYJbIIVNwVaIkSRheJ-xppgKO5VgPJo1pO91ZIB5ab1oo4ERgIG05ut4giWy9mEALsXlFcvhl5zlBkHwh3RDxmb0ARAkR7rnDbqMfdPt4Iw"
                      />
                      <div className="flex flex-col gap-1">
                        <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-surface-container-high text-on-surface shadow-sm">
                          <p className="font-body-md text-body-md">{item.text}</p>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className="flex items-end justify-end gap-1.5 max-w-[84%] self-end">
                    <div className="flex flex-col items-end gap-1">
                      <div className="px-3.5 py-2.5 rounded-2xl rounded-br-xs bg-primary-container text-white shadow-[0_4px_16px_rgba(255,107,53,0.35)]">
                        <p className="font-body-md text-body-md">{item.text}</p>
                      </div>
                      <div className="flex items-center gap-1 mr-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {item.timestamp}
                        </span>
                        <span className="material-symbols-outlined text-[13px] text-secondary">
                          done_all
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Real-time Typing Indicator Bubble */}
              {isTyping && (
                <div className="flex items-end gap-2 max-w-[70%] self-start" id="typing-indicator">
                  <img
                    alt="Avatar of Minh Trang typing"
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-1"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL4p-7AXAOUgxP5nfykdsqNU8EiXeR13liPRjQx6MnfIg5wStAx3Kw4ayuuVwhICB-MtaDLLex3_bT3cBXW4FL3toa5sZRCBZRFOm9lP_zoodVxcnsUfsjUvvgxiUTmkN67pBdKUCwdRLZc76StxQWrBKotxFqFS0h6K9mi7lOA-W4NLMuqp1ZZEOSDODNxqpj9UDofV8-8n2o1FQ99IHvzgqgvlBw1Gw3s1unlg_d4lLLBGhzYDxwpQ"
                  />
                  <div className="px-3.5 py-2 rounded-2xl rounded-bl-xs bg-surface-container-high text-secondary flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce"></span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                      Trang đang gõ...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Dynamic Input Bar */}
            <div className="p-margin pt-2 pb-5 w-full bg-surface-container-lowest/90 backdrop-blur-xl">
              <form className="flex items-center gap-2" id="chat-form" onSubmit={handleSendMessage}>
                {/* Media Attach Button */}
                <button
                  className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </button>

                {/* Text Input Field Container */}
                <div className="flex-1 min-w-0 h-11 px-3.5 rounded-full bg-surface-container flex items-center gap-2 shadow-inner focus-within:ring-1 focus-within:ring-primary-container">
                  <input
                    autoComplete="off"
                    className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                    id="message-input"
                    placeholder="Nhập tin nhắn với Trang..."
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button
                    className="text-on-surface-variant hover:text-tertiary flex items-center justify-center flex-shrink-0 transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                  </button>
                </div>

                {/* Send Button */}
                <button
                  id="send-button"
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-11 h-11 rounded-full bg-primary-container text-white flex items-center justify-center flex-shrink-0 shadow-[0_4px_18px_rgba(255,107,53,0.45)] active:scale-90 hover:brightness-110 transition-all duration-150 disabled:opacity-40 disabled:scale-100"
                >
                  <span className="material-symbols-outlined text-[20px] translate-x-0.5">send</span>
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
