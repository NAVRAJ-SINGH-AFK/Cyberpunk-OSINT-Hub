import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useCryptoDecode, useIdentifyHash } from "@workspace/api-client-react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function Crypto() {
  const cryptoDecode = useCryptoDecode();
  const identifyHash = useIdentifyHash();
  const [input, setInput] = useState("");
  const [hashInput, setHashInput] = useState("");
  
  const methods = ["base64", "rot13", "hex", "morse", "binary", "url", "reverse"] as const;

  const handleDecode = (method?: typeof methods[number]) => {
    if (!input) return;
    cryptoDecode.mutate({
      data: {
        input,
        methods: method ? [method] : undefined
      }
    });
  };

  const handleIdentifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput) return;
    identifyHash.mutate({
      data: { input: hashInput }
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
          <h1 className="text-xl font-bold glow-text">MODULE://CRYPTO</h1>
        </div>

        <div className="border border-border bg-card p-6">
          <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">DECODE PAYLOAD</h3>
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ENTER ENCODED STRING HERE..."
            className="min-h-[150px] font-mono bg-background border-border text-primary resize-none mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              onClick={() => handleDecode()} 
              className="font-mono bg-primary text-black hover:bg-primary/80"
              disabled={cryptoDecode.isPending}
            >
              [AUTO-DECODE]
            </Button>
            {methods.map(m => (
              <Button 
                key={m}
                onClick={() => handleDecode(m)}
                variant="outline" 
                className="font-mono border-primary text-primary hover:bg-primary hover:text-black"
                disabled={cryptoDecode.isPending}
              >
                [{m.toUpperCase()}]
              </Button>
            ))}
          </div>

          {cryptoDecode.data && (
            <div className="p-4 border border-border bg-background space-y-4">
              <p className="text-primary font-bold">{'>>'} DECODE RESULTS:</p>
              {cryptoDecode.data.results.map((res, i) => (
                <div key={i} className="pl-4 border-l-2 border-primary/50">
                  <span className="text-muted-foreground">METHOD:</span> {res.method.toUpperCase()} | 
                  <span className="text-muted-foreground ml-4">CONFIDENCE:</span> {res.confidence.toUpperCase()}
                  <pre className="mt-2 text-sm whitespace-pre-wrap text-primary break-all">{res.output}</pre>
                </div>
              ))}
              {cryptoDecode.data.suggestions.length > 0 && (
                <div className="mt-4 text-xs text-muted-foreground">
                  SUGGESTIONS: {cryptoDecode.data.suggestions.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border border-border bg-card p-6">
          <h3 className="font-bold mb-4 border-b border-border pb-2 text-primary">HASH IDENTIFICATION</h3>
          <form onSubmit={handleIdentifyHash} className="flex gap-4">
            <input 
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="ENTER HASH..."
              className="flex-1 bg-background border border-border px-3 py-2 text-primary font-mono outline-none focus:border-primary"
            />
            <Button type="submit" className="font-mono bg-primary text-black hover:bg-primary/80" disabled={identifyHash.isPending}>
              {identifyHash.isPending ? "ANALYZING..." : "[IDENTIFY]"}
            </Button>
          </form>

          {identifyHash.data && (
            <div className="mt-4 p-4 border border-border bg-background">
              <p className="text-primary font-bold mb-2">{'>>'} HASH ANALYSIS</p>
              <p className="text-sm">LENGTH: {identifyHash.data.length}</p>
              <p className="text-sm mb-4">LIKELY HASH: {identifyHash.data.isLikelyHash ? 'YES' : 'NO'}</p>
              
              {identifyHash.data.possibleTypes.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border/50">
                      <th className="pb-2">ALGORITHM</th>
                      <th className="pb-2">PROBABILITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {identifyHash.data.possibleTypes.map((type, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-primary/5">
                        <td className="py-2 text-primary">{type.name}</td>
                        <td className="py-2">{type.probability}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-destructive text-sm">NO KNOWN HASH SIGNATURE DETECTED.</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
