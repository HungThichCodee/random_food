import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { FoodDto } from '../../types/food';

interface SpinWheelProps {
  onResult?: (food: FoodDto) => void;
  isSpinning?: boolean;
}

export default function SpinWheel({ onResult, isSpinning = false }: SpinWheelProps) {
  const { t } = useTranslation();

  return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      {/* TODO: Animated spin wheel for random food selection */}
      <div
        style={{
          width: 250,
          height: 250,
          borderRadius: '50%',
          border: '8px dashed #ff6b35',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isSpinning ? 'spin 1s linear infinite' : 'none',
        }}
      >
        <span>{isSpinning ? t('common.loading') : t('food.spinButton')}</span>
      </div>
    </div>
  );
}
