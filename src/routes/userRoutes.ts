import {
  signUpUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
  userLogIn,
  getUserProfile,
  logout,
  usersForHostel,
  resetUserPassword,
} from "../controller/userController";
import upload from "../utils/multer";
import { validatePayload } from "../middleware/validate-payload";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { Router } from "express";
import { validateHostelAccess } from "../utils/AccessControl";

const userRouter = Router();

// User sign up
userRouter.post(
  "/signup",
  upload.single("photo"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validatePayload("User"), // Assuming you have validation logic for user payload

  signUpUser,
);

// Get all users
userRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  getAllUsers,
); // Only accessible by SuperAdmin

// Get user by email
userRouter.get(
  "/email",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  getUserByEmail,
);

// Get user by ID
userRouter.get(
  "/get/:userId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  getUserById,
);

// Update user
userRouter.put(
  "/update/:userId",

  upload.single("photo"),
  validatePayload("User"),
  authenticateJWT,
  validateHostelAccess,

  updateUser,
);

// Delete user
userRouter.delete(
  "/delete/:userId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  deleteUser,
);

// User login
userRouter.post("/login", validatePayload("User"), userLogIn);

// Get user profile
userRouter.get("/profile", authenticateJWT, getUserProfile);

// User logout
userRouter.post("/logout", authenticateJWT, logout);
userRouter.get(
  "/get/:hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  usersForHostel,
);
userRouter.post("/reset-password", resetUserPassword);
export default userRouter;
