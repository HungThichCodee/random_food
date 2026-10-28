import type { ReactNode } from 'react';
import { Button, Modal } from 'antd';

interface ModalAction {
  key: string;
  text: string;
  danger?: boolean;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}

interface MobileModalProps {
  visible: boolean;
  title: string;
  content: ReactNode;
  actions: ModalAction[];
  closeOnAction?: boolean;
  onClose?: () => void;
}

export default function MobileModal({
  visible,
  title,
  content,
  actions,
  closeOnAction = false,
  onClose,
}: MobileModalProps) {
  return (
    <Modal
      open={visible}
      title={title}
      centered
      closable={false}
      maskClosable={false}
      keyboard={Boolean(onClose)}
      onCancel={onClose}
      className="foodmatch-mobile-modal"
      width="min(420px, calc(100vw - 32px))"
      footer={actions.map(action => (
        <Button
          key={action.key}
          type={action.primary ? 'primary' : 'default'}
          danger={action.danger}
          disabled={action.disabled}
          onClick={() => {
            if (closeOnAction) onClose?.();
            void action.onClick();
          }}
        >
          {action.text}
        </Button>
      ))}
    >
      {content}
    </Modal>
  );
}
