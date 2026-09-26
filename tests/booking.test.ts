import { beforeEach, expect, test, vi } from 'vitest';
import { validateBookingTime } from '../app/_lib/booking-time';

const mocks = vi.hoisted(() => ({ session: vi.fn(), service: vi.fn(), existing: vi.fn(), create: vi.fn(), transaction: vi.fn(), revalidate: vi.fn() }));
vi.mock('next-auth', () => ({ getServerSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('@/_lib/auth', () => ({ authOptions: {} }));
vi.mock('@/_lib/prisma', () => ({ db: { $transaction: mocks.transaction } }));
import { createBooking } from '../app/_actions/create-booking';

const hours = [{ dayOfWeek: 1, isOpen: true, startTime: '09:00', endTime: '18:00' }];
const date = new Date('2030-01-07T12:00:00Z');
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: 'user' } });
  mocks.service.mockResolvedValue({ professionals: [{ id: 'professional' }], barbershop: { workingHours: hours } });
  mocks.existing.mockResolvedValue(null);
  mocks.transaction.mockImplementation(callback => callback({ barbershopService: { findUnique: mocks.service }, booking: { findFirst: mocks.existing, create: mocks.create } }));
});
test('horário respeita fuso, funcionamento, data futura e intervalos', () => {
  const now = new Date('2029-01-01');
  expect(() => validateBookingTime(date, hours, now)).not.toThrow();
  expect(() => validateBookingTime(new Date('invalid'), hours, now)).toThrow();
  expect(() => validateBookingTime(date, hours, new Date('2031-01-01'))).toThrow();
  expect(() => validateBookingTime(date, [{ ...hours[0], isOpen: false }], now)).toThrow();
  expect(() => validateBookingTime(new Date('2030-01-07T21:00:00Z'), hours, now)).toThrow();
  expect(() => validateBookingTime(new Date('2030-01-07T12:15:00Z'), hours, now)).toThrow();
});
test('agendamento exige autenticação', async () => {
  mocks.session.mockResolvedValue(null);
  await expect(createBooking({ serviceId: 'service', professionalId: 'professional', date })).rejects.toThrow('autenticado');
  expect(mocks.create).not.toHaveBeenCalled();
});
test('profissional deve atender ao serviço escolhido', async () => {
  await expect(createBooking({ serviceId: 'service', professionalId: 'other', date })).rejects.toThrow('Profissional');
  expect(mocks.create).not.toHaveBeenCalled();
});
test('reserva conflitante impede gravação', async () => {
  mocks.existing.mockResolvedValue({ id: 'existing' });
  await expect(createBooking({ serviceId: 'service', professionalId: 'professional', date })).rejects.toThrow('ocupado');
  expect(mocks.create).not.toHaveBeenCalled();
});
test('reserva válida usa o usuário da sessão e transação serializável', async () => {
  await createBooking({ serviceId: 'service', professionalId: 'professional', date });
  expect(mocks.create).toHaveBeenCalledWith({ data: { serviceId: 'service', professionalId: 'professional', date, userId: 'user' } });
  expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
});
