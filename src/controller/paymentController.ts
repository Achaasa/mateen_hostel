import { Request, Response ,NextFunction} from "express";
import * as roomHelper from "../helper/roomHelper"; // Assuming you have your room service functions in this file
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { Room } from "@prisma/client";
import { confirmPayment, initializePayment } from "../helper/paymentHelper";
export const initiatePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId, residentId, initialPayment } = req.body;
      const paymentUrl = await initializePayment(roomId, residentId, initialPayment);
      res.status(201).json({
        message: "Payment initialized.",
        paymentUrl,
      });
    } catch (error) {
        const err = error as HttpException;
        res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: err.message 
        });
      }
    };
  
  export const handlePaymentConfirmation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference } = req.query;
      const resident = await confirmPayment(reference as string);
      res.status(200).json({
        message: "Payment confirmed.",
        data: resident,
      });
    } catch (error) {
        const err = error as HttpException;
        res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: err.message 
        });
      }
    };