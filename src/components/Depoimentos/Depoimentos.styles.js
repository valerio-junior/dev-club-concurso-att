import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(2rem, 5vh, 3rem);
  overflow: hidden;
  padding: clamp(5rem, 10vh, 7rem) 0 clamp(3rem, 6vh, 4rem);
  background: ${({ theme }) => theme.colors.background};
`;

export const Heading = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.8rem, 3.2vw, 2.6rem);
  text-align: center;
`;

export const Stage = styled.div`
  position: relative;
  width: min(94vw, 1200px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Viewport = styled.div`
  width: 100%;
  overflow: hidden;
`;

export const Track = styled.div`
  display: flex;
  transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1);
  transform: translateX(${({ $index }) => `-${$index * 100}%`});
`;

export const Slide = styled.div`
  flex: 0 0 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 0 clamp(1rem, 5vw, 3rem);
`;

export const VideoStage = styled.div`
  position: relative;
  height: min(58vh, 620px);
  aspect-ratio: 9 / 16;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);

  iframe,
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border: none;
  }

  /* Nenhum controle é exibido, mas o próprio iframe ainda alterna play/pause ao clicar por
     padrão — bloquear eventos de ponteiro nele remove isso também, então realmente não há como
     interagir com o vídeo. */
  iframe {
    pointer-events: none;
  }
`;

export const TextBlock = styled.div`
  max-width: 640px;
  text-align: center;
`;

export const Quote = styled.p`
  color: rgba(245, 245, 245, 0.85);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  margin-bottom: 0.9rem;
`;

export const Name = styled.p`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1rem, 1.4vw, 1.15rem);
`;

export const RoleLine = styled.p`
  color: ${({ theme }) => theme.colors.blueLight};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.85rem, 1.1vw, 0.95rem);
`;

export const ArrowButton = styled.button`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === "left" ? "left: clamp(-0.5rem, 1vw, 1rem);" : "right: clamp(-0.5rem, 1vw, 1rem);")}
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition: opacity 0.3s ease, background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.blue};
    border-color: ${({ theme }) => theme.colors.blue};
  }
`;
