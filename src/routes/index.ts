import { Router } from "express";
import hostelRoute from "./hostelRoutes";
import visitorRouter from "./visitorRoute";
import roomRouter from "./roomRoutes";
import amenitiesRoute from "./amenitiesRoute";
import paymentRouter from "./paymentRoutes";
import residentRouter from "./residentRouter";
import StaffRouter from "./staffRoutes";
import userRouter from "./userRoutes";
import calendarYearRoute from "./calendarYearRouter";
import exportRouter from "./exportRoutes";

const mainRouter = Router();

mainRouter.use("/hostels", hostelRoute);
mainRouter.use("/visitors", visitorRouter);
mainRouter.use("/rooms", roomRouter);
mainRouter.use("/amenities", amenitiesRoute);
mainRouter.use("/payments", paymentRouter);
mainRouter.use("/residents", residentRouter);
mainRouter.use("/staffs", StaffRouter);
mainRouter.use("/users", userRouter);
mainRouter.use("/calendar", calendarYearRoute);
mainRouter.use("/exports", exportRouter);
export default mainRouter;
