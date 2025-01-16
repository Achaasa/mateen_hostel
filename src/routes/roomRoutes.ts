import { Router } from "express";
import * as roomController from "../controller/roomController"; // Assuming your controller file is named roomController

const roomRouter = Router();

// Get all rooms
roomRouter.get("/", roomController.getAllRoomsController);

// Get a room by ID
roomRouter.get("/:id", roomController.getRoomByIdController);

// Create a new room
roomRouter.post("/", roomController.addRoomController);

// Update an existing room
roomRouter.put("/:id", roomController.updateRoomController);

// Delete a room
roomRouter.delete("/:id", roomController.deleteRoomController);

// Get available rooms
roomRouter.get("/available", roomController.getAvailableRoomsController);

export default roomRouter;
