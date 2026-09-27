import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  money,
  periodLabels,
  paymentMethodLabels,
  type FinancialPeriod,
} from "@/_lib/financial"
import { formatBookingDate } from "@/_lib/booking-time"
import { bookingStatusLabels } from "@/_lib/booking-status"
import type { getFinancialReport } from "@/_data/get-financial-report"
import PaymentControl from "./payment-control"

type Report = Awaited<ReturnType<typeof getFinancialReport>>
export default function FinancialReport({
  report,
  period,
  basePath,
  dimension,
  periodError,
}: {
  report: Report
  period: FinancialPeriod
  basePath: string
  dimension: string
  periodError?: string
}) {
  const query = new URLSearchParams({
    period: period.key,
    start: period.start,
    end: period.end,
    dimension,
    pending: "1",
  })
  const pendingHref = `${basePath}?${query}#agenda`
  const max = Math.max(
    1,
    ...report.series.points.flatMap((p) => [p.projected, p.received]),
  )
  const width = Math.max(600, report.series.points.length * 74)
  const height = 240
  const barHeight = (value: number) => (value / max) * 170
  return (
    <section id="financeiro" className="admin-panel mt-8 scroll-mt-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Financeiro</h2>
        <p className="mt-2 text-sm text-foreground/75">
          Projeção de reservas confirmadas e pagamentos recebidos. Fuso: São
          Paulo.
        </p>
      </div>
      <form
        method="get"
        action={basePath + "#financeiro"}
        className="flex flex-wrap items-end gap-4"
      >
        <div className="space-y-2">
          <Label htmlFor="finance-period">Período</Label>
          <select
            id="finance-period"
            name="period"
            defaultValue={period.key}
            className="h-11 rounded-md border bg-card px-3"
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="finance-start">Início personalizado</Label>
          <Input
            id="finance-start"
            type="date"
            name="start"
            defaultValue={period.start}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="finance-end">Fim personalizado</Label>
          <Input
            id="finance-end"
            type="date"
            name="end"
            defaultValue={period.end}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="finance-dimension">Agrupar gráfico por</Label>
          <select
            id="finance-dimension"
            name="dimension"
            defaultValue={dimension}
            className="h-11 rounded-md border bg-card px-3"
          >
            <option value="date">Data</option>
            <option value="professional">Profissional</option>
            <option value="service">Serviço</option>
          </select>
        </div>
        <Button type="submit">Aplicar</Button>
      </form>
      {periodError && <p role="alert">{periodError} Exibindo o mês atual.</p>}
      <p className="text-sm text-foreground/75">
        {formatBookingDate(period.gte, "dd/MM/yyyy")} a{" "}
        {period.end.split("-").reverse().join("/")} (inclusive). As datas
        manuais são usadas ao escolher Personalizado.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border-t pt-4">
          <h3 className="text-sm">Receita projetada</h3>
          <p className="mt-3 text-2xl tabular-nums">
            {money(report.summary.projected)}
          </p>
        </div>
        <div className="border-t pt-4">
          <h3 className="text-sm">Receita recebida</h3>
          <p className="mt-3 text-2xl tabular-nums">
            {money(report.summary.received)}
          </p>
        </div>
        <div className="border-t pt-4">
          <h3 className="text-sm">Conversão em caixa</h3>
          <p className="mt-3 text-2xl tabular-nums">
            {report.summary.conversion === null
              ? "—"
              : report.summary.conversion.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                }) + "%"}
          </p>
        </div>
        <div className="border-t pt-4">
          <h3 className="text-sm">Concluídas sem pagamento</h3>
          <p className="mt-3 text-2xl tabular-nums">
            {report.summary.pendingIds.length}
          </p>
          <Link
            href={pendingHref}
            className="mt-2 inline-block underline underline-offset-4"
          >
            Ver pendências na agenda
          </Link>
        </div>
      </div>
      <p className="text-sm text-foreground/75">
        A projeção inclui somente confirmadas; ao finalizar, a reserva sai dessa
        soma. Recebimentos usam a data do pagamento e podem se referir a outro
        período de atendimento. A razão pode superar 100% e não representa uma
        taxa de quitação de uma mesma carteira.
      </p>
      <figure className="space-y-3">
        <figcaption className="text-sm">
          Projetada × recebida ·{" "}
          {dimension === "date"
            ? {
                day: "por dia",
                week: "por semana (segunda-feira)",
                month: "por mês",
              }[report.series.grain]
            : dimension === "professional"
              ? "por profissional"
              : "por serviço"}
        </figcaption>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            <i className="mr-2 inline-block h-3 w-3 bg-muted-foreground" />
            Projetada
          </span>
          <span>
            <i className="mr-2 inline-block h-3 w-3 bg-primary" />
            Recebida
          </span>
        </div>
        <div
          className="overflow-x-auto rounded-md bg-background p-3"
          tabIndex={0}
          role="region"
          aria-label="Gráfico financeiro com rolagem horizontal"
        >
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Comparação de receita projetada e recebida. Valores completos na tabela de séries abaixo."
          >
            <line
              x1="0"
              x2={width}
              y1="180"
              y2="180"
              stroke="currentColor"
              opacity=".25"
            />
            {report.series.points.map((point, index) => {
              const x =
                index * (width / Math.max(1, report.series.points.length)) + 12
              return (
                <g key={point.key}>
                  <title>
                    {point.label}: projetada {money(point.projected)}, recebida{" "}
                    {money(point.received)}
                  </title>
                  <rect
                    x={x}
                    y={180 - barHeight(point.projected)}
                    width="20"
                    height={barHeight(point.projected)}
                    fill="hsl(var(--muted-foreground))"
                  />
                  <rect
                    x={x + 24}
                    y={180 - barHeight(point.received)}
                    width="20"
                    height={barHeight(point.received)}
                    fill="hsl(var(--primary))"
                  />
                  <text x={x} y="205" fill="currentColor" fontSize="10">
                    {point.label.length > 13
                      ? point.label.slice(0, 12) + "…"
                      : point.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <details>
          <summary className="cursor-pointer py-2">
            Valores do gráfico em tabela
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Grupo</th>
                  <th>Projetada</th>
                  <th>Recebida</th>
                </tr>
              </thead>
              <tbody>
                {report.series.points.map((p) => (
                  <tr key={p.key} className="border-t">
                    <th className="p-2 font-normal">{p.label}</th>
                    <td>{money(p.projected)}</td>
                    <td>{money(p.received)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </figure>
      <div>
        <h3 className="text-lg font-medium">
          Reservas e recebimentos do período
        </h3>
        <p className="mt-2 text-sm text-foreground/75">
          Inclui atendimento ou pagamento no período. Canceladas são exibidas no
          histórico, mas nunca entram nas somas.
        </p>
      </div>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Reservas financeiras"
      >
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b">
              {[
                "Atendimento",
                "Cliente",
                "Serviço / profissional",
                "Preço reservado",
                "Reserva / pagamento",
                "Forma / recebimento",
                "Ação",
              ].map((h) => (
                <th key={h} className="p-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.id} className="border-b align-top">
                <td className="p-3">
                  {formatBookingDate(row.date, "dd/MM/yyyy HH:mm")}
                </td>
                <td className="p-3">{row.user.name}</td>
                <td className="p-3">
                  {row.service.name}
                  <br />
                  {row.professional.name}
                </td>
                <td className="p-3">
                  {Number(row.priceAtBooking).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
                <td className="p-3">
                  {bookingStatusLabels[row.status]}
                  <br />
                  <Badge variant="secondary">
                    {row.status === "CANCELLED"
                      ? "Não se aplica"
                      : row.paidAmount !== null
                        ? "Pago"
                        : row.status === "COMPLETED"
                          ? "Pendente"
                          : "Aguardando atendimento"}
                  </Badge>
                </td>
                <td className="p-3">
                  {row.paymentMethod
                    ? paymentMethodLabels[row.paymentMethod]
                    : "—"}
                  {row.paidAt && (
                    <>
                      <br />
                      {formatBookingDate(row.paidAt, "dd/MM/yyyy HH:mm")}
                      <br />
                      {Number(row.paidAmount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </>
                  )}
                </td>
                <td className="p-3">
                  {row.status === "COMPLETED" && (
                    <PaymentControl
                      bookingId={row.id}
                      price={row.priceAtBooking.toString()}
                      paidAmount={row.paidAmount?.toString() ?? null}
                      paymentMethod={row.paymentMethod}
                      paidAt={
                        row.paidAt
                          ? formatBookingDate(row.paidAt, "yyyy-MM-dd'T'HH:mm")
                          : ""
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {report.rows.length === 0 && (
          <p className="py-6 text-sm">
            Nenhuma reserva ou pagamento neste período.
          </p>
        )}
      </div>
      <p className="text-sm text-foreground/75">
        Reservas anteriores à implantação do preço histórico usam o preço do
        serviço na migração como aproximação. Registro manual único por reserva;
        sem gateway ou divisão entre formas.
      </p>
    </section>
  )
}
