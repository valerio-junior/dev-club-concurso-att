import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "../../lib/gsap";
import { setScrollLocked, refreshScroll } from "../../hooks/useLenis";
import { StarField } from "./StarField";
import { NAMES } from "./names";
import {
  Section,
  StarCanvas,
  Content,
  DescriptionCol,
  Heading,
  Description,
  EarthCol,
  EarthWrapper,
  EarthGlow,
  EarthImage,
  NameLabel,
  Cursor,
  SkipButton,
} from "./Ecossistema.styles";

const EARTH_SRC = "/assets/planeta-terra/planeta-terra.png";
const VISIBLE_NAME_COUNT = 10;
const SHOOTING_STAR_COUNT = 6;
const DRAG_INDEXES = [3, 7]; // quais paradas do cursor são "arrasta" em vez de "clica" (na entrada)
// Elipse, não círculo — o alcance vertical é bem menor que o horizontal de propósito, pra nenhum
// nome nascer perto o bastante do topo do wrapper pra correr risco de ficar atrás do cabeçalho
// (fixo, por cima de tudo).
const RING_RADIUS_X_PCT = 68;
const RING_RADIUS_Y_PCT = 44;
const OUTRO_HOLD = 2.3; // segundos com tudo em tela (cursor escondido) antes de começar a desfazer
const SKIP_DELAY_MS = 1500;

