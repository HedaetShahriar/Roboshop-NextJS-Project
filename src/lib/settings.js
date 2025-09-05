import getDb from './mongodb';

export async function getPlatformSettings() {
  const db = await getDb();
  const doc = await db.collection('settings').findOne({ _id: 'platform' });
  return doc || null;
}
