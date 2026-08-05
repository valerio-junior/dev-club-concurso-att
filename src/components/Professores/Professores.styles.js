import styled, { keyframes } from "styled-components";

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
  width: min(42%, 560px);
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
  }
`;

export const RightCol = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(52%, 700px);
  /* Deslocado para baixo do centro exato para que as linhas de conexão mais altas fiquem livres do
     header fixo em vez de aparecerem por baixo dele. */
  margin-top: clamp(2.5rem, 6vh, 4rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
    margin-top: 2rem;
  }
`;

export const Title = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.9rem, 2.8vw, 2.5rem);
  line-height: 1.3;
`;

export const Description = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(1rem, 1.3vw, 1.1rem);
  line-height: 1.6;
  margin-top: 1.1rem;
`;

export const Checklist = styled.ul`
  list-style: none;
  margin-top: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const ChecklistItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.15vw, 1.05rem);
  line-height: 1.5;
`;

export const CheckIcon = styled.svg`
  flex-shrink: 0;
  width: 1.3rem;
  height: 1.3rem;
  margin-top: 0.15rem;
  color: ${({ theme }) => theme.colors.blueLight};
`;

export const ClosingLine = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.1vw, 1rem);
  line-height: 1.6;
  margin-top: 1.75rem;
`;

/* O diagrama inteiro aparece com fade/escala/nitidez assim que o scroll se aproxima — a entrada de
   surgimento em profundidade padrão do site — depois tudo dentro dele simplesmente roda continuamente
   (sem mais nenhuma ligação com o scroll), já que isso deve passar a sensação de uma rede viva, não uma
   sequência controlada pelo scroll. */
export const Stage = styled.div`
  position: relative;
  width: 100%;
  max-width: 620px;
  aspect-ratio: 1 / 1;
  opacity: 0;
  transform: scale(0.85);
  filter: blur(10px);
  transition: opacity 1s ease, transform 1s ease, filter 1s ease;

  &[data-visible="true"] {
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  }
`;

const spinLeft = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(-360deg); }
`;

/* Círculo verdadeiro (não achatado), traço sólido — puramente decorativo, independente das posições
   reais dos nós (que ficam em seus próprios anéis circulares verdadeiros). Gira lentamente no sentido
   anti-horário ("esquerda"), mesma direção em que os próprios ícones orbitam. */
export const OrbitRing = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  width: ${({ $size }) => `${$size}%`};
  height: ${({ $size }) => `${$size}%`};
  pointer-events: none;
  animation: ${spinLeft} 70s linear infinite;
`;

export const LinesSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const dotPulse = keyframes`
  0%, 100% { transform: scale(0.8); filter: drop-shadow(0 0 3px currentColor); }
  50% { transform: scale(1.5); filter: drop-shadow(0 0 9px currentColor); }
`;

/* A posição (cx/cy) é controlada frame a frame via JS — isso só cuida do brilho/tamanho pulsante
   por cima disso, escalonado por ponto via $delay para que não pulsem todos em uníssono. */
export const EnergyDot = styled.circle`
  transform-box: fill-box;
  transform-origin: center;
  animation: ${dotPulse} 1s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

const pulse = keyframes`
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 30px rgba(120, 180, 255, 0.55)) drop-shadow(0 0 60px rgba(80, 140, 255, 0.3));
  }
  50% {
    transform: translate(-50%, -50%) scale(1.06);
    filter: drop-shadow(0 0 45px rgba(140, 195, 255, 0.75)) drop-shadow(0 0 85px rgba(90, 150, 255, 0.45));
  }
`;

/* A imagem gerada do cérebro manteve um fundo quase preto em vez de transparência alfa real —
   o blend mode `screen` faz com que pixels quase pretos se resolvam para o que estiver atrás deles
   (o próprio fundo quase preto dessa seção), então só o brilho em si realmente aparece, sem borda
   quadrada visível. */
export const BrainImg = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(150px, 20vw, 240px);
  transform: translate(-50%, -50%);
  mix-blend-mode: screen;
  animation: ${pulse} 4s ease-in-out infinite;
  z-index: 3;
`;

/* Pequeno núcleo brilhante bem no centro do cérebro, como o núcleo visto no meio da esfera de
   referência — sua escala/opacidade são controladas frame a frame via JS conforme a energia vai
   chegando, então ele visivelmente pulsa mais brilhante cada vez que "sente" a energia chegando. */
export const BrainCore = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 16px 6px rgba(190, 220, 255, 0.9), 0 0 34px 14px rgba(140, 190, 255, 0.5);
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: none;
`;

export const Node = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
`;

export const TeacherBadge = styled.div`
  width: clamp(52px, 6vw, 76px);
  height: clamp(52px, 6vw, 76px);
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 18px rgba(120, 180, 255, 0.25);
  cursor: default;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

export const IconBadge = styled.div`
  width: clamp(40px, 4.4vw, 56px);
  height: clamp(40px, 4.4vw, 56px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
  cursor: default;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  img {
    width: 52%;
    height: 52%;
    object-fit: contain;
  }
`;
