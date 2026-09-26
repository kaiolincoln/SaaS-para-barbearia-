// CAMINHO: app/admin/barbershops/[id]/_components/add-service-sheet.tsx

"use client";

import { useState } from "react";
import { Professional } from "@prisma/client"; // ✅ 1. Importar o tipo Professional
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddServiceForm } from "./add-service-form";

interface AddServiceSheetProps {
  barbershopId: string;
  professionals: Professional[]; 
}

export const AddServiceSheet = ({ barbershopId, professionals }: AddServiceSheetProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button>Adicionar Serviço</Button>
      </SheetTrigger>
      <SheetContent className="p-5">
        <SheetHeader className="mb-6">
          <SheetTitle>Adicionar Novo Serviço</SheetTitle>
        </SheetHeader>
        <AddServiceForm
          barbershopId={barbershopId}
          professionals={professionals} 
          onClose={() => setIsSheetOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
