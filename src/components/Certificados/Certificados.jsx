import { useEffect, useRef, useState } from "react";
import {
  Wrapper,
  Inner,
  Title,
  Description,
  CardsRow,
  Card,
  DevClubLogo,
  TechIconsRow,
  TechIconBadge,
  CardTitle,
  CardDescription,
} from "./Certificados.styles";

const TECH_ICONS = [
  { src: "/assets/logos/tech/html5.svg", alt: "HTML5" },
  { src: "/assets/logos/tech/react.svg", alt: "React" },
  { src: "/assets/logos/tech/css3.svg", alt: "CSS3" },
  { src: "/assets/logos/tech/typescript.svg", alt: "TypeScript" },
];

export function Certificados() {
  const wrapperRef = useRef(null);
  const [visible, setVisible] = useState(false);

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

  return (
    <Wrapper ref={wrapperRef}>
      <Inner data-visible={visible}>
        <Title>Certificado gerado e assinado diretamente pelo Rodolfo Mori</Title>
        <Description>Certificados que comprovam seu conhecimento em diversas áreas da tecnologia</Description>

        <CardsRow>
          <Card>
            <DevClubLogo src="/assets/logo-devclub/favicon.ico" alt="DevClub" />
            <CardTitle>Rodolfo Mori</CardTitle>
            <CardDescription>
              Certificados gerados pela maior escola de tecnologia do mercado e assinado pelo CEO Rodolfo Mori, onde vai ser
              ensinado por eles os módulos com a melhor didática possível.
            </CardDescription>
          </Card>

          <Card>
            <TechIconsRow>
              {TECH_ICONS.map((icon) => (
                <TechIconBadge key={icon.alt}>
                  <img src={icon.src} alt={icon.alt} />
                </TechIconBadge>
              ))}
            </TechIconsRow>
            <CardTitle>Diversas tecnologias para seu portfólio</CardTitle>
            <CardDescription>
              Certificados para cada módulo e tecnologia que forem finalizando conforme o curso, onde você pode gerar no
              formato de sua escolha: PDF, PNG, JPG ou JPEG.
            </CardDescription>
          </Card>
        </CardsRow>
      </Inner>
    </Wrapper>
  );
}
