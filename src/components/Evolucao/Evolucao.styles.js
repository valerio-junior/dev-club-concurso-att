import styled, { keyframes } from "styled-components";

/* Not pinned — scrolls normally. Children of the path-synced group (Node, Card) are
   absolutely positioned using the *same* percentage coordinate space as the SVG's viewBox, so
   the line is guaranteed to pass exactly through each node's center (see Evolucao.jsx). */
export const Track = styled.section`
  position: relative;
  width: 100%;
  min-height: 190vh;
  background: ${({ theme }) => theme.colors.background};
  padding: 4rem clamp(1.5rem, 6vw, 6rem) 0;
  overflow: hidden;
`;

export const LineSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`;

/* A separate, wider, blurred stroke drawn directly behind the crisp line (same path, same
   dash-draw progress) — a static "shield" glow around it, not the line itself pulsing. */
export const LineHalo = styled.path`
  fill: none;
  stroke: #3b82f6;
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.55;
  filter: blur(2.5px);
`;

export const LinePath = styled.path`
  fill: none;
  stroke: #60a5fa;
  stroke-width: 0.35;
  stroke-linecap: round;
`;

/* The dot itself stays a fixed size/color — only its surrounding halo ring pulses. */
export const LineTip = styled.circle`
  fill: #2563eb;
`;

const haloPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 0.95; }
`;

export const LineTipHalo = styled.circle`
  fill: none;
  stroke: #60a5fa;
  stroke-width: 0.6;
  filter: blur(1.2px);
  transform-origin: center;
  transform-box: fill-box;
  animation: ${haloPulse} 1.6s ease-in-out infinite;
`;

export const Node = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(56px, 5.2vw, 76px);
  height: clamp(56px, 5.2vw, 76px);
  border-radius: 50%;
  z-index: 2;
`;

export const NodeFace = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s linear;

  svg {
    width: 42%;
    height: 42%;
    stroke: #ffffff;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    position: relative;
    z-index: 1;
  }
`;

export const NodeFaceGray = styled(NodeFace)`
  background: radial-gradient(circle at 35% 30%, #4b5563, #2a2f38 70%);
  border: 3px solid rgba(255, 255, 255, 0.08);
`;

const nodePulse = keyframes`
  0%, 100% { box-shadow: 0 0 24px rgba(76, 141, 246, 0.55), 0 0 0 6px rgba(76, 141, 246, 0.08); }
  50% { box-shadow: 0 0 40px rgba(76, 141, 246, 0.85), 0 0 0 10px rgba(76, 141, 246, 0.16); }
`;

export const NodeFaceBlue = styled(NodeFace)`
  background: radial-gradient(circle at 35% 30%, #4c8df6, #1d4ed8 70%);
  border: 3px solid rgba(96, 165, 250, 0.35);
  opacity: 0;
  animation: ${nodePulse} 1.6s ease-in-out infinite;
`;

export const CardWrap = styled.div`
  position: absolute;
  top: 0;
  transform: translateY(-50%);
  width: min(34%, 420px);
  opacity: 0;
  will-change: opacity, transform;
  ${({ $side }) => ($side === "left" ? "left: calc(30% + 6vw);" : "right: calc(30% + 6vw);")}

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: min(60vw, 320px);
    ${({ $side }) => ($side === "left" ? "left: 30%;" : "right: 4%;")}
  }
`;

export const Card = styled.div`
  background: #0d0f14;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.4);
`;

export const CardTitle = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.1rem, 1.6vw, 1.35rem);
  margin-bottom: 0.5rem;
`;

export const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.9rem, 1.1vw, 1rem);
  line-height: 1.55;
`;

/* The one part of this section that pins — fixes in place once reached, and only releases
   once the WhatsApp message has finished being typed and sent. */
export const LaptopWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

export const LaptopStage = styled.div`
  position: relative;
  width: min(70vw, 1000px);
`;

export const LaptopImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

/* Positioned over the laptop image's screen area — measured against the generated
   evolucao-laptop.png (frontal shot), may still need a small calibration pass once seen live. */
export const WhatsAppScreen = styled.div`
  position: absolute;
  top: 26.5%;
  left: 34.7%;
  width: 30.6%;
  height: 36%;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #0b141a;
`;

export const WhatsAppHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  background: #202c33;
`;

export const ContactAvatar = styled.div`
  width: clamp(18px, 2vw, 26px);
  height: clamp(18px, 2vw, 26px);
  border-radius: 50%;
  background: #6b7c85;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: clamp(0.6rem, 1vw, 0.8rem);
  flex-shrink: 0;
`;

export const ContactName = styled.span`
  color: #e9edef;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: clamp(0.65rem, 1.1vw, 0.95rem);
`;

export const ChatArea = styled.div`
  flex: 1;
  position: relative;
  padding: clamp(0.5rem, 1.5vw, 1rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 14px 14px;
`;

export const Bubble = styled.div`
  align-self: flex-end;
  max-width: 82%;
  background: #005c4b;
  border-radius: 8px 8px 2px 8px;
  padding: clamp(0.4rem, 1.2vw, 0.65rem) clamp(0.55rem, 1.5vw, 0.85rem);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const BubbleText = styled.span`
  color: #e9edef;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.6rem, 1.2vw, 0.9rem);
  line-height: 1.4;
  white-space: pre-wrap;
`;

export const BubbleMeta = styled.span`
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(233, 237, 239, 0.6);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.5rem, 0.9vw, 0.7rem);

  svg {
    width: clamp(10px, 1.4vw, 14px);
    height: auto;
    opacity: 0;
  }
`;
