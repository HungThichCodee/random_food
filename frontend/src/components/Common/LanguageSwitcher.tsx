import { Button } from 'antd';
import { useLanguageStore } from '../../stores/useLanguageStore';

export default function LanguageSwitcher() {
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
