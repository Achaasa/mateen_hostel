import { Request, Response, NextFunction } from "express";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { ErrorResponse } from "../utils/types";
import cloudinary from "../utils/cloudinary";
import * as userHelper from "../helper/userHelper"; // Assuming you have similar helper methods for users
import { User } from "@prisma/client";
import { generatePassword } from "../utils/generatepass";
import { sendEmail } from "../utils/nodeMailer";
import { generateOtp, sendOtpEmail } from "../utils/otpSender";
import { compare } from "../utils/bcrypt";
import { setInvalidToken, signToken, UserPayload } from "../utils/jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// User registration function
export const signUpUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userData: User = req.body;
  const photo = req.file ? req.file.path : undefined;
  const picture = {
    imageUrl: "",
    imageKey: "",
  };

  try {
    if (photo) {
      const uploaded = await cloudinary.uploader.upload(photo, {
        folder: "user/",
      });
      if (uploaded) {
        picture.imageUrl = uploaded.secure_url;
        picture.imageKey = uploaded.public_id;
      }
    }

    const newUser = await userHelper.createUser(userData, picture);
    res
      .status(HttpStatus.OK)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// Get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allUsers = await userHelper.getUsers();
    res.status(HttpStatus.OK).json(allUsers);
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// Get a user by email
export const getUserByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const user = await userHelper.getUserByEmail(email);
    res.status(HttpStatus.OK).json(user);
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// Get a user by ID
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await userHelper.getUserById(id);
    res.status(HttpStatus.OK).json(user);
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// Update a user
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const userData: Partial<User> = req.body;
  const photo = req.file ? req.file.path : undefined;
  const picture = {
    imageUrl: "",
    imageKey: "",
  };

  try {
    if (photo) {
      const uploaded = await cloudinary.uploader.upload(photo, {
        folder: "user/",
      });
      if (uploaded) {
        picture.imageUrl = uploaded.secure_url;
        picture.imageKey = uploaded.public_id;
      }
    }

    const updatedUser = await userHelper.updateUser(id, userData, picture);
    res
      .status(HttpStatus.OK)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// Delete a user
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await userHelper.deleteUser(id);
    res
      .status(HttpStatus.OK)
      .json({ message: `User deleted successfully: ${id}` });
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// Verify and create hostel user
export const verifyAndCreateHostelUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hostelId } = req.params;

  try {
    const newHostelUser = await userHelper.verifyAndcreateHostelUser(hostelId);

    // Sending the email with credentials

    res.status(HttpStatus.OK).json({
      message: "Hostel manager user created and credentials sent to email",
      user: newHostelUser,
    });
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// User login function
export const userLogIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const authHeader = req.header("Authorization");
    console.log("Authorization header:", authHeader);
    const token = authHeader?.split(" ")[1]?.trim();
    // Extract token from Authorization header

    if (token) {
      try {
        // Decode and validate token
        const decoded = jwtDecode<UserPayload & { exp: number }>(token);

        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp > currentTime) {
          // Token is valid, proceed to fetch user
          const user = await userHelper.getUserById(decoded.id);
          if (user) {
            // Token is valid, send successful response
            res.status(HttpStatus.OK).json({
              message: "success logging in",
              userId: user.id,
              token,
            });
          } else {
            // Token is valid but user does not exist anymore
            throw new HttpException(HttpStatus.NOT_FOUND, "User not found");
          }
        } else {
          // Token has expired
          res.status(HttpStatus.UNAUTHORIZED).json({
            message: "Token expired. Please log in again.",
          });
        }
      } catch (err) {
        console.error("Invalid or expired token: ", err);
        res.status(HttpStatus.UNAUTHORIZED).json({
          message: "Invalid or expired token. Please log in again.",
        });
      }
    }

    // If token is not provided or is invalid, attempt to log in with email and password
    const user = await userHelper.getUserByEmail(email);
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User not found");
    }

    // Verify password match
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    // Generate a new JWT token for the user
    console.log("Login - User ID:", user.id);
    const newToken = signToken({ id: user.id, role: user.role });

    // Successful login, return the user ID and new token
    res.status(HttpStatus.OK).json({
      userId: user.id,
      message: "login successful",
      token: newToken,
    });
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};

// Get user profile
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");

  const token = authHeader?.split(" ")[1];
  if (token) {
    const decoded = jwtDecode(token) as UserPayload;
    const user = await userHelper.getUserById(decoded?.id);
    if (user) {
      const {password,...restofUser}=user
      res.status(HttpStatus.OK).json({ restofUser });
    } else {
      res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });
    }
  } else {
    res.status(HttpStatus.FORBIDDEN).json({ message: "No token found" });
  }
};


// User logout function
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    setInvalidToken();
    res.status(HttpStatus.OK).json({ message: "Logout successful" });
  } catch (error) {
    const err = error as ErrorResponse;
    next(
      new HttpException(
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message
      )
    );
  }
};
