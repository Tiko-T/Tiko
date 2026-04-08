import { TicketStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function checkInTicket(accessCode: string) {
  const entitlement = await db.ticketEntitlement.findUnique({
    where: { accessCode },
    include: {
      event: true,
      order: true,
      buyer: true,
    },
  });

  if (!entitlement) {
    throw new Error("Ticket not found");
  }

  if (entitlement.status !== TicketStatus.ACTIVE) {
    throw new Error(`Ticket is ${entitlement.status.toLowerCase()}`);
  }

  return db.ticketEntitlement.update({
    where: { id: entitlement.id },
    data: {
      status: TicketStatus.CHECKED_IN,
      checkedInAt: new Date(),
    },
    include: {
      event: true,
      order: true,
      buyer: true,
    },
  });
}