function pickNames(count) {
  const shuffled = [...NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Centro de um elemento em pixels, relativo ao canto superior-esquerdo de containerEl — usado pra
// mover o cursor até qualquer alvo (nome, texto, Terra) no mesmo espaço de coordenadas.
function centerRelativeTo(targetEl, containerEl) {
  const targetRect = targetEl.getBoundingClientRect();
  const containerRect = containerEl.getBoundingClientRect();
  return {
    x: targetRect.left + targetRect.width / 2 - containerRect.left,
    y: targetRect.top + targetRect.height / 2 - containerRect.top,
  };
}

// Reaproveita o mesmo desenho de cursor de seta em todo lugar — SVG simples, sem dependências.
function CursorArrow() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 2 L4 20 L9 15.5 L12.5 22 L15 20.8 L11.5 14.3 L18 14 Z"
        fill="#F5F5F5"
        stroke="#60A5FA"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Ecossistema({ active }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const descRef = useRef(null);
  const earthWrapperRef = useRef(null);
  const earthImageRef = useRef(null);
  const cursorRef = useRef(null);
  const labelRefs = useRef([]);
  const skipHandlerRef = useRef(null);

  const [skipVisible, setSkipVisible] = useState(false);
  const names = useMemo(() => pickNames(VISIBLE_NAME_COUNT), []);

  useEffect(() => {
    if (!active) return undefined;

    const field = new StarField(canvasRef.current);
    const strayTweens = [];

    setScrollLocked(true);
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    let unlocked = false;
    const unlockScroll = () => {
      if (unlocked) return;
      unlocked = true;
      setScrollLocked(false);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };

    let finished = false;
    // Colapsa a altura (e o padding — ver nota abaixo) da seção pra revelar o Hero por baixo.
    // Compartilhado pelo fim natural da sequência e pelo botão "Pular".
    const finishSequence = () => {
      if (finished) return;
      finished = true;
      skipHandlerRef.current = null;
      setSkipVisible(false);
      sectionRef.current.style.clipPath = "none";
      sectionRef.current.style.webkitClipPath = "none";
      const currentHeight = sectionRef.current.getBoundingClientRect().height;
      // O padding sozinho (top+bottom) nunca deixa a altura passar de ~208px, mesmo com height:0 —
      // border-box não ajuda aqui, então zera o padding junto com a altura.
      gsap.set(sectionRef.current, { minHeight: 0, height: currentHeight });
      gsap.to(sectionRef.current, {
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          refreshScroll();
          unlockScroll();
        },
      });
    };

    const skipTimer = setTimeout(() => setSkipVisible(true), SKIP_DELAY_MS);

    const ctx = gsap.context(() => {
      const content = contentRef.current;
      const cursor = cursorRef.current;

      // Posições (em px, relativas ao Content) dos nomes ao redor da Terra — calculadas a partir do
      // tamanho real renderizado do EarthWrapper, então funcionam em qualquer tela.
      const earthRect = earthWrapperRef.current.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const originX = earthRect.left + earthRect.width / 2 - contentRect.left;
      const originY = earthRect.top + earthRect.height / 2 - contentRect.top;
      const radiusX = earthRect.width * (RING_RADIUS_X_PCT / 100);
      const radiusY = earthRect.height * (RING_RADIUS_Y_PCT / 100);

      const positions = names.map((_, i) => {
        const angle = (i / names.length) * Math.PI * 2 - Math.PI / 2;
        const jitter = (Math.random() - 0.5) * 0.3;
        return {
          x: originX + Math.cos(angle) * (radiusX + jitter * radiusX * 0.15),
          y: originY + Math.sin(angle) * (radiusY + jitter * radiusY * 0.15),
        };
      });

      labelRefs.current.forEach((label, i) => {
        gsap.set(label, { left: positions[i].x, top: positions[i].y });
      });

      const tl = gsap.timeline();

      // ========== ENTRADA: constelação, Terra se formando, nomes surgindo ==========
      tl.call(() => field.revealStars(2.5), null, 0);
      tl.to(descRef.current, { opacity: 1, x: 0, duration: 1, ease: "power2.out" }, 0.8);

      const revealProxy = { r: 0 };
      for (let i = 0; i < SHOOTING_STAR_COUNT; i += 1) {
        tl.call(() => {
          const rect = earthImageRef.current.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const targetNdc = [(cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1];

          field.fireShootingStar({
            targetNdc,
            duration: 0.55,
            onArrive: () => {
              const target = ((i + 1) / SHOOTING_STAR_COUNT) * 50;
              strayTweens.push(gsap.to(revealProxy, {
                r: target,
                duration: 0.5,
                ease: "power2.out",
                onUpdate: () => {
                  const clip = `circle(${revealProxy.r}% at 50% 50%)`;
                  earthImageRef.current.style.clipPath = clip;
                  earthImageRef.current.style.webkitClipPath = clip;
                },
              }));
            },
          });
        }, null, i === 0 ? "+=0.9" : "+=0.5");
      }

      tl.to(cursor, { opacity: 1, duration: 0.3 }, "+=0.6");

      positions.forEach((pos, i) => {
        const label = labelRefs.current[i];
        const isDrag = DRAG_INDEXES.includes(i);

        if (isDrag) {
          const startPos = { x: originX + (Math.random() - 0.5) * radiusX, y: originY - radiusY - 30 };
          tl.set(cursor, { left: startPos.x, top: startPos.y }, "+=0.12");
          tl.set(label, { left: startPos.x, top: startPos.y, opacity: 1 });
          tl.to(cursor, { scale: 0.78, duration: 0.08, yoyo: true, repeat: 1 });
          tl.to([cursor, label], { left: pos.x, top: pos.y, duration: 0.55, ease: "power2.inOut" }, "<");
          tl.to(cursor, { scale: 0.78, duration: 0.08, yoyo: true, repeat: 1 });
        } else {
          tl.to(cursor, { left: pos.x, top: pos.y, duration: 0.38, ease: "power2.inOut" }, "+=0.15");
          tl.to(cursor, { scale: 0.75, duration: 0.08, yoyo: true, repeat: 1 });
          tl.fromTo(
            label,
            { opacity: 0, scale: 0.7 },
            { opacity: 1, scale: 1, duration: 0.26, ease: "back.out(2)" },
            "<0.05"
          );
        }
      });

      // ========== cursor some enquanto não está "trabalhando" ==========
      tl.to(cursor, { opacity: 0, duration: 0.35 }, "+=0.3");

      // ========== SEGURA A CENA (cursor escondido) ==========
      tl.to({}, { duration: OUTRO_HOLD });

      // ========== cursor volta pra começar a puxar tudo pra fora ==========
      tl.to(cursor, { opacity: 1, duration: 0.3 });

      // ========== SAÍDA: cursor arrasta cada nome pra fora ==========
      for (let i = positions.length - 1; i >= 0; i -= 1) {
        const pos = positions[i];
        const label = labelRefs.current[i];
        const dx = pos.x - originX;
        const dy = pos.y - originY;
        const dist = Math.hypot(dx, dy) || 1;
        const outX = pos.x + (dx / dist) * 140;
        const outY = pos.y + (dy / dist) * 140;

        tl.to(cursor, { left: pos.x, top: pos.y, duration: 0.18, ease: "power2.inOut" }, "+=0.05");
        tl.to(cursor, { scale: 0.78, duration: 0.05, yoyo: true, repeat: 1 });
        tl.to([cursor, label], { left: outX, top: outY, duration: 0.2, ease: "power1.in" }, "<");
        tl.to(label, { opacity: 0, duration: 0.16 }, "<0.05");
      }

      // ========== SAÍDA: cursor clica no texto ==========
      tl.to(
        cursor,
        {
          left: () => centerRelativeTo(descRef.current, content).x,
          top: () => centerRelativeTo(descRef.current, content).y,
          duration: 0.45,
          ease: "power2.inOut",
        },
        "+=0.15"
      );
      tl.to(cursor, { scale: 0.78, duration: 0.1, yoyo: true, repeat: 1 });
      tl.to(descRef.current, { opacity: 0, x: -48, duration: 0.45, ease: "power1.in" }, "<");

      // ========== SAÍDA: cursor clica na Terra ==========
      tl.to(
        cursor,
        {
          left: () => centerRelativeTo(earthImageRef.current, content).x,
          top: () => centerRelativeTo(earthImageRef.current, content).y,
          duration: 0.45,
          ease: "power2.inOut",
        },
        "+=0.2"
      );
      tl.to(cursor, { scale: 0.78, duration: 0.1, yoyo: true, repeat: 1 });
      const hideEarthProxy = { r: 50 };
      tl.to(hideEarthProxy, {
        r: 0,
        duration: 0.45,
        ease: "power1.in",
        onUpdate: () => {
          const clip = `circle(${hideEarthProxy.r}% at 50% 50%)`;
          earthImageRef.current.style.clipPath = clip;
          earthImageRef.current.style.webkitClipPath = clip;
        },
      }, "<");
      tl.to(earthWrapperRef.current, { opacity: 0, duration: 0.35 }, "<0.1");

      // ========== só as estrelas restam — um pequeno impulso nelas ==========
      tl.to(cursor, { opacity: 0, duration: 0.35 }, "+=0.25");
      tl.to(field.starPoints.rotation, { y: "+=0.6", duration: 1.1, ease: "power1.inOut" }, "<");

      // ========== a janela fecha (mesma técnica de clip-path da Plataforma/Projetos) ==========
      const closeProxy = { t: 0 };
      tl.to(
        closeProxy,
        {
          t: 1,
          duration: 1.1,
          ease: "power2.inOut",
          onUpdate: () => {
            const inset = closeProxy.t * 50;
            const radius = closeProxy.t * 28;
            const clip = `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`;
            sectionRef.current.style.clipPath = clip;
            sectionRef.current.style.webkitClipPath = clip;
          },
        },
        "+=0.15"
      );

      tl.call(() => {
        field.destroy();
        finishSequence();
      });
    }, sectionRef);

    skipHandlerRef.current = () => {
      ctx.revert();
      strayTweens.forEach((tween) => tween?.kill());
      field.destroy();
      finishSequence();
    };

    return () => {
      clearTimeout(skipTimer);
      skipHandlerRef.current = null;
      ctx.revert();
      strayTweens.forEach((tween) => tween?.kill());
      field.destroy();
      unlockScroll();
    };
  }, [active, names]);

  const handleSkipClick = useCallback(() => {
    skipHandlerRef.current?.();
  }, []);

  return (
    <Section ref={sectionRef}>
      <StarCanvas ref={canvasRef} />
      <Content ref={contentRef}>
        <DescriptionCol ref={descRef}>
          <Heading>Milhares de pessoas por todo o mundo fazendo parte do ecossistema DevClub</Heading>
          <Description>
            De norte a sul, uma comunidade real de devs trocando experiência, se ajudando e crescendo
            junto — todos os dias.
          </Description>
        </DescriptionCol>
        <EarthCol>
          <EarthWrapper ref={earthWrapperRef}>
            <EarthGlow />
            <EarthImage ref={earthImageRef} src={EARTH_SRC} alt="Planeta Terra" />
          </EarthWrapper>
        </EarthCol>
        {names.map((name, i) => (
          <NameLabel
            key={name}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
          >
            {name}
          </NameLabel>
        ))}
        <Cursor ref={cursorRef}>
          <CursorArrow />
        </Cursor>
      </Content>
      <SkipButton type="button" $visible={skipVisible} onClick={handleSkipClick}>
        Pular →
      </SkipButton>
    </Section>
  );
}
