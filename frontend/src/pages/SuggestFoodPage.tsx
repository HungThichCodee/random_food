import { useTranslation } from 'react-i18next';

export default function SuggestFoodPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{t('nav.suggest')}</h2>
      {/* TODO: CriteriaFilter component */}
      {/* TODO: Result list of FoodCard components */}
    </div>
  );
}
