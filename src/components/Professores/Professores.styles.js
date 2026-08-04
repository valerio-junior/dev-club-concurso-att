import styled, { keyframes } from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

export const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(2rem, 5vw, 5rem);
  height: 100%;
  padding: 0 clamp(1.5rem, 6vw, 6rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    justify-content: center;
    padding: 2rem 1.5rem;
  }
`;

export const LeftCol = styled.div`
  width: min(42%, 560px);
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
  }
`;

export const RightCol = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(52%, 700px);
  /* Nudged down from dead-center so the topmost connecting lines clear the fixed header
     instead of poking up underneath it. */
  margin-top: clamp(2.5rem, 6vh, 4rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
    margin-top: 2rem;
  }
`;

export const Title = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.9rem, 2.8vw, 2.5rem);
  line-height: 1.3;
`;

export const Description = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(1rem, 1.3vw, 1.1rem);
  line-height: 1.6;
  margin-top: 1.1rem;
`;

export const Checklist = styled.ul`
  list-style: none;
  margin-top: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const ChecklistItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.15vw, 1.05rem);
  line-height: 1.5;
`;

export const CheckIcon = styled.svg`
  flex-shrink: 0;
  width: 1.3rem;
  height: 1.3rem;
  margin-top: 0.15rem;
  color: ${({ theme }) => theme.colors.blueLight};
`;

export const ClosingLine = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.1vw, 1rem);
  line-height: 1.6;
  margin-top: 1.75rem;
`;

/* The whole diagram fades/scales/sharpens into view once scrolled near — the site's usual
   depth-emerge entrance — then everything inside just runs continuously (no further scroll
   tie-in), since this is meant to read as a living network, not a scroll-scrubbed sequence. */
export const Stage = styled.div`
  position: relative;
  width: 100%;
  max-width: 620px;
  aspect-ratio: 1 / 1;
  opacity: 0;
  transform: scale(0.85);
  filter: blur(10px);
  transition: opacity 1s ease, transform 1s ease, filter 1s ease;

  &[data-visible="true"] {
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  }
`;

/* Flattened into an ellipse (not a true circle) for a subtle perspective/orbit feel, purely
   decorative — independent of the actual node positions, which sit on true circular rings. */
export const OrbitRing = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  width: ${({ $size }) => `${$size}%`};
  height: ${({ $size }) => `${$size * 0.55}%`};
  pointer-events: none;
`;

export const LinesSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const pulse = keyframes`
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 30px rgba(120, 180, 255, 0.55)) drop-shadow(0 0 60px rgba(80, 140, 255, 0.3));
  }
  50% {
    transform: translate(-50%, -50%) scale(1.06);
    filter: drop-shadow(0 0 45px rgba(140, 195, 255, 0.75)) drop-shadow(0 0 85px rgba(90, 150, 255, 0.45));
  }
`;

/* The generated brain image kept a near-black backdrop instead of true alpha transparency —
   `screen` blend mode makes near-black pixels resolve to whatever's behind them (this
   section's own near-black background), so only the glow itself actually shows, no visible
   square edge. */
export const BrainImg = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(150px, 20vw, 240px);
  transform: translate(-50%, -50%);
  mix-blend-mode: screen;
  animation: ${pulse} 4s ease-in-out infinite;
  z-index: 3;
`;

/* Small bright nucleus at the very center of the brain, like the core seen in the middle of
   the reference sphere — its scale/opacity are driven per-frame from JS as inbound energy
   arrives, so it visibly pulses brighter each time it "feels" the incoming energy. */
export const BrainCore = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 16px 6px rgba(190, 220, 255, 0.9), 0 0 34px 14px rgba(140, 190, 255, 0.5);
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: none;
`;

export const Node = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
`;

export const TeacherBadge = styled.div`
  width: clamp(52px, 6vw, 76px);
  height: clamp(52px, 6vw, 76px);
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 18px rgba(120, 180, 255, 0.25);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

export const IconBadge = styled.div`
  width: clamp(40px, 4.4vw, 56px);
  height: clamp(40px, 4.4vw, 56px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);

  img {
    width: 52%;
    height: 52%;
    object-fit: contain;
  }
`;
