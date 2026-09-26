-- AlterTable
ALTER TABLE "BarbershopService" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing bookings retain their original thirty-minute duration.
UPDATE "Booking" SET "endsAt" = "date" + INTERVAL '30 minutes';
ALTER TABLE "BarbershopService" ADD CONSTRAINT "service_duration_valid" CHECK ("durationMinutes" BETWEEN 30 AND 720 AND "durationMinutes" % 30 = 0);
ALTER TABLE "Booking" ADD CONSTRAINT "booking_duration_valid" CHECK ("durationMinutes" BETWEEN 30 AND 720 AND "durationMinutes" % 30 = 0);
ALTER TABLE "Booking" ADD CONSTRAINT "booking_interval_valid" CHECK ("endsAt" = "date" + "durationMinutes" * INTERVAL '1 minute');
