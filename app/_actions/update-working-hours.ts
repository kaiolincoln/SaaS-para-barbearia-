"use server";

import { actionError, requireBarbershopAccess } from "@/_lib/authorize-barbershop";
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"; 
import { z } from "zod";
import { db } from "@/_lib/prisma";


const workingHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  barbershopId: z.string().uuid(),
});

export const updateWorkingHours = async (formData: FormData) => {
  const rawData = {
    dayOfWeek: Number(formData.get("dayOfWeek")),
    isOpen: formData.get("isOpen") === "true",
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    barbershopId: formData.get("barbershopId") as string,
  };

  const validatedFields = workingHoursSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten());
    return {
      error: "Dados inválidos.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { dayOfWeek, isOpen, startTime, endTime, barbershopId } = validatedFields.data;

  try {
    await requireBarbershopAccess(barbershopId);
    await db.workingHours.upsert({
      where: {
        barbershopId_dayOfWeek: {
          barbershopId,
          dayOfWeek,
        },
      },
      update: {
        isOpen,
        startTime,
        endTime,
      },
      create: {
        barbershopId,
        dayOfWeek,
        isOpen,
        startTime,
        endTime,
      },
    });

    
    revalidateBarbershop(barbershopId);

    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
};

