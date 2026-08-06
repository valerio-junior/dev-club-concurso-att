import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "../../lib/gsap";
import { setScrollLocked } from "../../hooks/useLenis";
import { buildPhraseModel, buildSingleWordModel, useIntroTimeline } from "./useIntroTimeline";
import { DustField } from "./DustField";
import { Overlay, Canvas, BurnGlow, SentenceWrapper, PhraseCWrapper, Word, Char, SkipButton } from "./Loader.styles";

const PHRASE_A = "Venha ter essa experiência tecnológica a cada rolagem da página";
const PHRASE_B =
  "Não seria apenas algo sobre tecnologia, mas um ecossistema completo que te prende do começo ao fim";
const PHRASE_C = "Preparados para ter uma experiência cinematográfica em um passe de tecnologia?";
const DEVCLUB_TEXT = "DevClub";

const SKIP_DELAY_MS = 1500;
const CLOSE_FADE_MS = 350;

const DEVCLUB_FORM_DURATION = 1.8;
const DEVCLUB_HOLD_DURATION = 1.1;
const DEVCLUB_DISSOLVE_DURATION = 1.0;
const TREMBLE_DURATION = 0.7;
const BURN_DURATION = 2.0;

// Azul da marca (theme.colors.blueLight/blue — mesmo tom da fumaça do "DevClub" e da teia) —
// hardcoded aqui porque esse arquivo escreve estilo direto em elementos DOM via JS, fora do fluxo
// normal do styled-components/ThemeProvider.
const BURN_GLOW_INNER = "96, 165, 250";
const BURN_GLOW_OUTER = "37, 99, 235";

// A página "queima" a partir do centro, como fogo em papel: um buraco elíptico cresce no meio do
// Overlay (via CSS mask, então o Canvas/fundo inteiro somem juntos ali) revelando o Hero por baixo,
// puxando mais rápido pros lados (eixo X) do que pra cima/baixo — por isso duas easings diferentes
// para rx/ry — com um anel brilhante acompanhando a borda da queimada.
function runBurnReveal({ overlayEl, glowEl, duration = BURN_DURATION, onComplete }) {
  if (!overlayEl || !glowEl) {
    onComplete?.();
    return null;
  }

  const halfW = window.innerWidth / 2;
  const halfH = window.innerHeight / 2;
  const rxMax = halfW * 1.3;
  const ryMax = halfH * 1.3;
  const rxEase = gsap.parseEase("power1.out");
  const ryEase = gsap.parseEase("power2.in");

  const proxy = { t: 0 };
  return gsap.to(proxy, {
    t: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      const rx = Math.max(2, rxMax * rxEase(proxy.t));
      const ry = Math.max(2, ryMax * ryEase(proxy.t));
      // "white" (não preto) de propósito: mask-image pode ser interpretado por luminância em vez
      // de alfa dependendo do navegador — preto lido por luminância seria tratado como oculto,
      // invertendo o efeito inteiro. Branco funciona como "visível" nos dois modos.
      const mask = `radial-gradient(ellipse ${rx}px ${ry}px at 50% 50%, transparent 0%, transparent 80%, white 100%)`;
      overlayEl.style.maskImage = mask;
      overlayEl.style.webkitMaskImage = mask;

      glowEl.style.background = `radial-gradient(ellipse ${rx}px ${ry}px at 50% 50%, transparent 0%, transparent 76%, rgba(${BURN_GLOW_INNER}, 0.9) 88%, rgba(${BURN_GLOW_OUTER}, 0.55) 97%, transparent 109%)`;
    },
    onComplete,
  });
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

// Fumaça azul forma "DevClub", dissolve, a teia treme sincronizada e então a página queima a partir
// do centro revelando o Hero — tudo visual, sem DOM próprio: reaproveita o campo de partículas já
// montado no Loader e o Overlay/BurnGlow recebidos por ref.
function DevClubStage({ dustRef, overlayRef, glowRef, onDone }) {
  useLayoutEffect(() => {
    const dust = dustRef.current;
    if (!dust) return undefined;

    let burnTween = null;
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
        dust.tremble(TREMBLE_DURATION);
      },
      null,
      `+=${DEVCLUB_DISSOLVE_DURATION + 0.2}`
    );
    tl.call(
      () => {
        burnTween = runBurnReveal({
          overlayEl: overlayRef.current,
          glowEl: glowRef.current,
          duration: BURN_DURATION,
          onComplete: onDone,
        });
      },
      null,
      `+=${TREMBLE_DURATION + 0.15}`
    );

    return () => {
      tl.kill();
      burnTween?.kill();
      dust.cancelActive();
    };
  }, [dustRef, overlayRef, glowRef, onDone]);

  return null;
}

export function Loader({ onComplete }) {
  const [stage, setStage] = useState("sentence");
  const [skipVisible, setSkipVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const dustRef = useRef(null);
  const overlayRef = useRef(null);
  const glowRef = useRef(null);
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
      <BurnGlow ref={glowRef} />
      {stage === "sentence" && <CharGrid model={model} gridRef={containerRef} />}
      {stage === "phraseC" && <PhraseCStage dustRef={dustRef} onDone={handlePhraseCDone} />}
      {stage === "devclub" && (
        <DevClubStage dustRef={dustRef} overlayRef={overlayRef} glowRef={glowRef} onDone={finish} />
      )}
      <SkipButton type="button" $visible={skipVisible && !closing} onClick={finish}>
        Pular →
      </SkipButton>
    </Overlay>
  );
}
