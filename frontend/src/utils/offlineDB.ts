import Dexie, { type Table } from 'dexie';

interface OfflineSale {
  id?: number;
  payload: string;
  createdAt: string;
  synced: number; // 0 = false, 1 = true
}

class OfflineDB extends Dexie {
  offlineSales!: Table<OfflineSale>;

  constructor() {
    super('posOfflineDB');
    this.version(1).stores({
      offlineSales: '++id, synced, createdAt',
    });
  }
}

export const db = new OfflineDB();

export const queueSale = async (salePayload: unknown) => {
  await db.offlineSales.add({
    payload: JSON.stringify(salePayload),
    createdAt: new Date().toISOString(),
    synced: 0,
  });
};

export const getPendingSales = async () => {
  return db.offlineSales.where('synced').equals(0).toArray();
};

export const markSaleSynced = async (id: number) => {
  await db.offlineSales.update(id, { synced: 1 });
};

export const getPendingCount = async (): Promise<number> => {
  return db.offlineSales.where('synced').equals(0).count();
};

export const purgeOldSyncedSales = async (days = 30) => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  await db.offlineSales.where('synced').equals(1).and(
    (sale) => sale.createdAt < cutoff
  ).delete();
};
