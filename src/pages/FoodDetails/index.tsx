import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const getFood = await api
        .get<Food>(`foods/${routeParams.id}`)
        .then(response => response.data);
      setFood(getFood);
      setExtras(
        getFood.extras.map(item => ({
          ...item,
          quantity: 0,
        })),
      );
      const getFavorite = await api
        .get(`favorites/${routeParams.id}`)
        .then(response => response.data)
        .catch(error => console.log(error));
      setIsFavorite(getFavorite && true);
    }

    loadFood();
  }, [routeParams]);

  const handleIncrementExtra = useCallback(
    (id: number) => {
      const loadExtras = [...extras];

      const foodIncrement = loadExtras.findIndex(add => add.id === id);

      if (foodIncrement !== -1) {
        loadExtras[foodIncrement].quantity += 1;

        setExtras(loadExtras);
      }
    },
    [extras],
  );

  const handleDecrementExtra = useCallback(
    (id: number) => {
      const loadExtras = [...extras];

      const foodDecrement = loadExtras.findIndex(add => add.id === id);

      if (foodDecrement !== -1) {
        if (loadExtras[foodDecrement].quantity >= 1) {
          loadExtras[foodDecrement].quantity -= 1;
        }

        setExtras(loadExtras);
      }
    },
    [extras],
  );

  const handleIncrementFood = useCallback(() => {
    const quantity = foodQuantity + 1;
    setFoodQuantity(quantity);
  }, [foodQuantity]);

  const handleDecrementFood = useCallback(() => {
    if (foodQuantity >= 2) {
      const quantity = foodQuantity - 1;
      setFoodQuantity(quantity);
    }
  }, [foodQuantity]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      api.post('favorites', food);
    } else {
      api.delete(`favorites/${food.id}`);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const priceFood = foodQuantity * food.price;

    const priceExtra = extras.reduce((ini: number, extra: Extra) => {
      ini += extra.quantity * extra.value;
      return ini;
    }, 0);

    return formatValue(priceFood + priceExtra);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const productId = food.id;
    delete food.id;
    await api.post('orders', {
      ...food,
      productId,
    });
  }

  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
