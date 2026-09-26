type WorkingHours = { dayOfWeek: number; isOpen: boolean; startTime: string; endTime: string };

export function validateBookingTime(date: Date, hours: WorkingHours[], now = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()) || date <= now) {
    throw new Error('Escolha uma data futura válida.');
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday'));
  const schedule = hours.find(item => item.dayOfWeek === day);
  const minutes = Number(part('hour')) * 60 + Number(part('minute'));
  const toMinutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
  if (!schedule?.isOpen || minutes < toMinutes(schedule.startTime) || minutes + 30 > toMinutes(schedule.endTime)) {
    throw new Error('Horário fora do funcionamento da barbearia.');
  }
  if (minutes % 30 !== 0 || date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
    throw new Error('Selecione um horário em intervalos de 30 minutos.');
  }
}
