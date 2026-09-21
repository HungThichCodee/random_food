import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ChatMessageDto } from '../../types/chat';

const { Text } = Typography;

interface ChatMessageProps {
  message: ChatMessageDto;
  isOwn: boolean;
}

export default function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const { t } = useTranslation();

  return (
    // TODO: Single chat message bubble
    <div
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '8px 12px',
          borderRadius: 8,
          backgroundColor: isOwn ? '#ff6b35' : '#f0f0f0',
          color: isOwn ? '#fff' : '#000',
        }}
      >
        {!isOwn && (
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            {message.senderName}
          </Text>
        )}
        <Text style={{ color: isOwn ? '#fff' : 'inherit' }}>{message.message}</Text>
      </div>
    </div>
  );
}
