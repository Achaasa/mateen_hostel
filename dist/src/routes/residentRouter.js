"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const residentController_1 = require("../controller/residentController"); // Assuming your controller file is named residentController
const jsonwebtoken_1 = require("../utils/jsonwebtoken");
const validate_payload_1 = require("../middleware/validate-payload");
const AccessControl_1 = require("../utils/AccessControl");
const residentRouter = (0, express_1.Router)();
// Define your specific routes first
residentRouter.get("/debtors", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin"]), residentController_1.getAlldebtors);
residentRouter.post("/register", residentController_1.registerResidentController);
residentRouter.post("/add", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), (0, validate_payload_1.validatePayload)("Resident"), AccessControl_1.validateHostelAccess, residentController_1.addResidentFromHostelController);
residentRouter.get("/get", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin"]), AccessControl_1.validateHostelAccess, residentController_1.getAllResidentsController);
residentRouter.get("/get/:residentId", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), residentController_1.getResidentByIdController);
residentRouter.get("/email/:email", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), AccessControl_1.validateHostelAccess, residentController_1.getResidentByEmailController);
residentRouter.put("/update/:residentId", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), AccessControl_1.validateHostelAccess, residentController_1.updateResidentController);
residentRouter.delete("/delete/:residentId", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), AccessControl_1.validateHostelAccess, residentController_1.deleteResidentController);
residentRouter.get("/hostel/:hostelId", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), AccessControl_1.validateHostelAccess, residentController_1.getAllresidentsForHostel);
residentRouter.get("/debtors/hostel/:hostelId", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), AccessControl_1.validateHostelAccess, residentController_1.getDebtorsForHostel);
residentRouter.put("/assign/:residentId", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), residentController_1.assignRoomToResidentController);
residentRouter.get("/verify", jsonwebtoken_1.authenticateJWT, (0, jsonwebtoken_1.authorizeRole)(["super_admin", "admin"]), residentController_1.verifyResidentCodeController);
exports.default = residentRouter;
