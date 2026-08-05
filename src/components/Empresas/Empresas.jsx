import { useCallback, useEffect, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { useVideoFrames } from "../../hooks/useVideoFrames";
import { drawImageCover } from "../../lib/canvas";
import { ScrollTrigger } from "../../lib/gsap";
import {
  Wrapper,
  TextColumn,
  TitleGroup,
  Eyebrow,
  Title,
  CardsCol,
  Card,
  NotebookStage,
  NotebookCanvas,
  Vignette,
  ScreenOverlay,
  LogoImg,
} from "./Empresas.styles";

const VIDEO_SRC = "/assets/generated/empresas-notebook.mp4";
// Clipe mais longo agora (abertura + digitação, ~10s em vez do loop anterior de 5s), então mais
// amostras para manter a mesma resolução temporal.
const FRAME_COUNT = 64;

// Fração do intervalo de progresso do scroll em que a tampa termina de abrir E as mãos já
// tiveram tempo de se acomodar no teclado — estimado, não medido a partir de um frame real (pode
// precisar de um ajuste de calibração depois de visto). Empurrado mais para frente que o próprio
// ponto de abertura da tampa para que os logos não comecem enquanto as mãos ainda estão no ar
// descendo até as teclas.
// OBS: essa fração mapeia diretamente para um frame de vídeo bruto (floatIndex = progress *
// frameCount) independente de `distance` — distance só muda quanto de scroll físico uma
// determinada fração de progresso consome, nunca qual frame de vídeo ela mostra. Então isso NÃO
// deve ser reescalado quando distance mudar (uma tentativa anterior de fazer isso fez os logos
// começarem antes da tampa realmente terminar de abrir no vídeo). 0.8 em vez do 0.78 original
// adiciona um pouco mais de margem, conforme pedido, além de corrigir essa regressão.
const OPEN_THRESHOLD = 0.8;
const SCREEN_FADE_IN = 0.08; // quanto de progresso extra a própria tela leva para aparecer depois disso

const LOGOS = [
  { src: "/assets/logos/netflix.svg", alt: "Netflix" },
  { src: "/assets/logos/amazon.svg", alt: "Amazon" },
  { src: "/assets/logos/ifood.svg", alt: "iFood" },
  { src: "/assets/logos/mercadolivre.svg", alt: "Mercado Livre" },
];

// Cada logo ganha uma pausa real (um momento parado em opacidade total) em vez de fazer um
// crossfade direto para o próximo — [fadeInStart, fadeInEnd, holdEnd, fadeOutEnd], sequencial
// dentro do intervalo que sobra depois de OPEN_THRESHOLD. O holdEnd/fadeOutEnd da última entrada
// são substituídos por Infinity no momento da renderização (ver o isLast check abaixo), para que
// ele permaneça em vez de desaparecer.
// Ampliado para preencher [OPEN_THRESHOLD, 1] (agora 0.2 de largura em vez do 0.22 original —
// fração mais estreita, mas a distância cresceu de 3.6 para 4.39, então o scroll *absoluto* para
// toda essa fase acaba sendo maior que antes) — mesmo formato/ordem por logo, só mais espaço por
// pausa.
const LOGO_WINDOWS = [
  [0.8, 0.818, 0.841, 0.85],
  [0.85, 0.868, 0.891, 0.9],
  [0.9, 0.918, 0.941, 0.95],
  [0.95, 0.968, 0.991, 1],
];

const EYEBROW_TEXT = "Mercado aquecido e você preparado";
const TITLE_TEXT = "Domine além do código";
const CARDS = [
  "Aqui você não só aprende a escrever código",
  "Você aprende como o mercado de trabalho funciona",
  "E como estar preparado para trabalhar em empresas de alto nível",
];

// O título (+ eyebrow) não se move — ele só aparece lentamente com fade, no lugar — então só
// precisa de [fadeInStart, fadeInEnd]; uma vez dentro, ele fica. Reescalado (mesmo fator 0.82 do
// OPEN_THRESHOLD) para manter seu tempo de scroll absoluto idêntico depois que a distância cresceu
// — ver OPEN_THRESHOLD acima.
const TITLE_WINDOW = [0, 0.115];

// Cards: [fadeInStart, fadeInEnd, holdEnd, fadeOutEnd] em progresso de scroll (0..1) —
// sequencial, um totalmente sumido antes do próximo começar a aparecer. As janelas de fade-in são
// propositalmente curtas (rápidas) agora que o easing faz o trabalho de deixar a subida suave.
// Reescalado junto com TITLE_WINDOW/OPEN_THRESHOLD — mesmo tempo de scroll absoluto de antes.
const CARD_WINDOWS = [
  [0.115, 0.197, 0.312, 0.353],
  [0.353, 0.435, 0.549, 0.59],
  [0.59, 0.672, 0.787, 0.82],
];

// Cards: a opacidade sobe até 1 dentro dessa fração da janela de fade-in — mantida abaixo de 1
// para que o card ainda esteja visivelmente se deslocando (não só aparecendo no lugar). O título
// não tem deslocamento, então usa fração 1 (a opacidade suaviza gradualmente por toda a janela
// dele, em vez disso).
const CARD_OPACITY_FRACTION = 0.55;
const EXIT_RISE_PX = 48;
const ENTER_RISE_BUFFER_PX = 40;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Anima um item sequencial: sobe de `riseDistance` abaixo até o lugar (totalmente suavizado,
 * não linear — um translate linear passa a sensação de rígido/mecânico), depois opcionalmente
 * segura, depois opcionalmente desaparece enquanto sobe. `riseDistance: 0` dá um fade puro no
 * lugar (usado para o título). Passe holdEnd/fadeOutEnd como Infinity para um item que deve
 * permanecer depois de entrar.
 */
function animateSequentialItem(t, fadeInStart, fadeInEnd, holdEnd, fadeOutEnd, riseDistance, opacityFraction = CARD_OPACITY_FRACTION) {
  if (t <= fadeInStart) return { opacity: 0, translateY: riseDistance };

  if (t < fadeInEnd) {
    const posT = (t - fadeInStart) / (fadeInEnd - fadeInStart);
    const easedPos = easeOutCubic(posT);
    const opacityT = clamp01(posT / opacityFraction);
    return { opacity: opacityT, translateY: (1 - easedPos) * riseDistance };
  }

  if (t <= holdEnd) return { opacity: 1, translateY: 0 };

  if (t < fadeOutEnd) {
    const exitT = (t - holdEnd) / (fadeOutEnd - holdEnd);
    return { opacity: 1 - exitT, translateY: -exitT * EXIT_RISE_PX };
  }

  return { opacity: 0, translateY: -EXIT_RISE_PX };
}

export function Empresas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const screenOverlayRef = useRef(null);
  const titleGroupRef = useRef(null);
  const cardsColRef = useRef(null);
  const logoRefs = useRef([]);
  const cardRefs = useRef([]);
  const cardsRiseRef = useRef(400);

  // Carrega de forma antecipada assim que monta, igual antes — adiar o início (tentado tanto via
  // proximidade do viewport quanto um timer fixo) só reduz a vantagem que ele ganha enquanto o
  // usuário ainda está rolando pelo Hero, o que piorava as chegadas em scroll rápido, não
  // melhorava. A correção de fato para isso é a passada grosseira abaixo: uma varredura rápida com
  // poucos frames por todo o clipe termina bem mais rápido que a passada completa de 64 frames,
  // então dar scrub em qualquer ponto da seção sempre tem *algum* frame para mostrar — não fica
  // travado no frame 0 (seu frame de prioridade) — enquanto a passada fina continua refinando em
  // segundo plano.
  const { frames, coarseFrames, ready, primaryReady } = useVideoFrames(VIDEO_SRC, {
    frameCount: FRAME_COUNT,
    priorityIndex: 0,
    coarseCount: 16,
  });

  // A que distância abaixo de sua posição de repouso a coluna de cards precisa começar para
  // realmente vir da borda inferior da tela — medido contra o viewport real. O título não se move,
  // então não precisa dessa medição (ver a chamada `riseDistance: 0` mais abaixo).
  const measureRiseDistances = useCallback(() => {
    if (cardsColRef.current) {
      // O próprio CardsCol nunca é transformado (só os filhos Card dentro dele são),
      // então sua posição é sempre confiável de ler diretamente.
      const rect = cardsColRef.current.getBoundingClientRect();
      cardsRiseRef.current = Math.max(window.innerHeight - rect.top + ENTER_RISE_BUFFER_PX, 0);
    }
  }, []);

  useEffect(() => {
    measureRiseDistances();
    window.addEventListener("resize", measureRiseDistances);
    // Seções irmãs adicionadas depois (seus próprios pin-spacers, vídeos, etc.) podem mudar o
    // layout geral da página depois da medição inicial dessa seção — o evento "refresh" do GSAP
    // dispara sempre que o ScrollTrigger recalcula qualquer coisa, que é o sinal geral para
    // remedir.
    ScrollTrigger.addEventListener("refresh", measureRiseDistances);
    return () => {
      window.removeEventListener("resize", measureRiseDistances);
      ScrollTrigger.removeEventListener("refresh", measureRiseDistances);
    };
  }, [measureRiseDistances]);

  const render = useCallback(
    (progress) => {
      // Notebook: digitação da mão / vapor em loop, câmera travada, então mapeia 1:1 com o scroll —
      // não precisa de reenquadramento aqui (isso era só para a virada costas->perfil do Hero).
      // Desenha a partir do conjunto grosseiro que chega rápido até o conjunto fino completo
      // terminar de extrair, mesma transição que o Hero já faz — mesmo espaço de proporção nos dois
      // casos (ver useVideoFrames), então não há salto quando faz a troca.
      const canvas = canvasRef.current;
      const list = ready ? frames.current : coarseFrames.current;
      if (canvas && list.length) {
        const floatIndex = progress * (list.length - 1);
        // Os frames do conjunto grosseiro ficam distantes o bastante no tempo para que fazer crossfade
        // entre dois deles pareça um fantasma de dupla exposição (poses bem diferentes misturadas)
        // em vez de movimento suave — então enquanto só o conjunto grosseiro está disponível, apenas
        // segura o único frame mais próximo, sem blend. Os frames do conjunto fino ficam próximos o
        // suficiente entre si para o blend passar a sensação de movimento, então ele continua fazendo
        // isso assim que estiver pronto.
        const indexA = ready ? Math.floor(floatIndex) : Math.round(floatIndex);
        const indexB = ready ? Math.min(indexA + 1, list.length - 1) : indexA;
        const blend = ready ? floatIndex - indexA : 0;
        const frameA = list[indexA];
        const frameB = list[indexB];

        if (frameA || frameB) {
          const ctx = canvas.getContext("2d");
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const targetW = Math.round(canvas.clientWidth * dpr);
          const targetH = Math.round(canvas.clientHeight * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          if (frameA) {
            ctx.globalAlpha = 1;
            drawImageCover(ctx, frameA, canvas.width, canvas.height);
          }
          if (frameB && frameB !== frameA) {
            ctx.globalAlpha = frameA ? blend : 1;
            drawImageCover(ctx, frameB, canvas.width, canvas.height, { clear: !frameA });
            ctx.globalAlpha = 1;
          }
        }
      }

      // Tela: escondida enquanto a tampa está fechada/abrindo (nada para mostrar ainda), aparece
      // bem quando a tampa termina de abrir, e então os logos fazem crossfade dentro do que sobra
      // do intervalo de scroll — não o intervalo completo 0..1 como antes.
      if (screenOverlayRef.current) {
        const screenOpacity = clamp01((progress - OPEN_THRESHOLD) / SCREEN_FADE_IN);
        screenOverlayRef.current.style.opacity = screenOpacity.toFixed(3);
      }
      // Cada logo aparece, segura, e depois desaparece antes do próximo começar — exceto o
      // último (Mercado Livre), que permanece assim que chega em vez de deixar a tela em branco no
      // final do scroll.
      const lastLogoIndex = LOGOS.length - 1;
      logoRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b, c, d] = LOGO_WINDOWS[i];
        const isLast = i === lastLogoIndex;
        const { opacity } = animateSequentialItem(progress, a, b, isLast ? Infinity : c, isLast ? Infinity : d, 0, 1);
        el.style.opacity = opacity.toFixed(3);
      });

      // Título: sem deslocamento, só um fade lento no lugar (riseDistance 0, a opacidade suaviza por
      // toda a janela em vez de uma fração rápida dela) — depois permanece.
      if (titleGroupRef.current) {
        const [a, b] = TITLE_WINDOW;
        const { opacity } = animateSequentialItem(progress, a, b, Infinity, Infinity, 0, 1);
        titleGroupRef.current.style.opacity = opacity.toFixed(3);
      }

      // Cards: sobem visivelmente, seguram, e depois desaparecem enquanto sobem — sequencial.
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b, c, d] = CARD_WINDOWS[i];
        const { opacity, translateY } = animateSequentialItem(progress, a, b, c, d, cardsRiseRef.current);
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translateY(${translateY.toFixed(2)}px)`;
      });
    },
    [frames, coarseFrames, ready]
  );

  // Cresceu de 3.6 para 4.39 unicamente para dar mais espaço de scroll absoluto à fase dos logos —
  // todas as outras janelas acima foram reescaladas pelo mesmo fator 3.6/4.39 para que seu tempo de
  // scroll absoluto (quando a tampa termina de abrir, quando cada card entra/sai) permaneça
  // exatamente como era.
  useStickyScrub(containerRef, { distance: 4.39, onUpdate: render });

  useEffect(() => {
    if (primaryReady) {
      measureRiseDistances();
      render(0);
    }
  }, [primaryReady, render, measureRiseDistances]);

  return (
    <Wrapper ref={containerRef}>
      <TextColumn>
        <TitleGroup ref={titleGroupRef}>
          <Eyebrow>{EYEBROW_TEXT}</Eyebrow>
          <Title>{TITLE_TEXT}</Title>
        </TitleGroup>
        <CardsCol ref={cardsColRef}>
          {CARDS.map((text, i) => (
            <Card key={i} ref={(el) => (cardRefs.current[i] = el)}>
              {text}
            </Card>
          ))}
        </CardsCol>
      </TextColumn>

      <NotebookStage>
        <NotebookCanvas ref={canvasRef} data-ready={primaryReady} />
        <Vignette />
        <ScreenOverlay ref={screenOverlayRef}>
          {LOGOS.map((logo, i) => (
            <LogoImg key={logo.alt} ref={(el) => (logoRefs.current[i] = el)} src={logo.src} alt={logo.alt} />
          ))}
        </ScreenOverlay>
      </NotebookStage>
    </Wrapper>
  );
}
