import { Button, Space, Radio } from 'antd';
import { useTranslation } from 'react-i18next';

export default function RandomFoodPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{t('nav.random')}</h2>
      {/* TODO: Category selector (all/kho/nuoc) */}
      {/* TODO: SpinWheel component */}
      {/* TODO: FoodCard result display */}
      <Space direction="vertical">
        <Radio.Group defaultValue="all">
          <Radio.Button value="all">{t('food.category.all')}</Radio.Button>
          <Radio.Button value="kho">{t('food.category.kho')}</Radio.Button>
          <Radio.Button value="nuoc">{t('food.category.nuoc')}</Radio.Button>
        </Radio.Group>
        <Button type="primary" size="large">{t('food.spinButton')}</Button>
      </Space>
    </div>
  );
}
