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

// Fallback vertical distance (px) between each card's resting slot, used only until the real
// slot spacing is measured from the rendered layout (CardsStack/CardItem heights are now
// responsive `vh` clamps in the styles file, so a hardcoded px value would overflow on short
// viewports — this mirrors the "measure real layout" approach used in ModuloBonus).
const CARD_SLOT_FALLBACK = 110;

// Text/image keep their exact same absolute scroll timing (0/28vh/59.5vh) as before — only the
// cards' stacking/unstacking got roughly double the scroll room (entrance ~120vh->240vh,
// collapse ~60vh->120vh), since that motion itself was reading as too fast. Distance grew from
// 2.6 to 4.4 to fit that; everything rescaled below is just those same absolute boundaries
// divided by the new total.
const TEXT_WINDOW = [0, 0.064];
const IMAGE_WINDOW = [0.064, 0.135];

// Cards enter one at a time (each gets an equal slice of this range), then — once all four are
// in — collapse back into a single stack from the bottom up, then fade out together.
const CARDS_ENTER_START = 0.135;
const CARDS_ENTER_END = 0.68;
const CARDS_EXIT_START = 0.68;
const CARDS_COLLAPSE_END = 0.952;
const CARDS_FADE_END = 1;

// Depth-emerge tuning: a big scale swing (starts at half size) plus a blur-to-sharp sweep —
// like the element is coming from far away and racking into focus, not just popping in.
const SCALE_START = 0.5;
const BLUR_START_PX = 14;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Progress arrives imperatively from PlataformaProjetos (the shared pinned Stage hosting this
// section together with Projetos) instead of this section pinning itself — see that component
// for the combined scroll choreography (this section's own timing/distance is unchanged; only
// the window-closing exit that reveals Projetos afterward lives there).
export const Plataforma = forwardRef(function Plataforma(_props, ref) {
  const descRef = useRef(null);
  const stageRef = useRef(null);
  const cardsStackRef = useRef(null);
  const cardRefs = useRef([]);
  const slotRef = useRef(CARD_SLOT_FALLBACK);

  // Slot spacing = (stack height - one card's own height) / (n - 1), so the last card's bottom
  // edge lands exactly at the stack's bottom edge — measured from the real rendered sizes
  // instead of assuming a fixed px value, since both are now responsive `vh` clamps.
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

    // Entrance: each card gets an equal, sequential slice of the enter range — one at a time,
    // sliding down from slot 0 (on top of the pile) to its own resting slot i.
    const n = CARDS.length;
    const enterSlice = (CARDS_ENTER_END - CARDS_ENTER_START) / n;

    // Exit: a single shared "collapsing front" descends from slot (n-1) to slot 0 — each card
    // sits still at its own slot until the front reaches it, then rides it down the rest of the
    // way, which is what makes already-collapsed cards continue moving together as one group.
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
        // Travels only from the previous card's slot (i-1) to its own (i) — not all the way
        // from slot 0 — so each card visibly emerges from the one right before it.
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
