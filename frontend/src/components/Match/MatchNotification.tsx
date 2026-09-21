import { Modal, Button, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { MatchRequestDto } from '../../types/match';

const { Text } = Typography;

interface MatchNotificationProps {
  request: MatchRequestDto | null;
  isOpen: boolean;
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number) => void;
}

export default function MatchNotification({
  request,
  isOpen,
  onAccept,
  onDecline,
}: MatchNotificationProps) {
  const { t } = useTranslation();

  if (!request) return null;

  return (
    // TODO: Ant Design notification/modal for incoming match request
    <Modal
      title={t('match.invite')}
      open={isOpen}
      footer={[
        <Button key="decline" danger onClick={() => onDecline(request.id)}>
          {t('match.decline')}
        </Button>,
        <Button key="accept" type="primary" onClick={() => onAccept(request.id)}>
          {t('match.accept')}
        </Button>,
      ]}
      closable={false}
    >
      <Space direction="vertical">
        <Text strong>{request.fromUserName}</Text>
        <Text>{t('match.invite')}?</Text>
      </Space>
    </Modal>
  );
}
