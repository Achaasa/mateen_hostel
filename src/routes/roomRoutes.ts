import { Router } from "express";
import * as roomController from "../controller/roomController"; // Assuming your controller file is named roomController
import upload from "../utils/multer";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { validateHostelAccess } from "../utils/AccessControl";
import { validatePayload } from "../middleware/validate-payload";

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
  validateHostelAccess,

  roomController.getRoomByIdController
);

// Create a new room
roomRouter.post(
  "/add",
  upload.array("photos"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  roomController.addRoomController
);

// Update an existing room
roomRouter.put(
  "/update/:roomId",
  upload.array("photos"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  roomController.updateRoomController
);

// Update an existing room
roomRouter.put(
  "/updateall/:roomId",
  upload.array("photos"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  roomController.updateRoomControllerAll
);

// Delete a room
roomRouter.delete(
  "/delete/:roomId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  roomController.deleteRoomController
);

// Get available rooms
roomRouter.get(
  "/available",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  roomController.getAvailableRoomsController
);

roomRouter.post(
  "/:roomId/add",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  validateHostelAccess,

  roomController.addAmenitiesToRoomController
);
roomRouter.post(
  "/:roomId/remove",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  roomController.removeAmenitiesFromRoomController
);

roomRouter.get(
  "/hostel/:hostelId",
  

  roomController.roomsForHostel
);
export default roomRouter;
