import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Room, Amenities } from "@prisma/client";
import cloudinary from "../utils/cloudinary";
import { formatPrismaError } from "../utils/formatPrisma";

export const getAllRooms = async () => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        Amenities: true, // Include the amenities in the response
        RoomImage: true,
        Resident: true,
      },
    });
    return rooms;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const updateRoom = async (
  roomId: string,
  roomData: Partial<Room>,
  pictures: { imageUrl: string; imageKey: string }[]
) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { RoomImage: true },
    });
    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
    }

    // Delete old images from Cloudinary
    if (room.RoomImage && room.RoomImage.length > 0) {
      for (const image of room.RoomImage) {
        await cloudinary.uploader.destroy(image.imageKey); // Delete image from Cloudinary
      }
    }

    // Remove old images from the database
    await prisma.roomImage.deleteMany({
      where: { roomId: roomId },
    });

    // Update the room data
    let updatedRoomData = { ...roomData };

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: updatedRoomData,
    });

    // Add new images to Cloudinary and save them to the database
    if (pictures.length > 0) {
      const roomImages = pictures?.map((picture) => ({
        imageUrl: picture.imageUrl,
        imageKey: picture.imageKey,
        roomId: roomId,
      }));
      await prisma.roomImage.createMany({ data: roomImages });
    }

    return updatedRoom;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const deleteRoom = async (roomId: string) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { RoomImage: true }, // Include associated images
    });

    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
    }

    // Delete images from Cloudinary first
    for (const image of room.RoomImage) {
      await cloudinary.uploader.destroy(image.imageKey); // Delete image from Cloudinary
    }

    // Remove the images from the database
    await prisma.roomImage.deleteMany({
      where: { roomId: roomId },
    });

    // Remove the room from the database
    await prisma.room.delete({
      where: { id: roomId },
    });

    return { message: "Room and associated images deleted successfully" };
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getRoomById = async (roomId: string) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        Amenities: true, // Include the amenities for the room
        RoomImage: true, // Include the room images for the room
        Resident: true,
      },
    });

    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
    }

    return room;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const createRoom = async (
  roomData: Room,
  pictures: { imageUrl: string; imageKey: string }[],
  amenitiesIds?: string[]
) => {
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
        (total, amenity) => total + parseFloat(amenity.price.toString()),
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
    if (!newRoom) {
      throw new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Error adding room"
      );
    }

    const roomImages = pictures.map((picture) => ({
      imageUrl: picture.imageUrl,
      imageKey: picture.imageKey,
      roomId: newRoom.id,
    }));
    
    // Ensure the images are inserted into the database
    if (roomImages.length > 0) {
      await prisma.roomImage.createMany({ data: roomImages });
    }
    
    return newRoom;
  } catch (error) {
    throw formatPrismaError(error);
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
        RoomImage: true,
        Resident: true,
      },
    });

    return availableRooms; // Return the list of available rooms
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const addAmenitiesToRoom = async (
  roomId: string,
  amenitiesIds: string[]
) => {
  try {
    // Check if the room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { Amenities: true }, // Include current amenities of the room
    });

    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
    }

    // Fetch amenities to be added
    const amenitiesToAdd = await prisma.amenities.findMany({
      where: { id: { in: amenitiesIds } },
    });

    // Calculate the total price of the amenities to be added
    const totalAmenitiesPrice = amenitiesToAdd.reduce(
      (total, amenity) => total + amenity.price,
      0
    );

    // Update the room price and connect the new amenities
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        price: room.price + totalAmenitiesPrice,
        Amenities: {
          connect: amenitiesIds.map((id: string) => ({ id })),
        },
      },
    });

    return updatedRoom;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const removeAmenitiesFromRoom = async (
  roomId: string,
  amenitiesIds: string[]
) => {
  try {
    // Check if the room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { Amenities: true }, // Include current amenities of the room
    });

    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
    }

    // Fetch amenities to be removed
    const amenitiesToRemove = await prisma.amenities.findMany({
      where: { id: { in: amenitiesIds } },
    });

    // Calculate the total price of the amenities to be removed
    const totalAmenitiesPrice = amenitiesToRemove.reduce(
      (total, amenity) => total + amenity.price,
      0
    );

    // Update the room price and disconnect the amenities
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        price: room.price - totalAmenitiesPrice,
        Amenities: {
          disconnect: amenitiesIds.map((id: string) => ({ id })),
        },
      },
    });

    return updatedRoom;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllRoomsForHostel = async (hostelId: string) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { hostelId },
      include: { RoomImage: true, Resident: true, Amenities: true },
    });
    return rooms as Room[];
  } catch (error) {
    throw formatPrismaError(error);
  }
};
