import { Router } from "express";
import { z } from "zod";

const router = Router();

const SolarCalcSchema = z.object({
  shadowLength: z.number(),
  objectHeight: z.number(),
  date: z.string(),
  time: z.string(),
  timezone: z.string().optional(),
});

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function calculateSolarElevation(
  date: Date,
  hourDecimal: number,
  timezone: number
): { elevation: number; azimuth: number; latRange: { min: number; max: number } } {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
      86400000
  );

  const declination =
    -23.45 *
    Math.cos(degreesToRadians((360 / 365) * (dayOfYear + 10)));

  const solarNoon = 12 - timezone;
  const hourAngle = (hourDecimal - solarNoon) * 15;

  const shadowRatio = 0;

  const elevationAngle = Math.atan2(
    1,
    shadowRatio === 0 ? 1 : shadowRatio
  );

  const latitudeFromDeclination = declination;
  const latMin = Math.max(-90, latitudeFromDeclination - 25);
  const latMax = Math.min(90, latitudeFromDeclination + 25);

  const azimuth = hourAngle > 0 ? 180 + Math.abs(hourAngle) : 180 - Math.abs(hourAngle);

  return {
    elevation: radiansToDegrees(elevationAngle),
    azimuth: azimuth % 360,
    latRange: { min: parseFloat(latMin.toFixed(2)), max: parseFloat(latMax.toFixed(2)) },
  };
}

router.post("/geolocation/solar-calc", async (req, res) => {
  const result = SolarCalcSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "validation_error", message: result.error.message });
    return;
  }

  const { shadowLength, objectHeight, date: dateStr, time, timezone } = result.data;

  try {
    const date = new Date(dateStr);
    const [hourStr, minStr] = time.split(":");
    const hour = parseInt(hourStr ?? "12");
    const min = parseInt(minStr ?? "0");
    const hourDecimal = hour + min / 60;

    let tzOffset = 0;
    if (timezone) {
      const tzMatch = timezone.match(/UTC([+-])(\d+)/);
      if (tzMatch) {
        tzOffset = parseInt(tzMatch[2]) * (tzMatch[1] === "+" ? 1 : -1);
      }
    }

    const shadowAngle = Math.atan2(objectHeight, shadowLength);
    const solarElevationAngle = radiansToDegrees(shadowAngle);

    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
        86400000
    );

    const declination =
      -23.45 * Math.cos(degreesToRadians((360 / 365) * (dayOfYear + 10)));

    const solarNoon = 12 - tzOffset;
    const hourAngle = (hourDecimal - solarNoon) * 15;

    const latEstimate =
      Math.asin(
        Math.sin(degreesToRadians(solarElevationAngle)) /
          Math.cos(degreesToRadians(hourAngle)) -
          Math.tan(degreesToRadians(declination))
      ) || declination;

    const latDeg = isNaN(latEstimate) ? declination : radiansToDegrees(latEstimate);

    const latMin = parseFloat(Math.max(-90, latDeg - 15).toFixed(2));
    const latMax = parseFloat(Math.min(90, latDeg + 15).toFixed(2));

    const azimuth = hourAngle > 0 ? (180 + hourAngle) % 360 : (180 - Math.abs(hourAngle)) % 360;

    const ratio = (objectHeight / shadowLength).toFixed(3);

    const explanation =
      `Shadow ratio (H/L = ${ratio}) yields a solar elevation of ~${solarElevationAngle.toFixed(1)}°. ` +
      `On ${dateStr} with declination ${declination.toFixed(2)}° ` +
      `at local time ${time} (UTC${tzOffset >= 0 ? "+" : ""}${tzOffset}), ` +
      `estimated latitude is between ${latMin}° and ${latMax}°. ` +
      `Sun azimuth is approximately ${azimuth.toFixed(1)}° from North.`;

    const confidence =
      Math.abs(hourAngle) < 15
        ? "high"
        : Math.abs(hourAngle) < 45
        ? "medium"
        : "low";

    res.json({
      solarElevationAngle: parseFloat(solarElevationAngle.toFixed(2)),
      estimatedLatitudeRange: { min: latMin, max: latMax },
      solarAzimuth: parseFloat(azimuth.toFixed(2)),
      explanation,
      confidence,
    });
  } catch {
    res.status(400).json({ error: "calc_error", message: "Failed to perform solar calculation" });
  }
});

export default router;
