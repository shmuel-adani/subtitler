// Lighting by hour. Each hour sets sky colours, a colour wash over the scene, and the sun's path.
// Values are applied as CSS custom properties, registered with @property so they animate.

const P = {
  1:  { s1: '#2a3765', s2: '#c4796c', s3: '#f3b27c', tint: '#ff9a5a', to: 0.20, far: '#6b6a8a', sun: '#ffb46e' },
  2:  { s1: '#36558c', s2: '#a7b5cc', s3: '#f6d3a5', tint: '#ffb070', to: 0.13, far: '#7e86a3', sun: '#ffd49a' },
  3:  { s1: '#3b6eb0', s2: '#93b8da', s3: '#e9e3cf', tint: '#ffdcae', to: 0.07, far: '#8d9ab4', sun: '#fff0cc' },
  4:  { s1: '#3878c0', s2: '#88b9e2', s3: '#e2e7e4', tint: '#ffffff', to: 0.0,  far: '#93a3bb', sun: '#fff8e4' },
  5:  { s1: '#367fca', s2: '#8cc0e8', s3: '#e7ece9', tint: '#ffffff', to: 0.0,  far: '#98a9c0', sun: '#fffaf0' },
  6:  { s1: '#5c9bd6', s2: '#bcd9ef', s3: '#f6f5ec', tint: '#fff8e2', to: 0.24, far: '#b5c0cf', sun: '#ffffff' },
  7:  { s1: '#5a98d4', s2: '#b8d6ee', s3: '#f4f2ea', tint: '#fff6dc', to: 0.21, far: '#b1bccc', sun: '#ffffff' },
  8:  { s1: '#3877be', s2: '#8bb9df', s3: '#ece6d4', tint: '#ffe8bf', to: 0.04, far: '#98a4b8', sun: '#fff3d6' },
  9:  { s1: '#3a6aac', s2: '#9db5d0', s3: '#f0dab4', tint: '#ffc88a', to: 0.08, far: '#8f97ae', sun: '#ffe2a8' },
  10: { s1: '#384f8a', s2: '#bb918a', s3: '#f4b67e', tint: '#ff9b52', to: 0.17, far: '#7c7c9a', sun: '#ffb873' },
  11: { s1: '#2b3767', s2: '#a1627a', s3: '#ef955e', tint: '#ff7840', to: 0.25, far: '#68618a', sun: '#ff9a55' },
  12: { s1: '#0d1330', s2: '#1d2450', s3: '#3d3459', tint: '#1d2368', to: 0.48, far: '#2a2c4a', sun: '#fff0d0' },
};
const CLOUD = { s1: '#6e7d92', s2: '#a3adb9', s3: '#c7cac8', tint: '#5f6b7c', to: 0.24, far: '#8f97a3', sun: '#e8ecef' };

export function palette(hour, cloudy) {
  const base = P[Math.max(1, Math.min(12, hour))];
  return cloudy ? { ...base, ...CLOUD } : base;
}

// Sun position across the visible sky: east (left) at hour 1, west (right) at hour 12.
export function sunPos(hour) {
  const t = (hour - 0.5) / 12;
  const x = 120 + t * 1360;
  const y = 640 - Math.sin(t * Math.PI) * 520;
  return { x, y };
}

export function applyLight(el, hour, cloudy) {
  const p = palette(hour, cloudy);
  el.style.setProperty('--sky1', p.s1);
  el.style.setProperty('--sky2', p.s2);
  el.style.setProperty('--sky3', p.s3);
  el.style.setProperty('--tint', p.tint);
  el.style.setProperty('--tint-o', String(p.to));
  el.style.setProperty('--far', p.far);
  el.style.setProperty('--sun', p.sun);
  el.dataset.cloudy = cloudy ? '1' : '0';
  el.dataset.glare = hour === 6 || hour === 7 ? '1' : '0';
}
