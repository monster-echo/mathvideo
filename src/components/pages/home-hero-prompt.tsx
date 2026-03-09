"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { localePath, type Locale } from "@/lib/i18n";

type HomeHeroPromptProps = {
  locale: Locale;
  placeholder: string;
};

const zhExampleTopics = [
  "欧几里得算法求最大公约数",
  "埃拉托斯特尼筛法找出 1 到 100 的素数",
  "牛顿迭代法逼近 sqrt(2)",
  "二分法求方程 x^3 - x - 2 = 0 的根",
  "梯度下降在二次函数上的收敛轨迹",
  "高斯消元解三元一次方程组",
  "快速排序的分区与递归过程",
  "Dijkstra 最短路径算法",
  "FFT 分治拆分与频域合并",
  "KMP 字符串匹配失败函数",
];

const zhExampleStyles = [
  "用坐标动画演示",
  "用逐步高亮解释",
  "通过几何变换展示",
  "做一个适合课堂讲解的动画：",
  "用 3D 视角可视化",
];

const enExampleTopics = [
  "Euclid's algorithm for greatest common divisor",
  "Sieve of Eratosthenes to find primes from 1 to 100",
  "Newton's method converging to sqrt(2)",
  "Bisection method solving x^3 - x - 2 = 0",
  "Gradient descent convergence on a quadratic function",
  "Gaussian elimination for a 3-variable linear system",
  "Quicksort partition and recursion flow",
  "Dijkstra shortest path algorithm",
  "FFT divide-and-conquer split and merge",
  "KMP string matching failure function",
];

const enExampleStyles = [
  "Visualize with coordinate-based animation:",
  "Explain with step-by-step highlights:",
  "Show through geometric transformation:",
  "Create a classroom-ready walkthrough for",
  "Use a 3D perspective to illustrate",
];

const zhHeroPromptCandidates = zhExampleTopics.flatMap((topic) =>
  zhExampleStyles.map((style) => `${style}${topic}`),
);
const enHeroPromptCandidates = enExampleTopics.flatMap((topic) =>
  enExampleStyles.map((style) => `${style} ${topic}`),
);

const rotatingHintsByLocale: Record<Locale, string[]> = {
  zh: zhHeroPromptCandidates,
  en: enHeroPromptCandidates,
  de: enHeroPromptCandidates,
};

export function HomeHeroPrompt({ locale, placeholder }: HomeHeroPromptProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  const rotatingHints = rotatingHintsByLocale[locale];

  const canSubmit = useMemo(() => prompt.trim().length > 0, [prompt]);
  const currentHint = rotatingHints[activeHintIndex] ?? placeholder;

  useEffect(() => {
    if (!rotatingHints.length) return;

    let timeoutId: number | undefined;
    const intervalId = window.setInterval(() => {
      setHintVisible(false);
      timeoutId = window.setTimeout(() => {
        setActiveHintIndex((prev) => (prev + 1) % rotatingHints.length);
        setHintVisible(true);
      }, 260);
    }, 3200);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [rotatingHints.length]);

  function submitPrompt() {
    const next = prompt.trim();

    if (!next) {
      return;
    }

    const targetBasePath = localePath(locale, "/creator");
    router.push(`${targetBasePath}?prompt=${encodeURIComponent(next)}`);
  }

  return (
    <form
      className="mt-4 w-full max-w-5xl rounded-2xl border border-blue-200 bg-white p-3 shadow-sm dark:border-blue-700/60 dark:bg-slate-950/60"
      onSubmit={(event) => {
        event.preventDefault();
        submitPrompt();
      }}
    >
      <div className="flex min-h-[70px] items-start gap-3 rounded-xl border border-blue-200 bg-white px-5 py-4 dark:border-blue-700/60 dark:bg-slate-900">
        <div className="relative min-w-0 flex-1 pt-0.5">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="relative z-10 w-full bg-transparent text-base leading-6 text-slate-700 outline-none placeholder:opacity-0 dark:text-slate-200"
          />
          {!prompt ? (
            <span
              className={`pointer-events-none absolute left-0 top-0 z-0 text-base leading-6 text-slate-400 transition-opacity duration-300 ${
                hintVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {currentHint}
            </span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`self-center rounded-md p-1.5 transition-colors ${canSubmit ? "text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200" : "text-slate-400"}`}
          aria-label={locale === "zh" ? "提交提示词" : "Submit prompt"}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m8 5 8 7-8 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
