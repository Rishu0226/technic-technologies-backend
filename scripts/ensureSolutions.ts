import dotenv from "dotenv";
import mongoose from "mongoose";
import { Solution } from "../src/models/Solution";
import { defaultSolutions } from "../src/data/defaultSolutions";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is required");
}

async function main() {
  await mongoose.connect(uri as string);
  const count = await Solution.countDocuments();
  if (count === 0) {
    await Solution.insertMany(defaultSolutions);
    console.log(`Inserted ${defaultSolutions.length} solutions`);
  } else {
    console.log(`Solutions already present: ${count}`);
  }
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unable to prepare solutions");
  process.exit(1);
});
