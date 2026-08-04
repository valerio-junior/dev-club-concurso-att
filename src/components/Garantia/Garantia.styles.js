import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #0d131a;
`;

export const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(3rem, 7vw, 6rem);
  height: 100%;
  padding: clamp(1.5rem, 3vh, 2.5rem) clamp(1.5rem, 6vw, 6rem) 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    padding: clamp(6rem, 14vh, 8rem) 1.5rem 1.5rem;
    gap: 2rem;
  }
`;

/* Slides up from below the section (still hidden by Wrapper's overflow:hidden while off-screen)
   into its resting spot — translateY is driven per-frame from JS, matching how the site does
   scroll-scrubbed entrances elsewhere (Plataforma, Projetos). */
export const ShieldWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  width: clamp(200px, 22vw, 300px);
  height: clamp(220px, 24vw, 330px);
  will-change: transform, opacity;
`;

export const ShieldImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 20px 30px rgba(37, 99, 235, 0.35));
`;

export const TextCol = styled.div`
  width: min(46%, 620px);
  flex-shrink: 0;
  will-change: transform, opacity;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
    text-align: center;
  }
`;

export const Title = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.9rem, 2.9vw, 2.6rem);
  line-height: 1.3;
`;

export const TitleHighlight = styled.span`
  color: #88d0e2;
`;

export const Description = styled.p`
  margin-top: 1.25rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(1rem, 1.2vw, 1.15rem);
  line-height: 1.7;
`;
