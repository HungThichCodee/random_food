import { Modal, Form, Input, Radio, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface ReportModalProps {
  reportedUserId: string | null;
  isOpen: boolean;
  onSubmit: (data: { reportedUserId: string; reason: string; block: boolean }) => void;
  onCancel: () => void;
}

export default function ReportModal({
  reportedUserId,
  isOpen,
  onSubmit,
  onCancel,
}: ReportModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleFinish = (values: { reason: string; block: boolean }) => {
    // TODO: Submit user report
    if (reportedUserId) {
      onSubmit({
        reportedUserId,
        reason: values.reason,
        block: values.block || false,
      });
      form.resetFields();
    }
  };

  return (
    // TODO: Ant Design Modal with report form
    <Modal
      title={t('report.title')}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="reason"
          label={t('report.reason')}
          rules={[{ required: true, message: 'Please select a reason' }]}
        >
          <Radio.Group>
            <Radio value="inappropriate">Hành vi không phù hợp</Radio>
            <Radio value="harassment">Quấy rối</Radio>
            <Radio value="spam">Spam quảng cáo</Radio>
            <Radio value="other">Khác</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="detail" label="Chi tiết">
          <Input.TextArea rows={3} placeholder="Mô tả thêm nếu có..." />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="primary" danger htmlType="submit">
            {t('report.submit')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
