import { useEffect, useState } from "react";

interface TypewriterProps {
  text: string;
}

export function Typewriter({ text, speed = 50 }: TypewriterProps & { speed?: number }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;

      if (i > text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="border-r-2 border-black pr-1 animate-pulse">
      {displayed}
    </span>
  );
}