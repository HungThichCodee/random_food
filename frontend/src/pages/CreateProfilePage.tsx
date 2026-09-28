import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Toast, Selector } from 'antd-mobile';
import { tempUserApi } from '../api/tempUserApi';
import { useUserStore } from '../stores/useUserStore';
import type { CreateTempUserDto } from '../types/tempUser';

export default function CreateProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setProfile, toggleVisibilityLocally } = useUserStore();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const dto: CreateTempUserDto = {
        displayName: values.displayName,
        gender: values.gender?.[0], // Selector returns array
        foodPreferences: values.foodPreferences,
        desiredFood: values.desiredFood,
      };

      const user = await tempUserApi.create(dto);
      
      // Save to Zustand
      setProfile(user);
      toggleVisibilityLocally(true); // default visible

      Toast.show({
        icon: 'success',
        content: t('profile.create') + ' ' + t('common.success', 'thành công!'),
      });
      
      // Redirect to map
      navigate('/map');
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error?.response?.data?.message || t('common.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-safe" style={{ padding: '1.5rem', background: 'var(--surface)', minHeight: '100vh', color: 'var(--on-surface)' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{t('profile.title')}</h2>
      <p style={{ color: 'var(--outline)', marginBottom: '2rem', fontSize: '14px' }}>{t('profile.expiryNote')}</p>
      
      <Form
        layout="vertical"
        onFinish={onFinish}
        style={{ '--background-color': 'transparent', '--border-top': 'none', '--border-bottom': 'none' } as any}
        footer={
          <Button block type="submit" color="primary" size="large" loading={loading} style={{ borderRadius: 'var(--radius-pill)', marginTop: '1rem' }}>
            {t('profile.create')}
          </Button>
        }
      >
        <Form.Item
          name="displayName"
          label={<span style={{ color: 'var(--on-surface-variant)' }}>{t('profile.displayName')}</span>}
          rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
        >
          <Input placeholder="Tên hiển thị trên bản đồ" style={{ '--color': 'var(--on-surface)' }} />
        </Form.Item>

        <Form.Item name="gender" label={<span style={{ color: 'var(--on-surface-variant)' }}>{t('profile.gender')}</span>}>
          <Selector
            options={[
              { label: 'Nam', value: 'Male' },
              { label: 'Nữ', value: 'Female' },
              { label: 'Khác', value: 'Other' },
            ]}
            style={{ '--color': 'var(--on-surface)', '--text-color': 'var(--on-surface)', '--border-radius': 'var(--radius-sm)' }}
          />
        </Form.Item>

        <Form.Item name="desiredFood" label={<span style={{ color: 'var(--on-surface-variant)' }}>{t('profile.desiredFood')}</span>}>
          <Input placeholder="VD: Bún bò huế, Phở..." style={{ '--color': 'var(--on-surface)' }} />
        </Form.Item>
        
        <Form.Item name="foodPreferences" label={<span style={{ color: 'var(--on-surface-variant)' }}>{t('profile.preferences')}</span>}>
           <Selector
            columns={3}
            multiple
            options={[
              { label: 'Cay', value: 'cay' },
              { label: 'Ăn chay', value: 'chay' },
              { label: 'Hải sản', value: 'hai_san' },
              { label: 'Thịt', value: 'thit' },
              { label: 'Healthy', value: 'healthy' }
            ]}
            style={{ '--color': 'var(--on-surface)', '--text-color': 'var(--on-surface)', '--border-radius': 'var(--radius-sm)' }}
          />
        </Form.Item>
      </Form>
    </div>
  );
}
