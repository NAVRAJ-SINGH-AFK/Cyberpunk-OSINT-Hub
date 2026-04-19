import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useSolarCalc } from "@workspace/api-client-react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Geolocation() {
  const solarCalc = useSolarCalc();
  const [shadowLength, setShadowLength] = useState("");
  const [objectHeight, setObjectHeight] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState("");

  const handleSolarCalc = (e: React.FormEvent) => {
    e.preventDefault();
    solarCalc.mutate({
      data: {
        shadowLength: Number(shadowLength),
        objectHeight: Number(objectHeight),
        date,
        time,
        timezone: timezone || undefined
      }
    });
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" className="font-mono text-primary border-primary hover:bg-primary hover:text-black">
              <ChevronLeft className="w-4 h-4 mr-2" />
              [{"<<"} BACK TO TERMINAL]
            </Button>
          </Link>
          <h1 className="text-xl font-bold glow-text">MODULE://GEOLOCATION</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border bg-card p-6">
            <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">SOLAR SHADOW CALC</h3>
            <form onSubmit={handleSolarCalc} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">SHADOW LENGTH (M)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    required
                    value={shadowLength}
                    onChange={(e) => setShadowLength(e.target.value)}
                    className="font-mono bg-background border-border text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">OBJECT HEIGHT (M)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    required
                    value={objectHeight}
                    onChange={(e) => setObjectHeight(e.target.value)}
                    className="font-mono bg-background border-border text-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">DATE</label>
                  <Input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="font-mono bg-background border-border text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">TIME</label>
                  <Input 
                    type="time" 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="font-mono bg-background border-border text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">TIMEZONE</label>
                  <Input 
                    type="text" 
                    placeholder="UTC+2"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="font-mono bg-background border-border text-primary"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full font-mono bg-primary text-black hover:bg-primary/80" disabled={solarCalc.isPending}>
                {solarCalc.isPending ? "CALCULATING..." : "[EXECUTE CALCULATION]"}
              </Button>
            </form>

            {solarCalc.data && (
              <div className="mt-6 p-4 border border-primary/50 bg-primary/10 text-sm">
                <p className="text-primary font-bold mb-2">{'>>'} OUTPUT</p>
                <p>ELEVATION ANGLE: {solarCalc.data.solarElevationAngle.toFixed(2)}°</p>
                <p>LAT RANGE: {solarCalc.data.estimatedLatitudeRange.min.toFixed(2)}° TO {solarCalc.data.estimatedLatitudeRange.max.toFixed(2)}°</p>
                <p className="mt-2 text-muted-foreground">{solarCalc.data.explanation}</p>
                <p className="mt-2 text-xs">CONFIDENCE: {solarCalc.data.confidence.toUpperCase()}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border border-border bg-card p-6">
              <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">SEARCH STRATEGIES</h3>
              <div className="flex flex-wrap gap-2">
                {['Google Images', 'Yandex', 'TinEye', 'Bing'].map(engine => (
                  <Button key={engine} variant="outline" className="font-mono border-primary text-primary hover:bg-primary hover:text-black">
                    [{engine.toUpperCase()}]
                  </Button>
                ))}
              </div>
            </div>

            <div className="border border-border bg-card p-6">
              <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">OBSERVATION CHECKLIST</h3>
              <div className="space-y-2">
                {['Power poles', 'Street signs', 'Vegetation', 'Architecture', 'Weather patterns', 'Language/script'].map(item => (
                  <label key={item} className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary">
                    <input type="checkbox" className="accent-primary bg-background border-border w-4 h-4 rounded-none" />
                    <span>{item.toUpperCase()}</span>
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
