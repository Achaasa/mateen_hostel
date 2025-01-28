import { Router } from "express";
import * as roomController from "../controller/roomController"; // Assuming your controller file is named roomController
import upload from "../utils/multer";

const roomRouter = Router();

// Get all rooms
roomRouter.get("/get", roomController.getAllRoomsController);

// Get a room by ID
roomRouter.get("/get/:id", roomController.getRoomByIdController);

// Create a new room
roomRouter.post(
  "/add",
  upload.array("photos"),
  roomController.addRoomController
);

// Update an existing room
roomRouter.put(
  "/update/:id",
  upload.array("photos"),
  roomController.updateRoomController
);

// Delete a room
roomRouter.delete("/delete/:id", roomController.deleteRoomController);

// Get available rooms
roomRouter.get("/available", roomController.getAvailableRoomsController);

roomRouter.post("/:id/add", roomController.addAmenitiesToRoomController);
roomRouter.post(
  "/:id/remove",
  roomController.removeAmenitiesFromRoomController
);
export default roomRouter;
