import { useEffect, useRef } from "react";
import TVApp from "../../tvos/App";
import "./App.css";
export default function App() {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const resize = () => {
      const scale = Math.min(
        window.innerWidth / 1920,
        window.innerHeight / 1080
      );
      if (stage.current)
        stage.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };
    resize();
    window.addEventListener("resize", resize);
    const navigate = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const back = [
          ...document.querySelectorAll<HTMLElement>('[role="button"]'),
        ].find((x) =>
          ["Cancel", "Back to app"].includes(x.getAttribute("aria-label") ?? "")
        );
        (
          back ?? document.querySelector<HTMLElement>('[aria-label="◎  Radar"]')
        )?.click();
        return;
      }
      if (
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          event.key
        ) ||
        document.activeElement?.tagName === "INPUT" ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey
      )
        return;
      event.preventDefault();
      const candidates = [
        ...document.querySelectorAll<HTMLElement>('[role="button"], input'),
      ].filter(
        (el) => el.offsetWidth > 0 && el.getBoundingClientRect().height > 0
      );
      const current = document.activeElement as HTMLElement;
      if (!candidates.includes(current)) {
        candidates[0]?.focus();
        return;
      }
      const r = current.getBoundingClientRect();
      const x = r.x + r.width / 2;
      const y = r.y + r.height / 2;
      const horizontal =
        event.key === "ArrowLeft" || event.key === "ArrowRight";
      const sign =
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const ranked = candidates
        .filter((el) => el !== current)
        .map((el) => {
          const box = el.getBoundingClientRect();
          const dx = box.x + box.width / 2 - x;
          const dy = box.y + box.height / 2 - y;
          const forward = (horizontal ? dx : dy) * sign;
          const cross = Math.abs(horizontal ? dy : dx);
          return { el, forward, score: forward + cross * 4 };
        })
        .filter((c) => c.forward > 4)
        .sort((a, b) => a.score - b.score);
      ranked[0]?.el.focus();
      ranked[0]?.el.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    document.addEventListener("keydown", navigate);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", navigate);
    };
  }, []);
  return (
    <div className="tv-stage" ref={stage}>
      <TVApp />
    </div>
  );
}
