import { format } from 'date-fns';

export const generateInvoiceNumber = async (tx) => {
  const result = await tx.$queryRaw`
    UPDATE "Counter" SET value = value + 1 WHERE name = 'invoice' RETURNING value
  `;
  const seq = Number(result[0].value);
  return `INV-${format(new Date(), 'yyyyMMdd')}-${String(seq).padStart(4, '0')}`;
};
