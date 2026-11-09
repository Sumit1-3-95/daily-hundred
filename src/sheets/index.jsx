import QuickAdd from './QuickAdd.jsx';
import Settings from './Settings.jsx';
import MetricsSheet from './Metrics.jsx';
import DaySheet from './Day.jsx';
import TaskOne from './TaskOne.jsx';
import AvoidSheet from '../components/Avoid.jsx';
import WeightPage from './WeightPage.jsx';
import { FoodEdit, FoodViewSheet, WorkoutEdit } from './Library.jsx';
import { PlanDaySheet } from '../components/Plan.jsx';
import BooksSheet from './Books.jsx';
import { Blood, CloseDay, ListForm, LogFood, LogWorkout, Measure, NewFood, NewWorkout, Routine, Sleep, TaskForm, Water, Weight } from './Forms.jsx';

export const SHEETS = {
  quick: QuickAdd, settings: Settings, metrics: MetricsSheet, day: DaySheet, taskOne: TaskOne, avoid: AvoidSheet, weightPage: WeightPage, foodEdit: FoodEdit, workoutEdit: WorkoutEdit, foodView: FoodViewSheet, planDay: PlanDaySheet, books: BooksSheet, logFood: LogFood, newFood: FoodEdit, logWorkout: LogWorkout, newWorkout: WorkoutEdit,
  water: Water, weight: Weight, sleep: Sleep, routine: Routine, closeDay: CloseDay, task: TaskForm, list: ListForm,
  measure: Measure, blood: Blood,
};
