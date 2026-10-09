import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd-mobile';
import { Toast } from '../stores/useToastStore';
import { useSignalR } from '../hooks/useSignalR';
import { matchApi } from '../api/matchApi';

export default function GlobalMatchListener() {
  const { matchHub } = useSignalR();
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any>(null);

  useEffect(() => {
    if (matchHub) {
      matchHub.on('MatchRequestReceived', (req: any) => {
        setCurrentRequest(req);
        setModalVisible(true);
      });

      matchHub.on('MatchRequestResponded', (res: any) => {
        if (res.status === 'Accepted') {
          Toast.show({ icon: 'success', content: `${res.toUserName} đã đồng ý! Bắt đầu chat nào.` });
          navigate(`/chat/${res.id}`);
        } else if (res.status === 'Declined') {
          Toast.show({ icon: 'fail', content: `${res.toUserName} đã từ chối lời rủ của bạn.` });
        }
      });

      return () => {
        matchHub.off('MatchRequestReceived');
        matchHub.off('MatchRequestResponded');
      };
    }
  }, [matchHub, navigate]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const pendingReqs = await matchApi.getPending();
        if (pendingReqs && pendingReqs.length > 0) {
          setCurrentRequest(pendingReqs[0]);
          setModalVisible(true);
        }
      } catch (e) {
        console.error('Failed to fetch pending requests', e);
      }
    };
    fetchPending();
  }, []);

  const handleReject = async () => {
    try {
      setModalVisible(false);
      await matchApi.respond(currentRequest.id, false);
      Toast.show('Đã từ chối lời rủ');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async () => {
    try {
      setModalVisible(false);
      const res = await matchApi.respond(currentRequest.id, true);
      Toast.show({ icon: 'success', content: 'Tuyệt vời! Bắt đầu chat nào.' });
      navigate(`/chat/${res.id}`);
    } catch (e) {
      console.error(e);
      Toast.show('Lỗi khi chấp nhận');
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
