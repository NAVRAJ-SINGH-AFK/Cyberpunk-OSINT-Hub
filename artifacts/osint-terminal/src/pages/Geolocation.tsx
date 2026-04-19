import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useAnalyzeImageLocation } from "@workspace/api-client-react";
import { ChevronLeft, UploadCloud, MapPin, Eye, Clock, Leaf, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";

const CHECKLIST_ITEMS = [
  { label: "Power pole types (wood, concrete, metal)", category: "Infrastructure" },
  { label: "Street sign colors and shape conventions", category: "Infrastructure" },
  { label: "Road markings and lane styles", category: "Infrastructure" },
  { label: "Traffic light orientation (horizontal/vertical)", category: "Infrastructure" },
  { label: "Vehicle makes, license plate shapes", category: "Transport" },
  { label: "Driving side (left/right hand traffic)", category: "Transport" },
  { label: "Vegetation and plant types (tropical, temperate, arid)", category: "Nature" },
  { label: "Shadow direction and solar angle", category: "Solar" },
  { label: "Architecture style (roof shape, wall material)", category: "Architecture" },
  { label: "Language or script on signs", category: "Language" },
  { label: "Cultural clothing or uniforms visible", category: "Culture" },
  { label: "Sky color and cloud patterns", category: "Climate" },
];

const REVERSE_IMAGE_ENGINES = [
  { name: "Google Images", url: "https://images.google.com" },
  { name: "Yandex", url: "https://yandex.com/images" },
  { name: "TinEye", url: "https://tineye.com" },
  { name: "Bing Visual", url: "https://www.bing.com/visualsearch" },
];

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-green-400",
  medium: "text-yellow-400",
  low: "text-orange-400",
  very_low: "text-red-400",
};

