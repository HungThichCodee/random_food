import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Selector, Button, Toast, SpinLoading } from 'antd-mobile';
import { useFoodStore } from '../stores/useFoodStore';
import './RandomFoodPage.css';
import { v4 as uuidv4 } from 'uuid'; // need to generate a session id

// Generate a random session ID if not exists. Usually this would be in localStorage or Context.
// For simplicity, we just generate one here.
const generateSessionId = () => {
  let id = localStorage.getItem('foodMatch_sessionId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('foodMatch_sessionId', id);
  }
  return id;
};

export default function RandomFoodPage() {
  const { t: translate } = useTranslation();
  const { currentFood, fetchRandomFood, isLoading, error } = useFoodStore();
  const [category, setCategory] = useState<string>('');

  const handleSpin = async () => {
    const sessionId = generateSessionId();
    await fetchRandomFood({
      category: category === '' ? undefined : category,
      sessionId
    });
    if (error) {
      Toast.show({ icon: 'fail', content: error });
    }
  };

  return (
    <div className="random-page">
      <div className="header">
        <h2 className="neon-text-secondary">{translate('nav.random', 'Pick Random Food')}</h2>
      </div>

      <div className="selector-container">
        <Selector
          options={[
            { label: translate('food.category.all', 'All'), value: '' },
            { label: translate('food.category.kho', 'Khô'), value: 'Kho' },
            { label: translate('food.category.nuoc', 'Nước'), value: 'Nuoc' },
          ]}
          value={[category]}
          onChange={(val) => setCategory(val[0] || '')}
        />
      </div>

      <div className="spin-action">
        <Button 
          block 
          color="primary" 
          size="large" 
          onClick={handleSpin}
          loading={isLoading}
          className="spin-btn"
        >
          {isLoading ? translate('food.spinning', 'Spinning...') : translate('food.spinButton', 'SPIN NOW!')}
        </Button>
      </div>

      {currentFood && !isLoading && (
        <div className="glass-card result-card bounce-in">
          <h3 className="neon-text-primary">{currentFood.name}</h3>
          <div className="food-tags">
            <span className="tag">{currentFood.category}</span>
            <span className="tag">{currentFood.cuisineType}</span>
            <span className="tag">{currentFood.avgPriceRange}</span>
            <span className="tag">{currentFood.mealTime}</span>
          </div>
          <div className="food-extra-tags">
            {currentFood.tags.map(tag => (
              <span key={tag} className="tag outline">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
