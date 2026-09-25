import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const sourceUri = process.env.SOURCE_MONGODB_URI || "mongodb://localhost:27017/technictechnologies";
const targetUri = process.env.TARGET_MONGODB_URI;

async function copyDatabase() {
  if (!targetUri) {
    throw new Error("TARGET_MONGODB_URI is required.");
  }

  const source = await mongoose.createConnection(sourceUri).asPromise();
  const target = await mongoose.createConnection(targetUri).asPromise();
  const sourceDb = source.db;
  const targetDb = target.db;

  if (!sourceDb || !targetDb) {
    throw new Error("Could not open a database connection.");
  }

  const collections = await sourceDb.listCollections().toArray();
  for (const collection of collections) {
    const name = collection.name;
    if (name.startsWith("system.")) continue;

    const documents = await sourceDb.collection(name).find().toArray();
    await targetDb.collection(name).deleteMany({});
    if (documents.length > 0) {
      await targetDb.collection(name).insertMany(documents);
    }
    console.log(`${name}: ${documents.length}`);
  }

  await source.close();
  await target.close();
}

copyDatabase()
  .then(() => {
    console.log("Local database copied.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database copy failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
