import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { ErrorResponse } from "../utils/types";
import { User } from "@prisma/client";
import { updateUserSchema, userSchema } from "../zodSchema/userSchema";
import { hashPassword } from "../utils/bcrypt";
import cloudinary from "../utils/cloudinary";
export const createUser = async (UserData: User) => {
  try {
    const validateUser = userSchema.safeParse(UserData);
    if (!validateUser.success) {
      const errors = validateUser.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const { email } = UserData;
    const findUser = await prisma.user.findUnique({ where: { email } });
    if (findUser) {
      throw new HttpException(HttpStatus.CONFLICT, "Email already exists");
    }

    const hashedPassword = await hashPassword(UserData.password);
    const newUser = await prisma.user.create({
      data: {
        ...UserData,
        password: hashedPassword,
      },
    });
    const { password, ...restOfUser } = newUser;
    return restOfUser as User;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error Creating User"
    );
  }
};

export const getUsers = async () => {
  try {
    const users = await prisma.user.findMany();
    return users as User[];
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error getting all users"
    );
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    return user;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error getting user by id"
    );
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error getting user by email"
    );
  }
};

export const deleteUser = async (id: string) => {
  try {
    const findUser = await getUserById(id);
    if (!findUser) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User does not exist");
    }

    await prisma.user.delete({ where: { id } });
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error deleting user"
    );
  }
};

export const updateUser = async (id: string, UserData: Partial<User>) => {
  try {
    const validateUser = updateUserSchema.safeParse(UserData);
    if (!validateUser.success) {
      const errors = validateUser.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }
    const findUser = await prisma.user.findUnique({ where: { id } });
    if (!findUser) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User not found");
    }

    if (UserData.password) {
      const hashedpassword = await hashPassword(UserData.password);
      if (!hashedpassword) {
        throw new HttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Error Hashing Password"
        );
      }
      UserData.password = hashedpassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { ...UserData },
    });
    const { password, ...restOfUpdate } = updatedUser;
    return restOfUpdate as User;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error deleting user"
    );
  }
};
