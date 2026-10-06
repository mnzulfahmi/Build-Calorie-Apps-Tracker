export type Food = {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const foods: Food[] = [
  { id: "chicken-breast", name: "Chicken breast", servingSize: "100 g cooked", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "white-rice", name: "White rice", servingSize: "1 cup cooked", calories: 205, protein: 4.3, carbs: 44.5, fat: 0.4 },
  { id: "eggs", name: "Eggs", servingSize: "2 large", calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6 },
  { id: "banana", name: "Banana", servingSize: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: "rolled-oats", name: "Rolled oats", servingSize: "1/2 cup dry", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { id: "salmon", name: "Salmon", servingSize: "100 g cooked", calories: 206, protein: 22, carbs: 0, fat: 12 },
  { id: "tofu", name: "Tofu", servingSize: "100 g firm", calories: 144, protein: 17, carbs: 3, fat: 8 },
  { id: "greek-yogurt", name: "Greek yogurt", servingSize: "170 g plain", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { id: "apple", name: "Apple", servingSize: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: "avocado", name: "Avocado", servingSize: "1/2 medium", calories: 120, protein: 1.5, carbs: 6, fat: 11 },
  { id: "almonds", name: "Almonds", servingSize: "28 g", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: "broccoli", name: "Broccoli", servingSize: "1 cup cooked", calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6 },
  { id: "pasta", name: "Pasta", servingSize: "1 cup cooked", calories: 220, protein: 8, carbs: 43, fat: 1.3 },
  { id: "ground-beef", name: "Ground beef", servingSize: "100 g cooked 85% lean", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { id: "tuna", name: "Tuna", servingSize: "1 can in water", calories: 120, protein: 27, carbs: 0, fat: 1 },
  { id: "potato", name: "Potato", servingSize: "1 medium baked", calories: 161, protein: 4.3, carbs: 36.6, fat: 0.2 },
  { id: "whole-milk", name: "Whole milk", servingSize: "1 cup", calories: 149, protein: 7.7, carbs: 11.7, fat: 8 },
  { id: "peanut-butter", name: "Peanut butter", servingSize: "2 tbsp", calories: 190, protein: 7, carbs: 8, fat: 16 },
  { id: "black-beans", name: "Black beans", servingSize: "1 cup cooked", calories: 227, protein: 15.2, carbs: 40.8, fat: 0.9 },
  { id: "whole-wheat-bread", name: "Whole wheat bread", servingSize: "2 slices", calories: 160, protein: 8, carbs: 28, fat: 2 },
  { id: "cheddar-cheese", name: "Cheddar cheese", servingSize: "28 g", calories: 113, protein: 7, carbs: 0.4, fat: 9.3 },
  { id: "sweet-potato", name: "Sweet potato", servingSize: "1 medium baked", calories: 112, protein: 2, carbs: 26, fat: 0.1 },
  { id: "spinach", name: "Spinach", servingSize: "3 cups raw", calories: 21, protein: 2.6, carbs: 3.3, fat: 0.4 },
  { id: "olive-oil", name: "Olive oil", servingSize: "1 tbsp", calories: 119, protein: 0, carbs: 0, fat: 13.5 },
];
