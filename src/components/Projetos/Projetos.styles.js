import styled from "styled-components";

/* Placeholder section — real content (project showcase) comes later. Sits mounted underneath
   PlataformaProjetos' closing window, so it needs to already fill its layer even before it's
   visually revealed. */
export const Wrapper = styled.section`
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgroundAlt};
`;

export const Title = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(2rem, 4vw, 3.2rem);
  text-align: center;
`;
