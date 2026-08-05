import { scrollToSection } from "../../hooks/useLenis";
import { Wrapper, Row, LogoImg, Nav, NavLink, SocialRow, SocialLink, Copyright } from "./Footer.styles";

const NAV_LINKS = [
  { label: "Projetos", id: "#projetos" },
  { label: "Professores", id: "#professores" },
  { label: "Perguntas", id: "#perguntas" },
  { label: "Certificados", id: "#certificados" },
];

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/devclubescola/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@canaldevclub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/rodolfomori/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <Wrapper>
      <Row>
        <LogoImg src="/assets/logo-devclub/logo-devclub.png" alt="DevClub" />

        <Nav>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.id} type="button" onClick={() => scrollToSection(link.id)}>
              {link.label}
            </NavLink>
          ))}
        </Nav>

        <SocialRow>
          {SOCIAL_LINKS.map((social) => (
            <SocialLink key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
              {social.icon}
            </SocialLink>
          ))}
        </SocialRow>
      </Row>

      <Copyright>© 2026 DevClub. Todos os direitos reservados.</Copyright>
    </Wrapper>
  );
}
