// Game content for room 1, "מחוץ לחומה".
// Every halachic fact the players need lives here with its source,
// so a reviewer can check the content without reading the engine.
// Rulings follow the Rambam; items marked `verify` still need a scholar's check.

export const ROLES = {
  m: { id: 'm', name: 'המצורע', short: 'מצורע' },
  k: { id: 'k', name: 'הכהן', short: 'כהן' },
};

// ---------------------------------------------------------------- places
// x is the position on the near layer of the panorama (world width 3200).
export const PLACES = {
  spring:    { name: 'מעיין הגיחון', x: 420,  y: 700, outdoor: true,  closeup: 'spring' },
  booth:     { name: 'סוכת המצורע',  x: 1150, y: 655, outdoor: false, closeup: 'booth' },
  field:     { name: 'השדה ושעון השמש', x: 1560, y: 690, outdoor: true },
  stall:     { name: 'דוכן הרוכל',   x: 2160, y: 660, outdoor: true,  closeup: 'stall' },
  gate:      { name: 'בדרך אל שער העיר', x: 2930, y: 600, outdoor: true },
  gatehouse: { name: 'לשכת השער',    x: 2990, y: 520, outdoor: false, closeup: 'gatehouse', inside: true },
};

// ---------------------------------------------------------------- time
// Hours are שעות זמניות: the first hour starts at sunrise, the twelfth ends at sunset.
export const VALID_HOURS = [4, 5, 8, 9]; // משנה נגעים ב, ב, כרבי יהודה. verify: ruling in Rambam 9.
export const CLOUDY = { 1: [4], 2: [8] }; // per day, the hours a cloud covers the sun
export const START_HOUR = 2;
export const LAST_HOUR = 11;

export const HOUR_NAMES = ['', 'הראשונה', 'השנייה', 'השלישית', 'הרביעית', 'החמישית', 'השישית',
  'השביעית', 'השמינית', 'התשיעית', 'העשירית', 'האחת עשרה', 'השתים עשרה'];

// ---------------------------------------------------------------- shades
// Rambam follows the Sages: שאת כצמר לבן, ותולדתה כקרום ביצה.
export const SHADES = {
  snow:  { name: 'בהרת', like: 'עזה כשלג', rank: 'אב', note: 'הלבן העז ביותר. מבהיק ונוצץ כשלג.' },
  sid:   { name: 'תולדת הבהרת', like: 'כסיד ההיכל', rank: 'תולדה', note: 'לבן גירי ועמום, כטיח שנמרח בכותל.' },
  wool:  { name: 'שאת', like: 'כצמר לבן', rank: 'אב', note: 'לבן רך, סיבי ומסולסל, כצמר נקי.' },
  egg:   { name: 'תולדת השאת', like: 'כקרום ביצה', rank: 'תולדה', note: 'לבן חלק ומבריק, שקוף מעט, כקרום הדק שתחת הקליפה.' },
  bahak: { name: 'בהק', like: 'אינו נגע', rank: '', note: 'לבן כהה ודהוי, נוטה לחום ומנומר. "בֹּהַק הוּא פָּרַח בָּעוֹר, טָהוֹר הוּא".' },
};
export const SHADE_ORDER = ['snow', 'sid', 'wool', 'egg', 'bahak'];

// ---------------------------------------------------------------- the body
export const POSTURES = {
  stand: { name: 'עומד כדרכו', note: 'ידיים לצד הגוף, רגליים צמודות' },
  hoe:   { name: 'כעודר', note: 'מפסק רגליו, כמי שעודר בשדה' },
  olive: { name: 'כמוסק זיתים', note: 'מגביה זרועותיו, כמי שמוסק זיתים' },
};

export const REGIONS = {
  hand:     { name: 'גב כף היד הימנית', needs: null },
  forearm:  { name: 'אמת היד השמאלית', needs: null },
  shoulder: { name: 'הכתף והחזה', needs: null },
  face:     { name: 'הפנים והצוואר', needs: null },
  armpit:   { name: 'בית השחי הימני', needs: 'olive' },
  calf:     { name: 'צד השוק הפנימי', needs: 'hoe' },
};

