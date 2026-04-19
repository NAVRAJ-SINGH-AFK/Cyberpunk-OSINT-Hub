import { useState, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useExtractMetadata } from "@workspace/api-client-react";
import { UploadCloud, ChevronLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Metadata() {
  const [isDragging, setIsDragging] = useState(false);
  const extractMetadata = useExtractMetadata();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result?.toString().split(',')[1];
      if (base64) {
        extractMetadata.mutate({
          data: {
            filename: file.name,
            mimeType: file.type,
            data: base64
          }
        });
      }
    };
    reader.readAsDataURL(file);
  }, [extractMetadata]);

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
          <h1 className="text-xl font-bold glow-text">MODULE://METADATA</h1>
        </div>

        <div 
          className={[
            "border-2 border-dashed p-12 text-center transition-colors",
            isDragging ? "border-primary bg-primary/10" : "border-border bg-card"
          ].join(" ")}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <UploadCloud className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2">DRAG AND DROP FILE TO INITIALIZE SCAN</p>
          <p className="text-xs text-muted-foreground">SUPPORTED FORMATS: ANY</p>
        </div>

        {extractMetadata.isPending && (
          <div className="border border-border p-4 bg-card animate-pulse">
            <span className="text-primary">{'>'} SCANNING...</span>
          </div>
        )}

        {extractMetadata.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border p-4 bg-card">
              <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">FILE DATA</h3>
              <div className="space-y-2 text-sm">
                <p>NAME: {extractMetadata.data.filename}</p>
                <p>SIZE: {(extractMetadata.data.fileSize / 1024).toFixed(2)} KB</p>
                <p>MIME: {extractMetadata.data.mimeType}</p>
                <p>GPS FOUND: {extractMetadata.data.gpsFound ? 'YES' : 'NO'}</p>
              </div>

              {extractMetadata.data.gpsFound && extractMetadata.data.lat && extractMetadata.data.lng && (
                <div className="mt-4 p-4 border border-primary/50 bg-primary/10">
                  <p className="flex items-center gap-2 mb-2 text-primary font-bold">
                    <MapPin className="w-4 h-4" /> LOCATION IDENTIFIED
                  </p>
                  <p>LAT: {extractMetadata.data.lat}</p>
                  <p>LNG: {extractMetadata.data.lng}</p>
                  <a 
                    href={"https://www.google.com/maps?q=" + extractMetadata.data.lat + "," + extractMetadata.data.lng}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-xs underline text-primary"
                  >
                    [OPEN IN MAPS]
                  </a>
                </div>
              )}
            </div>

            <div className="border border-border p-4 bg-card max-h-[500px] overflow-y-auto">
              <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">METADATA TAGS</h3>
              {extractMetadata.data.tags.length > 0 ? (
                <table className="w-full text-xs">
                  <tbody>
                    {extractMetadata.data.tags.map((tag, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-primary/5">
                        <td className="py-1 text-muted-foreground w-1/3">[{tag.group}]</td>
                        <td className="py-1 text-primary">{tag.tag}</td>
                        <td className="py-1 truncate max-w-[200px]" title={tag.value}>{tag.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>
                  <p className="text-destructive mb-4">NO METADATA TAGS FOUND.</p>
                  <h4 className="font-bold text-primary mb-2">CLUE CHECKLIST:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                    {extractMetadata.data.clues.map((clue, i) => (
                      <li key={i}>{clue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
