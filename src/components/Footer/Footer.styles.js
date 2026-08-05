import styled from "styled-components";

export const Wrapper = styled.footer`
  position: relative;
  width: 100%;
  background-color: #121920;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: clamp(2.25rem, 4vh, 3rem) clamp(1.5rem, 5vw, 4rem);
`;

/* Logo | nav | ícones sociais — as duas colunas externas compartilham a mesma largura (1fr cada), então
   o mesmo padding horizontal dá margens equivalentes para o logo e os ícones em cada borda, com
   o nav centralizado na coluna do meio independente de quão largas as outras duas acabem ficando. */
export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 1.75rem;
  }
`;

export const LogoImg = styled.img`
  justify-self: start;
  height: clamp(30px, 3.6vw, 40px);
  width: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    justify-self: center;
  }
`;

export const Nav = styled.nav`
  justify-self: center;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(1.25rem, 3vw, 2.25rem);
`;

export const NavLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.9rem, 1vw, 0.98rem);
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: #ffffff;
  }
`;

export const SocialRow = styled.div`
  justify-self: end;
  display: flex;
  align-items: center;
  gap: clamp(0.9rem, 2vw, 1.25rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    justify-self: center;
  }
`;

export const SocialLink = styled.a`
  display: flex;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: color 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.blueLight};
  }
`;

export const Copyright = styled.p`
  margin-top: clamp(1.75rem, 3.5vh, 2.5rem);
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.85rem;
`;
