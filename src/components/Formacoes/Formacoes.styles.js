import styled from "styled-components";

/* Absolutely positioned (not its own pinned flow element) — it's stacked, together with
   ConteudosIA, inside a shared pinned Stage (see FormacoesConteudosIA) so the two can overlap
   on screen: this section's tail (the last card exiting) plays concurrently with ConteudosIA's
   opening reveal, instead of finishing completely before the next section starts. */
export const Wrapper = styled.section`
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

/* The conveyor belt itself — title and card slot ride together, continuously translated left
   in lockstep with scroll from progress 0 all the way to fully off-screen. Nothing here
   fades or slides in on its own; the belt is the only thing moving them. */
export const BeltLayer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: clamp(3rem, 7vw, 7.5rem);
  padding: 0 clamp(1.5rem, 6vw, 6rem);
  will-change: transform;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 0 1.5rem;
  }
`;

export const TextCol = styled.div`
  width: min(48%, 620px);
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 70vw;
  }
`;

export const Heading = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.8rem, 3.4vw, 2.8rem);
  line-height: 1.3;
  /* Balances line lengths across wraps (never splits a word) instead of a manual <br /> that
     can leave an orphaned word on its own line at narrower widths. */
  text-wrap: balance;
`;

/* The row all the cards ride in — laid out side by side (not stacked), naturally
   overflowing past the viewport to the right. The belt's translateX is what reveals each
   one in turn; this row itself never moves independently. */
export const CardsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 400px;
  flex-shrink: 0;
  padding: 2.25rem;
  background: #0d0f14;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  opacity: 0;
  will-change: opacity, transform;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 78vw;
  }
`;

export const IconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

/* A quiet badge behind each logo instead of a bare, flat SVG floating on the card —
   reads as considered/designed rather than a raw icon dump. */
export const IconBadge = styled.div`
  width: 3.25rem;
  height: 3.25rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 50%;
`;

export const CardIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
`;

export const CardTitle = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.2rem, 1.8vw, 1.5rem);
  line-height: 1.3;
`;

export const CardDescription = styled.p`
  color: rgba(245, 245, 245, 0.62);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.2vw, 1.05rem);
  line-height: 1.6;
  /* Balances line lengths across wraps (never splits a word — a whole word that doesn't fit
     just moves entirely to the next line) instead of leaving an orphaned single word alone
     on the last line. */
  text-wrap: balance;
`;
