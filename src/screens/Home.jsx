import { useState } from 'react';
import { useStore } from '../store.jsx';
import { BigRings } from '../components/Rings.jsx';
import { Alerts } from '../components/Nudges.jsx';
import { BooksHome, FoodHome, Glance, HabitsHome, WaterHome, WeekRings, WorkoutHome } from '../components/HomeSections.jsx';

const pct = (v) => `${Math.round(Math.max(0, v) * 100)}%`;
function NameCard() {
  const { A } = useStore();
  const [name, setName] = useState('');
  return (
    <section className="card">
      <form className="inline" onSubmit={(e) => { e.preventDefault(); if (name.trim()) A.saveProfile({ name: name.trim() }); }}>
        <div className="field"><label htmlFor="nmIn">What should we call you?</label><input id="nmIn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sumit" autoComplete="given-name" /></div>
        <button className="btn sm">Save</button>
      </form>
    </section>
  );
}

export default function Home({ goTab }) {
  const { S, today, calc } = useStore();
  const c = calc(today);
  return (
    <>
      {!S.profile.name && <NameCard />}
      <Alerts k={today} />
      <section className="card hero">
        <div className="rings-wrap"><BigRings c={c} /></div>
        <div className="hero-r">
          <div className="hero-score"><b>{pct(c.score)}</b></div>
          <div className="sub">day score</div>
          <ul className="legend">
            <li><i className="dot r1" /><span>Habits</span><b>{pct(c.ringT)}</b></li>
            <li><i className="dot r2" /><span>Intake</span><b>{pct(c.ringD)}</b></li>
            <li><i className="dot r3" /><span>Workout</span><b>{pct(c.ringW)}</b></li>
          </ul>
        </div>
      </section>
      <WeekRings />
      <WaterHome />
      <Glance />
      <HabitsHome goTab={goTab} />
      <BooksHome />
      <FoodHome />
      <WorkoutHome />
    </>
  );
}
