import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import mainRouter from "./routes";
import swaggerUi from "swagger-ui-express"
// import * as swaggerDocs from './swagger.json'
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 2020;
app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:2020",
    credentials: true,
  })
);
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

// app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use("/api", mainRouter);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.log("error handler: ", error.status || 500, next);
  res.status(error.status || 500).json({
    status: error.status || 500,
    error: error.message,
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
