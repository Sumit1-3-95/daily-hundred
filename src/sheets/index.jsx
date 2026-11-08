import QuickAdd from './QuickAdd.jsx';
import Settings from './Settings.jsx';
import { Blood, CloseDay, ListForm, LogFood, LogWorkout, Measure, NewFood, NewWorkout, Routine, Sleep, TaskForm, Water, Weight } from './Forms.jsx';

export const SHEETS = {
  quick: QuickAdd, settings: Settings, logFood: LogFood, newFood: NewFood, logWorkout: LogWorkout, newWorkout: NewWorkout,
  water: Water, weight: Weight, sleep: Sleep, routine: Routine, closeDay: CloseDay, task: TaskForm, list: ListForm,
  measure: Measure, blood: Blood,
};
