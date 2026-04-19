import { Router, type IRouter } from "express";
import healthRouter from "./health";
import metadataRouter from "./metadata";
import geolocationRouter from "./geolocation";
import cryptoRouter from "./crypto";
import imageAnalysisRouter from "./image-analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(metadataRouter);
router.use(geolocationRouter);
router.use(cryptoRouter);
router.use(imageAnalysisRouter);

export default router;
