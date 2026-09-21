import { useState } from 'react';
import { Card, Input, Button, List } from 'antd';
import { useTranslation } from 'react-i18next';
import ChatMessage from './ChatMessage';
import type { ChatMessageDto } from '../../types/chat';

interface ChatWindowProps {
  matchRequestId: number;
}

export default function ChatWindow({ matchRequestId }: ChatWindowProps) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);

  const handleSend = () => {
    // TODO: Send chat message via SignalR / API
    if (!inputText.trim()) return;
    setInputText('');
  };

  return (
    // TODO: Chat panel with message list and input
    <Card
      title={`Chat #${matchRequestId}`}
      style={{ width: 360, position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
    >
      <div style={{ height: 300, overflowY: 'auto', marginBottom: 12 }}>
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={false}
            />
          )}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          placeholder={t('chat.placeholder')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={handleSend}
        />
        <Button type="primary" onClick={handleSend}>
          {t('chat.send')}
        </Button>
      </div>
    </Card>
  );
}
