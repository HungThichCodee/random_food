import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Button, Selector, Toast } from 'antd-mobile';
import { useFoodStore } from '../stores/useFoodStore';
import { v4 as uuidv4 } from 'uuid';
import './SuggestFoodPage.css';

const generateSessionId = () => {
  let id = localStorage.getItem('foodMatch_sessionId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('foodMatch_sessionId', id);
  }
  return id;
};

export default function SuggestFoodPage() {
  const { t } = useTranslation();
  const { suggestedFoods, fetchSuggestedFoods, isLoading, error } = useFoodStore();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    const sessionId = generateSessionId();
    await fetchSuggestedFoods({
      sessionId,
      mealTime: values.mealTime?.[0],
      priceRange: values.priceRange?.[0],
      includedTags: values.includedTags, // From some tag selector if needed, but keeping it simple for now
    });
    if (error) {
      Toast.show({ icon: 'fail', content: error });
    }
  };

  return (
    <div className="suggest-page">
      <div className="ambient-glow-tertiary" style={{ top: '-40px', left: '-40px', width: '200px', height: '200px' }} />

      <div className="header">
        <h2 className="text-tertiary text-headline-xl">{t('nav.suggest', 'Suggest Food')}</h2>
      </div>

      <Form
        form={form}
        onFinish={onFinish}
        footer={
          <Button block type="submit" color="primary" size="large" loading={isLoading} className="suggest-btn">
            {t('food.suggestButton', 'Get Suggestion')}
          </Button>
        }
      >
        <Form.Item name="mealTime" label={<span className="text-label-lg text-on-surface">{t('food.mealTime', 'Meal Time')}</span>}>
          <Selector
            options={[
              { label: 'Sáng', value: 'Sang' },
              { label: 'Trưa', value: 'Trua' },
              { label: 'Tối', value: 'Toi' },
              { label: 'Ăn Vặt', value: 'AnVat' },
              { label: 'Khuya', value: 'Khuya' },
            ]}
          />
        </Form.Item>
        <Form.Item name="priceRange" label={<span className="text-label-lg text-on-surface">{t('food.priceRange', 'Price Range')}</span>}>
          <Selector
            options={[
              { label: 'Rẻ', value: 'Re' },
              { label: 'Trung Bình', value: 'TrungBinh' },
              { label: 'Sang Trọng', value: 'SangTrong' },
            ]}
          />
        </Form.Item>
      </Form>

      {suggestedFoods.length > 0 && !isLoading && (
        <div className="suggested-results">
          {suggestedFoods.map((food, idx) => (
            <div key={`${food.id}-${idx}`} className="glass-card result-card bounce-in">
              <div className="result-icon-wrapper-tertiary">
                <span className="material-symbols-outlined result-icon-tertiary">dinner_dining</span>
              </div>
              <h3 className="text-tertiary text-title-md">{food.name}</h3>
              <div className="food-tags">
                <span className="tag text-label-md">{food.category}</span>
                <span className="tag text-label-md">{food.cuisineType}</span>
                <span className="tag text-label-md">{food.avgPriceRange}</span>
                <span className="tag text-label-md">{food.mealTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
