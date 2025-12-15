import { Prisma } from 'generated/prisma/client';

/**
 * Genera un código único para la prescripción
 * Formato: RX-YYYYMMDD-XXXXXX (donde XXXXXX es un número secuencial)
 */
export async function generatePrescriptionCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Buscar el último código del día
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
    // Extraer el número secuencial del último código
    const lastSequence = parseInt(
      lastPrescription.code.split('-')[2] || '0',
      10,
    );
    sequence = lastSequence + 1;
  }

  // Formatear el número secuencial con 6 dígitos
  const sequenceStr = sequence.toString().padStart(6, '0');

  return `RX-${dateStr}-${sequenceStr}`;
}
