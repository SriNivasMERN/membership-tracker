import app from "./app";
import { connectDB } from "./config/db";
import { config } from "./config/env";

const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

startServer();