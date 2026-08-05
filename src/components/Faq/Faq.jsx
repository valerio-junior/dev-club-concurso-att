import { useEffect, useRef, useState } from "react";
import {
  Wrapper,
  Inner,
  Title,
  List,
  Item,
  QuestionButton,
  ToggleIcon,
  AnswerGrid,
  AnswerInner,
  AnswerText,
} from "./Faq.styles";

const FAQ_ITEMS = [
  {
    question: "Quem é o Rodolfo?",
    answer:
      "De ex eletricista para um dos melhores mentores e profissionais da área de tecnologia, já passou dificuldades, teve medos e dúvidas se iria conseguir migrar de área, igual a grande maioria de vocês, comprou cursos que não tinham didáticas tão boas, e com isso ele sabe a sua dor, e trás o melhor método de ensino para você!",
  },
  {
    question: "Porque devo comprar o curso de vocês?",
    answer:
      "Fique tranquilo, você não é cobaia, nossa metodologia ajudou, e vem ajudando milhares de pessoas como você, venha fazer parte disso.",
  },
  {
    question: "Teremos acesso a comunidade?",
    answer:
      "Sim! e temos muitos profissionais na comunidade, os que começaram agora e também os que já são Pleno, Sênior e podem te ajudar, você não está sozinho!",
  },
  {
    question: "O curso é para iniciantes ou precisa ter uma base?",
    answer:
      "Os dois. Se você está começando, os cursos te dão a base. Se já tem repertório, eles te ajudam a chegar mais rápido no seu objetivo.",
  },
  {
    question: "Eu já trabalho na área, o curso vai agregar para mim?",
    answer:
      "Sim, e muito! temos formações do básico ao avançado, para programadores e pessoas que irão migrar para essa área, temos módulos de IA, análise de dados e muitos outros!",
  },
  {
    question: "O curso disponibiliza certificado?",
    answer:
      "Sim, e com grande peso no mercado de trabalho, por mostrar que está estudando e adquirindo conhecimentos técnicos, e por fazer parte dessa grande família DevClub.",
  },
  {
    question: "Qual são as formas de pagamento?",
    answer:
      "Conseguimos fazer à vista, no pix e até 12x no cartão de crédito, e claro! no boleto, então não tem desculpa para não fazer parte disso.",
  },
  {
    question: "Como recebo o acesso ao conteúdo?",
    answer:
      "Logo após a confirmação do pagamento, você receberá um e-mail com todas as instruções e seus dados de acesso imediato à plataforma.",
  },
  {
    question: "Como funciona a garantia de 7 dias?",
    answer:
      "Você pode testar todo o conteúdo por 7 dias. Se por qualquer motivo achar que não é para você, basta solicitar o reembolso e devolvemos 100% do valor investido.",
  },
  {
    question: "Por quanto tempo terei acesso?",
    answer:
      "Você terá acesso por 12 meses completos a todo o conteúdo da Formação DevClub, incluindo as atualizações e novos módulos que forem sendo liberados durante esse período. Mas caso queira renovar você pode! Além de temos oportunidades para se tornar um vitalício, e nessa parte nosso suporte pode te ajudar.",
  },
];

export function Faq() {
  const wrapperRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

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

  const toggle = (index) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <Wrapper id="perguntas" ref={wrapperRef}>
      <Inner data-visible={visible}>
        <Title>Perguntas frequentes</Title>

        <List>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <Item key={item.question}>
                <QuestionButton onClick={() => toggle(i)} aria-expanded={isOpen}>
                  {item.question}
                  <ToggleIcon
                    $open={isOpen}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </ToggleIcon>
                </QuestionButton>
                <AnswerGrid $open={isOpen}>
                  <AnswerInner>
                    <AnswerText>{item.answer}</AnswerText>
                  </AnswerInner>
                </AnswerGrid>
              </Item>
            );
          })}
        </List>
      </Inner>
    </Wrapper>
  );
}
