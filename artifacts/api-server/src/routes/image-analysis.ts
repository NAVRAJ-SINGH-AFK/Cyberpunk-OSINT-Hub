import { Router } from "express";
import { z } from "zod";
import OpenAI from "openai";

const router = Router();

if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
  throw new Error("AI_INTEGRATIONS_OPENAI_BASE_URL is not set");
}
if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  throw new Error("AI_INTEGRATIONS_OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const AnalyzeImageSchema = z.object({
  filename: z.string(),
  data: z.string(),
  mimeType: z.string().optional(),
});

router.post("/geolocation/analyze-image", async (req, res) => {
  const result = AnalyzeImageSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "validation_error", message: result.error.message });
    return;
  }

  const { data, mimeType } = result.data;
  const imageType = mimeType ?? "image/jpeg";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are an expert OSINT geolocation analyst. Analyze images to determine their geographic location with as much precision as possible. You examine:
- Shadow angles, length, and direction (solar position clues)
- Architecture styles (building facades, rooftops, construction materials)
- Vegetation types (trees, plants, climate indicators)
- Street infrastructure (road markings, signs, power lines, traffic lights)
- Vehicle types and license plates (if visible)
- Language on signs, storefronts, text
- Cultural markers, clothing, uniforms
- Sky conditions, sun angle, and apparent time of day
- Landscape features (mountains, coastlines, terrain)

Respond ONLY with a JSON object matching this exact schema:
{
  "estimatedCountry": "string or null",
  "estimatedRegion": "string or null (state/province/county)",
  "estimatedCity": "string or null",
  "estimatedCoordinates": { "lat": number, "lng": number, "radiusKm": number } or null,
  "confidence": "high" | "medium" | "low" | "very_low",
  "clues": [
    { "category": "string", "observation": "string", "significance": "string" }
  ],
  "shadowAnalysis": "string or null (describe shadow direction, estimated sun position, and what that implies about time and latitude)",
  "timeOfDayEstimate": "string or null",
  "seasonEstimate": "string or null",
  "searchStrategies": ["string"],
  "rawAnalysis": "string (detailed narrative analysis)"
}

Be precise. If you are very confident about the location, provide tight coordinates. If unsure, widen the radius. Include ALL visual clues you observe even minor ones. searchStrategies should be specific actionable steps (e.g., "Search for this specific road sign style on Google Street View in northern France").`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image for geolocation clues. Identify the most likely location and explain all visual evidence.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageType};base64,${data}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = {
        estimatedCountry: null,
        estimatedRegion: null,
        estimatedCity: null,
        estimatedCoordinates: null,
        confidence: "very_low",
        clues: [],
        shadowAnalysis: null,
        timeOfDayEstimate: null,
        seasonEstimate: null,
        searchStrategies: ["Try reverse image search on Google Images, Yandex, and TinEye"],
        rawAnalysis: content,
      };
    }

    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "ai_error", message: `AI analysis failed: ${message}` });
  }
});

export default router;
