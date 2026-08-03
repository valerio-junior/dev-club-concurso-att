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

  /* Scoped to main (not #root) so the Header — a sibling of main, not a descendant — stays
     outside this perspective's containing-block effect and its position: fixed keeps working
     against the real viewport. See src/lib/gsap.js for why perspective breaks position: fixed
     for any descendant. */
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
