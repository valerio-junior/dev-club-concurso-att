import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "../../lib/gsap";
import { setScrollLocked } from "../../hooks/useLenis";
import { buildPhraseModel, buildSingleWordModel, useIntroTimeline } from "./useIntroTimeline";
import { DustField } from "./DustField";
import {
  Overlay,
  Canvas,
  BrainWrapper,
  BrainImage,
  SentenceWrapper,
  PhraseCWrapper,
  Word,
  Char,
  SkipButton,
} from "./Loader.styles";

const PHRASE_A = "Venha ter essa experiência tecnológica a cada rolagem da página";
const PHRASE_B =
  "Não seria apenas algo sobre tecnologia, mas um ecossistema completo que te prende do começo ao fim";
const PHRASE_C = "Preparados para ter uma experiência cinematográfica em um passe de tecnologia?";
const DEVCLUB_TEXT = "DevClub";
const BRAIN_SRC = "/assets/generated/professores-cerebro-transparente.png";

const SKIP_DELAY_MS = 1500;
const CLOSE_FADE_MS = 350;

const DEVCLUB_FORM_DURATION = 1.8;
const DEVCLUB_HOLD_DURATION = 1.1;
const DEVCLUB_DISSOLVE_DURATION = 1.0;

const BRAIN_OPACITY = 0.35;
const BRAIN_SPIN_SECONDS = 16; // por volta — giro contínuo, discreto, "não muito rápido"
const BRAIN_BASE_SCALE = 0.5; // tamanho de repouso, metade do tamanho "cheio"
const BRAIN_GROW_SCALE = 1.0; // cresce até esse tamanho (o que hoje é o tamanho "normal") antes de explodir
const BRAIN_GROW_DURATION = 1.4;
const BRAIN_SHATTER_DURATION = 0.85;
const BRAIN_SHATTER_GRID = 6; // 6x6 = 36 estilhaços
const EXPLOSION_REVEAL_DURATION = 1.0;

// A página "explode" a partir do centro (onde está o cérebro): um buraco elíptico cresce rápido no
// meio do Overlay (via CSS mask, então o Canvas/fundo inteiro somem juntos ali) revelando o Hero por
// baixo. Sem brilho/anel extra de propósito — só o cérebro se estilhaçando e o burst de partículas
// (ver DevClubStage) carregam a leitura de "explosão".
function runExplosionReveal({ overlayEl, duration = EXPLOSION_REVEAL_DURATION, onComplete }) {
  if (!overlayEl) {
    onComplete?.();
    return null;
  }

  const halfW = window.innerWidth / 2;
  const halfH = window.innerHeight / 2;
  const rxMax = halfW * 1.3;
  const ryMax = halfH * 1.3;
  const ease = gsap.parseEase("power4.out");

  const proxy = { t: 0 };
  return gsap.to(proxy, {
    t: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      const eased = ease(proxy.t);
      const rx = Math.max(2, rxMax * eased);
      const ry = Math.max(2, ryMax * eased);
      // "white" (não preto) de propósito: mask-image pode ser interpretado por luminância em vez
      // de alfa dependendo do navegador — preto lido por luminância seria tratado como oculto,
      // invertendo o efeito inteiro. Branco funciona como "visível" nos dois modos.
      const mask = `radial-gradient(ellipse ${rx}px ${ry}px at 50% 50%, transparent 0%, transparent 80%, white 100%)`;
      overlayEl.style.maskImage = mask;
      overlayEl.style.webkitMaskImage = mask;
    },
    onComplete,
  });
}

