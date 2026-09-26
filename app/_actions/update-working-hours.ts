"use server";

import { actionError, requireBarbershopAccess } from "@/_lib/authorize-barbershop";
import { revalidateBarbershop } from "@/_lib/revalidate-barbershop"; 
import { z } from "zod";
import { db } from "@/_lib/prisma";


const time = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
const base = { dayOfWeek: z.number().int().min(0).max(6), barbershopId: z.string().uuid() }
const workingHoursSchema = z.discriminatedUnion("isOpen", [
  z.object({ ...base, isOpen: z.literal(true), startTime: time, endTime: time }),
  z.object({ ...base, isOpen: z.literal(false), startTime: time.optional(), endTime: time.optional() }),
]).refine(data => !data.isOpen || data.startTime < data.endTime, { message: "Início deve ser anterior ao fim.", path: ["endTime"] })

export const updateWorkingHours = async (formData: FormData) => {
  const rawData = {
    dayOfWeek: formData.has("dayOfWeek") ? Number(formData.get("dayOfWeek")) : NaN,
    isOpen: formData.get("isOpen") === "true" ? true : formData.get("isOpen") === "false" ? false : undefined,
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    barbershopId: formData.get("barbershopId") as string,
  };

  const validatedFields = workingHoursSchema.safeParse(rawData);

  if (!validatedFields.success) {
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
        startTime: startTime ?? "09:00",
        endTime: endTime ?? "18:00",
      },
    });

    
    revalidateBarbershop(barbershopId);

    return { success: true };
  } catch (error) {
    return { error: actionError(error) };
  }
};

