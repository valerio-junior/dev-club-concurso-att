import styled from "styled-components";

export const Section = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
  /* padding-top nunca pode ficar menor que a altura real do Header (fixo, por cima de tudo) —
     senão em telas mais baixas os nomes de cima do anel acabam desenhados atrás dele. */
  padding: clamp(128px, 16vh, 180px) clamp(20px, 6vw, 96px) clamp(64px, 10vh, 120px);
`;

export const StarCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
`;

export const Content = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

export const DescriptionCol = styled.div`
  opacity: 0;
  transform: translateX(-48px);
`;

export const Heading = styled.h2`
  font-size: clamp(1.8rem, 3.4vw, 2.8rem);
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.1rem;
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(1rem, 1.3vw, 1.15rem);
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 46ch;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin: 0 auto;
  }
`;

export const EarthCol = styled.div`
  display: flex;
  justify-content: center;
`;

export const EarthWrapper = styled.div`
  position: relative;
  /* limitado por vw E vh — em telas largas mas baixas (laptops, janelas maximizadas) o tamanho
     não pode depender só da largura, senão o anel de nomes acaba estourando pra fora da tela. */
  width: clamp(220px, min(28vw, 42vh), 420px);
  aspect-ratio: 1 / 1;
`;

export const EarthGlow = styled.div`
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.35) 0%, rgba(96, 165, 250, 0.08) 55%, transparent 75%);
  filter: blur(6px);
  pointer-events: none;
`;

export const EarthImage = styled.img`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  clip-path: circle(0% at 50% 50%);
  -webkit-clip-path: circle(0% at 50% 50%);
  box-shadow: 0 0 60px rgba(96, 165, 250, 0.25);
`;

// Posicionadas via GSAP em pixels, relativas ao Content (não mais em % relativas só à Terra) — assim
// o cursor consegue viajar até elas E até o texto/Terra na saída, tudo no mesmo espaço de coordenadas.
export const NameLabel = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  opacity: 0;
  white-space: nowrap;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.78rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  background: rgba(5, 5, 5, 0.55);
  border: 1px solid rgba(96, 165, 250, 0.4);
  border-radius: 999px;
  padding: 0.3em 0.8em;
  pointer-events: none;
  z-index: 1;
`;

export const Cursor = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  filter: drop-shadow(0 0 6px rgba(96, 165, 250, 0.8));
`;

// Mesmo visual do botão "Pular" do Loader, de propósito — mesma função, mesmo lugar na tela.
export const SkipButton = styled.button`
  position: absolute;
  right: clamp(16px, 4vw, 40px);
  bottom: clamp(16px, 4vw, 40px);
  z-index: 3;
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
