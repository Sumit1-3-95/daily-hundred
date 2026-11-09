// Default meals: if a meal's time passes with nothing logged, these get logged for you (marked "default").
import { MEALS } from './dates.js';

export const MEAL_DUE = { Breakfast: 11, Lunch: 15, Snack: 18.5, Dinner: 22.5 }; // hour of day
const DEFAULT_PLAN = {
  Breakfast: [['Coffee', 2], ['Poha', 1], ['Protein shake', 1]],
  Lunch: [['Chicken salad', 1]],
  Snack: [['Masala chai', 1], ['Protein bar', 1]],
  Dinner: [['Chicken sandwich (Sub)', 1]],
};

/** The plan as { meal: [{ food_id, qty }] }: saved one, or the default matched by food name. */
export function mealPlan(S) {
  const saved = S.profile.prefs?.meal_plan;
  if (saved) return saved;
  const live = S.foods.filter((f) => !f.archived);
  const find = (n) => live.find((f) => f.name.toLowerCase() === n.toLowerCase());
  return Object.fromEntries(MEALS.map((m) => [m, (DEFAULT_PLAN[m] || [])
    .map(([n, qty]) => ({ food_id: find(n)?.id, qty })).filter((x) => x.food_id)]));
}
