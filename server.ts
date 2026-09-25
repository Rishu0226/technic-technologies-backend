import dotenv from "dotenv";
import app from "./src/app";
import { connectDatabase } from "./src/config/db";

dotenv.config();

const port = Number(process.env.PORT) || 5000;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : "connection failed";
    console.error("MongoDB connection error:", message);
    process.exit(1);
  });
