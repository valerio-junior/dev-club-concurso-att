import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
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
  font-size: clamp(1.8rem, 3.2vw, 2.6rem);
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
