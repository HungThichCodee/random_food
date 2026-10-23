import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd-mobile';
import { Toast } from '../stores/useToastStore';
import { useSignalR } from '../hooks/useSignalR';
import { matchApi } from '../api/matchApi';
import { useUserStore } from '../stores/useUserStore';
import type { MatchRequestDto } from '../types/match';

export default function GlobalMatchListener() {
  const { matchHub, isConnected } = useSignalR();
  const navigate = useNavigate();
  const token = useUserStore((state) => state.profile?.token);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<MatchRequestDto | null>(null);
  const noticeVersion = useRef(0);
  const pendingFetchId = useRef(0);
  const responding = useRef(false);

  useEffect(() => {
    if (matchHub && token) {
      const onReceived = (req: MatchRequestDto) => {
        noticeVersion.current += 1;
        setCurrentRequest(req);
        setModalVisible(true);
      };

      const onResponded = (res: MatchRequestDto) => {
        if (res.status === 'Accepted') {
          Toast.show({ icon: 'success', content: `${res.toUserName} đã đồng ý! Bắt đầu chat nào.` });
          navigate(`/chat/${res.id}`);
        } else if (res.status === 'Declined') {
          Toast.show({ icon: 'fail', content: `${res.toUserName} đã từ chối lời rủ của bạn.` });
        }
      };

      matchHub.on('MatchRequestReceived', onReceived);
      matchHub.on('MatchRequestResponded', onResponded);

      return () => {
        matchHub.off('MatchRequestReceived', onReceived);
        matchHub.off('MatchRequestResponded', onResponded);
      };
    }
  }, [matchHub, navigate, token]);

  useEffect(() => {
    if (token) return;
    noticeVersion.current += 1;
    setCurrentRequest(null);
    setModalVisible(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchPending = async () => {
      if (responding.current) return;
      const startedAtVersion = noticeVersion.current;
      const fetchId = ++pendingFetchId.current;
      try {
        const pendingReqs = await matchApi.getPending();
        if (cancelled || responding.current || noticeVersion.current !== startedAtVersion ||
          pendingFetchId.current !== fetchId) return;
        setCurrentRequest(pendingReqs[0] ?? null);
        setModalVisible(pendingReqs.length > 0);
      } catch {
        if (!cancelled) console.error('Could not fetch pending requests');
      }
    };
    void fetchPending();
    const interval = window.setInterval(() => { void fetchPending(); }, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [token, isConnected]);

  const handleReject = async () => {
    if (!currentRequest || responding.current) return;
    responding.current = true;
    try {
      noticeVersion.current += 1;
      setModalVisible(false);
      await matchApi.respond(currentRequest.id, false);
      Toast.show('Đã từ chối lời rủ');
    } catch {
      console.error('Could not reject match request');
    } finally {
      responding.current = false;
    }
  };

  const handleAccept = async () => {
    if (!currentRequest || responding.current) return;
    responding.current = true;
    try {
      noticeVersion.current += 1;
      setModalVisible(false);
      const res = await matchApi.respond(currentRequest.id, true);
      Toast.show({ icon: 'success', content: 'Tuyệt vời! Bắt đầu chat nào.' });
      navigate(`/chat/${res.id}`);
    } catch {
      console.error('Could not accept match request');
      Toast.show('Lỗi khi chấp nhận');
    } finally {
      responding.current = false;
    }
  };

  return (
    <Modal
      visible={modalVisible}
      title="Lời mời đi ăn"
      content={`${currentRequest?.fromUserName} muốn rủ bạn đi ăn! Bạn có đồng ý không?`}
      closeOnAction={true}
      actions={[
        {
          key: 'reject',
          text: 'Từ chối',
          danger: true,
          onClick: handleReject,
        },
        {
          key: 'accept',
          text: 'Đồng ý',
          primary: true,
          onClick: handleAccept,
        },
      ]}
    />
  );
}