// Quebra a imagem do cérebro numa grade de estilhaços (cada um um recorte de background-image do
// próprio PNG, via background-position) que voam pra fora radialmente a partir do centro — em vez de
// só escalar/sumir a imagem inteira. Os estilhaços nascem dentro de um wrapper que herda a mesma
// rotação/escala/opacidade que a imagem tinha no instante do congelamento, então a transição da
// imagem única pros pedaços é contínua, sem salto visual.
function explodeBrainIntoPieces({ wrapperEl, imgEl, src, duration = BRAIN_SHATTER_DURATION, onComplete }) {
  if (!wrapperEl || !imgEl) {
    onComplete?.();
    return null;
  }

  const rotation = gsap.getProperty(imgEl, "rotation");
  const scale = gsap.getProperty(imgEl, "scale");
  const opacity = gsap.getProperty(imgEl, "opacity");

  const fragmentsEl = document.createElement("div");
  Object.assign(fragmentsEl.style, { position: "absolute", inset: "0", transformOrigin: "50% 50%" });
  wrapperEl.appendChild(fragmentsEl);
  gsap.set(fragmentsEl, { rotation, scale, opacity });
  imgEl.style.visibility = "hidden";

  const grid = BRAIN_SHATTER_GRID;
  const tileSize = 1024 / grid;
  const center = 512;
  const tl = gsap.timeline({
    onComplete: () => {
      fragmentsEl.remove();
      onComplete?.();
    },
  });

  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      const left = col * tileSize;
      const top = row * tileSize;
      const tile = document.createElement("div");
      Object.assign(tile.style, {
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
        backgroundImage: `url(${src})`,
        backgroundSize: "1024px 1024px",
        backgroundPosition: `-${left}px -${top}px`,
        mixBlendMode: "screen",
      });
      fragmentsEl.appendChild(tile);

      const dx = left + tileSize / 2 - center;
      const dy = top + tileSize / 2 - center;
      const dist = Math.hypot(dx, dy) || 1;
      const distance = gsap.utils.random(260, 540);

      tl.to(tile, {
        x: (dx / dist) * distance + gsap.utils.random(-40, 40),
        y: (dy / dist) * distance + gsap.utils.random(-40, 40),
        rotation: gsap.utils.random(-220, 220),
        opacity: 0,
        duration: duration * gsap.utils.random(0.8, 1.15),
        ease: "power2.out",
      }, 0);
    }
  }

  return tl;
}

function CharGrid({ model, gridRef }) {
  return (
    <SentenceWrapper ref={gridRef}>
      {model.map((word, wi) => (
        <Word key={wi}>
          {word.map((slot, li) => (
            <Char key={li} data-intro-char="" data-a={slot.a} data-b={slot.b}>
              {slot.a}
            </Char>
          ))}
        </Word>
      ))}
    </SentenceWrapper>
  );
}

function PhraseCStage({ dustRef, onDone }) {
  const textRef = useRef(null);
  const model = useMemo(() => buildSingleWordModel(PHRASE_C), []);

  useLayoutEffect(() => {
    const dust = dustRef.current;

    const ctx = gsap.context(() => {
      const chars = Array.from(textRef.current.querySelectorAll("[data-intro-char]"));
      gsap.set(chars, { opacity: 0, y: 18 });

      const tl = gsap.timeline({ onComplete: onDone });

      tl.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.6)",
        stagger: 0.014,
      });

      tl.to(chars, {
        opacity: 0,
        y: -10,
        duration: 0.5,
        ease: "power1.in",
        stagger: {
          each: 0.008,
          onStart: () => dust?.pulseRays(0.4, 0.3),
        },
      }, "+=1.1");
    }, textRef);

    return () => ctx.revert();
  }, [dustRef, onDone]);

  return (
    <PhraseCWrapper ref={textRef}>
      {model.map((word, wi) => (
        <Word key={wi}>
          {word.map((letter, li) => (
            <Char key={li} data-intro-char="">
              {letter}
            </Char>
          ))}
        </Word>
      ))}
    </PhraseCWrapper>
  );
}

// Fumaça azul forma "DevClub" e dissolve; então o cérebro (girando desde o início atrás de tudo, no
// tamanho de repouso menor) para de girar, cresce tremendo até o tamanho "cheio" e se estilhaça em
// pedaços que voam pra fora — junto com uma explosão de partículas e a página se abrindo a partir do
// centro, revelando o Hero. Tudo visual, sem DOM próprio: reaproveita o campo de partículas e as
// refs (Overlay/brain) já montados no Loader.
function DevClubStage({ dustRef, overlayRef, brainRef, brainWrapperRef, onDone }) {
  useLayoutEffect(() => {
    const dust = dustRef.current;
    if (!dust) return undefined;

    const brainTweens = [];
    const tl = gsap.timeline();
    tl.call(() => dust.formText(DEVCLUB_TEXT, { duration: DEVCLUB_FORM_DURATION }), null, 0);
    tl.call(
      () => dust.dissolveTextToRight(DEVCLUB_DISSOLVE_DURATION),
      null,
      `+=${DEVCLUB_FORM_DURATION + DEVCLUB_HOLD_DURATION}`
    );
    tl.call(
      () => {
        dust.fadeSmoke(0.5);

        const brain = brainRef.current;
        if (brain) {
          gsap.killTweensOf(brain, "rotation"); // congela o giro exatamente onde estava, sem pulo
          brainTweens.push(
            gsap.to(brain, { scale: BRAIN_GROW_SCALE, duration: BRAIN_GROW_DURATION, ease: "power1.in" }),
            shakeElement(brain, BRAIN_GROW_DURATION, 16)
          );
        }
      },
      null,
      `+=${DEVCLUB_DISSOLVE_DURATION + 0.2}`
    );
    tl.call(
      () => {
        brainTweens.push(
          explodeBrainIntoPieces({
            wrapperEl: brainWrapperRef.current,
            imgEl: brainRef.current,
            src: BRAIN_SRC,
            duration: BRAIN_SHATTER_DURATION,
          })
        );
        dust.burstExplosion(0.9);
        brainTweens.push(
          runExplosionReveal({
            overlayEl: overlayRef.current,
            duration: EXPLOSION_REVEAL_DURATION,
            onComplete: onDone,
          })
        );
      },
      null,
      `+=${BRAIN_GROW_DURATION}`
    );

    return () => {
      tl.kill();
      brainTweens.forEach((tween) => tween?.kill());
      dust.cancelActive();
    };
  }, [dustRef, overlayRef, brainRef, brainWrapperRef, onDone]);

  return null;
}

