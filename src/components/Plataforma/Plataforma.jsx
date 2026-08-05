import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import {
  Wrapper,
  Inner,
  LeftCol,
  Description,
  RightCol,
  PlatformStage,
  PlatformImage,
  CardsStack,
  CardItem,
  CardText,
  CardNumber,
} from "./Plataforma.styles";

const PLATFORM_SRC = "/assets/plataforma/plataforma-ensino.png";

const CARDS = [
  "Aulas com a melhor didática do mercado.",
  "Conteúdos para quem já é avançado ou iniciante",
  "Organizado em uma trilha personalizada para você não se perder",
  "Conteúdos exclusivos e atualizados toda semana",
];

// Distância vertical (px) de fallback entre cada slot de repouso dos cards, usada apenas até que o
// espaçamento real dos slots seja medido a partir do layout renderizado (as alturas de
// CardsStack/CardItem agora são clamps `vh` responsivos no arquivo de estilos, então um valor px
// fixo transbordaria em viewports baixas — isso reflete a abordagem de "medir o layout real" usada
// no ModuloBonus).
const CARD_SLOT_FALLBACK = 110;

// Texto/imagem mantêm exatamente o mesmo tempo de scroll absoluto (0/28vh/59.5vh) de antes — só o
// empilhamento/desempilhamento dos cards ganhou aproximadamente o dobro do espaço de scroll (entrada
// ~120vh->240vh, colapso ~60vh->120vh), já que esse movimento em si estava parecendo rápido demais.
// A distância cresceu de 2.6 para 4.4 para caber isso; tudo que foi reescalado abaixo é só esses
// mesmos limites absolutos divididos pelo novo total.
const TEXT_WINDOW = [0, 0.064];
const IMAGE_WINDOW = [0.064, 0.135];

// Os cards entram um de cada vez (cada um recebe uma fatia igual desse intervalo), depois — assim
// que os quatro estiverem dentro — colapsam de volta para uma única pilha de baixo para cima, e então
// desaparecem juntos.
const CARDS_ENTER_START = 0.135;
const CARDS_ENTER_END = 0.68;
const CARDS_EXIT_START = 0.68;
const CARDS_COLLAPSE_END = 0.952;
const CARDS_FADE_END = 1;

// Ajuste do "surgimento em profundidade": uma grande variação de escala (começa na metade do
// tamanho) mais uma varredura de desfoque para nitidez — como se o elemento estivesse vindo de
// longe e focando, não apenas surgindo de repente.
const SCALE_START = 0.5;
const BLUR_START_PX = 14;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// O progresso chega de forma imperativa a partir do PlataformaProjetos (o Stage fixado
// compartilhado que hospeda essa seção junto com Projetos) em vez dessa seção fixar a si mesma —
// veja aquele componente para a coreografia de scroll combinada (o tempo/distância dessa seção em
// si não muda; só a saída de fechamento de janela que revela o Projetos depois fica lá).
export const Plataforma = forwardRef(function Plataforma(_props, ref) {
  const descRef = useRef(null);
  const stageRef = useRef(null);
  const cardsStackRef = useRef(null);
  const cardRefs = useRef([]);
  const slotRef = useRef(CARD_SLOT_FALLBACK);

  // Espaçamento do slot = (altura da pilha - altura do próprio card) / (n - 1), para que a borda
  // inferior do último card caia exatamente na borda inferior da pilha — medido a partir dos
  // tamanhos reais renderizados em vez de assumir um valor px fixo, já que ambos agora são clamps
  // `vh` responsivos.
  useEffect(() => {
    const measure = () => {
      const stackHeight = cardsStackRef.current?.offsetHeight;
      const cardHeight = cardRefs.current[0]?.offsetHeight;
      if (stackHeight && cardHeight && CARDS.length > 1) {
        slotRef.current = (stackHeight - cardHeight) / (CARDS.length - 1);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const render = useCallback((progress) => {
    if (descRef.current) {
      const [start, end] = TEXT_WINDOW;
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      descRef.current.style.opacity = t.toFixed(3);
      descRef.current.style.transform = `scale(${(SCALE_START + (1 - SCALE_START) * t).toFixed(3)})`;
      descRef.current.style.filter = `blur(${(BLUR_START_PX * (1 - t)).toFixed(2)}px)`;
    }

    if (stageRef.current) {
      const [start, end] = IMAGE_WINDOW;
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      stageRef.current.style.opacity = t.toFixed(3);
      stageRef.current.style.transform = `scale(${(SCALE_START + (1 - SCALE_START) * t).toFixed(3)})`;
      stageRef.current.style.filter = `blur(${(BLUR_START_PX * (1 - t)).toFixed(2)}px)`;
    }

    // Entrada: cada card recebe uma fatia igual e sequencial do intervalo de entrada — um de cada vez,
    // deslizando do slot 0 (no topo da pilha) até seu próprio slot de repouso i.
    const n = CARDS.length;
    const enterSlice = (CARDS_ENTER_END - CARDS_ENTER_START) / n;

    // Saída: uma única "frente de colapso" compartilhada desce do slot (n-1) até o slot 0 — cada card
    // fica parado no seu próprio slot até a frente alcançá-lo, e então acompanha o resto do caminho
    // para baixo, o que é o que faz os cards já colapsados continuarem se movendo juntos como um grupo.
    const collapseT = easeOutCubic(clamp01((progress - CARDS_EXIT_START) / (CARDS_COLLAPSE_END - CARDS_EXIT_START)));
    const front = (n - 1) * (1 - collapseT);
    const fadeT = clamp01((progress - CARDS_COLLAPSE_END) / (CARDS_FADE_END - CARDS_COLLAPSE_END));

    cardRefs.current.forEach((el, i) => {
      if (!el) return;

      let slot;
      let opacity;
      if (progress < CARDS_EXIT_START) {
        const cardStart = CARDS_ENTER_START + i * enterSlice;
        const cardEnd = cardStart + enterSlice;
        const t = easeOutCubic(clamp01((progress - cardStart) / (cardEnd - cardStart)));
        // Percorre apenas do slot do card anterior (i-1) até o próprio (i) — não do slot 0 inteiro —
        // para que cada card visivelmente surja daquele logo antes dele.
        slot = Math.max(0, i - 1) + (i === 0 ? 0 : t);
        opacity = t;
      } else {
        slot = Math.min(i, front);
        opacity = 1 - fadeT;
      }

      el.style.transform = `translateY(${(slot * slotRef.current).toFixed(1)}px)`;
      el.style.opacity = opacity.toFixed(3);
    });
  }, []);

  useImperativeHandle(ref, () => ({ render }), [render]);

  return (
    <Wrapper>
      <Inner>
        <LeftCol>
          <Description ref={descRef}>Plataforma de trilha do básico ao avançado</Description>
          <CardsStack ref={cardsStackRef}>
            {CARDS.map((text, i) => (
              <CardItem key={text} ref={(el) => (cardRefs.current[i] = el)} style={{ zIndex: i + 1 }}>
                <CardText>{text}</CardText>
                <CardNumber>{String(i + 1).padStart(2, "0")}</CardNumber>
              </CardItem>
            ))}
          </CardsStack>
        </LeftCol>
        <RightCol>
          <PlatformStage ref={stageRef}>
            <PlatformImage src={PLATFORM_SRC} alt="Plataforma de ensino DevClub" />
          </PlatformStage>
        </RightCol>
      </Inner>
    </Wrapper>
  );
});
