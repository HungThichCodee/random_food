import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toast } from '../stores/useToastStore';
import { tempUserApi } from '../api/tempUserApi';
import { matchApi } from '../api/matchApi';
import { useUserStore } from '../stores/useUserStore';
import { useGeolocation } from '../hooks/useGeolocation';
import type { NearbyUserDto } from '../types/tempUser';
import type { MatchRequestDto } from '../types/match';

export default function NearbyBuddiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useGeolocation();
  const profile = useUserStore((state) => state.profile);

  const [nearbyUsers, setNearbyUsers] = useState<NearbyUserDto[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchRequestDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [activeUserForMatch, setActiveUserForMatch] = useState<NearbyUserDto | null>(null);
  const lastNearbyFetchAt = useRef(0);

  const fetchUsers = async () => {
    setLoadError('');
    try {
      if (location.lat != null && location.lng != null && profile) {
        await tempUserApi.updateLocation(profile.id, location.lat, location.lng);
        const users = await tempUserApi.getNearby();
        setNearbyUsers(users.filter((u) => u.id.toLowerCase() !== profile.id.toLowerCase()));
        
        // Check for active match
        const active = await matchApi.getActive().catch((error: unknown) => {
          if (axios.isAxiosError(error) && error.response?.status === 404) return null;
          throw error;
        });
        if (active) {
          setActiveMatch(active);
        } else {
          setActiveMatch(null);
        }
      }
    } catch {
      console.error('Could not load nearby users');
      setLoadError('Không tải được danh sách người gần bạn. Hãy thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.isLoading || !profile) return;
    if (location.lat == null || location.lng == null) {
      setIsLoading(false);
      setLoadError('Không lấy được vị trí của bạn. Hãy cấp quyền GPS và thử lại.');
      return;
    }
    if (Date.now() - lastNearbyFetchAt.current < 10000) return;
    lastNearbyFetchAt.current = Date.now();
    void fetchUsers();
  }, [location.isLoading, location.lat, location.lng, profile?.id]);

  const handleSendMatchRequest = async () => {
    if (!activeUserForMatch || !profile) return;
    setIsSendingRequest(true);
    try {
      await matchApi.sendRequest({
        toTempUserId: activeUserForMatch.id,
      });
      Toast.show({
        icon: 'success',
        content: t('Lời mời đã gửi!'),
      });
      setActiveUserForMatch(null);
    } catch (error: unknown) {
      const response = axios.isAxiosError<{ message?: string }>(error) ? error.response : undefined;
      Toast.show({
        icon: 'fail',
        content: response?.data?.message || t('Lỗi khi gửi lời rủ / Error sending request'),
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <h2 className="text-on-surface text-xl text-center mb-4">
          Bạn cần tạo hồ sơ để dùng tính năng này
        </h2>
        <button type="button" onClick={() => navigate('/profile')}
          className="rounded-xl bg-primary-container px-5 py-3 font-semibold text-white active:scale-95">
          Đến trang tạo hồ sơ
        </button>
      </div>
    );
  }

  if (!location.isLoading && location.error) {
    return <div className="min-h-screen bg-background text-on-surface p-6 flex items-center justify-center text-center">Cần cho phép truy cập vị trí để tìm bạn ăn ở gần. {location.error}</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background pt-safe-top pb-32">
      {/* App Bar */}
      <div className="px-4 py-3 flex items-center sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all mr-2 shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-title-lg font-bold text-white tracking-wide truncate">Gợi ý bạn ăn</h1>
      </div>

      <div className="px-4 mt-4">
        {activeMatch && (
          <div 
            onClick={() => navigate(`/chat/${activeMatch.id}`)}
            className="mb-6 bg-gradient-to-r from-primary-container to-surface-tint text-white p-4 rounded-2xl flex items-center justify-between cursor-pointer shadow-[0_8px_24px_rgba(255,107,53,0.3)] active:scale-95 transition-all relative overflow-hidden border border-white/10"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-3xl animate-pulse">chat</span>
              </div>
              <div>
                <h3 className="font-title-md font-bold">Kèo đã chốt!</h3>
                <p className="font-body-sm opacity-90">Vào phòng chat ngay</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-2xl relative z-10">chevron_right</span>
          </div>
        )}

        {loadError && <p className="p-4 mb-4 rounded-xl bg-error/10 text-error" role="alert">{loadError}</p>}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          </div>
        ) : nearbyUsers.length === 0 ? (
          <div className="flex flex-col items-center text-center p-8 bg-surface-container-low rounded-2xl border border-white/5 mt-8">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-3">location_off</span>
            <p className="text-body-lg text-on-surface-variant">Không tìm thấy ai quanh đây.</p>
            <p className="text-body-sm text-on-surface-variant/70 mt-1">Hãy thử lại sau nhé!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {nearbyUsers.map((user) => (
              <div key={user.id} className="bg-surface-container-low border border-white/5 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-container/80 to-surface-tint shadow-inner flex items-center justify-center text-2xl relative shrink-0">
                    {user.gender === 'Female' ? '👩' : user.gender === 'Male' ? '👨' : '👤'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-title-md font-bold text-white tracking-wide truncate pr-2">{user.displayName}</h3>
                    <div className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-1">
                      <div className="flex items-center bg-surface-container-highest px-1.5 py-0.5 rounded-full text-[10px] font-bold text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[12px] mr-0.5">near_me</span>
                        {user.distanceLabel}
                      </div>
                      {user.desiredFood && (
                        <div className="text-[12px] opacity-80 truncate text-on-surface-variant/90">
                          Thèm: <span className="font-medium text-on-surface-variant">{user.desiredFood}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {activeMatch && (activeMatch.toUserId === user.id || activeMatch.fromUserId === user.id) ? (
                  <button
                    onClick={() => navigate(`/chat/${activeMatch.id}`)}
                    className="w-11 h-11 rounded-full bg-secondary text-on-secondary flex items-center justify-center hover:bg-secondary/90 active:scale-90 transition-all shrink-0 shadow-[0_4px_12px_rgba(79,219,204,0.4)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveUserForMatch(user)}
                    className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary active:scale-90 transition-all shrink-0 border border-primary/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">local_dining</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Match Request Modal */}
      {activeUserForMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isSendingRequest && setActiveUserForMatch(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-surface-container-high rounded-[28px] p-6 w-full max-w-sm shadow-[0_24px_48px_rgba(0,0,0,0.6)] border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-7 mt-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-container/80 to-surface-tint shadow-inner flex items-center justify-center text-3xl mb-4 relative">
                {activeUserForMatch.gender === 'Female' ? '👩' : activeUserForMatch.gender === 'Male' ? '👨' : '👤'}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface-container-high rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary">restaurant</span>
                </div>
              </div>
              <h2 className="text-title-lg font-bold text-white mb-2 leading-tight">
                Rủ <span className="text-primary">{activeUserForMatch.displayName}</span> đi ăn?
              </h2>
              <p className="text-body-sm text-on-surface-variant px-2">
                Họ sẽ nhận được lời mời và hai bạn có thể nhắn tin với nhau để trao đổi thêm.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSendMatchRequest}
                disabled={isSendingRequest}
                className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-primary/80 text-on-primary font-label-lg font-bold flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,53,0.4)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSendingRequest ? (
                  <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                ) : (
                  'Gửi lời mời'
                )}
              </button>
              <button
                onClick={() => setActiveUserForMatch(null)}
                disabled={isSendingRequest}
                className="w-full h-12 rounded-full bg-surface-container-highest/50 text-white font-label-lg font-medium flex items-center justify-center hover:bg-surface-container-highest active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
