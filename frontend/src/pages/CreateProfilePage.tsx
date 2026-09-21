import { useTranslation } from 'react-i18next';

export default function CreateProfilePage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>{t('profile.title')}</h2>
      {/* TODO: ProfileForm component */}
      <p style={{ color: '#999' }}>{t('profile.expiryNote')}</p>
    </div>
  );
}
