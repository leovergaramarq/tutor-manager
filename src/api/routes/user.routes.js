import { Router } from "express";
import { get } from "../controllers/user.controllers.js";

const router = Router();

router.get("/", get);

export default router;
