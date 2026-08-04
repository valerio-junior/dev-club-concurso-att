import styled from "styled-components";

export const Stage = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

export const Layer = styled.div`
  position: absolute;
  inset: 0;
`;

/* The "window" that closes in on itself as the user scrolls past Plataforma — clip-path is
   driven per-frame from JS (not a CSS transition), closing symmetrically from all four edges
   toward the center until it collapses to a single point, revealing Projetos (already mounted
   underneath, in the plain Layer) through the shrinking gap. */
export const ClosingFrame = styled(Layer)`
  will-change: clip-path;
`;
