import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Search, Database, Fingerprint } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mt-12"
      >
        <div className="mb-12 text-center">
          <pre className="text-primary text-xs md:text-sm glow-text whitespace-pre-wrap">
{`
   ____  _____ _____ _   _ _____ 
  / __ \\/ ____|_   _| \\ | |_   _|
 | |  | | (___   | | |  \\| | | |  
 | |  | |\\___ \\  | | | . \` | | |  
 | |__| |____) |_| |_| |\\  | | |  
  \\____/|_____/|_____|_| \\_| |_|  
`}
          </pre>
          <p className="mt-4 text-muted-foreground border-t border-b border-border py-2 inline-block">
            SELECT MODULE TO INITIALIZE
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/metadata">
            <div className="group border border-border bg-card p-6 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all glitch-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-xs opacity-50">0x01</div>
              <Database className="w-12 h-12 mb-4 text-primary group-hover:animate-pulse" />
              <h2 className="text-xl font-bold mb-2">[METADATA EXTRACTION]</h2>
              <p className="text-sm text-muted-foreground">
                Extract hidden EXIF, GPS, and device info from media files.
              </p>
            </div>
          </Link>

          <Link href="/geolocation">
            <div className="group border border-border bg-card p-6 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all glitch-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-xs opacity-50">0x02</div>
              <Search className="w-12 h-12 mb-4 text-primary group-hover:animate-pulse" />
              <h2 className="text-xl font-bold mb-2">[GEOLOCATION INTEL]</h2>
              <p className="text-sm text-muted-foreground">
                Calculate shadows, review environmental clues, and reverse search.
              </p>
            </div>
          </Link>

          <Link href="/crypto">
            <div className="group border border-border bg-card p-6 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all glitch-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-xs opacity-50">0x03</div>
              <Fingerprint className="w-12 h-12 mb-4 text-primary group-hover:animate-pulse" />
              <h2 className="text-xl font-bold mb-2">[CRYPTO/DECODE]</h2>
              <p className="text-sm text-muted-foreground">
                Identify hashes, decode base64, hex, and perform cipher analysis.
              </p>
            </div>
          </Link>
        </div>
      </motion.div>
    </Layout>
  );
}
