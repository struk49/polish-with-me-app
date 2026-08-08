import { Router, type IRouter } from "express";
import aiTutorRouter from "./aiTutor";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiTutorRouter);

export default router;
