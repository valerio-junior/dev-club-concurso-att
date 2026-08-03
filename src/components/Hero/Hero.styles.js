import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

export const Inner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const TextCol = styled.div`
  position: absolute;
  top: 50%;
  left: clamp(1.5rem, 6vw, 6rem);
  width: min(46%, 640px);
  transform: translateY(-50%);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 80%;
  }
`;

export const Heading = styled.h1`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(2.1rem, 4.6vw, 4rem);
  line-height: 1.18;
  letter-spacing: -0.01em;
`;

/* Keeps a whole word together as one atomic box, so the line only ever wraps between
   words — the per-letter spans inside can't get split across two lines. */
export const Word = styled.span`
  display: inline-block;
  white-space: nowrap;
`;

/* Each letter starts invisible/lowered; the scroll handler reveals them in a staggered
   wave (opacity + a small rise) instead of the whole line fading in as one block. */
export const Char = styled.span`
  display: inline-block;
  opacity: 0;
  transform: translateY(0.3em);
  will-change: opacity, transform;
`;

export const CharacterStage = styled.div`
  position: absolute;
  top: 50%;
  /* Resting (progress = 0) position/blur as the CSS default, so it's already correct
     before any scroll fires and before JS has measured/painted anything. A themed
     fallback fill (not a random photo) shows while the priority frame is still loading. */
  left: 50%;
  width: clamp(260px, 30vw, 440px);
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  overflow: hidden;
  transform: translate(-50%, -50%);
  filter: blur(8px);
  background: linear-gradient(180deg, ${({ theme }) => theme.colors.surface}, ${({ theme }) => theme.colors.background});
  will-change: left, filter;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.55);
`;

export const CharacterCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;

  &[data-ready="true"] {
    opacity: 1;
  }
`;

/* Fades the canvas edges into the page background, hiding any backdrop-color mismatch
   from the generated clip and doubling as a cinematic vignette. */
export const Vignette = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 30%,
    ${({ theme }) => theme.colors.background} 82%
  );
`;