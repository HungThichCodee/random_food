import { Card, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { FoodDto } from '../../types/food';

interface FoodCardProps {
  food: FoodDto;
}

export default function FoodCard({ food }: FoodCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      hoverable
      cover={food.imageUrl ? <img alt={food.name} src={food.imageUrl} /> : undefined}
      style={{ width: 300, margin: '16px auto' }}
    >
      {/* TODO: Ant Design Card showing food info (name, category, price, image, tags) */}
      <Card.Meta
        title={food.name}
        description={
          <div>
            <p>{food.category} - {food.avgPriceRange}</p>
            <div>
              {food.tags?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        }
      />
    </Card>
  );
}
