import styled from "styled-components";

/* Posicionado de forma absoluta (não é seu próprio elemento de fluxo fixado) — fica empilhado,
   junto com o ConteudosIA, dentro de um Stage fixado compartilhado (ver FormacoesConteudosIA) para
   que os dois possam se sobrepor na tela: a cauda dessa seção (o último card saindo) acontece ao
   mesmo tempo que a revelação de abertura do ConteudosIA, em vez de terminar completamente antes da
   próxima seção começar. */
export const Wrapper = styled.section`
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

/* A própria esteira transportadora — o título e o slot de cards andam juntos, continuamente
   transladados para a esquerda em sincronia com o scroll, do progresso 0 até saírem totalmente da
   tela. Nada aqui aparece com fade ou desliza sozinho; a esteira é a única coisa que os move. */
export const BeltLayer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: clamp(3rem, 7vw, 7.5rem);
  padding: 0 clamp(1.5rem, 6vw, 6rem);
  will-change: transform;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 0 1.5rem;
  }
`;

export const TextCol = styled.div`
  width: min(48%, 620px);
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 70vw;
  }
`;

export const Heading = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.8rem, 3.4vw, 2.8rem);
  line-height: 1.3;
  /* Equilibra o comprimento das linhas nas quebras (nunca separa uma palavra) em vez de um <br />
     manual que pode deixar uma palavra órfã sozinha numa linha em larguras mais estreitas. */
  text-wrap: balance;
`;

/* A fileira em que todos os cards ficam — dispostos lado a lado (não empilhados), transbordando
   naturalmente para além do viewport à direita. O translateX da esteira é o que revela cada um por
   vez; essa fileira em si nunca se move de forma independente. */
export const CardsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 400px;
  flex-shrink: 0;
  padding: 2.25rem;
  background: #0d0f14;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  opacity: 0;
  will-change: opacity, transform;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 78vw;
  }
`;

export const IconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

/* Um badge discreto atrás de cada logo em vez de um SVG chapado flutuando solto no card —
   passa a sensação de algo pensado/desenhado em vez de um amontoado cru de ícones. */
export const IconBadge = styled.div`
  width: 3.25rem;
  height: 3.25rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 50%;
`;

export const CardIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
`;

export const CardTitle = styled.h3`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.2rem, 1.8vw, 1.5rem);
  line-height: 1.3;
`;

export const CardDescription = styled.p`
  color: rgba(245, 245, 245, 0.62);
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.95rem, 1.2vw, 1.05rem);
  line-height: 1.6;
  /* Equilibra o comprimento das linhas nas quebras (nunca separa uma palavra — uma palavra inteira
     que não cabe simplesmente vai toda para a próxima linha) em vez de deixar uma única palavra
     órfã sozinha na última linha. */
  text-wrap: balance;
`;
