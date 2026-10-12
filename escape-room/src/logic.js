// Pure game logic. No DOM here: the same module can run later on the real server.
// Each action takes (state, role, payload) and returns { patch } or { error },
// optionally with an `event` that both players see.

import { PLACES, VALID_HOURS, CLOUDY, START_HOUR, LAST_HOUR, MARKS, REGIONS,
  SOLUTION, EXAM_VERDICT, SHADE_ORDER } from './content.js';

export function initialState(code) {
  return {
    v: 1, code, created: Date.now(), startedAt: 0, finishedAt: 0,
    seats: { m: '', k: '' },
    day: 1, hour: START_HOUR,
    loc: { m: 'booth', k: 'gatehouse' },
    posture: 'stand',
    coins: 12, penalty: 0,
    f: { certified: false, declared: false, commanded: false, basketOk: false },
    cert: { tries: 0, lockUntil: 0, seed: Math.floor(Math.random() * 1e6) },
    exam: { active: false, region: '', tries: 0, rec: {} },
    basket: { birds: [], cedar: '', wool: '', hyssop: '', vessel: '', water: '', measure: '', brought: false, tries: 0 },
    ev: { n: 0, who: '', text: '', tone: '' },
  };
}

// -------------------------------------------------------------- helpers
export const isCloudy = (s) => (CLOUDY[s.day] || []).includes(s.hour);
export const together = (s) => s.loc.m === s.loc.k;

export function lightMode(s, place) {
  // How colours read right now: 'true', 'dim' (כהה נראית עזה) or 'glare' (עזה נראית כהה).
  const p = PLACES[place];
  if (!p || !p.outdoor) return 'dim';
  if (isCloudy(s)) return 'dim';
  if (s.hour <= 3 || s.hour >= 10) return 'dim';
  if (s.hour === 6 || s.hour === 7) return 'glare';
  return 'true';
}

export function examConditions(s) {
  const where = s.loc.m;
  const problems = [];
  if (!PLACES[where]?.outdoor) problems.push('place');
  if (isCloudy(s)) problems.push('cloud');
  if (!VALID_HOURS.includes(s.hour)) problems.push('hour');
  return problems;
}

export function visibleRegions(posture) {
  return Object.keys(REGIONS).filter((r) => !REGIONS[r].needs || REGIONS[r].needs === posture);
}

