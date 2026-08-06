import { useCallback, useState } from "react";
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import { GlobalStyle } from "./styles/GlobalStyle";
import { useLenis } from "./hooks/useLenis";
import { Loader } from "./components/Loader";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Empresas } from "./components/Empresas";
import { FormacoesConteudosIA } from "./components/FormacoesConteudosIA";
import { Evolucao } from "./components/Evolucao";
import { PlataformaProjetos } from "./components/PlataformaProjetos";
import { Depoimentos } from "./components/Depoimentos";
import { Professores } from "./components/Professores";
import { ModuloBonus } from "./components/ModuloBonus";
import { Certificados } from "./components/Certificados";
import { SalariosDev } from "./components/SalariosDev";
import { Garantia } from "./components/Garantia";
import { Faq } from "./components/Faq";
import { Footer } from "./components/Footer";

function App() {
  useLenis();
  const [introDone, setIntroDone] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {!introDone && <Loader onComplete={handleIntroComplete} />}
      <Header />
      <main>
        <Hero />
        <Empresas />
        <FormacoesConteudosIA />
        <Evolucao />
        <PlataformaProjetos />
        <Depoimentos />
        <Professores />
        <ModuloBonus />
        <Certificados />
        <SalariosDev />
        <Garantia />
        <Faq />
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
