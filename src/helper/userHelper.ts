import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { ErrorResponse } from "../utils/types";
import { Hostel, User } from "@prisma/client";
import { updateUserSchema, userSchema } from "../zodSchema/userSchema";
import { hashPassword } from "../utils/bcrypt";
import cloudinary from "../utils/cloudinary";
import { generatePassword } from "../utils/generatepass";
import { sendEmail } from "../utils/nodeMailer";
import { jwtDecode } from "jwt-decode";
import { UserPayload } from "../utils/jsonwebtoken";
import { formatPrismaError } from "../utils/formatPrisma";
import { generateAdminWelcomeEmail } from "../services/generateAdminEmail";
import { generateResetPasswordEmail } from "../services/generateResetPasswword";
export const createUser = async (
  UserData: User,
  picture: { imageUrl: string; imageKey: string },
) => {
  try {
    const validateUser = userSchema.safeParse(UserData);
    if (!validateUser.success) {
      const errors = validateUser.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const { email } = UserData;
    // Check for existing non-deleted user
    const findUser = await prisma.user.findFirst({
      where: {
        email,
        delFlag: false,
      },
    });
    if (findUser) {
      throw new HttpException(HttpStatus.CONFLICT, "Email already exists");
    }

    const hashedPassword = await hashPassword(UserData.password);
    const newUser = await prisma.user.create({
      data: {
        ...UserData,
        password: hashedPassword,
        imageKey: picture.imageKey,
        imageUrl: picture.imageUrl,
        delFlag: false, // Explicitly set delFlag to false for new users
      },
    });
    const { password, ...restOfUser } = newUser;
    return restOfUser as User;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        delFlag: false, // Only get non-deleted users
      },
      include: { hostel: true },
    });
    return users as User[];
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id, delFlag: false }, // Only get non-deleted users
      include: { hostel: true },
    });
    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User not found.");
    }

    return user;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        delFlag: false, // Only get non-deleted users
      },
      include: { hostel: true },
    });
    return user;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const deleteUser = async (id: string) => {
  try {
    const findUser = await getUserById(id);
    if (!findUser) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User does not exist");
    }

    // Instead of deleting, update the delFlag to true
    await prisma.user.update({
      where: { id },
      data: { delFlag: true },
    });

    return { message: "User soft deleted successfully" };
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const updateUser = async (
  id: string,
  UserData: Partial<User>,
  picture?: { imageUrl: string; imageKey: string },
) => {
  try {
    const validateUser = updateUserSchema.safeParse(UserData);
    if (!validateUser.success) {
      const errors = validateUser.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }
    const findUser = await prisma.user.findUnique({ where: { id } });
    if (!findUser) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User not found");
    }

    if (picture && picture.imageKey && picture.imageUrl) {
      // Delete the existing photo from Cloudinary if it exists
      if (findUser.imageKey) {
        await cloudinary.uploader.destroy(findUser.imageKey);
      }

      // Update tutorData with new picture details
      UserData.imageKey = picture.imageKey;
      UserData.imageUrl = picture.imageUrl;
    }

    if (UserData.password) {
      const hashedpassword = await hashPassword(UserData.password);
      if (!hashedpassword) {
        throw new HttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Error Hashing Password",
        );
      }
      UserData.password = hashedpassword;
      UserData.changedPassword = true;
    }
    const { role, ...restOfUser } = UserData;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { ...restOfUser },
    });
    const { password, ...restOfUpdate } = updatedUser;
    return restOfUpdate as User;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const verifyAndcreateHostelUser = async (hostelId: string) => {
  try {
    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
    if (!hostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }
    // 2. Check if the hostel manager email already exists
    const { email, isVerified } = hostel;
    const findUser = await prisma.user.findFirst({
      where: { email, delFlag: false },
    });
    if (findUser || isVerified) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Email already exists or is verified",
      );
    }

    const verifyHostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: { isVerified: true },
    });

    // 3. Generate a password for the user
    const generatedPassword = generatePassword();

    // 4. Create the user account
    const newUser = await prisma.user.create({
      data: {
        email,
        name: hostel.manager, // Using manager's name as the user's name
        password: await hashPassword(generatedPassword), // Hash the generated password
        phoneNumber: hostel.phone,
        role: "ADMIN",
        imageKey: "",
        imageUrl: "", // Assign the correct role here
        hostelId: hostel.id,
      },
    });

    // 5. Send the generated credentials to the email
    const htmlContent = generateAdminWelcomeEmail(email, generatedPassword);
    await sendEmail(email, "Your Hostel Admin Account", htmlContent);

    // 6. Return the user without password
    const { password, ...restOfUser } = newUser;
    return restOfUser as User;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getUserProfileHelper = async (authHeader: string) => {
  try {
    if (!authHeader) {
      throw new HttpException(HttpStatus.FORBIDDEN, "No token provided");
    }

    const token = authHeader.split(" ")[1]; // Extract the token from 'Bearer <token>'
    if (!token) {
      throw new HttpException(HttpStatus.FORBIDDEN, "Invalid token format");
    }

    let decoded: UserPayload & { exp: number };
    try {
      decoded = jwtDecode<UserPayload & { exp: number }>(token); // Decode the token
    } catch (error) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, "Invalid token");
    }

    const currentTime = Date.now() / 1000;
    if (decoded?.exp < currentTime) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, "Token expired");
    }

    // Fetch the user profile from DB using the user ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User not found");
    }

    return user; // Return the found user
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllUsersForHostel = async (hostelId: string) => {
  try {
    const Users = await prisma.user.findMany({
      where: {
        hostelId,
        delFlag: false, // Only get non-deleted users
      },
      include: {
        hostel: {
          where: {
            delFlag: false, // Only include non-deleted hostels
          },
        },
      },
    });
    return Users;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const resetPassword = async (email: string) => {
  if (!email) {
    throw new HttpException(HttpStatus.BAD_REQUEST, "Email is required");
  }
  try {
    const user = await prisma.user.findFirst({
      where: { email, delFlag: false },
    });

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User not found");
    }

    const newPassword = generatePassword();
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, changedPassword: false },
    });

    const htmlContent = generateResetPasswordEmail(email, newPassword);
    await sendEmail(email, "Password Reset", htmlContent);

    return { message: "Password reset successfully. Check your email." };
  } catch (error) {
    throw formatPrismaError(error);
  }
};
