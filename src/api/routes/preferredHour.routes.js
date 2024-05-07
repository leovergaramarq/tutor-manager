import { Router } from "express";
import {
    get,
    add,
    remove,
    clearAll
} from "../controllers/preferredHour.controllers.js";

const router = Router();

router.get("/", get);
router.post("/", add);
router.delete("/:id", remove);
router.delete("/", clearAll);

export default router;
