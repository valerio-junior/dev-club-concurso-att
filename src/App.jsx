import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import { GlobalStyle } from "./styles/GlobalStyle";
import { useLenis } from "./hooks/useLenis";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Empresas } from "./components/Empresas";
import { FormacoesConteudosIA } from "./components/FormacoesConteudosIA";
import { Evolucao } from "./components/Evolucao";

// Demais seções serão importadas e compostas aqui conforme forem criadas.

function App() {
  useLenis();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Header />
      <main>
        <Hero />
        <Empresas />
        <FormacoesConteudosIA />
        <Evolucao />
      </main>
    </ThemeProvider>
  );
}

export default App;