// The truth about each mark. Never shown directly; the kohen must read it.
// size: 'lt' smaller than a גריס, 'ge' a גריס or more.
export const MARKS = {
  m1: { region: 'forearm',  shade: 'bahak', size: 'ge', white: 3, black: 1, cx: 0.42, cy: 0.52, r: 74, seed: 11 },
  m2: { region: 'hand',     shade: 'snow',  size: 'lt', white: 2, black: 0, cx: 0.58, cy: 0.46, r: 21, seed: 23 },
  m3: { region: 'shoulder', shade: 'wool',  size: 'ge', white: 1, black: 3, cx: 0.47, cy: 0.5,  r: 80, seed: 37 },
  m4: { region: 'armpit',   shade: 'sid',   size: 'ge', white: 0, black: 2, cx: 0.52, cy: 0.5,  r: 78, seed: 41, original: true },
  m5: { region: 'calf',     shade: 'egg',   size: 'lt', white: 0, black: 0, cx: 0.45, cy: 0.55, r: 20, seed: 53 },
};
export const GRIS_PX = 54; // side of the גריס square in region-panel pixels

// ---------------------------------------------------------------- market
// Every item shows the same facts to both players. The law is only in the kohen's book.
export const CATEGORIES = [
  { id: 'birds',  name: 'צפרים',      pick: 2 },
  { id: 'cedar',  name: 'עץ ארז',     pick: 1 },
  { id: 'wool',   name: 'שני תולעת',  pick: 1 },
  { id: 'hyssop', name: 'אזוב',       pick: 1 },
  { id: 'vessel', name: 'כלי',        pick: 1 },
];

export const ITEMS = {
  birds: [
    { id: 'b1', label: 'ציפור חומה קטנה', facts: ['דרור, חיה בחופש', 'זפק נראה', 'אצבע אחורית יתירה', 'גודל: קטנה', 'מחיר: שתי פרוטות'], art: { tone: '#8b6a4b', crop: true, size: 1, price: 2 } },
    { id: 'b2', label: 'ציפור חומה קטנה', facts: ['דרור, חיה בחופש', 'זפק נראה', 'אצבע אחורית יתירה', 'גודל: קטנה', 'מחיר: שתי פרוטות'], art: { tone: '#8b6a4b', crop: true, size: 1, price: 2 } },
    { id: 'b3', label: 'ציפור חומה גדולה', facts: ['דרור, חיה בחופש', 'זפק נראה', 'אצבע אחורית יתירה', 'גודל: גדולה מעט', 'מחיר: שתי פרוטות'], art: { tone: '#8b6a4b', crop: true, size: 1.18, price: 2 } },
    { id: 'b4', label: 'ציפור חומה קטנה', facts: ['דרור, חיה בחופש', 'זפק נראה', 'אצבע אחורית יתירה', 'גודל: קטנה', 'מחיר: שלוש פרוטות'], art: { tone: '#8b6a4b', crop: true, size: 1, price: 3 } },
    { id: 'b5', label: 'ציפור חומה קטנה', facts: ['דרור, חיה בחופש', 'אין לה זפק', 'אצבע אחורית יתירה', 'גודל: קטנה', 'מחיר: שתי פרוטות'], art: { tone: '#8b6a4b', crop: false, size: 1, price: 2 } },
    { id: 'b6', label: 'עוף טורף', facts: ['תופס טרף בציפורניו', 'מקור מעוקל', 'גודל: גדול', 'מחיר: שתי פרוטות'], art: { tone: '#6f5a46', raptor: true, size: 1.3, price: 2 } },
  ],
  cedar: [
    { id: 'c1', label: 'עץ ארז', facts: ['עץ אדמדם וריחני', 'אורך: שש עשרה אצבעות', 'עובי: כרביע כרע המטה'], art: { wood: 'cedar', len: 16, thick: 1 } },
    { id: 'c2', label: 'עץ ארז', facts: ['עץ אדמדם וריחני', 'אורך: עשרים וארבע אצבעות', 'עובי: כרביע כרע המטה'], art: { wood: 'cedar', len: 24, thick: 1 } },
    { id: 'c3', label: 'עץ ארז עבה', facts: ['עץ אדמדם וריחני', 'אורך: שישה טפחים', 'עובי: ככרע המטה כולו'], art: { wood: 'cedar', len: 24, thick: 2.2 } },
    { id: 'c4', label: 'עץ אלון', facts: ['עץ בהיר, קליפה מחורצת', 'אורך: שישה טפחים', 'עובי: כרביע כרע המטה'], art: { wood: 'oak', len: 24, thick: 1 } },
  ],
  wool: [
    { id: 'w1', label: 'צמר אדום', facts: ['צבע אדום עמוק', 'תווית הצבעי: "מן השורש"'], art: { color: '#a3262f', tag: 'root' } },
    { id: 'w2', label: 'צמר אדום', facts: ['צבע אדום עמוק', 'תווית הצבעי: "מן התולעת"'], art: { color: '#9e1f2d', tag: 'worm' } },
    { id: 'w3', label: 'צמר כחול', facts: ['צבע כחול כרקיע', 'תווית הצבעי: "מן החלזון"'], art: { color: '#2e4f8a', tag: 'shell' } },
    { id: 'w4', label: 'צמר סגול', facts: ['צבע סגול כהה', 'תווית הצבעי: "מן החלזון"'], art: { color: '#5b2a5e', tag: 'shell' } },
  ],
  hyssop: [
    { id: 'h1', label: 'אזוב יווני', facts: ['כך קורא לו הרוכל', 'עלים אפרפרים'], art: { leaf: '#8a9a7a', tag: 'יווני' } },
    { id: 'h2', label: 'אזוב', facts: ['כך קורא לו הרוכל', 'נקטף מסדק בחומה'], art: { leaf: '#6f8a55', tag: '' } },
    { id: 'h3', label: 'אזוב כוחלי', facts: ['כך קורא לו הרוכל', 'עלים כהים, כעין כוחל'], art: { leaf: '#4f5f6a', tag: 'כוחלי' } },
    { id: 'h4', label: 'אזוב רומי', facts: ['כך קורא לו הרוכל', 'עלים ארוכים'], art: { leaf: '#7c8f5e', tag: 'רומי' } },
    { id: 'h5', label: 'אזוב מדברי', facts: ['כך קורא לו הרוכל', 'יבש, נאסף בערבה'], art: { leaf: '#9a9466', tag: 'מדברי' } },
  ],
  vessel: [
    { id: 'v1', label: 'קערת נחושת', facts: ['כלי מתכת', 'חדשה ומבריקה'], art: { kind: 'copper' } },
    { id: 'v2', label: 'כלי חרס', facts: ['כלי חרס', 'משומש, יש בו סדק דק'], art: { kind: 'old' } },
    { id: 'v3', label: 'כלי חרס', facts: ['כלי חרס', 'חדש, טרם השתמשו בו'], art: { kind: 'new' } },
  ],
};

