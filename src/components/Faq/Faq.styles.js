import styled from "styled-components";

export const Wrapper = styled.section`
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: #121920;
  padding: clamp(5rem, 12vh, 8rem) clamp(1.5rem, 6vw, 6rem);
`;

/* Same fade-up entrance as Certificados/SalariosDev — no pin, no scroll-scrub. */
export const Inner = styled.div`
  max-width: 860px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s ease, transform 0.9s ease;

  &[data-visible="true"] {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Title = styled.h2`
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1.9rem, 3.2vw, 2.6rem);
  text-align: center;
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
`;

export const Item = styled.div`
  background: #171b26;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  overflow: hidden;
`;

export const QuestionButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(1.1rem, 2vw, 1.4rem) clamp(1.25rem, 2.5vw, 1.6rem);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: #ffffff;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 700;
  font-size: clamp(1rem, 1.3vw, 1.1rem);
`;

export const ToggleIcon = styled.svg`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.blueLight};
  transition: transform 0.3s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
`;

/* Height-animates the answer without measuring scrollHeight in JS — grid-template-rows
   0fr -> 1fr transitions smoothly, with AnswerInner's overflow:hidden clipping the content
   while it's collapsed. */
export const AnswerGrid = styled.div`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 0.35s ease;
`;

export const AnswerInner = styled.div`
  overflow: hidden;
`;

export const AnswerText = styled.p`
  padding: 0 clamp(1.25rem, 2.5vw, 1.6rem) clamp(1.1rem, 2vw, 1.4rem);
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.92rem, 1.1vw, 1rem);
  line-height: 1.65;
`;