// Tremor curto e "quantizado" (não suave) num elemento DOM — mesma leitura de glitch digital usada
// na teia, aqui aplicada ao cérebro enquanto ele cresce.
function shakeElement(el, duration, magnitude = 14) {
  const steps = Math.max(1, Math.floor(duration / 0.045));
  const tl = gsap.timeline();
  for (let i = 0; i < steps; i += 1) {
    tl.to(el, {
      x: () => gsap.utils.random(-magnitude, magnitude),
      y: () => gsap.utils.random(-magnitude, magnitude),
      duration: 0.045,
      ease: "none",
    });
  }
  tl.to(el, { x: 0, y: 0, duration: 0.05 });
  return tl;
}

export function Loader({ onComplete }) {
  const [stage, setStage] = useState("sentence");
  const [skipVisible, setSkipVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const dustRef = useRef(null);
  const overlayRef = useRef(null);
  const brainRef = useRef(null);
  const brainWrapperRef = useRef(null);
  const model = useMemo(() => buildPhraseModel(PHRASE_A, PHRASE_B), []);

  useLayoutEffect(() => {
    const dust = new DustField(canvasRef.current);
    dustRef.current = dust;
    dust.revealRays(1.0);
    return () => {
      dust.destroy();
      dustRef.current = null;
    };
  }, []);

  // O cérebro fica visível (opacidade parcial), no tamanho de repouso (metade do "cheio"), atrás do
  // texto do início ao fim da intro, girando devagar pra direita sem parar — até o DevClubStage
  // congelar esse giro e crescer ele pra fase final.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(brainRef.current, { scale: BRAIN_BASE_SCALE });
      gsap.to(brainRef.current, { opacity: BRAIN_OPACITY, duration: 1.2, ease: "power1.out" });
      gsap.to(brainRef.current, {
        rotation: "+=360",
        duration: BRAIN_SPIN_SECONDS,
        ease: "none",
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    setScrollLocked(true);
    const timer = setTimeout(() => setSkipVisible(true), SKIP_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setScrollLocked(false);
    };
  }, []);

  const finish = useCallback(() => {
    setClosing(true);
    setTimeout(() => onComplete?.(), CLOSE_FADE_MS);
  }, [onComplete]);

  const handleSentenceDone = useCallback(() => setStage("phraseC"), []);
  const handlePhraseCDone = useCallback(() => setStage("devclub"), []);

  useIntroTimeline({
    containerRef,
    active: stage === "sentence",
    onDone: handleSentenceDone,
  });

  return (
    <Overlay ref={overlayRef} $closing={closing}>
      <Canvas ref={canvasRef} />
      <BrainWrapper ref={brainWrapperRef}>
        <BrainImage ref={brainRef} src={BRAIN_SRC} alt="" />
      </BrainWrapper>
      {stage === "sentence" && <CharGrid model={model} gridRef={containerRef} />}
      {stage === "phraseC" && <PhraseCStage dustRef={dustRef} onDone={handlePhraseCDone} />}
      {stage === "devclub" && (
        <DevClubStage
          dustRef={dustRef}
          overlayRef={overlayRef}
          brainRef={brainRef}
          brainWrapperRef={brainWrapperRef}
          onDone={finish}
        />
      )}
      <SkipButton type="button" $visible={skipVisible && !closing} onClick={finish}>
        Pular →
      </SkipButton>
    </Overlay>
  );
}