export const WATER = {
  sources: [
    { id: 'spring',  name: 'מי המעיין', facts: ['נובעים מן הסלע וזורמים'] },
    { id: 'cistern', name: 'מי הבור',   facts: ['בור חצוב שנאספו בו מי גשמים'] },
    { id: 'puddle',  name: 'מי השלולית', facts: ['מי גשמים שעמדו בשקע בסלע'] },
  ],
  measures: [
    { id: 'egg1',   name: 'ביצה אחת' },
    { id: 'egg1h',  name: 'ביצה וחצי' },
    { id: 'egg3',   name: 'שלוש ביצים' },
    { id: 'egg6',   name: 'שש ביצים' },
  ],
};

// The one correct combination (birds in any order).
export const SOLUTION = {
  birds: ['b1', 'b2'], cedar: 'c2', wool: 'w2', hyssop: 'h2', vessel: 'v3',
  water: 'spring', measure: 'egg1h',
};
// Exam truth: the records the kohen must enter, and the verdict.
export const EXAM_VERDICT = 'tahor';

// ---------------------------------------------------------------- the kohen's book
// Each page: a source block (square script) and a commentary block (Rashi script).
// `unlock` names a state flag; pages without it are open from the start.
export const BOOK = [
  {
    id: 'shades', tab: 'מראות',
    title: 'מראות הנגעים',
    source: [
      { ref: 'משנה נגעים א, א', text: 'מַרְאוֹת נְגָעִים שְׁנַיִם שֶׁהֵן אַרְבָּעָה. בַּהֶרֶת עַזָּה כַּשֶּׁלֶג, שְׁנִיָּה לָהּ כְּסִיד הַהֵיכָל. ... וַחֲכָמִים אוֹמְרִים: הַשְּׂאֵת כְּצֶמֶר לָבָן, שְׁנִיָּה לָהּ כִּקְרוּם בֵּיצָה.' },
    ],
    commentary: 'שני אבות הם, בהרת ושאת, ולכל אחד תולדה הנמוכה ממנו. והלכה כחכמים, וכן פסק הרמב"ם (הלכות טומאת צרעת א). ובהק אינו נגע כלל, שנאמר "בהק הוא פרח בעור, טהור הוא" (ויקרא יג, לט). ראה את הדוגמאות שבעמוד, ולמד להבחין ביניהן, שאין הכהן רואה נגעים עד שיהא בקי בהם ובשמותיהם.',
    swatches: true,
  },
  {
    id: 'signs', tab: 'סימנים',
    title: 'שיעור וסימני טומאה',
    source: [
      { ref: 'ויקרא יג, ג', text: 'וְרָאָה הַכֹּהֵן אֶת הַנֶּגַע בְּעוֹר הַבָּשָׂר, וְשֵׂעָר בַּנֶּגַע הָפַךְ לָבָן ... נֶגַע צָרַעַת הוּא.' },
      { ref: 'ספרא, תזריע', text: 'נִמְצָא גּוּפָהּ שֶׁל בַּהֶרֶת כִּגְרִיס הַקִּילְקִי מְרֻבָּע.' },
    ],
    commentary: 'כל מראה נגע שהוא פחות מכגריס, אינו נגע. ושער לבן, אין פחות משתי שערות; שערה אחת לבנה אינה סימן, ושער שחור אינו סימן כלל. מצורע מוחלט שהלך סימן טומאתו מנגעו ולא נשאר בו סימן, הרי הוא נרפא, והכהן אומר לו טהור. מדוד כל נגע במידת הגריס, וספור את שערותיו בזכוכית.',
  },
  {
    id: 'seeing', tab: 'ראייה',
    title: 'זמן הראייה ודרכה',
    source: [
      { ref: 'משנה נגעים ב, ב', text: 'אֵין רוֹאִין אֶת הַנְּגָעִים בְּשַׁחֲרִית וּבֵין הָעַרְבַּיִם, וּבְתוֹךְ הַבַּיִת, וְלֹא בְּיוֹם הַמְּעֻנָּן, שֶׁהַכֵּהָה נִרְאֵית עַזָּה, וְלֹא בַצָּהֳרַיִם, שֶׁהָעַזָּה נִרְאֵית כֵּהָה.' },
      { ref: 'שם', text: 'רַבִּי יְהוּדָה אוֹמֵר: בְּאַרְבַּע, בְּחָמֵשׁ, בִּשְׁמוֹנֶה וּבְתֵשַׁע.' },
      { ref: 'משנה נגעים ב, ד', text: 'הָאִישׁ נִרְאֶה כְּעוֹדֵר וּכְמוֹסֵק זֵיתִים.' },
    ],
    commentary: 'השעות הן שעות היום מזריחת החמה, ואין רואין אלא בשעה הרביעית, החמישית, השמינית או התשיעית, תחת כיפת השמים ולא ביום שעננים מכסים את החמה. ובשעה שאינה ראויה, אל תסמוך על עיניך, שהמראות מתחלפים. העודר מפסק רגליו, והמוסק מגביה זרועותיו, ומה שנגלה בהם הוא בכלל הראייה. שעון השמש עומד בשדה.',
  },
  {
    id: 'who', tab: 'הכהן',
    title: 'מי רואה ומי פוסק',
    source: [
      { ref: 'משנה נגעים ג, א', text: 'הַכֹּל כְּשֵׁרִין לִרְאוֹת אֶת הַנְּגָעִים, אֶלָּא שֶׁהַטֻּמְאָה וְהַטָּהֳרָה בִּידֵי כֹהֵן.' },
    ],
    commentary: 'כהן שאינו יודע להבחין במראות ובשמותיהם אינו רואה לבדו עד שילמד. לפיכך לא תצא אל המצורע עד שתעמוד במבחן המראות שבסוף הספר. ואדם אינו רואה את נגעי עצמו; המצורע יעמוד ויתנהג כפי שתורה לו, ואתה תראה ותפסוק. ולא תיכנס לסוכתו, שהמצורע מטמא את הנכנס למקום שהוא בו.',
    exam: true,
  },
  {
    id: 'order', tab: 'הטהרה', unlock: 'declared',
    title: 'וְצִוָּה הַכֹּהֵן וְלָקַח',
    source: [
      { ref: 'ויקרא יד, ד', text: 'וְצִוָּה הַכֹּהֵן וְלָקַח לַמִּטַּהֵר שְׁתֵּי צִפֳּרִים חַיּוֹת טְהֹרוֹת וְעֵץ אֶרֶז וּשְׁנִי תוֹלַעַת וְאֵזֹב.' },
      { ref: 'משנה נגעים יד, א', text: 'הָיָה מֵבִיא פַּיְלִי שֶׁל חֶרֶס חֲדָשָׁה, וְנוֹתֵן לְתוֹכָהּ רְבִיעִית מַיִם חַיִּים, וּמֵבִיא שְׁתֵּי צִפֳּרִים דְּרוֹר.' },
      { ref: 'משנה נגעים יד, ה', text: 'שְׁתֵּי צִפֳּרֵי מְצֹרָע, מִצְוָתָן שֶׁיִּהְיוּ שָׁווֹת בַּמַּרְאֶה וּבַקּוֹמָה וּבַדָּמִים, וּלְקִיחָתָן כְּאַחַת.' },
      { ref: 'משנה נגעים יד, ו', text: 'עֵץ אֶרֶז, מִצְוָתוֹ שֶׁיְּהֵא אָרְכּוֹ אַמָּה, וְעָבְיוֹ כִּרְבִיעַ כֶּרַע הַמִּטָּה.' },
      { ref: 'משנה חולין ג, ו', text: 'כָּל עוֹף הַדּוֹרֵס, טָמֵא. כָּל שֶׁיֵּשׁ לוֹ אֶצְבַּע יְתֵרָה, וְזֶפֶק, וְקֻרְקְבָנוֹ נִקְלָף, טָהוֹר.' },
    ],
    commentary: 'שני תולעת הוא צמר הצבוע בצבע הבא מן התולעת. ואזוב, אזוב סתם ולא אזוב שיש לו שם לוואי; את מיני האזוב הפסולים מנה התנא במשנה פרה פרק יא משנה ז, ועיין שם. מים חיים הם מים הנובעים ממעיין, ולא מים שנאספו. ומידות: אמה ששה טפחים, וטפח ארבע אצבעות. ורביעית היא ביצה וחצי. צוה את המצורע לקחת, ובדוק את הסל כשיביאנו אליך, שאם תאשר צירוף פסול, הפסד הוא לו.',
    command: true,
  },
];

