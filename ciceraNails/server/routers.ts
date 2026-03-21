import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  appointments: router({
    create: publicProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
        clientPhone: z.string().min(10),
        service: z.string().min(1),
        appointmentDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createAppointment } = await import("./db");
        const { createCalendarEvent } = await import("./_core/googleCalendar");
        
        try {
          const eventId = await createCalendarEvent(
            input.clientName,
            input.clientEmail,
            input.service,
            input.appointmentDate,
            input.notes
          );
          
          const result = await createAppointment({
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            clientPhone: input.clientPhone,
            service: input.service,
            appointmentDate: input.appointmentDate,
            notes: input.notes || null,
            googleCalendarEventId: eventId,
            status: "confirmed",
          });
          return result;
        } catch (error) {
          console.error("Failed to create appointment:", error);
          throw error;
        }
      }),
    getAvailableSlots: publicProcedure
      .input(z.object({
        date: z.date(),
      }))
      .query(async ({ input }) => {
        const { getAvailableSlots } = await import("./_core/googleCalendar");
        
        try {
          const availableSlots = await getAvailableSlots(input.date);
          return availableSlots;
        } catch (error) {
          console.error("Failed to get available slots:", error);
          return [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
          ];
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
