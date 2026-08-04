let apiPromise = null;

// Loads the YouTube IFrame Player API once (shared across every caller) and resolves with the
// global `window.YT` object once it's actually usable (`YT.Player` exists) — components can
// just `await loadYouTubeApi()` without worrying about the script tag or load races.
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
