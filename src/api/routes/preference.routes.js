import { Router } from "express";
import { get, upsert, reset } from "../controllers/preference.controllers.js";

const router = Router();

router.get("/", get);
router.put("/", upsert);
router.delete("/", reset);

export default router;
