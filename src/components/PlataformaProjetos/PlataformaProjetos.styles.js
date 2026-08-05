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

/* A "janela" que se fecha sobre si mesma conforme o usuário rola pelo Plataforma — o clip-path é
   controlado frame a frame via JS (não uma transição CSS), fechando simetricamente das quatro
   bordas em direção ao centro até colapsar em um único ponto, revelando o Projetos (já montado por
   baixo, na Layer simples) através da fresta que vai encolhendo. */
export const ClosingFrame = styled(Layer)`
  will-change: clip-path;
`;
