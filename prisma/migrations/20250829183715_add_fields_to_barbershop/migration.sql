/*
  Warnings:

  - You are about to drop the column `update` on the `Barbershop` table. All the data in the column will be lost.
  - Added the required column `description` to the `Barbershop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Barbershop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Barbershop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Barbershop" DROP COLUMN "update",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "phones" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
