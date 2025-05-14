import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import cloudinary from "../utils/cloudinary";

export const clearAllData = async () => {
    try {
     
      // Start a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Get all records that might have images
        const roomImages = await tx.roomImage.findMany();
        const staffs = await tx.staff.findMany();
        const users = await tx.user.findMany();
        const hostels = await tx.hostelImages.findMany(); // Changed to hostelImages model
  
        // Delete hostel images
        for (const hostelImage of hostels) {
          if (hostelImage.imageKey) {
            await cloudinary.uploader.destroy(hostelImage.imageKey);
          }
        }
  
        // Delete room images
        for (const roomImage of roomImages) {
          if (roomImage.imageKey) {
            await cloudinary.uploader.destroy(roomImage.imageKey);
          }
        }
  
        // Delete staff passport images
        for (const staff of staffs) {
          if (staff.passportKey) {
            await cloudinary.uploader.destroy(staff.passportKey);
          }
        }
  
        // Delete user profile images
        for (const user of users) {
          if (user.imageKey) {
            await cloudinary.uploader.destroy(user.imageKey);
          }
        }
  
        // Clear all tables in the correct order to handle foreign key constraints
        await tx.payment.deleteMany({});
        await tx.visitor.deleteMany({}); // Added visitor deletion
        await tx.historicalResident.deleteMany({});
        await tx.resident.deleteMany({});
        await tx.roomImage.deleteMany({});
        await tx.room.deleteMany({});
        await tx.amenities.deleteMany({});
        await tx.calendarYear.deleteMany({});
        await tx.staff.deleteMany({});
        await tx.hostelImages.deleteMany({}); // Added hostelImages deletion
        await tx.hostel.deleteMany({});
        await tx.user.deleteMany({
          where: { role: { not: "SUPER_ADMIN" } } // Preserve super admin
        });
      });
  
      return { message: "All data cleared successfully" };
    } catch (error) {
      throw new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Failed to clear database"
      );
    }
  };

