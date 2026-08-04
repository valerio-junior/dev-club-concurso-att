import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "../../lib/youtube";
import {
  Wrapper,
  Heading,
  Stage,
  Viewport,
  Track,
  Slide,
  VideoStage,
  TextBlock,
  Quote,
  Name,
  RoleLine,
  ArrowButton,
} from "./Depoimentos.styles";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Gabriel Santos",
    role: "Desenvolvedor Front-end Jr na ",
    company: "Netflix",
    quote:
      '"A didática e os projetos práticos foram o divisor de águas na minha carreira. Antes do curso eu não sabia como montar um portfólio profissional, e em menos de 3 meses após terminar, consegui minha primeira vaga dev!"',
    youtubeId: "S9uPNppGsGo",
    startTime: 1,
    endTime: 11,
  },
  {
    id: 3,
    name: "Lucas Andrade",
    role: "Desenvolvedor React no ",
    company: "Ifood",
    quote:
      '"O grande diferencial foi aprender como o mercado realmente trabalha. Não foi só sintaxe de código, mas sim arquitetura, boas práticas e como resolver problemas reais do dia a dia."',
    youtubeId: "zqkMdn1tANw",
    startTime: 1,
    endTime: 20,
  },
  {
    id: 4,
    name: "Mosh Ramedami",
    role: "Desenvolvedor Back-end no ",
    company: "Facebook",
    quote:
      '"Consegui aplicar no meu trabalho atual tudo o que aprendi e logo fui promovido. A qualidade das aulas e o foco em UI/UX moderno me destacaram de todos os outros candidatos."',
    youtubeId: "Ke90Tje7VS0",
    startTime: 3,
    endTime: 14,
  },
  {
    id: 5,
    name: "João Alves",
    role: "Desenvolvedor Full Stack Jr na ",
    company: "Amazon",
    quote:
      '"O suporte durante o curso e o networking que criei foram sensacionais. A sensação de ver meus projetos rodando em produção e recebendo elogios nas entrevistas não tem preço."',
    youtubeId: "fTcWRLv56Xc",
    startTime: 4,
    endTime: 15,
  },
  {
    id: 6,
    name: "Camila Vasconcelos",
    role: "Desenvolvedor Front-end pleno na ",
    company: "Globo",
    quote:
      '"Foi o melhor investimento que fiz no meu ano. Se você busca sair do zero e chegar ao mercado preparado para os desafios reais, esse é o caminho certo sem enrolação."',
    youtubeId: "bmuWW2kF60o",
    startTime: 42,
    endTime: 53,
  },
];

export function Depoimentos() {
  const [index, setIndex] = useState(0);
  const mountRef = useRef(null);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(TESTIMONIALS.length - 1, i + 1));

  // Only the active slide gets a real YT.Player (the rest just show a thumbnail) — created
  // fresh on a plain DOM node (not one React itself renders into) so the IFrame API is free to
  // replace it with its own iframe without React ever trying to diff/remove that node itself.
  useEffect(() => {
    let cancelled = false;
    const outer = mountRef.current;
    if (!outer) return undefined;

    const mountPoint = document.createElement("div");
    mountPoint.style.width = "100%";
    mountPoint.style.height = "100%";
    outer.appendChild(mountPoint);

    const current = TESTIMONIALS[index];
    let player = null;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT) return;
      player = new YT.Player(mountPoint, {
        videoId: current.youtubeId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          start: current.startTime,
          end: current.endTime,
          // No controls at all — with the seek bar gone there's no way to drag outside the
          // start/end trim, pause, unmute, or change any setting; it just plays on loop.
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0,
          playsinline: 1,
        },
        events: {
          // `end` stops the clip there, but looping back to the start (instead of just
          // stopping) needs an explicit seek+replay once it reports ENDED.
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(current.startTime, true);
              event.target.playVideo();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy?.();
      outer.innerHTML = "";
    };
  }, [index]);

  return (
    <Wrapper>
      <Heading>O que dizem nossos alunos</Heading>
      <Stage>
        <ArrowButton $side="left" $visible={index > 0} onClick={goPrev} aria-label="Depoimento anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </ArrowButton>

        <Viewport>
          <Track $index={index}>
            {TESTIMONIALS.map((t, i) => (
              <Slide key={t.id}>
                <VideoStage>
                  {i === index ? (
                    <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <img src={`https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg`} alt="" />
                  )}
                </VideoStage>
                <TextBlock>
                  <Quote>{t.quote}</Quote>
                  <Name>{t.name}</Name>
                  <RoleLine>
                    {t.role}
                    {t.company}
                  </RoleLine>
                </TextBlock>
              </Slide>
            ))}
          </Track>
        </Viewport>

        <ArrowButton $side="right" $visible={index < TESTIMONIALS.length - 1} onClick={goNext} aria-label="Próximo depoimento">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </ArrowButton>
      </Stage>
    </Wrapper>
  );
}
