import { useLayoutEffect } from "react";
import { gsap } from "../../lib/gsap";

const SCRAMBLE_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$&";

const BUILD_STAGGER = 0.016;
const BUILD_DURATION = 0.5;
const MORPH_STAGGER_STEP = 0.02;
const MORPH_LETTER_DURATION = 0.9;
const MORPH_HOLD_AFTER = 2.6; // quanto tempo a frase B fica parada, legível, antes de explodir
const EXPLODE_STAGGER = 0.004;
const EXPLODE_DURATION = 0.75;

function randomScrambleChar() {
  return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
}

// Monta um modelo palavra->letra alinhado por índice de palavra entre as duas frases. A frase B
// (mais longa) define quantas palavras/letras existem no total; posições que só existem em B
// nascem vazias (crescem na fase de morph), posições que só existem em A somem na fase de morph.
export function buildPhraseModel(phraseA, phraseB) {
  const wordsA = phraseA.split(" ");
  const wordsB = phraseB.split(" ");
  const wordCount = Math.max(wordsA.length, wordsB.length);
  const model = [];

  for (let w = 0; w < wordCount; w += 1) {
    const wordA = wordsA[w] ?? "";
    const wordB = wordsB[w] ?? "";
    const letterCount = Math.max(wordA.length, wordB.length);
    const letters = [];
    for (let l = 0; l < letterCount; l += 1) {
      letters.push({ a: wordA[l] ?? "", b: wordB[l] ?? "" });
    }
    model.push(letters);
  }

  return model;
}

export function buildSingleWordModel(phrase) {
  return phrase.split(" ").map((word) => word.split(""));
}

/**
 * Orquestra as fases 1-3 da intro (build da frase A, morph letra a letra até a frase B, explosão)
 * como uma única timeline GSAP baseada em tempo (não em scroll — diferente do resto do site).
 */
export function useIntroTimeline({ containerRef, active, onDone }) {
  useLayoutEffect(() => {
    if (!active || !containerRef.current) return undefined;

    const ctx = gsap.context(() => {
      const chars = Array.from(containerRef.current.querySelectorAll("[data-intro-char]"));
      const aChars = chars.filter((el) => el.dataset.a);
      const bVisibleChars = chars.filter((el) => el.dataset.b);

      gsap.set(chars, { opacity: 0, y: 22 });

      const tl = gsap.timeline({ onComplete: onDone });

      // Fase 1 — a frase A nasce, letra por letra.
      tl.to(aChars, {
        opacity: 1,
        y: 0,
        duration: BUILD_DURATION,
        ease: "back.out(1.7)",
        stagger: BUILD_STAGGER,
      }, 0);

      tl.addLabel("morphStart", ">+=0.35");

      // Fase 2 — cada posição troca de letra (A -> B) ou nasce/some conforme o tamanho de cada frase.
      // Mais lenta de propósito (duração + passo de stagger maiores) pra ler como uma transformação
      // tecnológica de verdade, não uma troca instantânea.
      chars.forEach((el, i) => {
        const a = el.dataset.a;
        const b = el.dataset.b;
        const pos = `morphStart+=${(i * MORPH_STAGGER_STEP).toFixed(3)}`;

        if (a && b) {
          const obj = { p: 0 };
          tl.to(obj, {
            p: 1,
            duration: MORPH_LETTER_DURATION,
            ease: "none",
            onUpdate: () => {
              el.textContent = obj.p > 0.75 ? b : randomScrambleChar();
            },
            onComplete: () => {
              el.textContent = b;
            },
          }, pos);
        } else if (!a && b) {
          tl.call(() => {
            el.textContent = b;
          }, null, pos);
          tl.to(el, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, pos);
        } else if (a && !b) {
          // Some da frase, e só depois de invisível colapsa a largura (limpando o texto) — senão o
          // caractere continua ocupando espaço mesmo com opacity 0, abrindo um vão na palavra.
          tl.to(el, {
            opacity: 0,
            y: -16,
            duration: 0.3,
            onComplete: () => {
              el.textContent = "";
            },
          }, pos);
        }
      });

      // Buffer até o fim do morph, mais o hold pra frase B ficar legível na tela antes de explodir.
      const morphSpan = chars.length * MORPH_STAGGER_STEP + MORPH_LETTER_DURATION + MORPH_HOLD_AFTER;
      tl.addLabel("explodeStart", `morphStart+=${morphSpan.toFixed(3)}`);

      // Fase 3 — explosão: metade esquerda da tela voa pra esquerda, metade direita pra direita.
      tl.to(bVisibleChars, {
        x: (i, target) => {
          const rect = target.getBoundingClientRect();
          const dir = rect.left + rect.width / 2 < window.innerWidth / 2 ? -1 : 1;
          return dir * gsap.utils.random(220, 520);
        },
        y: () => gsap.utils.random(-160, 160),
        rotation: (i, target) => {
          const rect = target.getBoundingClientRect();
          const dir = rect.left + rect.width / 2 < window.innerWidth / 2 ? -1 : 1;
          return dir * gsap.utils.random(35, 100);
        },
        opacity: 0,
        duration: EXPLODE_DURATION,
        ease: "power2.in",
        stagger: EXPLODE_STAGGER,
      }, "explodeStart");
    }, containerRef);

    return () => ctx.revert();
  }, [active, containerRef, onDone]);
}
