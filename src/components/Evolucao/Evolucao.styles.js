import styled, { keyframes } from "styled-components";

/* Não fixado — rola normalmente. Os filhos do grupo sincronizado com o path (Node, Card) são
   posicionados de forma absoluta usando o *mesmo* espaço de coordenadas em porcentagem do viewBox
   do SVG, então a linha tem garantia de passar exatamente pelo centro de cada nó (ver Evolucao.jsx). */
export const Track = styled.section`
  position: relative;
  width: 100%;
  min-height: 143vh;
  background: ${({ theme }) => theme.colors.background};
  padding: 4rem clamp(1.5rem, 6vw, 6rem) 0;
  overflow: hidden;
`;

export const LineSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`;

/* Um traço separado, mais largo e desfocado, desenhado diretamente atrás da linha nítida (mesmo
   path, mesmo progresso de desenho do traço) — um brilho estático de "escudo" ao redor dela, não a
   própria linha pulsando. */
export const LineHalo = styled.path`
  fill: none;
  stroke: #3b82f6;
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.55;
  filter: blur(2.5px);
`;

export const LinePath = styled.path`
  fill: none;
  stroke: #60a5fa;
  stroke-width: 0.35;
  stroke-linecap: round;
`;

/* O ponto em si mantém tamanho/cor fixos — só o anel de halo ao redor dele pulsa. */
export const LineTip = styled.circle`
  fill: #2563eb;
`;

const haloPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 0.95; }
`;

export const LineTipHalo = styled.circle`
  fill: none;
  stroke: #60a5fa;
  stroke-width: 0.6;
  filter: blur(1.2px);
  transform-origin: center;
  transform-box: fill-box;
  animation: ${haloPulse} 1.6s ease-in-out infinite;
`;

export const Node = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(56px, 5.2vw, 76px);
  height: clamp(56px, 5.2vw, 76px);
  border-radius: 50%;
  z-index: 2;
`;

export const NodeFace = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s linear;

  svg {
    width: 42%;
    height: 42%;
    stroke: #ffffff;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    position: relative;
    z-index: 1;
  }
`;

export const NodeFaceGray = styled(NodeFace)`
  background: radial-gradient(circle at 35% 30%, #4b5563, #2a2f38 70%);
  border: 3px solid rgba(255, 255, 255, 0.08);
`;

const nodePulse = keyframes`
  0%, 100% { box-shadow: 0 0 24px rgba(76, 141, 246, 0.55), 0 0 0 6px rgba(76, 141, 246, 0.08); }
  50% { box-shadow: 0 0 40px rgba(76, 141, 246, 0.85), 0 0 0 10px rgba(76, 141, 246, 0.16); }
`;

export const NodeFaceBlue = styled(NodeFace)`
  background: radial-gradient(circle at 35% 30%, #4c8df6, #1d4ed8 70%);
  border: 3px solid rgba(96, 165, 250, 0.35);
  opacity: 0;
  animation: ${nodePulse} 1.6s ease-in-out infinite;
`;

export const CardWrap = styled.div`
  position: absolute;
  top: 0;
  transform: translateY(-50%);
  width: min(24%, 280px);
  opacity: 0;
  will-change: opacity, transform;
  ${({ $side }) => ($side === "left" ? "left: calc(30% + 6vw);" : "right: calc(30% + 6vw);")}

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: min(48vw, 240px);
    ${({ $side }) => ($side === "left" ? "left: 30%;" : "right: 4%;")}
  }
`;

export const Card = styled.div`
  background: #0d0f14;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 0.9rem 1.1rem;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.4);
`;

export const CardTitle = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
  margin-bottom: 0.3rem;
`;

export const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.68rem, 0.85vw, 0.78rem);
  line-height: 1.45;
`;

/* A única parte dessa seção que fixa — trava no lugar assim que alcançada, e só solta depois que
   a mensagem do WhatsApp termina de ser digitada e enviada. O notebook fica perto do topo (não no
   centro exato) para que a linha de conexão acima dele (fazendo a ponte de onde a linha do Track
   termina) fique curta. */
export const LaptopWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 6vh;
  background: ${({ theme }) => theme.colors.background};
`;

/* Faz a ponte do vão visual entre o final da linha do Track e a imagem do notebook, com o mesmo
   estilo brilhante da própria linha. Começa totalmente colapsada (scaleY 0) e vai se desenhando —
   controlada de forma imperativa a partir do próprio progresso de scrub dessa seção (ver
   renderLaptop em Evolucao.jsx) — em vez de estar visível de forma estática desde o início, para
   passar a sensação de ser a continuação da linha, não uma peça estática separada que já estava
   ali. */
export const Connector = styled.div`
  width: 3px;
  height: 9vh;
  border-radius: 2px;
  background: #60a5fa;
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 1)) drop-shadow(0 0 12px rgba(76, 141, 246, 0.85));
  transform-origin: top;
  transform: scaleY(0);
  opacity: 0;
  will-change: transform, opacity;
