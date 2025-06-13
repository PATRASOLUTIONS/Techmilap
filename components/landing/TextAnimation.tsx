"use client";

import { cn } from "@/lib/utils";
import { stagger, motion } from "framer-motion";
import { useAnimate, useInView, useScroll, useTransform } from "framer-motion";
import { type JSX, useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className: string;
}

// Scroll Type Write Animation
export function ScrollTypewrite(props: Props) {
  const { text, className } = props;

  const scrollTarget = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollTarget,
    offset: ["start end", "end end"], // offset for tracking the element inside the container
  });

  const value =
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt iusto cum doloremque. Omnis error eum autem, debitis obcaecati, deserunt neque reprehenderit, libero voluptas minima quisquam reiciendis unde voluptates? Ex, quos.";

  const words = text?.length > 0 ? text?.split(" ") : value.split(" ");

  const [currentWord, setCurrentWord] = useState(0);
  const wordIndex = useTransform(scrollYProgress, [0, 0.7], [0, words.length]); // ranges the value from scroll to pick the word

  useEffect(() => {
    wordIndex.on("change", (latest) => {
      setCurrentWord(latest);
    });
  }, [wordIndex]);

  return (
    <section className="relative select-none">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="sticky top-80 font-medium text-center mt-8 p-4 ">
          <div className="text-3xl sm:text-4xl md:text-5xl mb-8 ">
            {words.map((word, wordIndex) => (
              <span
                key={wordIndex}
                className={cn(
                  `transition duration-500 text-white/15 ${className} `,
                  wordIndex < currentWord && "text-white"
                )}
              >{`${word} `}</span>
            ))}
          </div>
        </div>

        <div className={"h-[150vh]"} ref={scrollTarget}></div>
      </div>
    </section>
  );
}

type StaggeredTextProps = {
  text: string;
  el?: keyof JSX.IntrinsicElements;
  className?: string;
  once?: boolean;
};

const defaultAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.1 },
};

export function StaggeredText({
  text,
  el: Wrapper = "p",
  className,
  once,
}: StaggeredTextProps) {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { amount: 0.5, once });

  useEffect(() => {
    if (isInView) {
      animate("span", { opacity: 1 }, { delay: stagger(0.1) });
    } else {
      animate("span", { opacity: 0 }, { duration: 0 });
    }
  }, [isInView, animate]);

  return (
    <section className="container h-screen w-screen mx-auto">
      <div className="flex justify-center items-center top-16 h-full text-center">
        <h1 className="text-6xl md:text-8xl uppercase font-extrabold leading-tight">
          <Wrapper className={className}>
            <span className="sr-only">{text}</span>
            <motion.span ref={scope} initial="hidden" aria-hidden>
              {text.split(" ").map((word, i) => (
                <span key={i} className="inline-block mr-2">
                  {Array.from(word).map((char, j) => (
                    <motion.span
                      key={`${i}-${j}`}
                      className="inline-block"
                      variants={defaultAnimation}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {/* Add actual space between words */}
                  <span className="inline-block">&nbsp;</span>
                </span>
              ))}
            </motion.span>
          </Wrapper>
        </h1>
      </div>
    </section>
  );
}
