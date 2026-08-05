import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(1.5rem, 4vw, 4rem);
  padding: 0 clamp(1.5rem, 6vw, 6rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    justify-content: center;
    height: auto;
    min-height: 100vh;
    padding: 6rem 1.5rem;
  }
`;

export const TextColumn = styled.div`
  position: relative;
  width: min(34%, 460px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
    order: 2;
  }
`;

/* Envolve o eyebrow + título para que subam e apareçam com fade juntos como um único bloco. */
export const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  opacity: 0;
  will-change: opacity, transform;
`;

export const Eyebrow = styled.p`
  color: ${({ theme }) => theme.colors.blueLight};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 600;
  font-size: clamp(0.9rem, 1.3vw, 1.05rem);
  line-height: 1.3;
`;

export const Title = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.5rem, 2.6vw, 2.2rem);
  line-height: 1.25;
`;

export const CardsCol = styled.div`
  position: relative;
  width: 100%;
  height: 8rem;
`;

export const Card = styled.p`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.05rem, 1.7vw, 1.4rem);
  line-height: 1.35;
  padding: 1.1rem 1.4rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.blueLight};
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(96, 165, 250, 0.16);
  opacity: 0;
  will-change: opacity, transform;
`;

/* O clipe gerado renderiza em 16:9 (o modelo reenquadra qualquer entrada nessa proporção),
   então o stage bate exatamente com isso — sem corte, mantendo a matemática do screen-overlay
   exata. */
export const NotebookStage = styled.div`
  position: relative;
  width: min(62%, 860px);
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(180deg, ${({ theme }) => theme.colors.surface}, ${({ theme }) => theme.colors.background});
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.55);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
    order: 1;
  }
`;

export const NotebookCanvas = styled.canvas`
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

/* Esmaece as bordas do canvas no fundo da página, mesma técnica do vídeo do Hero,
   para que a cena pareça parte da página em vez de uma imagem/div encaixotada. */
export const Vignette = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 40%,
    ${({ theme }) => theme.colors.background} 92%
  );
`;

/* Posicionado sobre a área de tela em branco do clipe gerado assim que a tampa está aberta
   (medido em porcentagens, para escalar junto com o vídeo em qualquer tamanho). Centralização
   horizontal e tamanho confirmados como bons a partir de um screenshot do usuário; deslocado um
   pouco para cima nessa rodada para centralização completa. Começa escondido (tampa fechada). */
export const ScreenOverlay = styled.div`
  position: absolute;
  left: 27%;
  top: 9%;
  width: 44%;
  height: 32%;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8%;
`;

export const LogoImg = styled.img`
  position: absolute;
  max-width: 60%;
  max-height: 55%;
  width: auto;
  height: auto;
  object-fit: contain;
  opacity: 0;
  will-change: opacity;
`;
