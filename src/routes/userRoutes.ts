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
} from "../controller/userController";
import upload from "../utils/multer";
import { validatePayload } from "../middleware/validate-payload";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { Router } from "express";

const userRouter = Router();

// User sign up
userRouter.post(
  "/signup",
  validatePayload("User"), // Assuming you have validation logic for user payload
  upload.single("photo"),
  signUpUser
);

// Get all users
userRouter.get("get/", getAllUsers); // Only accessible by admin

// Get user by email
userRouter.get("/email", authenticateJWT, getUserByEmail);

// Get user by ID
userRouter.get("/get/:id", authenticateJWT, getUserById);

// Update user
userRouter.put(
  "/update/:id",
  validatePayload("User"),
  upload.single("photo"),

  updateUser
);

// Delete user
userRouter.delete(
  "/delete/:id",

  deleteUser
);




// User login
userRouter.post("/login", validatePayload("User"), userLogIn);

// Get user profile
userRouter.get("/profile", authenticateJWT, getUserProfile);

// User logout
userRouter.post("/logout", authenticateJWT, logout);

export default userRouter;
