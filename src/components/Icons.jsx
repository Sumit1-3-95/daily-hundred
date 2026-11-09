// Hand-drawn style line icons (24×24, round strokes). Each sits on a soft tinted tile.
const P = {
  thali: <><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10" r="2.6" /><circle cx="15" cy="9" r="2.1" /><circle cx="14" cy="15.3" r="2.5" /><path d="M7 15.5c1-.6 2-.6 3 0" /></>,
  dalchawal: <><path d="M3 12h18a9 8 0 0 1-18 0z" /><path d="M6.5 12c.6-2.6 2.8-4.3 5.5-4.3s4.9 1.7 5.5 4.3" /><path d="M10 9.5h.01M13 9h.01M14.5 10.6h.01M9 11h.01" /><path d="M9 3.5c-.7.8.7 1.6 0 2.5M13 3c-.7.8.7 1.6 0 2.5" /></>,
  tikki: <><ellipse cx="9" cy="14" rx="5.5" ry="3.2" /><ellipse cx="15" cy="10.5" rx="5.5" ry="3.2" /><path d="M13 10.3h.01M16.5 9.8h.01M15 11.6h.01M7.5 14h.01M10.5 14.6h.01" /></>,
  salad: <><path d="M3 12h18a9 8 0 0 1-18 0z" /><path d="M8 12c-.3-3.3 1.4-5.8 4.2-6.5.2 3-1.4 5.6-4.2 6.5z" /><path d="M12.5 12c.8-2.6 3-4 5.7-4-.6 2.5-2.8 4-5.7 4z" /></>,
  paneer: <><path d="M4 11l5-2.5 5 2.5v6l-5 2.5-5-2.5z" /><path d="M4 11l5 2.5 5-2.5M9 13.5v6" /><path d="M13 6.5l3.5-1.8L20 6.5v4.3l-3.5 1.8" /><path d="M13 6.5l3.5 1.8L20 6.5M16.5 8.3v4.2" /></>,
  sandwich: <><path d="M3 11c0-3.2 4-5.5 9-5.5s9 2.3 9 5.5z" /><path d="M3 13.3c1.5 1 3-.8 4.5 0s3 .8 4.5 0 3-.8 4.5 0 3 .8 4.5 0" /><path d="M4 15.8h16v1.7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M9 8.3h.01M12.5 7.6h.01M15.5 8.6h.01" /></>,
  daliya: <><path d="M3 12h18a9 8 0 0 1-18 0z" /><path d="M16.5 3.5L13 12" /><path d="M7 12c1-1.3 2.2-1.3 3.2 0M11.5 10.5c.8-.9 1.6-.9 2.3 0" /></>,
  shake: <><path d="M7.5 8h9l-1.3 12.2a1 1 0 0 1-1 .8H9.8a1 1 0 0 1-1-.8z" /><path d="M8.5 4.5h7V8h-7z" /><path d="M10.5 4.5V3h3v1.5" /><path d="M8.6 13h6.8" /></>,
  soya: <><path d="M3 13h18a9 7.5 0 0 1-18 0z" /><circle cx="8" cy="10.5" r="1.8" /><circle cx="12" cy="9" r="2" /><circle cx="16" cy="10.6" r="1.7" /></>,
  sweet: <><circle cx="8.5" cy="15.5" r="3.6" /><circle cx="15.5" cy="15.5" r="3.6" /><circle cx="12" cy="9.2" r="3.6" /><path d="M11 8.5h.01M13 10h.01M7.5 15h.01M9.5 16.5h.01M15 14.5h.01M16.5 16.5h.01" /></>,
  chai: <><path d="M5 9.5h11V14a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><path d="M16 10.5h1.3a2.5 2.5 0 0 1 0 5H16" /><path d="M8.5 3.5c-.8.9.8 1.7 0 2.7M12 3.5c-.8.9.8 1.7 0 2.7" /><path d="M4 21h13" /></>,
  roti: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 9.5h.01M14 8h.01M15.5 13h.01M10 14.5h.01M12 11.5h.01" /></>,
  curd: <><path d="M4 10h16l-1.6 8.3a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7z" /><path d="M4 10c1.3-1.8 3-1.8 4.3 0 1.3-1.8 3-1.8 4.3 0 1.3-1.8 3-1.8 4.3 0 1.1-1.5 2.4-1.7 3.1 0" /></>,
  egg: <><path d="M12 3c3.5 0 6.2 5.6 6.2 10.2a6.2 6.2 0 0 1-12.4 0C5.8 8.6 8.5 3 12 3z" /><path d="M9 13.5a3 3 0 0 0 2.5 3" /></>,
  milk: <><path d="M8 3h8v3l2 3v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9l2-3z" /><path d="M6 12h12" /><path d="M8 6h8" /></>,
  fruit: <><path d="M12 7c-3-1.6-7 0-7 5s3 8.5 5 8.5c1 0 1.3-.5 2-.5s1 .5 2 .5c2 0 5-3.5 5-8.5S15 5.4 12 7z" /><path d="M12 7c0-2 .6-3.4 2-4.2" /><path d="M12 6.5c-1.5-1.8-3.4-2-4.6-1.6 1 1.6 2.6 2 4.6 1.6z" /></>,
  bowl: <><path d="M3 12h18a9 8 0 0 1-18 0z" /><path d="M8 8.5c.8-1 2-1 2.8 0M13 8c.8-1 2-1 2.8 0" /></>,
  water: <><path d="M6 3h12l-1.6 17.1a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9z" /><path d="M6.8 10c1.7 1 3.4-1 5.2 0s3.5 1 5.2 0" /></>,
  bottle: <><path d="M10 2.5h4V5l1.5 2.5V20a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 8.5 20V7.5L10 5z" /><path d="M8.5 11.5c1.2.8 2.3-.8 3.5 0s2.3.8 3.5 0" /></>,
  scale: <><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><path d="M8 10a4 4 0 0 1 8 0z" /><path d="M12 10l1.6-2" /></>,
  moon: <path d="M20 14.5A8.2 8.2 0 1 1 9.5 4a6.6 6.6 0 0 0 10.5 10.5z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  dumbbell: <><path d="M6.5 7.5v9M3.5 10v4M17.5 7.5v9M20.5 10v4M6.5 12h11" /></>,
  shoe: <><path d="M3 16.5c0-3 .8-7 2.7-9.2l3 2.8c2 1.2 4 1.4 6.2 2.7 3 .8 6.1 1.7 6.1 3.7v1H3z" /><path d="M3 19.5h18" /><path d="M9.5 11.5l1.5-1.2M12 12.6l1.4-1.2" /></>,
  lotus: <><path d="M12 5.5c2.2 2.3 2.2 6.3 0 9.5-2.2-3.2-2.2-7.2 0-9.5z" /><path d="M12 15c-3.3 0-6.4-1.3-8.5-4.3 3.3-.3 6.6 1 8.5 4.3zm0 0c3.3 0 6.4-1.3 8.5-4.3-3.3-.3-6.6 1-8.5 4.3z" /><path d="M5 19h14" /></>,
  fire: <path d="M12 3c1.2 3.2 5.5 5.2 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4 2.4-5 0 2.2 1 3.4 2.1 3.4 0-3.2-1.1-5.6 1-8.9z" />,
  bolt: <path d="M13.5 2.5L5 14h6.3l-1 7.5L19 10h-6.3z" />,
  plate: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14.5H6.5A2.5 2.5 0 0 0 4 20z" /><path d="M4 20a2.5 2.5 0 0 0 2.5 1.5H20v-4" /><path d="M8.5 7.5h7" /></>,
  list: <><rect x="4" y="3.5" width="16" height="17" rx="3" /><path d="M8 9l1.3 1.3L12 7.8M8 14.5l1.3 1.3 2.7-2.5M14 9.5h3M14 15h3" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.8 2.7L16.3 9.5" /></>,
  steps: <><path d="M8 3.5c1.7 0 2.6 2 2.6 4.2S9.8 12 8 12s-2.5-2.2-2.5-4.4S6.4 3.5 8 3.5z" /><path d="M5.8 14.3h4.4M16 9c1.7 0 2.5 2 2.5 4.2S17.7 17.5 16 17.5s-2.6-2.1-2.6-4.3S14.3 9 16 9z" /><path d="M13.8 19.8h4.4" /></>,
  calories: <><path d="M12 3v3M4.5 7l2 2M19.5 7l-2 2" /><path d="M5 15a7 7 0 0 1 14 0z" /><path d="M3 18.5h18" /></>,
  flag: <><path d="M5 21V4M5 4.5h11l-2 3.5 2 3.5H5" /></>,
  drink: <><path d="M6 3h12l-1.2 7.5A4.9 4.9 0 0 1 12 14.5a4.9 4.9 0 0 1-4.8-4L6 3z" /><path d="M6.6 7h10.8" /><path d="M12 14.5V20M8.5 21h7" /></>,
  smoke: <><rect x="2.5" y="13" width="15" height="4" rx="1" /><path d="M14 13v4" /><path d="M20 13v4M17.8 3.5c0 2 2 2 2 4s-2 2-2 4M21 4.5c0 1.6 1 1.6 1 3" /></>,
  bed: <><path d="M3 18V7M3 14h18v4M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5" /><circle cx="7" cy="11" r="1.8" /></>,
};

