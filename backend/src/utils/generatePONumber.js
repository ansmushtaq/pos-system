import { format } from 'date-fns';

export const generatePONumber = async (tx) => {
  const result = await tx.$queryRaw`
    UPDATE "Counter" SET value = value + 1 WHERE name = 'po' RETURNING value
  `;
  const seq = Number(result[0].value);
  return `PO-${format(new Date(), 'yyyyMMdd')}-${String(seq).padStart(4, '0')}`;
};
