import { Router, type IRouter } from "express";
import healthRouter from "./health";
import metadataRouter from "./metadata";
import geolocationRouter from "./geolocation";
import cryptoRouter from "./crypto";

const router: IRouter = Router();

router.use(healthRouter);
router.use(metadataRouter);
router.use(geolocationRouter);
router.use(cryptoRouter);

export default router;
