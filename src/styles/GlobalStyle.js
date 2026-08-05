import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700;800&display=swap");

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    overflow-x: hidden;
  }

  /* Restrito ao main (não ao #root) para que o Header — um irmão do main, não um descendente —
     fique fora do efeito de containing-block dessa perspective e seu position: fixed continue
     funcionando em relação ao viewport real. Ver src/lib/gsap.js para entender por que perspective
     quebra o position: fixed de qualquer descendente. */
  main {
    perspective: 1500px;
    perspective-origin: 50% 50%;
  }

  h1, h2, h3, h4 {
    font-family: ${({ theme }) => theme.fonts.heading};
    line-height: 1.1;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
  }

  img {
    max-width: 100%;
    display: block;
  }
`;
