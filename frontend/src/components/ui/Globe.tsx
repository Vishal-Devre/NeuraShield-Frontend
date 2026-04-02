import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.1], // Dark gray
      markerColor: [0, 0.83, 1], // Cyan
      glowColor: [0.345, 0.458, 0.839], // Blueish
      markers: [
        { location: [37.7595, -122.4367], size: 0.05 },
        { location: [40.7128, -74.006], size: 0.05 },
        { location: [51.5072, 0.1276], size: 0.05 },
        { location: [35.6762, 139.6503], size: 0.1 },
      ],
      // @ts-ignore
      onRender: (state: any) => {
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div style={{ width: 400, height: 400, margin: "auto", maxWidth: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
      />
    </div>
  );
}
