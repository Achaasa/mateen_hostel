import { Router } from "express";
import * as roomController from "../controller/roomController"; // Assuming your controller file is named roomController
import upload from "../utils/multer";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";

const roomRouter = Router();

// Get all rooms
roomRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  roomController.getAllRoomsController
);

// Get a room by ID
roomRouter.get(
  "/get/:roomId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  roomController.getRoomByIdController
);

// Create a new room
roomRouter.post(
  "/add",
  upload.array("photos"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  roomController.addRoomController
);

// Update an existing room
roomRouter.put(
  "/update/:roomId",
  upload.array("photos"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  roomController.updateRoomController
);

// Delete a room
roomRouter.delete(
  "/delete/:roomId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  roomController.deleteRoomController
);

// Get available rooms
roomRouter.get(
  "/available",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  roomController.getAvailableRoomsController
);

roomRouter.post(
  "/:roomId/add",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  roomController.addAmenitiesToRoomController
);
roomRouter.post(
  "/:roomId/remove",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  roomController.removeAmenitiesFromRoomController
);

roomRouter.get(
  "/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  roomController.roomsForHostel
);
export default roomRouter;
