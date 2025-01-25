import { Router } from "express";
import {
  getAllResidentsController,
  getAlldebtors,
  getResidentByEmailController,
  getResidentByIdController,
  updateResidentController,
  registerResidentController,
  deleteResidentController
} from "../controller/residentController"; // Assuming your controller file is named residentController

const residentRouter = Router();

// Define your specific routes first
residentRouter.get("/debtors", getAlldebtors);


residentRouter.post("/register", registerResidentController);

residentRouter.get("/get", getAllResidentsController);


 residentRouter.get("/get/:id", getResidentByIdController);


 residentRouter.get("/email/:email", getResidentByEmailController);


 residentRouter.put("/update/:id", updateResidentController);


residentRouter.delete("/delete/:id", deleteResidentController);

// Catch-all route at the end
residentRouter.get("*", (req, res) => {
  console.log("Catch-all route hit!"); // Logs if this route is hit
  res.status(404).json({
    message: "Route not found",
  });
});

export default residentRouter;
