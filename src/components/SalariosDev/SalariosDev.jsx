import { useEffect, useRef, useState } from "react";
import {
  Wrapper,
  Inner,
  Title,
  CardsRow,
  Card,
  CardValue,
  ValuePrefix,
  ValueNumber,
  ValueSuffix,
  BarTrack,
  BarFill,
  CardRole,
  CardDescription,
} from "./SalariosDev.styles";

const CARDS = [
  {
    value: 3970,
    role: "Desenvolvedor Júnior",
    description: "Está começando a carreira, aplicando o que aprendeu em tarefas menores com apoio de devs mais experientes.",
  },
  {
    value: 6780,
    role: "Desenvolvedor Pleno",
    description: "Já resolve problemas complexos com autonomia e participa das decisões técnicas do dia a dia do time.",
  },
  {
    value: 11780,
    role: "Desenvolvedor Sênior",
    description: "Lidera projetos, define arquitetura e mentora outros devs, com domínio técnico e visão de negócio.",
  },
];

const MAX_VALUE = Math.max(...CARDS.map((c) => c.value));
const COUNT_DURATION = 3000;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const formatInt = (n) => Math.round(n).toLocaleString("pt-BR");

export function SalariosDev() {
  const wrapperRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const numberRefs = useRef([]);
  const barRefs = useRef([]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Counts every card from R$0,00 up to its final value together, once, the moment the section
  // becomes visible — driven imperatively (text content + bar width set directly on the DOM
  // nodes each frame) rather than React state, matching how animated values are done elsewhere
  // on the site (Plataforma, Professores) to avoid a re-render per frame.
  useEffect(() => {
    if (!visible) return undefined;

    let rafId;
    const start = performance.now();

    const tick = (now) => {
      const t = easeOutCubic(clamp01((now - start) / COUNT_DURATION));

      CARDS.forEach((card, i) => {
        const current = card.value * t;
        if (numberRefs.current[i]) numberRefs.current[i].textContent = formatInt(current);
        if (barRefs.current[i]) barRefs.current[i].style.width = `${((current / MAX_VALUE) * 100).toFixed(2)}%`;
      });

      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible]);

  return (
    <Wrapper ref={wrapperRef}>
      <Inner data-visible={visible}>
        <Title>Média salarial de um Desenvolvedor Web</Title>

        <CardsRow>
          {CARDS.map((card, i) => (
            <Card key={card.role}>
              <CardValue>
                <ValuePrefix>R$</ValuePrefix>
                <ValueNumber ref={(el) => (numberRefs.current[i] = el)}>0</ValueNumber>
                <ValueSuffix>,00</ValueSuffix>
              </CardValue>
              <BarTrack>
                <BarFill ref={(el) => (barRefs.current[i] = el)} />
              </BarTrack>
              <CardRole>{card.role}</CardRole>
              <CardDescription>{card.description}</CardDescription>
            </Card>
          ))}
        </CardsRow>
      </Inner>
    </Wrapper>
  );
}
