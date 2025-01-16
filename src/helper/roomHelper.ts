import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Room, Amenities } from "@prisma/client";
import { ErrorResponse } from "../utils/types";

export const getAllRooms = async () => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        Amenities: true, // Include the amenities in the response
      },
    });
    return rooms;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error fetching rooms"
    );
  }
};

export const updateRoom = async (
  roomId: string,
  roomData: Partial<Room>,
  amenitiesIds?: string[]
) => {
  try {
    if (amenitiesIds && amenitiesIds.length > 0) {
      // Fetch current amenities prices based on the provided IDs
      const amenities = await prisma.amenities.findMany({
        where: {
          id: {
            in: amenitiesIds,
          },
        },
      });

      const totalAmenitiesPrice = amenities.reduce(
        (total, amenity) => total + amenity.price,
        0
      );
      const totalPrice = (roomData.price || 0) + totalAmenitiesPrice; // Ensure price is handled

      // Update the room with new details and recalculate price
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          ...roomData,
          price: totalPrice, // Set the calculated total price
          Amenities: {
            set: amenitiesIds.map((id) => ({ id })), // Update associated amenities
          },
        },
      });

      return updatedRoom;
    } else {
      // If no amenities are provided, update room without recalculating price
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: { ...roomData },
      });
      return updatedRoom;
    }
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error updating room"
    );
  }
};

export const deleteRoom = async (roomId: string) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
    }

    // Remove the room from the database
    await prisma.room.delete({
      where: { id: roomId },
    });

    return { message: "Room deleted successfully" };
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error deleting room"
    );
  }
};

export const getRoomById = async (roomId: string) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        Amenities: true, // Include the amenities for the room
      },
    });

    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
    }

    return room;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error fetching room"
    );
  }
};

export const createRoom = async (roomData: Room, amenitiesIds?: string[]) => {
  try {
    if (amenitiesIds && amenitiesIds.length > 0) {
      // Fetch amenities based on the provided IDs
      const amenities = await prisma.amenities.findMany({
        where: {
          id: {
            in: amenitiesIds,
          },
        },
      });
      // Calculate total price by summing up base price and amenities prices
      const totalAmenitiesPrice = amenities.reduce(
        (total, amenity) => total + amenity.price,
        0
      );
      const totalPrice = roomData.price + totalAmenitiesPrice;

      // Create the room with calculated total price and selected amenities
      const newRoom = await prisma.room.create({
        data: {
          ...roomData,
          price: totalPrice, // Set the calculated total price
          Amenities: {
            connect: amenitiesIds.map((id) => ({ id })),
          },
        },
      });

      return newRoom;
    } else {
      const newRoom = await prisma.room.create({ data: roomData });
      return newRoom; // Return the newly created room
    }

    // Return the newly created room
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error adding room"
    );
  }
};

export const getAvailableRooms = async () => {
  try {
    // Fetch rooms with status 'AVAILABLE'
    const availableRooms = await prisma.room.findMany({
      where: {
        status: "AVAILABLE",
      },
      include: {
        Amenities: true, // Include related amenities if needed
      },
    });

    return availableRooms; // Return the list of available rooms
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error adding room"
    );
  }
};
