import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  const mongoUri = process.env.MONGO_DB;
  if (!mongoUri) {
    throw new Error('MONGO_DB env var is not set');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  cachedClient = client;

  // Resolve database name: prefer explicit env, then client options, then driver's default
  const explicitName = process.env.MONGO_DB_NAME;
  const resolvedName = explicitName || (client as any).options?.dbName;
  cachedDb = resolvedName ? client.db(resolvedName) : client.db();
  return cachedDb;
}

export async function disconnect(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}


