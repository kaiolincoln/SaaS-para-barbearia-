import { db } from "@/_lib/prisma"
import { requireBarbershopAccess } from "@/_lib/authorize-barbershop"
import {
  financialPeriod,
  summarizeFinance,
  financeSeries,
  inPeriod,
  type FinancialPeriod,
} from "@/_lib/financial"

export async function getFinancialReport(
  barbershopId: string,
  period: FinancialPeriod,
  dimension = "date",
  now = new Date(),
) {
  await requireBarbershopAccess(barbershopId)
  const month = financialPeriod("month", undefined, undefined, now)
  // Uma leitura atende ao período escolhido e ao resumo mensal, com o mesmo agregador.
  const rows = await db.booking.findMany({
    where: {
      service: { barbershopId },
      OR: [
        { date: { gte: period.gte, lt: period.lt } },
        { paidAt: { gte: period.gte, lt: period.lt } },
        { date: { gte: month.gte, lt: month.lt } },
      ],
    },
    select: {
      id: true,
      date: true,
      status: true,
      priceAtBooking: true,
      paidAmount: true,
      paidAt: true,
      paymentMethod: true,
      user: { select: { name: true } },
      service: { select: { id: true, name: true } },
      professional: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })
  return {
    summary: summarizeFinance(rows, period),
    monthSummary: summarizeFinance(rows, month),
    series: financeSeries(rows, period, dimension),
    rows: rows.filter(
      (row) =>
        inPeriod(row.date, period) ||
        (row.paidAt && inPeriod(row.paidAt, period)),
    ),
  }
}
