import styled from "styled-components";

export const Wrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: ${({ theme }) => theme.zIndex.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem clamp(1.5rem, 5vw, 4rem);
  background: rgba(5, 5, 5, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const LogoImg = styled.img`
  height: clamp(32px, 4vw, 44px);
  width: auto;
`;

export const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(1rem, 2.5vw, 2rem);
`;

export const StudentAreaText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.85rem, 1vw, 1rem);
  font-weight: 500;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

export const CTAButton = styled.button`
  background: ${({ theme }) => theme.colors.blue};
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  white-space: nowrap;
  transition: background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.blueHover};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;
