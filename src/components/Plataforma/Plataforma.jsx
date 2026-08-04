import { useCallback, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { Wrapper, Inner, LeftCol, Description, RightCol, PlatformStage, PlatformImage } from "./Plataforma.styles";

const PLATFORM_SRC = "/assets/plataforma/plataforma-ensino.png";

// Text emerges first, then — once fully in — the platform image emerges the same way.
const TEXT_WINDOW = [0, 0.4];
const IMAGE_WINDOW = [0.4, 0.85];

// Depth-emerge tuning: a big scale swing (starts at half size) plus a blur-to-sharp sweep —
// like the element is coming from far away and racking into focus, not just popping in.
const SCALE_START = 0.5;
const BLUR_START_PX = 14;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function Plataforma() {
  const containerRef = useRef(null);
  const descRef = useRef(null);
  const stageRef = useRef(null);

  const render = useCallback((progress) => {
    if (descRef.current) {
      const [start, end] = TEXT_WINDOW;
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      descRef.current.style.opacity = t.toFixed(3);
      descRef.current.style.transform = `scale(${(SCALE_START + (1 - SCALE_START) * t).toFixed(3)})`;
      descRef.current.style.filter = `blur(${(BLUR_START_PX * (1 - t)).toFixed(2)}px)`;
    }

    if (stageRef.current) {
      const [start, end] = IMAGE_WINDOW;
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      stageRef.current.style.opacity = t.toFixed(3);
      stageRef.current.style.transform = `scale(${(SCALE_START + (1 - SCALE_START) * t).toFixed(3)})`;
      stageRef.current.style.filter = `blur(${(BLUR_START_PX * (1 - t)).toFixed(2)}px)`;
    }
  }, []);

  useStickyScrub(containerRef, { distance: 0.7, onUpdate: render });

  return (
    <Wrapper ref={containerRef}>
      <Inner>
        <LeftCol>
          <Description ref={descRef}>Plataforma de trilha do básico ao avançado</Description>
        </LeftCol>
        <RightCol>
          <PlatformStage ref={stageRef}>
            <PlatformImage src={PLATFORM_SRC} alt="Plataforma de ensino DevClub" />
          </PlatformStage>
        </RightCol>
      </Inner>
    </Wrapper>
  );
}