export default function Geolocation() {
  const analyzeImage = useAnalyzeImageLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result?.toString() ?? "";
      const base64 = dataUrl.split(",")[1];
      if (base64) {
        setPreviewUrl(dataUrl);
        analyzeImage.mutate({
          data: {
            filename: file.name,
            mimeType: file.type,
            data: base64,
          },
        });
      }
    };
    reader.readAsDataURL(file);
  }, [analyzeImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleCheck = (label: string) => {
    setCheckedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const data = analyzeImage.data;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" className="font-mono text-primary border-primary hover:bg-primary hover:text-black">
              <ChevronLeft className="w-4 h-4 mr-2" />
              [{"<<"} BACK TO TERMINAL]
            </Button>
          </Link>
          <h1 className="text-xl font-bold glow-text">MODULE://GEOLOCATION</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="border border-border bg-card p-6">
              <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary flex items-center gap-2">
                <Eye className="w-4 h-4" /> AI IMAGE GEOLOCATION ANALYZER
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                DROP AN IMAGE TO SCAN FOR LOCATION CLUES — SHADOWS, ARCHITECTURE, VEGETATION, SIGNS, AND MORE
              </p>

              <label
                className={[
                  "block border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"
                ].join(" ")}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded"
                    className="max-h-48 mx-auto object-contain border border-border mb-3"
                  />
                ) : (
                  <UploadCloud className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                )}
                <p className="text-sm">
                  {previewUrl ? "CLICK OR DROP TO REPLACE IMAGE" : "DROP IMAGE OR CLICK TO SELECT"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, GIF SUPPORTED</p>
              </label>

              {analyzeImage.isPending && (
                <div className="mt-4 p-4 border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span className="text-primary text-sm">SCANNING IMAGE... AI VISION ANALYSIS IN PROGRESS</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>{'>'} Analyzing shadow angles and solar position...</p>
                    <p>{'>'} Identifying architectural signatures...</p>
                    <p>{'>'} Cross-referencing vegetation patterns...</p>
                    <p>{'>'} Processing language and signage...</p>
                  </div>
                </div>
              )}

              {analyzeImage.isError && (
                <div className="mt-4 p-4 border border-destructive/50 bg-destructive/10">
                  <p className="text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> ANALYSIS FAILED — CHECK IMAGE FORMAT
                  </p>
                </div>
              )}
            </div>

            {data && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-primary/50 bg-card p-6 space-y-4"
              >
                <h3 className="font-bold border-b border-border pb-2 text-primary">LOCATION ASSESSMENT</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CONFIDENCE:</span>
                    <span className={["font-bold", CONFIDENCE_COLOR[data.confidence] ?? "text-primary"].join(" ")}>
                      {data.confidence.toUpperCase().replace("_", " ")}
                    </span>
                  </div>
                  {data.estimatedCountry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">COUNTRY:</span>
                      <span className="text-primary font-bold">{data.estimatedCountry.toUpperCase()}</span>
                    </div>
                  )}
                  {data.estimatedRegion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">REGION:</span>
                      <span>{data.estimatedRegion}</span>
                    </div>
                  )}
                  {data.estimatedCity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CITY:</span>
                      <span>{data.estimatedCity}</span>
                    </div>
                  )}
                  {data.timeOfDayEstimate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TIME OF DAY:</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{data.timeOfDayEstimate}</span>
                    </div>
                  )}
                  {data.seasonEstimate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SEASON:</span>
                      <span className="flex items-center gap-1"><Leaf className="w-3 h-3" />{data.seasonEstimate}</span>
                    </div>
                  )}
                </div>

                {data.estimatedCoordinates && (
                  <div className="p-3 border border-primary/40 bg-primary/10">
                    <p className="text-primary font-bold mb-1 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" /> ESTIMATED COORDINATES
                    </p>
                    <p className="text-xs">
                      LAT: {data.estimatedCoordinates.lat.toFixed(4)} |
                      LNG: {data.estimatedCoordinates.lng.toFixed(4)} |
                      RADIUS: ~{data.estimatedCoordinates.radiusKm}km
                    </p>
                    <a
                      href={"https://www.google.com/maps?q=" + data.estimatedCoordinates.lat + "," + data.estimatedCoordinates.lng + "&z=10"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-xs underline text-primary hover:text-primary/70"
                    >
                      [OPEN IN GOOGLE MAPS]
                    </a>
                  </div>
                )}

                {data.shadowAnalysis && (
                  <div className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3">
                    <p className="text-primary mb-1">SHADOW ANALYSIS:</p>
                    <p>{data.shadowAnalysis}</p>
                  </div>
                )}

                {data.clues.length > 0 && (
                  <div>
                    <p className="text-primary text-sm font-bold mb-2">DETECTED CLUES:</p>
                    <div className="space-y-2">
                      {data.clues.map((clue, i) => (
                        <div key={i} className="text-xs border-b border-border/30 pb-2">
                          <span className="text-primary/70">[{clue.category.toUpperCase()}]</span>{" "}
                          <span>{clue.observation}</span>
                          <p className="text-muted-foreground mt-0.5 pl-2">→ {clue.significance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs">
                  <p className="text-primary font-bold mb-1">FULL ANALYSIS:</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{data.rawAnalysis}</p>
                </div>

                {data.searchStrategies.length > 0 && (
                  <div>
                    <p className="text-primary text-sm font-bold mb-2">SEARCH STRATEGIES:</p>
                    <ul className="space-y-1">
                      {data.searchStrategies.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary">{'>'}</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border border-border bg-card p-6">
              <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">REVERSE IMAGE SEARCH</h3>
              <p className="text-xs text-muted-foreground mb-3">CROSS-REFERENCE WITH EXTERNAL ENGINES:</p>
              <div className="flex flex-wrap gap-2">
                {REVERSE_IMAGE_ENGINES.map((engine) => (
                  <a key={engine.name} href={engine.url} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="font-mono border-primary text-primary hover:bg-primary hover:text-black text-xs">
                      [{engine.name.toUpperCase()}]
                    </Button>
                  </a>
                ))}
              </div>
            </div>

            <div className="border border-border bg-card p-6">
              <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">OBSERVATION CHECKLIST</h3>
              <p className="text-xs text-muted-foreground mb-3">MANUALLY VERIFY THESE VISUAL CLUES:</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {CHECKLIST_ITEMS.map((item) => (
                  <label
                    key={item.label}
                    className="flex items-start gap-3 text-xs cursor-pointer hover:text-primary group"
                    onClick={() => toggleCheck(item.label)}
                  >
                    <span className={["mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 transition-colors",
                      checkedItems[item.label] ? "border-primary bg-primary text-black" : "border-muted-foreground group-hover:border-primary"
                    ].join(" ")}>
                      {checkedItems[item.label] ? "X" : ""}
                    </span>
                    <span>
                      <span className="text-primary/50">[{item.category.toUpperCase()}]</span>{" "}
                      <span className={checkedItems[item.label] ? "line-through text-muted-foreground" : ""}>
                        {item.label}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
