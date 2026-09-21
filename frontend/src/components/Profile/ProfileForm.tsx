import { Form, Input, Radio, Select, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CreateTempUserDto } from '../../types/tempUser';

interface ProfileFormProps {
  onSubmit?: (values: CreateTempUserDto) => void;
  isLoading?: boolean;
}

export default function ProfileForm({ onSubmit, isLoading = false }: ProfileFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleFinish = (values: CreateTempUserDto) => {
    // TODO: Handle profile creation submission
    onSubmit?.(values);
  };

  return (
    // TODO: Ant Design Form with fields: displayName, gender, foodPreferences, desiredFood
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item
        name="displayName"
        label={t('profile.displayName')}
        rules={[{ required: true, message: 'Please enter display name' }]}
      >
        <Input placeholder={t('profile.displayName')} />
      </Form.Item>

      <Form.Item name="gender" label={t('profile.gender')}>
        <Radio.Group>
          <Radio value="male">Nam</Radio>
          <Radio value="female">Nữ</Radio>
          <Radio value="other">Khác</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="foodPreferences" label={t('profile.preferences')}>
        <Select mode="tags" placeholder="Chọn sở thích ẩm thực" options={[]} />
      </Form.Item>

      <Form.Item name="desiredFood" label={t('profile.desiredFood')}>
        <Input placeholder={t('profile.desiredFood')} />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={isLoading} block>
        {t('profile.create')}
      </Button>
    </Form>
  );
}
