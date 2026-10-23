import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
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
}

import { chatApi } from '../api/chatApi';
import { matchApi } from '../api/matchApi';
import { reportApi } from '../api/reportApi';
import { tempUserApi } from '../api/tempUserApi';
import type { MatchRequestDto, MeetingPlaceDto, MeetingSearchKind } from '../types/match';
import type { ChatMessageDto } from '../types/chat';

const toMessageItems = (data: ChatMessageDto[], profileId?: string): MessageItem[] =>
  data.filter(msg => !msg.message.startsWith('[SYS_MATCH]')).map(msg => ({
    id: msg.id,
    text: msg.message,
    sender: msg.senderUserId?.toLowerCase() === profileId?.toLowerCase() ? 'me' : 'partner',
    timestamp: new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

const mergeMessageHistory = (history: MessageItem[], current: MessageItem[]): MessageItem[] => {
  const historyIds = new Set(history.map(message => message.id));
  return [...history, ...current.filter(message => !historyIds.has(message.id))];
};

const matchUnavailable = (error: unknown): boolean =>
  axios.isAxiosError(error) && [403, 404].includes(error.response?.status ?? 0);

const meetingSearchOptions: { kind: MeetingSearchKind; label: string }[] = [
  { kind: 'restaurant', label: 'Quán ăn' },
  { kind: 'cafe', label: 'Cà phê' },
  { kind: 'vegetarian', label: 'Món chay' },
  { kind: 'dessert', label: 'Đồ ngọt' },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const [partnerName, setPartnerName] = useState('Đối tác');
  const [activeMatch, setActiveMatch] = useState<MatchRequestDto | null>(null);

  const { chatHub, matchHub, isConnected } = useSignalR();
  const { profile } = useUserStore();
  const token = profile?.token;
  const streamRef = useRef<HTMLDivElement>(null);
  const lastLocationSentAt = useRef(0);
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('Hành vi không phù hợp');
  const [reporting, setReporting] = useState(false);
  const [meetingPlaces, setMeetingPlaces] = useState<MeetingPlaceDto[]>([]);
  const [meetingPlacesLoading, setMeetingPlacesLoading] = useState(false);
  const [meetingPlacesError, setMeetingPlacesError] = useState(false);
  const [meetingSearchUrl, setMeetingSearchUrl] = useState('');
  const [meetingEmbedUrl, setMeetingEmbedUrl] = useState('');
  const [googlePlaceName, setGooglePlaceName] = useState('');
  const [googlePlaceUrl, setGooglePlaceUrl] = useState('');
  const [meetingProviderAvailable, setMeetingProviderAvailable] = useState(true);
  const [meetingDecisionBusy, setMeetingDecisionBusy] = useState(false);
  const [meetingRefreshKey, setMeetingRefreshKey] = useState(0);
  const [meetingSearchKind, setMeetingSearchKind] = useState<MeetingSearchKind>('restaurant');
  const canSuggestMeeting = activeMatch?.status === 'Accepted' &&
    activeMatch.hasSharedLocation && activeMatch.buddyHasSharedLocation &&
    typeof activeMatch.buddyLat === 'number' &&
    typeof activeMatch.buddyLng === 'number';

  // Auto-scroll to bottom of stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages]);

  // Load messages initially
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setMessages([]);
    setActiveMatch(null);
    const fetchMessages = async () => {
      try {
        const data = await chatApi.getMessages(parseInt(matchId));
        if (cancelled) return;
        const mapped = toMessageItems(data, profile?.id);
        setMessages(current => mergeMessageHistory(mapped, current));
      } catch {
        if (!cancelled) console.error('Could not fetch chat messages');
      }
    };
    fetchMessages();
    
    // Also fetch match details to get partner name
    matchApi.getById(parseInt(matchId)).then(match => {
      if (cancelled) return;
      if (match.status !== 'Accepted') {
        setMessages([]);
        setActiveMatch(null);
        navigate('/buddies', { replace: true });
        Toast.show('Cuộc hẹn không còn hiệu lực');
        return;
      }
      setActiveMatch(match);
      setPartnerName(match.fromUserId === profile?.id ? match.toUserName : match.fromUserName);
    }).catch(error => {
      if (cancelled) return;
      if (matchUnavailable(error)) {
        setMessages([]);
        setActiveMatch(null);
        navigate('/buddies', { replace: true });
        Toast.show('Cuộc hẹn không còn hiệu lực');
      } else console.error('Could not load match');
    });
    return () => { cancelled = true; };
  }, [matchId, profile?.id, navigate]);

  // SignalR cannot replay messages sent while this tab was disconnected.
  // Reload the persisted history whenever both hubs connect again.
  useEffect(() => {
    if (!isConnected || !matchId) return;
    const id = Number(matchId);
    if (!Number.isInteger(id)) return;
    let cancelled = false;
    chatApi.getMessages(id).then(data => {
      if (cancelled) return;
      const history = toMessageItems(data, profile?.id);
      setMessages(current => mergeMessageHistory(history, current));
    }).catch(() => console.error('Could not resync chat messages'));
    return () => { cancelled = true; };
  }, [isConnected, matchId, profile?.id]);

  // Refresh consent so a 60-minute expiry also removes private navigation in the UI.
  useEffect(() => {
    if (!matchId) return;
    const id = Number(matchId);
    if (!Number.isInteger(id)) return;
    let cancelled = false;
    let leaving = false;
    const refresh = () => {
      matchApi.getById(id).then(match => {
        if (cancelled || leaving) return;
        if (match.status !== 'Accepted') {
          leaving = true;
          setMessages([]);
          setActiveMatch(null);
          navigate('/buddies', { replace: true });
          Toast.show('Cuộc hẹn không còn hiệu lực');
          return;
        }
        setActiveMatch(match);
      }).catch(error => {
        if (cancelled || leaving) return;
        setActiveMatch(null);
        if (matchUnavailable(error)) {
          leaving = true;
          setMessages([]);
          navigate('/buddies', { replace: true });
          Toast.show('Cuộc hẹn không còn hiệu lực');
        }
      });
    };
    const interval = window.setInterval(refresh, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [matchId, navigate]);

  // Keep the exact measured coordinates current while this person is sharing.
  useEffect(() => {
    if (!activeMatch?.hasSharedLocation || !profile?.id || !navigator.geolocation) return;
    const userId = profile.id;
    let active = true;
    const watchId = navigator.geolocation.watchPosition((position) => {
      if (!active || Date.now() - lastLocationSentAt.current < 15000) return;
      lastLocationSentAt.current = Date.now();
      void tempUserApi.updateLocation(userId,
        position.coords.latitude, position.coords.longitude).catch(() => {
          console.error('Could not update shared location');
        });
    }, () => {
      console.error('Could not read shared location');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeMatch?.hasSharedLocation, profile?.id]);

  useEffect(() => {
    const match = activeMatch;
    const allowed = match?.status === 'Accepted' &&
      match?.hasSharedLocation && match?.buddyHasSharedLocation &&
      typeof match?.buddyLat === 'number' && typeof match?.buddyLng === 'number';
    if (!allowed) {
      setMeetingPlaces([]);
      setMeetingPlacesError(false);
      setMeetingSearchUrl('');
      setMeetingEmbedUrl('');
      return;
    }
    let cancelled = false;
    setMeetingPlacesLoading(true);
    setMeetingPlacesError(false);
    matchApi.getMeetingSuggestions(match.id, meetingSearchKind).then((result) => {
      if (!cancelled) {
        setMeetingPlaces(result.places);
        setMeetingSearchUrl(result.searchUrl);
        setMeetingEmbedUrl(result.embedUrl);
        setMeetingProviderAvailable(result.providerAvailable);
      }
    }).catch(() => {
      if (!cancelled) {
        setMeetingPlaces([]);
        setMeetingPlacesError(true);
        setMeetingSearchUrl('');
        setMeetingEmbedUrl('');
      }
    }).finally(() => {
      if (!cancelled) setMeetingPlacesLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeMatch?.id, activeMatch?.hasSharedLocation,
      activeMatch?.buddyHasSharedLocation, meetingRefreshKey, meetingSearchKind]);

  // Refresh the midpoint as either phone moves. Keep requests below the
  // MeetingSuggestions rate limit and stop immediately when consent ends.
  useEffect(() => {
    if (!canSuggestMeeting) return;
    const interval = window.setInterval(() => setMeetingRefreshKey(value => value + 1), 30000);
    return () => window.clearInterval(interval);
  }, [activeMatch?.id, canSuggestMeeting]);

  // Listen to SignalR real-time messages
  useEffect(() => {
    const onReceiveMessage = (msg: ChatMessageDto) => {
        if (msg.message.startsWith('[SYS_MATCH]')) return;
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
    };
    const onMatchChanged = (match: MatchRequestDto) => {
      if (match.id === parseInt(matchId || '0')) setActiveMatch(match);
    };

    if (chatHub && matchId) {
      chatHub.invoke('JoinChatGroup', matchId.toString())
        .catch(() => console.error('Could not join chat group'));
      chatHub.on('ReceiveMessage', onReceiveMessage);
    }

    if (matchHub) {
      matchHub.on('LocationSharingUpdated', onMatchChanged);
      matchHub.on('MeetingPlaceUpdated', onMatchChanged);
    }

    return () => {
      chatHub?.off('ReceiveMessage', onReceiveMessage);
      matchHub?.off('LocationSharingUpdated', onMatchChanged);
      matchHub?.off('MeetingPlaceUpdated', onMatchChanged);
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
    } catch {
      console.error('Could not send message');
    }
  };

  const handleShareLocation = () => {
    if (!matchId || !activeMatch) return;
    setShowShareConfirm(true);
  };

  const executeShareLocation = async () => {
    setShowShareConfirm(false);
    if (!matchId || !profile?.id) return;
    try {
      if (!navigator.geolocation) throw new Error('Geolocation unavailable');
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }));
      await tempUserApi.updateLocation(profile.id,
        position.coords.latitude, position.coords.longitude);
      lastLocationSentAt.current = Date.now();
      const updated = await matchApi.shareLocation(parseInt(matchId));
      setActiveMatch(updated);
    } catch {
      Toast.show('Không lấy được GPS mới hoặc không chia sẻ được vị trí');
    }
  };

  const handleStopSharingLocation = async () => {
    if (!matchId || !activeMatch) return;
    try {
      const updated = await matchApi.stopSharingLocation(parseInt(matchId));
      setActiveMatch(updated);
    } catch {
      console.error('Could not stop sharing location');
      alert('Lỗi dừng chia sẻ vị trí');
    }
  };

  const proposeMeetingPlace = async (place: MeetingPlaceDto) => {
    if (!activeMatch || meetingDecisionBusy) return;
    setMeetingDecisionBusy(true);
    try {
      setActiveMatch(await matchApi.proposeMeetingPlace(activeMatch.id, place.id));
      Toast.show('Đã gửi đề xuất điểm hẹn');
    } catch {
      Toast.show('Không gửi được đề xuất. Hãy tải lại gợi ý.');
    } finally {
      setMeetingDecisionBusy(false);
    }
  };

  const confirmMeetingPlace = async () => {
    if (!activeMatch?.meetingPlace || meetingDecisionBusy) return;
    setMeetingDecisionBusy(true);
    try {
      setActiveMatch(await matchApi.confirmMeetingPlace(
        activeMatch.id, activeMatch.meetingPlace.id));
      Toast.show('Hai bạn đã thống nhất điểm hẹn');
    } catch {
      Toast.show('Đề xuất đã thay đổi hoặc quyền chia sẻ đã hết. Hãy tải lại.');
    } finally {
      setMeetingDecisionBusy(false);
    }
  };

  const proposeGoogleMeetingPlace = async () => {
    if (!activeMatch || meetingDecisionBusy) return;
    setMeetingDecisionBusy(true);
    try {
      setActiveMatch(await matchApi.proposeGoogleMeetingPlace(
        activeMatch.id, googlePlaceName.trim(), googlePlaceUrl.trim()));
      setGooglePlaceName('');
      setGooglePlaceUrl('');
      Toast.show('Đã gửi liên kết quán cho người kia xác nhận');
    } catch {
      Toast.show('Tên hoặc liên kết Google Maps không hợp lệ, hoặc quyền chia sẻ đã hết.');
    } finally {
      setMeetingDecisionBusy(false);
    }
  };

  const handleReport = async () => {
    if (!activeMatch || !profile) return;
    const buddyId = activeMatch.fromUserId === profile.id ? activeMatch.toUserId : activeMatch.fromUserId;
    setReporting(true);
    try {
      await reportApi.create(buddyId, reportReason);
      setShowReport(false);
      Toast.show('Đã gửi báo cáo');
    } catch {
      Toast.show('Không gửi được báo cáo. Hãy thử lại.');
    } finally {
      setReporting(false);
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
                <span className="w-full h-full bg-surface-container-high flex items-center justify-center material-symbols-outlined" aria-hidden="true">person</span>
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
            <div className="absolute inset-0 bg-gradient-to-b from-surface-container-high to-surface"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-surface"></div>
            
            {/* Pulsing Radar Map Marker for Meetup Location */}
            {activeMatch?.hasSharedLocation && activeMatch.buddyHasSharedLocation &&
              activeMatch.meetingPlace && <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-12 h-12 rounded-full bg-primary-container/30 animate-ping"></span>
                <span className="absolute w-8 h-8 rounded-full bg-primary-container/50 animate-pulse"></span>
                <div className="w-7 h-7 rounded-full bg-primary-container shadow-[0_0_16px_rgba(255,107,53,0.8)] flex items-center justify-center text-white text-[14px]">
                  <span className="material-symbols-outlined text-[16px]">soup_kitchen</span>
                </div>
              </div>
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-highest/90 backdrop-blur-md shadow-lg">
                <span className="font-label-sm text-label-sm text-primary tracking-wide uppercase truncate max-w-[200px] block">
                  {activeMatch.meetingPlace.name}
                </span>
              </div>
            </div>}
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
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-title-md text-title-md text-on-surface truncate">
                      {partnerName}
                    </h2>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setShowReport(true)} disabled={!activeMatch}
                className="flex-shrink-0 px-3 py-2 rounded-full bg-surface-container-high text-on-surface-variant disabled:opacity-50">
                Báo cáo
              </button>
            </div>

            {/* Location Sharing Card */}
            {activeMatch && activeMatch.status === 'Accepted' && (
              <div className="px-margin mb-3">
                <div className="w-full p-3 rounded-DEFAULT bg-surface-container/90 backdrop-blur-lg flex flex-col gap-2 shadow-sm border border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">my_location</span>
                    <span className="font-title-sm text-on-surface">Chia sẻ vị trí</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    {activeMatch.hasSharedLocation
                      ? `${partnerName} có thể xem vị trí chính xác của bạn.`
                      : `Bạn chưa chia sẻ vị trí của mình với ${partnerName}.`}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {activeMatch.buddyHasSharedLocation
                      ? `${partnerName} đang chia sẻ vị trí với bạn.`
                      : `${partnerName} chưa chia sẻ vị trí với bạn.`}
                  </p>
                  {activeMatch.buddyHasSharedLocation &&
                    typeof activeMatch.buddyLat === 'number' &&
                    typeof activeMatch.buddyLng === 'number' && (
                    <button
                      onClick={() => navigate('/route', {
                        state: { privateMatchId: activeMatch.id, name: partnerName },
                      })}
                      className="w-full px-3 py-2 bg-primary text-on-primary rounded-full font-label-md"
                    >
                      Xem đường tới {partnerName}
                    </button>
                  )}
                  {activeMatch.hasSharedLocation ? (
                    <button onClick={handleStopSharingLocation}
                      className="w-full px-3 py-2 bg-surface-container-high text-error rounded-full font-label-md">
                      Dừng chia sẻ vị trí của tôi
                    </button>
                  ) : (
                    <button onClick={handleShareLocation}
                      className="w-full px-3 py-2 bg-primary text-on-primary rounded-full font-label-md">
                      Chia sẻ vị trí của tôi
                    </button>
                  )}
                  <p className="text-body-sm text-on-surface-variant">Gợi ý điểm hẹn xuất hiện khi cả hai cùng chia sẻ.</p>
                </div>
              </div>
            )}

            {activeMatch?.status === 'Accepted' &&
              activeMatch.hasSharedLocation && activeMatch.buddyHasSharedLocation &&
              activeMatch.meetingPlace && (
              <section className="px-margin mb-3" aria-label="Địa điểm hẹn đã đề xuất">
                <div className="p-3 rounded-DEFAULT bg-secondary-container/30 border border-secondary/40 space-y-2">
                  <p className="font-title-sm text-on-surface">
                    {activeMatch.meetingPlace.agreedAt
                      ? 'Hai bạn đã thống nhất điểm hẹn'
                      : 'Đề xuất điểm hẹn'}
                  </p>
                  <p className="font-label-lg text-on-surface break-words">
                    {activeMatch.meetingPlace.name}
                  </p>
                  {!activeMatch.meetingPlace.agreedAt && (
                    <p className="text-body-sm text-on-surface-variant">
                      {activeMatch.meetingPlace.proposedByUserId.toLowerCase() === profile?.id?.toLowerCase()
                        ? `Đang chờ ${partnerName} đồng ý.`
                        : `${partnerName} muốn gặp tại đây.`}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {!activeMatch.meetingPlace.agreedAt &&
                      activeMatch.meetingPlace.proposedByUserId.toLowerCase() !== profile?.id?.toLowerCase() && (
                      <button type="button" disabled={meetingDecisionBusy}
                        onClick={confirmMeetingPlace}
                        className="min-h-10 px-4 rounded-full bg-primary text-on-primary disabled:opacity-50">
                        Đồng ý điểm hẹn
                      </button>
                    )}
                    {activeMatch.meetingPlace.googleMapsUrl ? (
                      <a href={activeMatch.meetingPlace.googleMapsUrl} target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-10 px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container">
                        Mở quán trên Google Maps
                      </a>
                    ) : (
                      <button type="button"
                        onClick={() => navigate('/route', { state: {
                          privateMatchId: activeMatch.id,
                          meetingPlace: true,
                          name: activeMatch.meetingPlace!.name
                        } })}
                        className="min-h-10 px-4 rounded-full bg-secondary-container text-on-secondary-container">
                        Xem đường đi
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeMatch?.status === 'Accepted' &&
              activeMatch.hasSharedLocation && activeMatch.buddyHasSharedLocation &&
              typeof activeMatch.buddyLat === 'number' &&
              typeof activeMatch.buddyLng === 'number' && (
              <section className="px-margin mb-3" aria-label="Gợi ý điểm hẹn">
                <div className="p-3 rounded-DEFAULT bg-surface-container/90 border border-secondary/25 space-y-2">
                  <div className="flex items-center gap-2 text-on-surface font-title-sm">
                    <span className="material-symbols-outlined text-secondary">restaurant</span>
                    Gợi ý điểm hẹn ở khoảng giữa
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    Google Maps nhận tọa độ điểm giữa hai bạn để hiển thị quán. Bản đồ cập nhật khoảng 30 giây một lần khi vị trí thay đổi. Chọn quán, sao chép liên kết chia sẻ rồi gửi cho người kia xác nhận.
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Loại địa điểm hẹn">
                    {meetingSearchOptions.map((option) => (
                      <button key={option.kind} type="button" onClick={() => setMeetingSearchKind(option.kind)}
                        aria-pressed={meetingSearchKind === option.kind}
                        className={`min-h-10 shrink-0 rounded-full px-3 text-body-sm font-semibold ${meetingSearchKind === option.kind
                          ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setMeetingRefreshKey(value => value + 1)}
                    disabled={meetingPlacesLoading}
                    className="text-body-sm text-primary underline disabled:opacity-50 self-start">
                    Làm mới quán theo vị trí hiện tại
                  </button>
                  {meetingEmbedUrl && (
                    <iframe src={meetingEmbedUrl} title="Quán quanh điểm giữa trên Google Maps"
                      loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                      className="w-full h-72 rounded-xl border-0" />
                  )}
                  {meetingSearchUrl && (
                    <a href={meetingSearchUrl} target="_blank" rel="noopener noreferrer"
                      className="block rounded-full bg-primary-container text-white text-center px-3 py-2 text-label-sm">
                      Mở Google Maps để sao chép liên kết quán
                    </a>
                  )}
                  <div className="space-y-2 rounded-xl bg-surface-container-high p-3">
                    <label htmlFor="google-place-name" className="block text-body-sm text-on-surface">
                      Tên quán đã chọn
                    </label>
                    <input id="google-place-name" value={googlePlaceName}
                      onChange={event => setGooglePlaceName(event.target.value)}
                      maxLength={120} placeholder="Ví dụ: Quán ăn A"
                      className="w-full min-h-10 rounded-lg bg-surface px-3 text-on-surface" />
                    <label htmlFor="google-place-url" className="block text-body-sm text-on-surface">
                      Liên kết chia sẻ từ Google Maps
                    </label>
                    <input id="google-place-url" type="url" value={googlePlaceUrl}
                      onChange={event => setGooglePlaceUrl(event.target.value)}
                      maxLength={2048} placeholder="https://maps.app.goo.gl/..."
                      className="w-full min-h-10 rounded-lg bg-surface px-3 text-on-surface" />
                    <button type="button" disabled={meetingDecisionBusy ||
                      !googlePlaceName.trim() || !googlePlaceUrl.trim()}
                      onClick={proposeGoogleMeetingPlace}
                      className="w-full min-h-11 rounded-full bg-primary text-on-primary disabled:opacity-50">
                      Đề xuất quán này
                    </button>
                  </div>
                  {meetingProviderAvailable && meetingPlaces.length > 0 && (
                    <p className="text-body-sm text-on-surface-variant">
                      Gợi ý thêm từ OpenStreetMap, xếp theo khoảng cách tới điểm giữa.
                    </p>
                  )}
                  {meetingPlacesLoading && <p className="text-body-sm text-on-surface-variant">Đang tìm quán gần hai bạn...</p>}
                  {meetingPlacesError && <p className="text-body-sm text-error">Tạm thời không tải được gợi ý điểm hẹn.</p>}
                  {!meetingPlacesLoading && !meetingPlacesError && meetingPlaces.length === 0 &&
                    meetingProviderAvailable &&
                    <p className="text-body-sm text-on-surface-variant">
                      OpenStreetMap chưa tìm thấy quán phù hợp ở khoảng giữa.
                    </p>}
                  {meetingPlaces.map((place) => (
                    <div key={place.id} className="flex items-center gap-2 rounded-xl bg-surface-container-high p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-on-surface font-label-md truncate">{place.name}</p>
                        <p className="text-on-surface-variant text-body-sm">
                          {place.category === 'cafe' ? 'Cà phê' : place.category === 'fast_food' ? 'Ăn nhanh' : 'Quán ăn'}
                          {' · '}{place.distanceFromMiddleMeters} m từ điểm giữa
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button type="button" disabled={meetingDecisionBusy}
                          className="rounded-full bg-primary text-on-primary px-3 py-2 text-label-sm disabled:opacity-50"
                          onClick={() => proposeMeetingPlace(place)}>
                          Đề xuất
                        </button>
                        <button type="button"
                          className="rounded-full bg-secondary-container text-on-secondary-container px-3 py-2 text-label-sm"
                          onClick={() => navigate('/route', { state: {
                            lat: place.lat, lng: place.lng, name: place.name
                          } })}>
                          Xem đường
                        </button>
                      </div>
                    </div>
                  ))}
                  {meetingPlaces.length > 0 && (
                    <a href="https://www.openstreetmap.org/copyright"
                      target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-on-surface-variant underline">
                      © OpenStreetMap contributors · ODbL
                    </a>
                  )}
                </div>
              </section>
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
        content="Người đã match sẽ thấy vị trí chính xác của bạn ngay khi bạn chia sẻ, tối đa 60 phút, dù họ chưa chia sẻ lại. Khi cả hai cùng chia sẻ, Google Maps sẽ tải quán quanh điểm giữa và nhận tọa độ điểm giữa. Nếu có nguồn OpenStreetMap bổ sung, máy chủ cũng gửi điểm giữa tới nguồn đó."
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
      <Modal
        visible={showReport}
        title="Báo cáo người dùng"
        content={
          <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}
            className="w-full p-3 rounded-xl bg-surface-container-high text-on-surface">
            <option>Hành vi không phù hợp</option>
            <option>Quấy rối</option>
            <option>Spam</option>
            <option>Khác</option>
          </select>
        }
        closeOnAction={false}
        onClose={() => setShowReport(false)}
        actions={[
          { key: 'cancel', text: 'Hủy', onClick: () => setShowReport(false) },
          { key: 'submit', text: reporting ? 'Đang gửi...' : 'Gửi báo cáo', primary: true, disabled: reporting, onClick: handleReport },
        ]}
      />
    </div>
  );
}
