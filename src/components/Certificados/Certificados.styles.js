import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  overflow: hidden;
  // background: ${({ theme }) => theme.colors.background};
  background-color: #0d131a;
  padding: clamp(5rem, 12vh, 8rem) clamp(1.5rem, 6vw, 6rem);
`;

/* Entrada simples de fade-up assim que aparece no scroll — sem pin, sem scroll-scrub, apenas uma
   seção normal como Depoimentos/Professores. */
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
  max-width: 720px;
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  line-height: 1.25;
`;

export const Description = styled.p`
  max-width: 620px;
  margin-top: 1.1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(1rem, 1.3vw, 1.1rem);
  line-height: 1.6;
`;

export const CardsRow = styled.div`
  display: flex;
  gap: clamp(1.25rem, 2.5vw, 2rem);
  margin-top: clamp(2.5rem, 5vw, 3.5rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
  }
`;

export const Card = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1.1rem;
  min-height: clamp(220px, 18vw, 300px);
  padding: clamp(1.75rem, 2.4vw, 2.25rem);
  background: #171b26;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
`;

export const DevClubLogo = styled.img`
  width: 44px;
  height: 44px;
  margin-bottom: 0.75rem;
  border-radius: 10px;
  object-fit: cover;
`;

export const TechIconsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
`;

export const TechIconBadge = styled.div`
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;

  img {
    width: 55%;
    height: 55%;
    object-fit: contain;
  }
`;

export const CardTitle = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.15rem, 1.6vw, 1.35rem);
`;

export const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.92rem, 1.1vw, 1rem);
  line-height: 1.65;
`;
