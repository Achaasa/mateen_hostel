import { Request, Response } from "express";
import * as roomHelper from "../helper/roomHelper"; // Assuming you have your room service functions in this file
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { Room } from "@prisma/client";
import cloudinary from "../utils/cloudinary";

// Add a Room
export const addRoomController = async (req: Request, res: Response) => {
  const roomData: Room = {
    ...req.body,
    price: parseFloat(req.body.price),
    maxCap: parseInt(req.body.maxCap),
  }; // Assuming you are sending the room data in the request body
  const amenitiesIds: string[] = req.body.amenitiesIds; // List of amenities IDs associated with the room
  const photos = req.files ? req.files : undefined;
  const pictures = [];

  if (photos && Array.isArray(photos) && photos.length) {
    // Loop over the photos and upload each one to Cloudinary
    for (const photo of photos) {
      const uploaded = await cloudinary.uploader.upload(photo.path, {
        folder: "rooms/",
      });

      if (uploaded) {
        // Add image info (URL & Key) to the pictures array
        pictures.push({
          imageUrl: uploaded.secure_url,
          imageKey: uploaded.public_id,
        });
      }
    }
  } else {
    // If no files are provided, return an error
    throw new HttpException(HttpStatus.BAD_REQUEST, "No files uploaded.");
  }
  try {
    const newRoom = await roomHelper.createRoom(
      roomData,
      pictures,
      amenitiesIds
    );

    res.status(HttpStatus.CREATED).json({
      message: "Room created successfully",
      data: newRoom,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error adding room",
    });
  }
};

// Get All Rooms
export const getAllRoomsController = async (req: Request, res: Response) => {
  try {
    const rooms = await roomHelper.getAllRooms();

    res.status(HttpStatus.OK).json({
      message: "Rooms fetched successfully",
      data: rooms,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fetching rooms",
    });
  }
};

// Get Room by ID
export const getRoomByIdController = async (req: Request, res: Response) => {
  const { id } = req.params; // Getting room ID from the URL parameters

  try {
    const room = await roomHelper.getRoomById(id);

    res.status(HttpStatus.OK).json({
      message: "Room fetched successfully",
      data: room,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fetching room",
    });
  }
};

// Update a Room
export const updateRoomController = async (req: Request, res: Response) => {
  const { id } = req.params; // Room ID from the URL parameters
  const roomData: Partial<Room> = {
    ...req.body,
    price: parseFloat(req.body.price),
    maxCap: parseInt(req.body.maxCap),
  };
  const amenitiesIds: string[] = req.body.amenitiesIds; // List of amenities IDs to associate with the room
  const photos = req.files as Express.Multer.File[] | undefined;

  const pictures = [];

  try {
    if (photos && photos.length > 0) {
      // Loop over the photos and upload each one to Cloudinary
      for (const photo of photos) {
        const uploaded = await cloudinary.uploader.upload(photo.path, {
          folder: "rooms/",
        });

        if (uploaded) {
          // Add image info (URL & Key) to the pictures array
          pictures.push({
            imageUrl: uploaded.secure_url,
            imageKey: uploaded.public_id,
          });
        }
      }
    }
    const room = await roomHelper.getRoomById(id);
    if (room) {
      for (const image of room.RoomImage) {
        // Delete the existing image from Cloudinary
        await cloudinary.uploader.destroy(image.imageKey);
      }
    }
    const updatedRoom = await roomHelper.updateRoom(id, roomData, pictures);

    res.status(HttpStatus.OK).json({
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error updating room",
    });
  }
};

// Delete a Room
export const deleteRoomController = async (req: Request, res: Response) => {
  const { id } = req.params; // Room ID from the URL parameters

  try {
    const result = await roomHelper.deleteRoom(id);

    res.status(HttpStatus.OK).json({
      message: result.message,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error deleting room",
    });
  }
};

// Get Available Rooms
export const getAvailableRoomsController = async (
  req: Request,
  res: Response
) => {
  try {
    const availableRooms = await roomHelper.getAvailableRooms();

    res.status(HttpStatus.OK).json({
      message: "Available rooms fetched successfully",
      data: availableRooms,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fetching available rooms",
    });
  }
};

export const addAmenitiesToRoomController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const amenitiesIds: string[] = req.body.amenitiesIds;

  try {
    const updatedRoom = await roomHelper.addAmenitiesToRoom(id, amenitiesIds);
    res.status(HttpStatus.OK).json({
      message: "Amenities added successfully",
      data: updatedRoom,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error adding amenities to room",
    });
  }
};

export const removeAmenitiesFromRoomController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const amenitiesIds: string[] = req.body.amenitiesIds;

  try {
    const updatedRoom = await roomHelper.removeAmenitiesFromRoom(
      id,
      amenitiesIds
    );
    res.status(HttpStatus.OK).json({
      message: "Amenities removed successfully",
      data: updatedRoom,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error removing amenities from room",
    });
  }
};
