-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'PIX', 'OUTRO');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paidAmount" DECIMAL(10,2),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "priceAtBooking" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Historical approximation only: original charged prices were not recorded.
UPDATE "Booking" b SET "priceAtBooking" = s."price"
FROM "BarbershopService" s WHERE s."id" = b."serviceId";

ALTER TABLE "Booking" ADD CONSTRAINT "booking_price_nonnegative" CHECK ("priceAtBooking" >= 0);
ALTER TABLE "Booking" ADD CONSTRAINT "booking_payment_consistent" CHECK (
  ("paidAmount" IS NULL AND "paymentMethod" IS NULL AND "paidAt" IS NULL)
  OR ("paidAmount" IS NOT NULL AND "paidAmount" >= 0 AND "paymentMethod" IS NOT NULL AND "paidAt" IS NOT NULL AND "status" = 'COMPLETED')
);
