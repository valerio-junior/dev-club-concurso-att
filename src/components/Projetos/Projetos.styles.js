import styled from "styled-components";

export const Wrapper = styled.section`
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Clears the fixed header (~72-84px) with margin to spare on every viewport size — the
     previous value was tight enough that the title's own line-height clipped under it. */
  padding-top: clamp(7rem, 16vh, 10rem);
  background: ${({ theme }) => theme.colors.backgroundAlt};
`;

/* Same depth-emerge language used across the site (scale + blur + fade) for the title. */
export const Title = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(2rem, 4vw, 3.2rem);
  text-align: center;
  opacity: 0;
  transform: scale(0.5);
  will-change: opacity, transform, filter;
`;

/* Square stage sized so the whole ring (radius + image diameter) always fits inside it
   regardless of viewport aspect ratio — width and height are capped independently by both vh
   and vw, whichever is smaller wins, so nothing ever gets clipped by the section's own edges. */
export const RingStage = styled.div`
  position: relative;
  width: min(60vh, 76vw, 640px);
  height: min(60vh, 76vw, 640px);
  margin-top: clamp(2rem, 5vh, 3.5rem);
  flex-shrink: 0;
`;

export const ProjectItem = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(72px, 9vw, 112px);
  height: clamp(72px, 9vw, 112px);
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
  opacity: 0;
  will-change: opacity, transform;
`;

export const ProjectImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;
