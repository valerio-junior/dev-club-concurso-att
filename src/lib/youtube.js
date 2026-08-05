let apiPromise = null;

// Carrega a API do YouTube IFrame Player uma única vez (compartilhada entre todos os chamadores) e
// resolve com o objeto global `window.YT` assim que ele estiver realmente utilizável (`YT.Player`
// existe) — os componentes podem simplesmente fazer `await loadYouTubeApi()` sem se preocupar com
// a tag de script ou disputas de carregamento.
export function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

  return apiPromise;
}
