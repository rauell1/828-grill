const HOURS: Record<number, { open: string; close: string } | null> = {
  0: { open: '11:00', close: '21:00' }, // Sunday
  1: { open: '11:00', close: '21:00' }, // Monday
  2: { open: '11:00', close: '21:00' }, // Tuesday
  3: { open: '11:00', close: '21:00' }, // Wednesday
  4: { open: '11:00', close: '22:00' }, // Thursday
  5: { open: '11:00', close: '23:00' }, // Friday
  6: { open: '11:00', close: '23:00' }, // Saturday
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getEasternDate(now = new Date()) {
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

export function isOpen(now = new Date()): boolean {
  const eastern = getEasternDate(now);
  const todayHours = HOURS[eastern.getDay()];
  if (!todayHours) return false;
  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  const cur = eastern.getHours() * 60 + eastern.getMinutes();
  return cur >= openH * 60 + openM && cur < closeH * 60 + closeM;
}

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

export function getTodayHours(now = new Date()): { day: string; display: string } | null {
  const eastern = getEasternDate(now);
  const day = eastern.getDay();
  const h = HOURS[day];
  return { day: DAY_NAMES[day], display: h ? `${fmt12(h.open)} – ${fmt12(h.close)}` : 'Closed' };
}

export function formatHoursDisplay(): { day: string; hours: string; isToday: boolean }[] {
  const todayDay = getEasternDate().getDay();
  return DAY_NAMES.map((day, i) => {
    const h = HOURS[i];
    return { day, hours: h ? `${fmt12(h.open)} – ${fmt12(h.close)}` : 'Closed', isToday: i === todayDay };
  });
}
