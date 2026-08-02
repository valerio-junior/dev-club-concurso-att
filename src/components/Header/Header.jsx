import { Wrapper, LogoImg, RightGroup, StudentAreaText, CTAButton } from "./Header.styles";

export function Header() {
  return (
    <Wrapper>
      <LogoImg src="/assets/logo-devclub/logo-devclub.png" alt="DevClub" />

      <RightGroup>
        <StudentAreaText>Área do aluno</StudentAreaText>
        <CTAButton type="button">Quero ser aluno</CTAButton>
      </RightGroup>
    </Wrapper>
  );
}
