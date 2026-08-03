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
