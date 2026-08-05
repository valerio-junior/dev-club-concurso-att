import styled from "styled-components";

export const Wrapper = styled.section`
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Fica livre do header fixo (~72-84px) com folga em qualquer tamanho de viewport — o valor
     anterior era justo o bastante para o próprio line-height do título ficar cortado por baixo dele. */
  padding-top: clamp(7rem, 16vh, 10rem);
  background: ${({ theme }) => theme.colors.backgroundAlt};
`;

/* Mesma linguagem de surgimento em profundidade usada em todo o site (escala + desfoque + fade) para o título. */
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

/* Stage quadrado dimensionado para que o anel inteiro (raio + diâmetro da imagem) sempre caiba
   dentro dele independente da proporção do viewport — largura e altura são limitadas de forma
   independente por vh e vw, o menor dos dois vence, para que nada seja cortado pelas próprias
   bordas da seção. */
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
