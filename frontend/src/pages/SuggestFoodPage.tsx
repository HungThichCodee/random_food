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
      <div className="header">
        <h2 className="neon-text-secondary">{t('nav.suggest', 'Suggest Food')}</h2>
      </div>

      <Form
        form={form}
        onFinish={onFinish}
        footer={
          <Button block type="submit" color="primary" size="large" loading={isLoading}>
            {t('food.suggestButton', 'Get Suggestion')}
          </Button>
        }
      >
        <Form.Item name="mealTime" label={t('food.mealTime', 'Meal Time')}>
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
        <Form.Item name="priceRange" label={t('food.priceRange', 'Price Range')}>
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
              <h3 className="neon-text-primary">{food.name}</h3>
              <div className="food-tags">
                <span className="tag">{food.category}</span>
                <span className="tag">{food.cuisineType}</span>
                <span className="tag">{food.avgPriceRange}</span>
                <span className="tag">{food.mealTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
