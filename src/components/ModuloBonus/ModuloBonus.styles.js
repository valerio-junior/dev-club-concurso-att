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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(1.5rem, 6vw, 6rem);
`;

/* Título + descrição ficam centralizados de forma absoluta, independente da fileira abaixo, para que
   possam ocupar exatamente o mesmo lugar onde os cards depois vão se acomodar, sem empurrar nada. */
export const TitleGroup = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  opacity: 0;
  will-change: opacity, transform, filter;
`;

export const Title = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(2rem, 4vw, 3.2rem);
`;

export const Subtitle = styled.p`
  margin-top: 0.9rem;
  color: ${({ theme }) => theme.colors.blueLight};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 600;
  font-size: clamp(1.05rem, 1.8vw, 1.35rem);
`;

export const CardsRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  width: 100%;
  opacity: 0;
`;

export const Card = styled.div`
  position: relative;
  width: clamp(230px, 24vw, 330px);
  flex-shrink: 0;
  will-change: transform, opacity;
`;

export const CardImageStage = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.55);
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: default;
  transition: transform 0.25s ease, border-color 0.25s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blueLight};
    transform: translateY(-8px);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

export const CardCaption = styled.div`
  margin-top: 1.1rem;
  opacity: 0;
  transform: translateY(16px);
  will-change: opacity, transform;
`;

export const CardTitle = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.05rem, 1.5vw, 1.2rem);
`;

export const CardDescription = styled.p`
  margin-top: 0.4rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.85rem, 1.1vw, 0.95rem);
  line-height: 1.5;
`;