// Notes the metzora carries. He has no book: only what he remembers and sees.
export const M_NOTES = [
  { id: 'self', title: 'מה שאתה יודע', text: 'אתה מצורע מוחלט, ומקום מושבך מחוץ לחומה. כל מי שעובר בדרך אתה קורא לו "טמא, טמא", כדי שיתרחק. בימים האחרונים נדמה לך שהנגע נסוג. אבל אדם אינו רואה את נגעי עצמו, ורק כהן יכול לומר לך טהור.' },
  { id: 'remember', title: 'ממה שזכור לך', text: 'לפני שנים שמעת בבית המדרש שהמיטהר מביא שתי צפרים, עץ ארז, שני תולעת ואזוב, וכלי חרס עם מים. אילו מהם בדיוק, אינך זוכר. ההלכות כתובות בספר שבידי הכהן.' },
];

// Story beats shown when a role first enters.
export const INTRO = {
  m: {
    kicker: 'מערכה ראשונה · מחוץ לחומה',
    title: 'בוקר בעמק',
    text: 'החמה זרחה מעל הר המשחה. אתה מתעורר בסוכה שבנית לעצמך מתחת לחומות ירושלים, הרחק מכל אדם. השער פתוח, אבל לא בשבילך. הלילה חלמת שאתה נכנס בו. הבוקר אתה מחכה לכהן.',
  },
  k: {
    kicker: 'מערכה ראשונה · מחוץ לחומה',
    title: 'לשכת השער',
    text: 'נקראת אל הלשכה שליד שער העיר. מצורע ששוכן בעמק מבקש שיראו אותו. לפניך ספר הנגעים. לא תצא אליו עד שתהיה בקי במראות ובשמותיהם.',
  },
};
