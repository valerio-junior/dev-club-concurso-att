import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.intro};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 55% at 50% 24%, rgba(96, 165, 250, 0.26) 0%, rgba(96, 165, 250, 0.09) 38%, transparent 68%),
    ${({ theme }) => theme.colors.background};
  opacity: ${({ $closing }) => ($closing ? 0 : 1)};
  transition: opacity 0.35s ease;
  pointer-events: ${({ $closing }) => ($closing ? "none" : "auto")};
`;

export const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
`;

// Centraliza o cérebro por margin fixa (não transform), pra deixar o transform do próprio
// BrainImage inteiramente livre pro GSAP controlar rotação/escala/tremor sem conflito.
export const BrainWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1024px;
  height: 1024px;
  margin: -512px 0 0 -512px;
  z-index: 0;
  pointer-events: none;
  perspective: 1400px; /* pra o giro no eixo Y do cérebro (rotationY) ganhar profundidade real */
`;

export const BrainImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  mix-blend-mode: screen;
`;

export const SentenceWrapper = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  max-width: min(980px, 88vw);
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 800;
  font-size: clamp(1.3rem, 3.2vw, 2.6rem);
  line-height: 1.35;
  color: ${({ theme }) => theme.colors.text};
`;

export const PhraseCWrapper = styled(SentenceWrapper)`
  font-size: clamp(1.1rem, 2.4vw, 1.9rem);
  color: ${({ theme }) => theme.colors.text};
`;

export const Word = styled.span`
  display: inline-flex;
  white-space: nowrap;
  margin: 0 0.22em 0.3em 0;
`;

export const Char = styled.span`
  display: inline-block;
  will-change: transform, opacity;
`;

export const SkipButton = styled.button`
  position: absolute;
  right: clamp(16px, 4vw, 40px);
  bottom: clamp(16px, 4vw, 40px);
  z-index: 2;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(96, 165, 250, 0.45);
  border-radius: 999px;
  padding: 0.55em 1.1em;
  cursor: pointer;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition: opacity 0.4s ease, color 0.2s ease, border-color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.blueLight};
  }
`;
