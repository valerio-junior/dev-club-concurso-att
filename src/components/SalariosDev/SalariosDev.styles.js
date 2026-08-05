import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: #0d131a;
  padding: clamp(5rem, 12vh, 8rem) clamp(1.5rem, 6vw, 6rem);
`;

/* Mesma entrada de fade-up do Certificados — sem pin, sem scroll-scrub. */
export const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s ease, transform 0.9s ease;

  &[data-visible="true"] {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Title = styled.h2`
  max-width: min(50%, 620px);
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  line-height: 1.25;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    max-width: 100%;
  }
`;

export const CardsRow = styled.div`
  display: flex;
  gap: clamp(1.25rem, 2.5vw, 2rem);
  margin-top: clamp(2.75rem, 5.5vw, 4rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
  }
`;

export const Card = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: clamp(1.75rem, 2.4vw, 2.25rem);
  background: #171b26;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  cursor: default;
  transition: transform 0.25s ease, border-color 0.25s ease;

  &:hover {
    border-color: rgba(96, 165, 250, 0.45);
    transform: translateY(-4px);
  }
`;

export const CardValue = styled.div`
  display: flex;
  align-items: baseline;
  color: ${({ theme }) => theme.colors.blueLight};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 800;
`;

export const ValuePrefix = styled.span`
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  margin-right: 0.3rem;
`;

export const ValueNumber = styled.span`
  font-size: clamp(2.6rem, 4.4vw, 3.6rem);
  line-height: 1;
`;

export const ValueSuffix = styled.span`
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  margin-left: 0.15rem;
`;

/* Track + preenchimento animado, mesma linguagem visual da referência: uma barra fina e arredondada
   sob o número, cuja largura de preenchimento cresce em sincronia com a contagem. */
export const BarTrack = styled.div`
  position: relative;
  height: 6px;
  margin-top: 1.4rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
`;

export const BarFill = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  width: 0%;
  background: ${({ theme }) => theme.colors.blueLight};
  border-radius: 999px;
  will-change: width;
`;

export const CardRole = styled.p`
  margin-top: 1.4rem;
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.05rem, 1.4vw, 1.2rem);
`;

export const CardDescription = styled.p`
  margin-top: 0.6rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.9rem, 1.1vw, 0.98rem);
  line-height: 1.6;
`;
