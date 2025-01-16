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
    roomData: Partial<Room>
  ) => {
    try {
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          ...roomData,
        },
      });
  
      return updatedRoom;
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
    // Calculate total price if amenities are provided
    let totalPrice = roomData.price;
    const findRoom = await prisma.room.findFirst({
      where: {
        number: roomData.number,
        floor: roomData.floor,
        hostelId: roomData.hostelId,
      },
    });
    if (findRoom) {
      throw new HttpException(HttpStatus.CONFLICT, "Room already exists");
    }
    if (amenitiesIds && amenitiesIds.length > 0) {
      const amenities = await prisma.amenities.findMany({
        where: {
          id: {
            in: amenitiesIds,
          },
        },
      });

      // Sum up the prices of the selected amenities
      const totalAmenitiesPrice = amenities.reduce(
        (total, amenity) => total + amenity.price,
        0
      );
      totalPrice += totalAmenitiesPrice;
    }

    // Create the room and connect amenities if provided
    const newRoom = await prisma.room.create({
      data: {
        number: roomData.number,
        block: roomData.block,
        floor: roomData.floor,
        maxCap: roomData.maxCap,
        hostelId: roomData.hostelId,
        price: totalPrice,
        description: roomData.description,
        type: roomData.type,
        status: roomData.status,
        Amenities: amenitiesIds?.length
          ? {
              connect: amenitiesIds.map((id) => ({ id })),
            }
          : undefined, // Only connect amenities if provided
      },
    });

    return newRoom;
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



export const addAmenitiesToRoom = async (roomId:string,amenitiesIds:string[]) => {
  
  
    try {
      // Check if the room exists
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { Amenities: true },  // Include current amenities of the room
      });
  
      if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
        
      }
  
      // Connect amenities to the room
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          Amenities: {
            connect: amenitiesIds.map((id: string) => ({ id })),
          },
        },
      });
  
    return updatedRoom as Room;
    } catch (error) {
        const err = error as ErrorResponse;
        throw new HttpException(
          err.status || HttpStatus.INTERNAL_SERVER_ERROR,
          err.message || "Error adding amenities"
        );
      }
    };


    export const removeAmenitiesFromRoom = async (roomId:string,amenitiesIds:string[]) => {
      
        try {
          // Check if the room exists
          const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { Amenities: true },  // Include current amenities of the room
          });
      
          if (!room) {
            throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
          }
      
          // Disconnect amenities from the room
          const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: {
              Amenities: {
                disconnect: amenitiesIds.map((id: string) => ({ id })),
              },
            },
          });
          return updatedRoom as Room;
        } catch (error) {
            const err = error as ErrorResponse;
            throw new HttpException(
              err.status || HttpStatus.INTERNAL_SERVER_ERROR,
              err.message || "Error removing amenities"
            );
          }
        };