import { Form, Checkbox, Radio, Select, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { FoodCriteriaDto } from '../../types/food';

interface CriteriaFilterProps {
  onFilter?: (criteria: FoodCriteriaDto) => void;
}

export default function CriteriaFilter({ onFilter }: CriteriaFilterProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    // TODO: Map form values to FoodCriteriaDto
    if (onFilter) {
      onFilter(values);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      {/* TODO: Form with tag checkboxes, price range radio, meal time selector */}
      <Form.Item name="category" label={t('food.category.all')}>
        <Radio.Group>
          <Radio value="all">{t('food.category.all')}</Radio>
          <Radio value="kho">{t('food.category.kho')}</Radio>
          <Radio value="nuoc">{t('food.category.nuoc')}</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="priceRange" label="Price">
        <Radio.Group>
          <Radio value="re">{t('food.price.re')}</Radio>
          <Radio value="vua">{t('food.price.vua')}</Radio>
          <Radio value="cao">{t('food.price.cao')}</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="mealTime" label="Meal Time">
        <Select placeholder="Select meal time">
          <Select.Option value="sang">{t('food.mealTime.sang')}</Select.Option>
          <Select.Option value="trua">{t('food.mealTime.trua')}</Select.Option>
          <Select.Option value="toi">{t('food.mealTime.toi')}</Select.Option>
          <Select.Option value="khuya">{t('food.mealTime.khuya')}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="tags" label="Tags">
        <Checkbox.Group options={['Ăn vặt', 'Món chính', 'Gia đình', 'Đường phố']} />
      </Form.Item>

      <Button type="primary" htmlType="submit">
        {t('common.confirm')}
      </Button>
    </Form>
  );
}
