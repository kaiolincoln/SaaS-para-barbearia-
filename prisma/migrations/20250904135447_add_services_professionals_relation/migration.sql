-- CreateTable
CREATE TABLE "_BarbershopServiceToProfessional" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BarbershopServiceToProfessional_AB_unique" ON "_BarbershopServiceToProfessional"("A", "B");

-- CreateIndex
CREATE INDEX "_BarbershopServiceToProfessional_B_index" ON "_BarbershopServiceToProfessional"("B");

-- AddForeignKey
ALTER TABLE "_BarbershopServiceToProfessional" ADD CONSTRAINT "_BarbershopServiceToProfessional_A_fkey" FOREIGN KEY ("A") REFERENCES "BarbershopService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BarbershopServiceToProfessional" ADD CONSTRAINT "_BarbershopServiceToProfessional_B_fkey" FOREIGN KEY ("B") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
