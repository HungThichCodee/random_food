import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Modal } from 'antd-mobile';
import { Toast } from '../stores/useToastStore';
import { useSignalR } from '../hooks/useSignalR';
import { useUserStore } from '../stores/useUserStore';
import logoImg from '../assert/logo.png';

interface MessageItem {
  id: string | number;
  text: string;
  sender: 'me' | 'partner';
  timestamp: string;
  isSystem?: boolean;
}

import { chatApi } from '../api/chatApi';
import { matchApi } from '../api/matchApi';

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [partnerName, setPartnerName] = useState('Đối tác');
  const [restaurant, setRestaurant] = useState<any>(location.state?.restaurant || null);
  const [activeMatch, setActiveMatch] = useState<any>(null);

  const { chatHub, matchHub } = useSignalR();
  const { profile } = useUserStore();
  const token = profile?.token;
  const streamRef = useRef<HTMLDivElement>(null);
  const [showShareConfirm, setShowShareConfirm] = useState(false);

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
        
        let foundSysMatch = false;
        
        const mapped: MessageItem[] = data.map(msg => {
          const isSys = msg.message.startsWith('[SYS_MATCH]');
          if (isSys) {
             foundSysMatch = true;
             try {
                const restData = JSON.parse(msg.message.replace('[SYS_MATCH]', ''));
                setRestaurant(restData);
             } catch(e) {}
          }
          return {
            id: msg.id,
            text: msg.message,
            sender: msg.senderUserId?.toLowerCase() === profile?.id?.toLowerCase() ? 'me' : 'partner',
            timestamp: new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: isSys
          };
        });
        
        setMessages(mapped.filter(m => !m.isSystem));

        // If we are the sender and we have the restaurant in state, but no SYS message was sent yet
        if (!foundSysMatch && location.state?.restaurant && token) {
           chatApi.sendMessage(parseInt(matchId), `[SYS_MATCH]${JSON.stringify(location.state.restaurant)}`).catch(console.error);
        }
      } catch (err) {
        console.error('Error fetching chat messages', err);
      }
    };
    fetchMessages();
    
    // Also fetch match details to get partner name
    matchApi.getActive().then(match => {
      if (match) {
        setActiveMatch(match);
        setPartnerName(match.fromUserId === profile?.id ? match.toUserName : match.fromUserName);
      }
    }).catch(console.error);
    
  }, [matchId, profile?.id, location.state, token]);

  // Listen to SignalR real-time messages
  useEffect(() => {
    if (chatHub && matchId) {
      chatHub.invoke('JoinChatGroup', matchId.toString()).catch(console.error);

      chatHub.on('ReceiveMessage', (msg: any) => {
        const isSys = msg.message.startsWith('[SYS_MATCH]');
        if (isSys) {
          try {
             const restData = JSON.parse(msg.message.replace('[SYS_MATCH]', ''));
             setRestaurant(restData);
          } catch(e) {}
          return; // don't add to messages state
        }
        const newMsg: MessageItem = {
          id: msg.id || Date.now(),
          text: msg.message,
          sender: msg.senderUserId?.toLowerCase() === profile?.id?.toLowerCase() ? 'me' : 'partner',
          timestamp: new Date(msg.sentAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => {
          // Avoid duplicate messages if already appended by the API response
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
    }

    if (matchHub) {
      matchHub.on('LocationSharingUpdated', (match: any) => {
        if (match.id === parseInt(matchId || '0')) {
          setActiveMatch(match);
        }
      });
    }

    return () => {
      chatHub?.off('ReceiveMessage');
      matchHub?.off('LocationSharingUpdated');
    };
  }, [chatHub, matchHub, matchId, profile?.id]);

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

  const handleShareLocation = () => {
    if (!matchId || !activeMatch) return;
    setShowShareConfirm(true);
  };

  const executeShareLocation = async () => {
    setShowShareConfirm(false);
    if (!matchId) return;
    try {
      const updated = await matchApi.shareLocation(parseInt(matchId));
      setActiveMatch(updated);
    } catch (e) {
      console.error(e);
      Toast.show('Lỗi chia sẻ vị trí');
    }
  };

  const handleStopSharingLocation = async () => {
    if (!matchId || !activeMatch) return;
    try {
      const updated = await matchApi.stopSharingLocation(parseInt(matchId));
      setActiveMatch(updated);
    } catch (e) {
      console.error(e);
      alert('Lỗi dừng chia sẻ vị trí');
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
                <span className="font-label-sm text-label-sm text-primary tracking-wide uppercase truncate max-w-[200px] block">
                  {restaurant ? restaurant.name : 'Địa điểm hẹn'}
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
                  <div className="w-11 h-11 rounded-full object-cover shadow-md bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg">
                    {partnerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(79,219,204,0.9)]"></span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-title-md text-title-md text-on-surface truncate">
                      {partnerName}
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
                    Đang trực tuyến
                  </p>
                </div>
              </div>

              {/* Quick Action: Directions Button */}
              <button
                type="button"
                onClick={() => {
                  if (restaurant) {
                    navigate('/route', { state: { lat: restaurant.latitude, lng: restaurant.longitude, name: restaurant.name, address: restaurant.address } });
                  }
                }}
                disabled={!restaurant}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full bg-secondary-container text-on-secondary-container shadow-[0_4px_16px_rgba(0,177,163,0.35)] active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">navigation</span>
                <span className="font-label-md text-label-md">Chỉ Đường</span>
              </button>
            </div>

            {/* Agreed Meeting Place Card Banner */}
            {restaurant && (
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
                          Hôm Nay
                        </span>
                      </div>
                      <p className="font-label-lg text-label-lg text-on-surface truncate">
                        {restaurant.name}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {restaurant.address}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (restaurant) {
                        navigate('/route', { state: { lat: restaurant.latitude, lng: restaurant.longitude, name: restaurant.name, address: restaurant.address } });
                      }
                    }}
                    disabled={!restaurant}
                    className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">info</span>
                </button>
              </div>
            </div>
            )}

            {/* Location Sharing Card */}
            {activeMatch && activeMatch.status === 'Accepted' && (
              <div className="px-margin mb-3">
                <div className="w-full p-3 rounded-DEFAULT bg-surface-container/90 backdrop-blur-lg flex flex-col gap-2 shadow-sm border border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">my_location</span>
                    <span className="font-title-sm text-on-surface">Chia sẻ vị trí với nhau</span>
                  </div>
                  
                  {activeMatch.hasSharedLocation && activeMatch.buddyHasSharedLocation ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-body-sm text-primary">Cả hai đã chia sẻ vị trí.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigate('/route', { state: { lat: activeMatch.buddyLat, lng: activeMatch.buddyLng, name: partnerName } });
                          }}
                          className="flex-1 px-3 py-2 bg-primary text-on-primary rounded-full font-label-md"
                        >
                          Xem đường tới {partnerName}
                        </button>
                        <button
                          onClick={handleStopSharingLocation}
                          className="flex-1 px-3 py-2 bg-surface-container-high text-error rounded-full font-label-md"
                        >
                          Dừng chia sẻ
                        </button>
                      </div>
                    </div>
                  ) : activeMatch.hasSharedLocation ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-body-sm text-secondary">Đã chia sẻ, đang chờ {partnerName} chia sẻ lại.</p>
                      <button
                        onClick={handleStopSharingLocation}
                        className="w-full px-3 py-2 bg-surface-container-high text-error rounded-full font-label-md"
                      >
                        Hủy chia sẻ
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-body-sm text-on-surface-variant">Bấm chia sẻ để hiển thị bản đồ dẫn đường (chỉ hiện khi cả hai cùng bấm).</p>
                      <button
                        onClick={handleShareLocation}
                        className="w-full px-3 py-2 bg-primary text-on-primary rounded-full font-label-md"
                      >
                        Chia sẻ vị trí của tôi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-1">
                        {partnerName.charAt(0).toUpperCase()}
                      </div>
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
                  <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-1">
                    {partnerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="px-3.5 py-2 rounded-2xl rounded-bl-xs bg-surface-container-high text-secondary flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce"></span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                      {partnerName.split(' ')[0]} đang gõ...
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
                  onClick={() => Toast.show('Tính năng đính kèm tệp đang được phát triển')}
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
                    placeholder={`Nhập tin nhắn với ${partnerName.split(' ')[0]}...`}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <button
                    onClick={() => Toast.show('Tính năng gửi icon đang được phát triển')}
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

      <Modal
        visible={showShareConfirm}
        title="Xác nhận chia sẻ"
        content="Vị trí chính xác của bạn sẽ được hiển thị khi cả 2 cùng bấm chia sẻ. Sẽ tự động dừng sau 60 phút."
        closeOnAction={true}
        onClose={() => setShowShareConfirm(false)}
        actions={[
          {
            key: 'cancel',
            text: 'Hủy',
            onClick: () => setShowShareConfirm(false),
          },
          {
            key: 'confirm',
            text: 'Đồng ý',
            primary: true,
            onClick: executeShareLocation,
          },
        ]}
      />
    </div>
  );
}
