import styled from "styled-components";

export const Wrapper = styled.section`
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

export const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(2rem, 5vw, 5rem);
  height: 100%;
  padding: clamp(7rem, 16vh, 10rem) clamp(1.5rem, 6vw, 6rem) 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    justify-content: center;
    padding: clamp(7rem, 16vh, 10rem) 1.5rem 1.5rem;
  }
`;

export const LeftCol = styled.div`
  width: min(38%, 480px);
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
  }
`;

/* "Emerges from depth" — starts smaller and transparent, grows to full size/opacity — the
   mirror of how the previous section's notebook shrinks-and-fades away at its end, reused here
   as an entrance instead of an exit. */
export const Description = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.5rem, 2.6vw, 2.15rem);
  line-height: 1.3;
  opacity: 0;
  transform: scale(0.5);
  transform-origin: left center;
  will-change: opacity, transform, filter;
`;

export const RightCol = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(56%, 760px);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
    margin-top: 2rem;
  }
`;

/* Same depth-emerge treatment as Description, staggered to start once the text is fully in. */
export const PlatformStage = styled.div`
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.5);
  transform-origin: center;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
  will-change: opacity, transform, filter;
`;

export const PlatformImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

/* Fixed-height slot list — children (CardItem) are absolutely positioned and moved via JS
   (translateY in px, matching CARD_SLOT in Plataforma.jsx), so the container needs an explicit
   height instead of relying on normal document flow. */
export const CardsStack = styled.div`
  position: relative;
  margin-top: clamp(1.5rem, 3vw, 2.25rem);
  height: clamp(280px, 44vh, 422px);
`;

export const CardItem = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: clamp(64px, 9vh, 92px);
  display: flex;
  align-items: center;
  padding: clamp(0.75rem, 1.6vh, 1.1rem) 1.4rem;
  background: #0d0f14;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme }) => theme.colors.blueLight};
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  opacity: 0;
  will-change: opacity, transform;
`;

export const CardText = styled.p`
  position: relative;
  z-index: 1;
  max-width: 82%;
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(0.95rem, 1.3vw, 1.1rem);
  line-height: 1.4;
`;

export const CardNumber = styled.span`
  position: absolute;
  right: 0.6rem;
  bottom: -0.4rem;
  color: rgba(255, 255, 255, 0.06);
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 800;
  font-size: 3.6rem;
  line-height: 1;
  pointer-events: none;
`;