export const FOOD_ICONS = ['thali', 'dalchawal', 'tikki', 'salad', 'paneer', 'sandwich', 'daliya', 'shake', 'soya', 'sweet', 'chai', 'roti', 'curd', 'egg', 'milk', 'fruit', 'bowl'];

// tint per icon family
const TONE = {
  water: 'blue', bottle: 'blue', moon: 'violet', sun: 'amber', bed: 'violet', scale: 'slate', bolt: 'teal', fire: 'orange',
  dumbbell: 'teal', shoe: 'teal', lotus: 'teal', target: 'orange', calories: 'orange', book: 'violet', list: 'slate',
  check: 'violet', steps: 'teal', drink: 'pink', smoke: 'slate', flag: 'violet', shake: 'teal', soya: 'teal', paneer: 'teal', egg: 'teal', sweet: 'pink',
  chai: 'amber', fruit: 'green', salad: 'green',
};

export function Icon({ name, size = 22, className = '' }) {
  return (
    <svg className={`ic-svg ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name] || P.bowl}</svg>
  );
}

/** Icon on a soft rounded tile. */
export function IconTile({ name, size = 'md', tone }) {
  return <span className={`itile ${size} t-${tone || TONE[name] || 'amber'}`}><Icon name={name} size={size === 'lg' ? 30 : size === 'sm' ? 16 : 22} /></span>;
}

export function iconForWorkout(area = '') {
  if (/cardio/i.test(area)) return 'shoe';
  if (/mobil|yoga/i.test(area)) return 'lotus';
  return 'dumbbell';
}
