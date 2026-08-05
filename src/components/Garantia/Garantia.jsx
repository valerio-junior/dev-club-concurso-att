import { useCallback, useRef } from "react";
import { useStickyScrub } from "../../hooks/useStickyScrub";
import { Wrapper, Inner, ShieldWrapper, ShieldImage, TextCol, Title, TitleHighlight, Description } from "./Garantia.styles";

const SHIELD_SRC = "/assets/garantia/escudo-garantia.png";

const DISTANCE = 2.2;

// O escudo sobe e se acomoda no lugar primeiro; só depois que ele chega totalmente é que o texto
// começa a subir — sequencial, não sobreposto — depois os dois ficam parados pelo resto do espaço
// de scroll antes da seção soltar o pin.
const SHIELD_WINDOW = [0, 0.55];
const TEXT_WINDOW = [0.55, 0.85];

// A que distância abaixo da seção (em vh) cada elemento começa — grande o suficiente para que,
// combinado com o overflow:hidden do Wrapper, ambos fiquem totalmente fora da tela no progresso 0.
const SHIELD_START_VH = 70;
const TEXT_START_VH = 55;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function Garantia() {
  const containerRef = useRef(null);
  const shieldRef = useRef(null);
  const textRef = useRef(null);

  const render = useCallback((progress) => {
    if (shieldRef.current) {
      const [start, end] = SHIELD_WINDOW;
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      shieldRef.current.style.transform = `translateY(${(SHIELD_START_VH * (1 - t)).toFixed(2)}vh)`;
      shieldRef.current.style.opacity = t.toFixed(3);
    }

    if (textRef.current) {
      const [start, end] = TEXT_WINDOW;
      const t = easeOutCubic(clamp01((progress - start) / (end - start)));
      textRef.current.style.transform = `translateY(${(TEXT_START_VH * (1 - t)).toFixed(2)}vh)`;
      textRef.current.style.opacity = t.toFixed(3);
    }
  }, []);

  useStickyScrub(containerRef, { distance: DISTANCE, onUpdate: render });

  return (
    <Wrapper ref={containerRef}>
      <Inner>
        <ShieldWrapper ref={shieldRef} style={{ transform: `translateY(${SHIELD_START_VH}vh)`, opacity: 0 }}>
          <ShieldImage src={SHIELD_SRC} alt="Selo de garantia" />
        </ShieldWrapper>

        <TextCol ref={textRef} style={{ transform: `translateY(${TEXT_START_VH}vh)`, opacity: 0 }}>
          <Title>
            Sua satisfação garantida ou <TitleHighlight>100% do dinheiro de volta</TitleHighlight>
          </Title>
          <Description>
            Tenho absoluta confiança na qualidade do material. Se nos primeiros 7 dias você entender que o conteúdo não
            atendeu às suas expectativas, basta solicitar o reembolso com apenas um clique. Devolvemos todo o seu
            investimento, sem burocracia e sem perguntas.
          </Description>
        </TextCol>
      </Inner>
    </Wrapper>
  );
}
