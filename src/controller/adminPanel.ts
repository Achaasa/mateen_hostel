import prisma from "../utils/prisma";
import * as bcrypt from "../utils/bcrypt";
import { ErrorResponse } from "../utils/types";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";

export const createAdminUser = async () => {
  const adminEmail = String(process.env.ADMIN_EMAIL);
  const adminPassword = String(process.env.ADMIN_PASSWORD);

  // Check if admin user exists
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hashPassword(adminPassword);

      // Create the admin user
      await prisma.user.create({
        data: {
          name: "Admin",
          
          email: adminEmail,
          password: hashedPassword,
          phoneNumber: "1234567890", // Set a default or random number
          role: "SUPER_ADMIN", 
          imageKey:"",
          imageUrl:"",
        },
      });

      console.log("Admin user created successfully.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Failed to check for admin"
    );
  } finally {
    await prisma.$disconnect(); // Ensure Prisma client disconnects
  }
};
