import styled, { keyframes } from "styled-components";

/* Posicionado de forma absoluta, empilhado por baixo do Formacoes dentro do Stage fixado
   compartilhado (ver FormacoesConteudosIA) — essa seção já está presente e animando enquanto o
   último card do Formações ainda está terminando de sair por cima dela, em vez de só começar
   quando o Formações estiver completamente terminado. */
export const Wrapper = styled.section`
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #0d141a;
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

/* Mantém a primeira Description no fluxo normal (para que o margin-top do IconRow ainda seja
   medido a partir dela) enquanto o DescriptionOverlay fica posicionado de forma absoluta por cima
   dela, no mesmo tamanho/posição, para o crossfade entre as duas descrições. */
export const DescriptionStack = styled.div`
  position: relative;
`;

export const Description = styled.p`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 600;
  font-size: clamp(1.5rem, 2.6vw, 2.2rem);
  line-height: 1.35;
  /* Equilibra o comprimento das linhas nas quebras (nunca separa uma palavra — uma palavra inteira
     que não cabe simplesmente vai toda para a próxima linha) em vez de deixar uma última linha bem
     mais curta. */
  text-wrap: balance;
  opacity: 0;
  will-change: opacity, transform;
`;

export const DescriptionOverlay = styled(Description)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;

export const IconRow = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(0.9rem, 1.6vw, 1.25rem);
  margin-top: clamp(1.75rem, 3vw, 2.5rem);
`;

const shineSweep = keyframes`
  0% { transform: translateX(-120%); }
  10% { transform: translateX(120%); }
  100% { transform: translateX(120%); }
`;

/* A maioria dos ícones fica sobre o badge neutro compartilhado; alguns (fiéis à marca, como
   Gemini/Claude/Meta AI) passam seu próprio gradiente $background, batendo com a aparência real do
   ícone do app — esses também descartam a borda neutra, que ficaria estranha em cima de uma cor. */
export const IconWrap = styled.div`
  position: relative;
  width: clamp(52px, 4.4vw, 68px);
  height: clamp(52px, 4.4vw, 68px);
  border-radius: 16px;
  background: ${({ $background }) => $background || "rgba(255, 255, 255, 0.04)"};
  border: 1px solid ${({ $background, theme }) => ($background ? "transparent" : theme.colors.border)};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  opacity: 0;
  will-change: opacity, transform;
`;

export const IconImg = styled.img`
  width: 56%;
  height: 56%;
  object-fit: contain;
  position: relative;
  z-index: 2;
`;

export const Shine = styled.span`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(75deg, transparent 40%, rgba(255, 255, 255, 0.55) 50%, transparent 60%);
  transform: translateX(-120%);
  animation: ${shineSweep} ${({ $cycle }) => $cycle}s linear infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

export const RightCol = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-top: 2rem;
  }
`;

export const VideoStage = styled.div`
  position: relative;
  width: clamp(300px, 30vw, 440px);
  aspect-ratio: 4 / 5;
  border-radius: 20px;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.94);
  will-change: opacity, transform;
`;

export const VideoCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

export const Vignette = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, #0d131a 100%);
`;
