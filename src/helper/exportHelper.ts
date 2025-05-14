import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Amenities, Resident, Room, Visitor, Payment } from "@prisma/client";
import { parse } from "json2csv";
import { formatPrismaError } from "../utils/formatPrisma";
export const amenitiesCsv = async (hostelId: string) => {
  try {
    const amenities = await prisma.amenities.findMany({
      where: { hostelId }, // Add your conditions to filter data
      include: {
        hostel: true, // Include related room data,
        rooms: true,
      },
    });

    // Process the residents data using the spread operator
    const modifiedAmenities = amenities.map((amenities) => ({
      ...amenities, // Spread all fields from the resident object
      room: amenities.rooms ? amenities.rooms : "No Room", // Handle related room data,
      delFlag: undefined, // Remove the delFlag field
    }));

    // Convert the modified data into CSV
    const csv = parse(modifiedAmenities);
    return csv;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
export const residentCsv = async (hostelId: string) => {
  try {
    const residents = await prisma.resident.findMany({
      where: { delFlag: false, room: { hostelId } }, // Add your conditions to filter data
      include: {
        room: true, // Include related room data
      },
    });

    // Process the residents data using the spread operator
    const modifiedAmenities = residents.map((resident) => ({
      ...resident, // Spread all fields from the resident object
      room: resident.room ? resident.room : "No Room", // Handle related room data,
      delFlag: undefined, // Remove the delFlag field
    }));

    // Convert the modified data into CSV
    const csv = parse(modifiedAmenities);
    return csv;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
export const roomCsv = async (hostelId: string) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        delFlag: false,
        hostelId,
        hostel: {
          delFlag: false, // Only get rooms for non-deleted hostels
        },
      },
      include: {
        hostel: true,
      },
    });

    // Process the rooms data using the spread operator
    const modifiedRooms = rooms.map((room) => ({
      ...room, // Spread all fields from the room object
      hostel: room.hostel ? room.hostel : "No Hostel", // Handle related hostel data,
      delFlag: undefined, // Remove the delFlag field
    }));

    // Convert the modified data into CSV
    const csv = parse(modifiedRooms);
    return csv;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
export const visitorCsv = async (hostelId: string) => {
  try {
    const visitors = await prisma.visitor.findMany({
      where: { resident: { room: { hostelId } } },
      include: { resident: true },
    });

    // Process the visitors data using the spread operator
    const modifiedVisitors = visitors.map((visitor) => ({
      ...visitor, // Spread all fields from the visitor object
      resident: visitor.resident ? visitor.resident : "No Resident", // Handle related resident data,
      delFlag: undefined, // Remove the delFlag field
    }));

    // Convert the modified data into CSV
    const csv = parse(modifiedVisitors);
    return csv;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
export const paymentCsv = async (hostelId: string) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { resident: { room: { hostelId } } },
      include: { resident: true },
    });

    // Process the payments data using the spread operator
    const modifiedPayments = payments.map((payment) => ({
      ...payment, // Spread all fields from the payment object
      resident: payment.resident ? payment.resident : "No Resident", // Handle related resident data,
      delFlag: undefined, // Remove the delFlag field
    }));

    // Convert the modified data into CSV
    const csv = parse(modifiedPayments);
    return csv;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
export const StaffCsv = async (hostelId: string) => {
  try {
    const Staffs = await prisma.staff.findMany({
      where: { hostelId },
      include: { hostel: true },
    });
    // Process the payments data using the spread operator
    const modifiedStaffs = Staffs.map((Staff) => ({
      ...Staff,
      delFlag: undefined, // Remove the delFlag field
    }));

    // Convert the modified data into CSV
    const csv = parse(modifiedStaffs);
    return csv;
  } catch (error) {}
};
