import { Prisma } from 'generated/prisma/client';


export async function generatePrescriptionCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); 

  const lastPrescription = await tx.prescription.findFirst({
    where: {
      code: {
        startsWith: `RX-${dateStr}-`,
      },
    },
    orderBy: {
      code: 'desc',
    },
  });

  let sequence = 1;
  if (lastPrescription) {
    
    const lastSequence = parseInt(
      lastPrescription.code.split('-')[2] || '0',
      10,
    );
    sequence = lastSequence + 1;
  }

  const sequenceStr = sequence.toString().padStart(6, '0');

  return `RX-${dateStr}-${sequenceStr}`;
}
