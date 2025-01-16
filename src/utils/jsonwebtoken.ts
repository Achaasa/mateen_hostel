import { Request, Response, NextFunction } from "express";
import jwt  from "jsonwebtoken";
import HttpException from "./http-error";
import { HttpStatus } from "./http-status";


// Define the payload to handle both students and tutors
export interface UserPayload {
  id: string;
  role: 'ADMIN' | 'STAFF';
  
}

declare global {
  namespace Express {
    interface Request {
      user:UserPayload;   
    }
  }
}



export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        return next(
          new HttpException(HttpStatus.FORBIDDEN, "Invalid token")
        );
      }
      // Attach the user to the request based on role
      if (decoded && (decoded as UserPayload).role === "ADMIN") {
        req.user = decoded as UserPayload;
      } else if (decoded && (decoded as UserPayload).role === "STAFF") {
        req.user = decoded as UserPayload;
      }
      next();
    });
  } else {
    next(new HttpException(HttpStatus.FORBIDDEN, "No token found"));
  }
};


// Function to sign a JWT token with the student payload
export const signToken = (payload: UserPayload): string => {
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    throw new HttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "JWT configuration is missing"
    );
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};





// Function to create a short-lived invalid token
export const setInvalidToken = (): string => {
  if (!process.env.JWT_SECRET) {
    throw new HttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "JWT secret is missing"
    );
  }
  return jwt.sign({ logout: "logout" }, process.env.JWT_SECRET, {
    expiresIn: "30s", // Short-lived token
  });
};


export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user 
    
    if (!user || !allowedRoles.includes(user.role)) {
      return next(new HttpException(HttpStatus.FORBIDDEN, "Access denied"));
    }

    next();
  };
};