function event(s, who, text, tone = '') {
  return { n: (s.ev?.n || 0) + 1, who, text, tone };
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

// -------------------------------------------------------------- actions
export const actions = {
  claim(s, role, { pid }) {
    if (s.seats[role] && s.seats[role] !== pid) return { error: 'התפקיד הזה כבר תפוס בחדר.' };
    const seats = { ...s.seats, [role]: pid };
    const patch = { seats };
    if (seats.m && seats.k && !s.startedAt) patch.startedAt = Date.now();
    return { patch };
  },

  move(s, role, { to }) {
    const p = PLACES[to];
    if (!p) return { error: 'מקום לא ידוע.' };
    if (s.loc[role] === to) return { patch: {} };
    if (role === 'k' && s.loc.k === 'gatehouse' && !s.f.certified)
      return { error: 'עוד לא עמדת במבחן המראות. אין יוצאים אל המצורע לפני כן.', src: 'משנה נגעים ג, א' };
    if (role === 'm' && to === 'gatehouse')
      return { error: 'אתה מצורע. אינך נכנס אל העיר ואל לשכותיה.', src: 'ויקרא יג, מו' };
    if (role === 'm' && to === 'gate')
      return { error: 'קרוב יותר אינך יכול להתקרב. משמרות העיר כבר שמעו אותך קורא "טמא, טמא".', src: 'ויקרא יג, מה' };
    if (role === 'k' && to === 'booth')
      return { error: 'אינך נכנס לסוכת המצורע. מצורע מטמא את הנכנס למקום שהוא בו.', src: 'משנה נגעים יג, יא' };
    if (s.exam.active) return { error: 'הבדיקה עדיין נמשכת.' };
    return { patch: { loc: { [role]: to } } };
  },

  wait(s, role) {
    if (s.loc[role] !== 'field') return { error: 'אפשר לעקוב אחר השעות רק ליד שעון השמש.' };
    if (s.exam.active) return { error: 'אי אפשר להמתין באמצע בדיקה.' };
    if (s.hour >= LAST_HOUR) {
      return {
        patch: { day: s.day + 1, hour: START_HOUR, penalty: s.penalty + 10 },
        event: event(s, role, 'היום תם. ירד הלילה, ובבוקר עלה יום חדש.', 'night'),
      };
    }
    return { patch: { hour: s.hour + 1 } };
  },

  certify(s, role, { answers }) {
    if (role !== 'k') return { error: 'רק הכהן נבחן.' };
    if (Date.now() < s.cert.lockUntil) return { error: 'המתן מעט, ועיין שוב בספר.' };
    const order = certOrder(s.cert.seed);
    const ok = Array.isArray(answers) && order.every((shade, i) => answers[i] === shade);
    if (!ok) {
      return {
        patch: { cert: { tries: s.cert.tries + 1, lockUntil: Date.now() + 20000, seed: s.cert.seed + 7 }, penalty: s.penalty + 2 },
        error: 'לא כל המראות זוהו נכון. עיין שוב בדוגמאות שבספר, ונסה כעבור רגע.',
      };
    }
    return {
      patch: { f: { certified: true } },
      event: event(s, 'k', 'הכהן עמד במבחן המראות. שער הלשכה נפתח.', 'good'),
    };
  },

  startExam(s, role) {
    if (role !== 'k') return { error: 'רק הכהן בודק.' };
    if (!s.f.certified) return { error: 'עוד לא עמדת במבחן המראות.' };
    if (s.f.declared) return { error: 'כבר פסקת.' };
    if (!together(s)) return { error: 'המצורע אינו עומד לידך. הבדיקה בעיניים, לא מרחוק.', src: 'ויקרא יד, ג' };
    return {
      patch: { exam: { active: true, region: '' } },
      event: event(s, 'k', 'הכהן ניגש לבדוק את המצורע.', ''),
    };
  },

  endExam(s, role) {
    if (role !== 'k') return { error: 'רק הכהן מסיים את הבדיקה.' };
    return { patch: { exam: { active: false, region: '' } } };
  },

  posture(s, role, { p }) {
    if (role !== 'm') return { error: 'רק המצורע משנה את עמידתו.' };
    return { patch: { posture: p } };
  },

  look(s, role, { region }) {
    if (role !== 'k') return { patch: {} };
    return { patch: { exam: { region } } };
  },

  record(s, role, { mark, rec }) {
    if (role !== 'k') return { error: 'רק הכהן רושם.' };
    if (!MARKS[mark]) return { error: 'סימן לא ידוע.' };
    return { patch: { exam: { rec: { [mark]: rec } } } };
  },

  declare(s, role, { verdict }) {
    if (role !== 'k') return { error: 'הטומאה והטהרה בידי כהן.', src: 'משנה נגעים ג, א' };
    if (!s.exam.active) return { error: 'קודם יש לבדוק.' };
    const bad = examConditions(s);
    if (bad.length) {
      return {
        patch: { exam: { tries: s.exam.tries + 1 }, penalty: s.penalty + 3 },
        error: 'הבדיקה הזאת אינה בדיקה. משהו בזמן או במקום פוסל את הראייה.',
        src: 'משנה נגעים ב, ב',
      };
    }
    const recs = s.exam.rec || {};
    const missing = Object.keys(MARKS).filter((id) => !recs[id]);
    if (missing.length) {
      return {
        patch: { exam: { tries: s.exam.tries + 1 }, penalty: s.penalty + 3 },
        error: 'לא ראית את כל גופו של המצורע. יש מקום שעדיין לא נגלה לעיניך.',
        src: 'משנה נגעים ב, ד',
      };
    }
    const wrong = Object.entries(MARKS).filter(([id, m]) => {
      const r = recs[id];
      return r.shade !== m.shade || r.size !== m.size || Number(r.white) !== m.white;
    });
    if (wrong.length || verdict !== EXAM_VERDICT) {
      return {
        patch: { exam: { tries: s.exam.tries + 1 }, penalty: s.penalty + 5 },
        error: 'הפסק אינו תואם את מה שבגופו של המצורע. עבור שוב על כל סימן: מראהו, שיעורו ושערותיו.',
        src: 'ויקרא יג; משנה נגעים א, א',
      };
    }
    return {
      patch: { f: { declared: true }, exam: { active: false, region: '' } },
      event: event(s, 'k', 'הכהן הכריז: "טָהוֹר". נגע הצרעת נרפא.', 'pure'),
    };
  },

  command(s, role) {
    if (role !== 'k' || !s.f.declared) return { error: 'עוד לא הגיעה העת.' };
    return {
      patch: { f: { commanded: true } },
      event: event(s, 'k', 'הכהן ציווה: "קח לך שתי צפרים חיות טהורות, ועץ ארז, ושני תולעת, ואזוב".', 'good'),
    };
  },

  pick(s, role, { cat, id }) {
    if (role !== 'm') return { error: 'רק המצורע קונה.' };
    if (!s.f.commanded) return { error: 'הרוכל מסרב: "קודם יצווה הכהן. איני מוכר למי שעדיין טמא בלי ציווי."', src: 'ויקרא יד, ד' };
    if (s.loc.m !== 'stall') return { error: 'צריך לעמוד ליד הדוכן.' };
    if (s.basket.brought) return { error: 'הסל אצל הכהן.' };
    if (cat === 'birds') {
      const cur = s.basket.birds || [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 2 ? [cur[1], id] : [...cur, id];
      return { patch: { basket: { birds: next } } };
    }
    const cur = s.basket[cat];
    const patch = { basket: { [cat]: cur === id ? '' : id } };
    if (cat === 'vessel' && cur !== id) { patch.basket.water = ''; patch.basket.measure = ''; }
    return { patch };
  },

  fill(s, role, { source, measure }) {
    if (role !== 'm') return { error: 'רק המצורע ממלא.' };
    if (s.loc.m !== 'spring') return { error: 'צריך לרדת אל המעיין.' };
    if (!s.basket.vessel) return { error: 'אין בידך כלי. קנה כלי אצל הרוכל.' };
    if (s.basket.brought) return { error: 'הסל אצל הכהן.' };
    return { patch: { basket: { water: source || '', measure: measure || '' } } };
  },

  bring(s, role) {
    if (role !== 'm') return { error: 'רק המצורע מביא את הסל.' };
    if (!together(s)) return { error: 'הכהן אינו כאן. לך אליו עם הסל.' };
    const b = s.basket;
    if (b.birds.length !== 2 || !b.cedar || !b.wool || !b.hyssop || !b.vessel || !b.water || !b.measure)
      return { error: 'הסל עדיין חסר. צריך שתי צפרים, ארז, שני תולעת, אזוב, וכלי ובו מים.' };
    return {
      patch: { basket: { brought: true } },
      event: event(s, 'm', 'המצורע הניח את הסל לפני הכהן.', ''),
    };
  },

  giveBack(s, role) {
    if (role !== 'k') return { error: 'רק הכהן מחזיר.' };
    if (!s.basket.brought) return { patch: {} };
    return {
      patch: { basket: { brought: false }, coins: Math.max(0, s.coins - 1), penalty: s.coins > 0 ? s.penalty : s.penalty + 2 },
      event: event(s, 'k', 'הכהן החזיר את הסל. הרוכל גובה פרוטה על כל החלפה.', 'warn'),
    };
  },

  approve(s, role) {
    if (role !== 'k') return { error: 'רק הכהן מאשר.' };
    if (!s.basket.brought) return { error: 'הסל אינו לפניך.' };
    const b = s.basket, sol = SOLUTION;
    const ok = sameSet(b.birds, sol.birds) && b.cedar === sol.cedar && b.wool === sol.wool &&
      b.hyssop === sol.hyssop && b.vessel === sol.vessel && b.water === sol.water && b.measure === sol.measure;
    if (!ok) {
      const cost = 3;
      return {
        patch: {
          basket: { brought: false, tries: b.tries + 1 },
          coins: Math.max(0, s.coins - cost),
          penalty: s.penalty + (s.coins >= cost ? 2 : 6),
        },
        event: event(s, 'k', 'הצירוף אינו כשר. הכסף שהוצא אבד, והסל חזר אל המצורע.', 'bad'),
      };
    }
    return {
      patch: { f: { basketOk: true }, finishedAt: Date.now() },
      event: event(s, 'k', 'הכהן אישר: הכל כשר ומוכן לטהרה.', 'pure'),
    };
  },
};

export function apply(s, role, type, payload = {}) {
  const fn = actions[type];
  if (!fn) return { error: 'פעולה לא ידועה.' };
  return fn(s, role, payload) || { patch: {} };
}

// The order of swatches in the certification test, derived from a seed so both screens agree.
export function certOrder(seed) {
  const base = ['snow', 'sid', 'wool', 'egg', 'bahak', 'snow'];
  let x = seed || 1;
  const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const a = base.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export { SHADE_ORDER };