`;

/* De volta à imagem estática notebook-aberto.png (notebook de clip-art com moldura preta) depois
   que os experimentos com vídeo não deram certo — sua própria proporção é de ~1.2987 (900x693). A
   largura é limitada de três formas: uma fração da largura do viewport, um máximo absoluto, e um
   limite derivado da *altura* do viewport (através dessa proporção) para que a altura renderizada
   da imagem nunca ultrapasse o espaço realmente disponível dentro do wrapper fixado de 100vh (menos
   o padding-top e o Connector acima) — caso contrário ela seria cortada em cima/embaixo pelo
   overflow: hidden do LaptopWrapper. */
export const LaptopStage = styled.div`
  position: relative;
  width: min(60vw, 900px, calc(78vh * 1.2987));
  transform-origin: center;
  will-change: transform, opacity;
`;

export const LaptopImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

/* Esmaece as bordas da imagem no fundo da página, mesma técnica usada nos vídeos do Hero/Empresas,
   para que pareça parte da página em vez de uma caixa com bordas duras. */
export const LaptopVignette = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, ${({ theme }) => theme.colors.background} 100%);
`;

/* Posicionado sobre a área da tela do notebook-aberto.png — o dimensionamento que já tinha sido
   confirmado como bom antes do desvio para vídeo. */
export const WhatsAppScreen = styled.div`
  position: absolute;
  top: 6.5%;
  left: 15.5%;
  width: 72%;
  height: 55%;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #0b141a;
`;

export const WhatsAppHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  background: #202c33;
`;

export const ContactAvatar = styled.div`
  width: clamp(18px, 2vw, 26px);
  height: clamp(18px, 2vw, 26px);
  border-radius: 50%;
  background: #6b7c85;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: clamp(0.6rem, 1vw, 0.8rem);
  flex-shrink: 0;
`;

export const ContactName = styled.span`
  color: #e9edef;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: clamp(0.65rem, 1.1vw, 0.95rem);
`;

export const ChatArea = styled.div`
  flex: 1;
  position: relative;
  padding: clamp(0.5rem, 1.5vw, 1rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 14px 14px;
`;

/* Começa escondido — só aparece depois que a mensagem termina de ser digitada no ComposeInput e
   "enviada" (ver a janela de transição de envio em Evolucao.jsx). */
export const Bubble = styled.div`
  align-self: flex-end;
  max-width: 82%;
  background: #005c4b;
  border-radius: 8px 8px 2px 8px;
  padding: clamp(0.4rem, 1.2vw, 0.65rem) clamp(0.55rem, 1.5vw, 0.85rem);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  opacity: 0;
  transform: translateY(6px) scale(0.94);
  will-change: opacity, transform;
`;

/* A fileira de composição na parte inferior, onde a mensagem é digitada letra por letra antes de
   "enviar". */
export const ComposeRow = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 0.8vw, 0.5rem);
  padding: clamp(0.3rem, 1vw, 0.55rem) clamp(0.4rem, 1.2vw, 0.7rem);
  background: #202c33;
`;

export const ComposeInput = styled.div`
  flex: 1;
  min-height: clamp(1.1rem, 2.6vw, 1.8rem);
  background: #2a3942;
  border-radius: 999px;
  padding: 0.3rem clamp(0.5rem, 1.3vw, 0.8rem);
  display: flex;
  align-items: center;
`;

export const ComposeText = styled.span`
  color: #e9edef;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.55rem, 1.1vw, 0.85rem);
  line-height: 1.3;
  white-space: pre-wrap;
`;

export const SendButton = styled.div`
  flex-shrink: 0;
  width: clamp(18px, 2.4vw, 28px);
  height: clamp(18px, 2.4vw, 28px);
  border-radius: 50%;
  background: #00a884;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 52%;
    height: 52%;
    fill: none;
    stroke: #ffffff;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const BubbleText = styled.span`
  color: #e9edef;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.6rem, 1.2vw, 0.9rem);
  line-height: 1.4;
  white-space: pre-wrap;
`;

export const BubbleMeta = styled.span`
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(233, 237, 239, 0.6);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.5rem, 0.9vw, 0.7rem);

  svg {
    width: clamp(10px, 1.4vw, 14px);
    height: auto;
    opacity: 0;
  }
`;
