import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../../stores/useLanguageStore';

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguageStore();

  return (
    <div>
      {/* TODO: Ant Design Switch or Button that toggles between VI and EN using useLanguageStore */}
      <Button type="default" size="small" onClick={toggleLanguage}>
        {currentLanguage === 'vi' ? 'EN' : 'VI'}
      </Button>
    </div>
  );
}
