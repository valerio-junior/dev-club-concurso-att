import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
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
  gap: 1.25rem;
  width: 400px;
  flex-shrink: 0;
  padding: 2.25rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.blueLight};
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(96, 165, 250, 0.14);
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

export const CardIcon = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
`;

export const CardTitle = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.2rem, 1.8vw, 1.5rem);
`;

export const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.2vw, 1.05rem);
  line-height: 1.55;
`;
