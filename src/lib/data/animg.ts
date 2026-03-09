import type { Locale } from "@/lib/i18n";

export type SiteLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type AnimationItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  createdAt: string;
  author: string;
  aiModel: string;
  status: "Completed";
  thumbnailUrl: string;
  videoUrl: string;
  specMarkdown: string;
  code: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type UseCasePageContent = {
  badge: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  whyTitle: string;
  whySubtitle: string;
  whyItems: Array<{ title: string; description: string }>;
  topicsTitle: string;
  topics: Array<{ title: string; description: string }>;
  faqTitle?: string;
  faqs?: FaqItem[];
  proTitle: string;
  proSubtitle: string;
  proItems: string[];
  proPriceLine: string;
  proPriceHint: string;
  socialProof: string;
  finalTitle: string;
  finalSubtitle: string;
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  de: "Deutsch",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  zh: "🇨🇳",
  de: "🇩🇪",
};

export const navLinks: SiteLink[] = [
  { href: "/creator", label: "Creator" },
  { href: "/explore", label: "Explore" },
  { href: "/playground", label: "Playground" },
  { href: "/subscription", label: "Pricing" },
];

export const supportMenuLinks: SiteLink[] = [
  { href: "/how-it-works", label: "How AnimG Works" },
  { href: "/examples", label: "Animation Examples" },
  { href: "https://docs.manim.community/en/stable/", label: "Manim Docs", external: true },
  { href: "mailto:animg@voycrew.com", label: "Feedback", external: true },
  { href: "https://discord.gg/sqrCJUZHkK", label: "Discord Community", external: true },
];

export const footerLinks = {
  product: [
    { href: "/creator", label: "AI Animation Creator" },
    { href: "/playground", label: "Online Manim Playground" },
    { href: "/explore", label: "Explore Animations" },
    { href: "/examples", label: "Animation Examples" },
  ],
  useCases: [
    { href: "/manim-for-educators", label: "Manim for Educators" },
    { href: "/manim-for-students", label: "Manim for Students" },
    { href: "/manim-for-youtube", label: "Manim for YouTube" },
  ],
  resources: [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/subscription", label: "Pricing" },
    { href: "mailto:animg@voycrew.com", label: "Support", external: true },
  ],
  legal: [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/refund", label: "Refund" },
  ],
};

export const homeHero = {
  badge: "AI-powered · No install · Free to try",
  headingTop: "AnimG - Manim AI Video Generator",
  headingBottom: "Create Mathematical Animations Online",
  promptHint: "Try it out: Describe your idea and press Enter",
  promptPlaceholder: "Describe your animation... e.g., 'Animate a rotating 3D cube with gradient colors'",
  examplePrompts: [
    "Show a slope field for a differential equation with solution curves following the field directions",
    "Animate gradient descent finding the minimum of a 2D function, showing the path taken by the algorithm",
    "Visualize how a square wave can be approximated by adding sine waves using Fourier series",
  ],
  primaryCta: "Start from scratch",
  pills: [
    { title: "AI-Powered", subtitle: "Text to Manim Video" },
    { title: "No Install", subtitle: "Runs in Browser" },
    { title: "Instant", subtitle: "Real-time Rendering" },
  ],
};

export const homepageTools = [
  {
    title: "Manim AI Creator",
    description:
      "The leading AI tool that transforms text into precise mathematical animations with AnimG agentic engine.",
    href: "/creator",
    cta: "Create with AI",
  },
  {
    title: "Publish & Explore",
    description:
      "Publish and share your animations. Discover amazing mathematical animations created by the community.",
    href: "/explore",
    cta: "Browse community animations",
  },
  {
    title: "Online Manim Rendering",
    description: "No installation needed. Write, compile and render Manim code in your browser.",
    href: "/playground",
    cta: "Try Playground",
  },
];

export const homepageUseCases = [
  {
    title: "For Educators",
    description:
      "Create engaging mathematical visualizations and physics animations for your lessons.",
    href: "/manim-for-educators",
    cta: "Learn more for educators",
  },
  {
    title: "For Students",
    description: "Visualize concepts for presentations, projects, and understanding abstract ideas.",
    href: "/manim-for-students",
    cta: "Learn more for students",
  },
  {
    title: "For Content Creators",
    description: "Produce high-quality mathematical animation content for YouTube, courses, or social media.",
    href: "/manim-for-youtube",
    cta: "Learn more for creators",
  },
];

export const homepageSteps = [
  { title: "Describe", description: "Describe your animation in natural language." },
  { title: "Review Spec", description: "Align the generated spec with your expectations." },
  { title: "Generate", description: "Once aligned, Manim video is generated automatically." },
  { title: "Iterate", description: "Watch the result and request changes to refine your animation." },
];

export const homepageFaqs: FaqItem[] = [
  {
    question: "What is AnimG?",
    answer:
      "AnimG is an online Manim AI platform that turns natural language prompts into rendered math animation videos.",
  },
  {
    question: "How to use Manim AI?",
    answer:
      "Use Creator to describe animation intent, review specification, then generate. Use Playground for direct code editing.",
  },
  {
    question: "Is AnimG free to use?",
    answer: "Yes, there is a free tier for trying generation and playground rendering with daily limits.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No. Everything runs in your browser and cloud rendering workers.",
  },
  {
    question: "Do I need to know Python?",
    answer: "No for Creator mode. Playground mode is available if you want to edit Manim code directly.",
  },
  {
    question: "Can I download my videos?",
    answer: "Yes, video downloading is available on Pro plans.",
  },
  {
    question: "Manim vs other animation tools?",
    answer:
      "Manim is code-driven and mathematically precise. AnimG adds AI-driven spec generation and cloud rendering workflows.",
  },
];

const rotatingCubeSpec = `## Animation Specification for Test3D (Single Scene)

### 1. Overview
- **Purpose:** Demonstrate a simple 3D orange cube that appears, camera orbits for about 22s, then fades out.
- **Total Duration:** Around 25 seconds.

### 2. Elements
- **Cube:** Side length 2, centered at origin.
- **Camera:** phi = 75°, theta = -45°.
- **Ambient Rotation:** rate = 0.4 rad/s.

### 3. Sequence
1. **0.0-1.0s:** Create cube.
2. **1.0-1.2s:** Brief pause.
3. **1.2-23.2s:** Begin ambient camera rotation.
4. **23.2-23.4s:** Stop rotation.
5. **23.4-24.4s:** Fade out cube.
6. **24.4-25.0s:** Final pause.

### 4. Notes
- Use default smooth easing.
- Keep single-scene ThreeDScene structure.`;

const rotatingCubeCode = `from manim import *

class Test3D(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=75 * DEGREES, theta=-45 * DEGREES)
        cube = Cube(side_length=2, fill_color=ORANGE, fill_opacity=1, stroke_width=0)
        self.play(Create(cube))
        self.wait(0.2)
        self.begin_ambient_camera_rotation(rate=0.4)
        self.wait(22)
        self.stop_ambient_camera_rotation()
        self.play(FadeOut(cube))
        self.wait(0.6)
`;

const genericCode = `from manim import *

class GenScene(Scene):
    def construct(self):
        title = Text("AnimG Generated Scene", font_size=36)
        self.play(Write(title))
        self.wait(0.5)
        self.play(FadeOut(title))
`;

function genericSpec(title: string, description: string) {
  return `## ${title}\n\n### Overview\n${description}\n\n### Workflow\n1. Build visual primitives and coordinate references.\n2. Reveal key formulas and transformations in sequence.\n3. Render short final hold for readability.\n`;
}

export const communityAnimations: AnimationItem[] = [
  {
    id: "gkyIndrcWxlUe7m3cqoz",
    slug: "rotating-orange-cube-in-3d-e7m3cqoz",
    title: "Rotating Orange Cube in 3D",
    description:
      "A solid orange cube appears, stays static for a moment, then the camera orbits around it for twenty-two seconds, creating the illusion of rotation. The orbit stops, the cube fades out, and the scene ends.",
    tags: ["3d", "geometry", "camera-rotation"],
    duration: "0:24",
    createdAt: "Mar 8, 2026, 10:12 AM",
    author: "Ram",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/EW4PL7JruQf6zMk2f0wZ8sopJPJ3/20260308_101544_Test3D.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/EW4PL7JruQf6zMk2f0wZ8sopJPJ3/20260308_101544_Test3D.mp4",
    specMarkdown: rotatingCubeSpec,
    code: rotatingCubeCode,
  },
  {
    id: "vViPFuXayvOYZrj4L7AI",
    slug: "magical-circle-to-fourier-transform-visual-journey-Zrj4L7AI",
    title: "Magical Circle to Fourier Transform Visual Journey",
    description:
      "The animation starts with a bright yellow circle surrounded by rotating blue sub-circles, then morphs the circles into vertical spectrum bars representing frequency components.",
    tags: ["fourier-transform", "signal-processing"],
    duration: "0:12",
    createdAt: "Mar 8, 2026, 10:11 AM",
    author: "lihan Chen",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/KvFvqb2SHPTI2Ya3Ln1YG3G48sk1/20260308_101525_GenScene.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/KvFvqb2SHPTI2Ya3Ln1YG3G48sk1/20260308_101525_GenScene.mp4",
    specMarkdown: genericSpec(
      "Magical Circle to Fourier Transform Visual Journey",
      "Transition from geometric circles to Fourier-domain representations and denoised waveform output.",
    ),
    code: genericCode,
  },
  {
    id: "cxtQfii9MLhf9i5wiU7B",
    slug: "3d-proof-of-difference-and-sum-of-cubes-9i5wiU7B",
    title: "3D Proof of Difference and Sum of Cubes",
    description:
      "The scene builds two colored cubes, shows the volume difference and sum, and breaks them into rectangular prisms that match algebraic factors.",
    tags: ["algebra", "geometry", "3d-visualization"],
    duration: "0:33",
    createdAt: "Mar 6, 2026, 04:30 PM",
    author: "NANI",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/sn50IfyhVgMfiuBjDMsc94B98cT2/20260306_165259_CubeIdentities.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/sn50IfyhVgMfiuBjDMsc94B98cT2/20260306_165259_CubeIdentities.mp4",
    specMarkdown: genericSpec(
      "3D Proof of Difference and Sum of Cubes",
      "Decompose 3D solids to connect geometric volume reasoning with factorization identities.",
    ),
    code: genericCode,
  },
  {
    id: "nc1XDXAKWMqnDoc2e0UP",
    slug: "satellites-align-after-extra-inner-revolution-Doc2e0UP",
    title: "Satellites Align After Extra Inner Revolution",
    description:
      "A top-down animation compares two orbital periods and highlights re-alignment after an extra inner revolution.",
    tags: ["orbital-mechanics", "physics-visualization"],
    duration: "0:12",
    createdAt: "Mar 6, 2026, 12:31 PM",
    author: "963411096",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/yrUd0EZIi4VbN6AgYIfbFzB3l413/20260306_123429_SatelliteAlignmentScene.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/yrUd0EZIi4VbN6AgYIfbFzB3l413/20260306_123429_SatelliteAlignmentScene.mp4",
    specMarkdown: genericSpec(
      "Satellites Align After Extra Inner Revolution",
      "Visualize orbital angular velocity differences and collinearity recurrence events.",
    ),
    code: genericCode,
  },
  {
    id: "S6EolDVPH3xByoYJujmy",
    slug: "orthogonal-projection-onto-a-3d-plane-yoYJujmy",
    title: "Orthogonal Projection onto a 3D Plane",
    description:
      "An animated 3D scene introduces a projection plane, normal vector, and perpendicular projection with right-angle cues.",
    tags: ["geometry", "linear-algebra", "3d-visualization", "projections"],
    duration: "0:21",
    createdAt: "Mar 3, 2026, 02:50 PM",
    author: "磊旷",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/LWWrSyDpl2WW4wDQZRv7ylcxeC83/20260303_150746_ProjectionPlaneScene.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/LWWrSyDpl2WW4wDQZRv7ylcxeC83/20260303_150746_ProjectionPlaneScene.mp4",
    specMarkdown: genericSpec(
      "Orthogonal Projection onto a 3D Plane",
      "Use vector, plane and perpendicular distance constructs to show orthogonal projection mechanics.",
    ),
    code: genericCode,
  },
  {
    id: "4J5OMWWKxFdpkobHPT3g",
    slug: "boat-journey-shows-greens-theorem-for-kids-kobHPT3g",
    title: "Boat Journey Shows Green's Theorem for Kids",
    description:
      "A cartoon pond story compares line integral around boundary with interior curl accumulation to explain Green's theorem.",
    tags: ["green-theorem", "vector-field", "calculus", "education"],
    duration: "0:30",
    createdAt: "Mar 3, 2026, 04:11 AM",
    author: "Math Concepts",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/QOV4X01CekTdkAynzqB7m6olajG3/20260303_041803_GreensTheoremForKids.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/QOV4X01CekTdkAynzqB7m6olajG3/20260303_041803_GreensTheoremForKids.mp4",
    specMarkdown: genericSpec(
      "Boat Journey Shows Green's Theorem for Kids",
      "Narrative flow to connect local swirl (curl) and boundary circulation in an intuitive storyline.",
    ),
    code: genericCode,
  },
  {
    id: "aqI33Wyxu5KzaJiKqcmF",
    slug: "slow-reveal-of-n-dimensional-sphere-volume-formula-aJiKqcmF",
    title: "Slow Reveal of n-Dimensional Sphere Volume Formula",
    description:
      "An animated scene types out the volume formula for an n-dimensional sphere letter by letter.",
    tags: ["geometry", "higher-dimensions", "volume-formula"],
    duration: "0:07",
    createdAt: "Mar 1, 2026, 11:16 AM",
    author: "DADA",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/wlZvNh7U5ZfSxyegdB8Rc6bhz8y2/20260301_111830_VolumeFormulaScene.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/wlZvNh7U5ZfSxyegdB8Rc6bhz8y2/20260301_111830_VolumeFormulaScene.mp4",
    specMarkdown: genericSpec(
      "Slow Reveal of n-Dimensional Sphere Volume Formula",
      "Minimalist formula reveal with emphasis on typography timing and contrast.",
    ),
    code: `from manim import *

class VolumeFormulaScene(Scene):
    def construct(self):
        self.camera.background_color = "#00FF00"
        formula = MathTex(r"V_n(R) = \\frac{\\pi^{n/2}}{\\Gamma(\\frac{n}{2} + 1)} R^n", color=BLACK)
        self.play(Write(formula, lag_ratio=0.1), run_time=6)
        self.wait()
`,
  },
  {
    id: "deiB9djhrvbthnuyGDNw",
    slug: "3d-cross-product-visualization-with-right-hand-rule-hnuyGDNw",
    title: "3D Cross Product Visualization with Right Hand Rule",
    description:
      "An animated 3D scene shows vectors a and b, determinant expansion, and resulting cross-product vector c.",
    tags: ["cross-product", "vector-calculus", "3d-visualization", "linear-algebra"],
    duration: "0:34",
    createdAt: "Feb 28, 2026, 05:39 PM",
    author: "Teguh Widjaja",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/MLHYp5uAsDc8S724KHygS7Wezc23/20260228_190857_CrossProduct3DScene.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/MLHYp5uAsDc8S724KHygS7Wezc23/20260228_190857_CrossProduct3DScene.mp4",
    specMarkdown: genericSpec(
      "3D Cross Product Visualization with Right Hand Rule",
      "Build geometric intuition for cross product direction and magnitude using 3D coordinate views.",
    ),
    code: genericCode,
  },
  {
    id: "ro1mKSylyBiZIiF5Ah7b",
    slug: "evaluating-the-gaussian-integral-with-polar-coordinates-IiF5Ah7b",
    title: "Evaluating the Gaussian Integral with Polar Coordinates",
    description:
      "The animation walks through the classic Gaussian integral proof via squaring, coordinate transform and radial integration.",
    tags: ["gaussian-integral", "calculus", "polar-coordinates", "visual-proof"],
    duration: "0:15",
    createdAt: "Feb 28, 2026, 02:26 AM",
    author: "AnimG Community",
    aiModel: "GPT-OSS-120b",
    status: "Completed",
    thumbnailUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/thumbnails/ZjGTd4wFJyRflCLjYr4O2dRyd7n2/20260228_023612_GaussianIntegralScene.jpg",
    videoUrl:
      "https://storage.googleapis.com/animg-d7ca1.firebasestorage.app/videos/ZjGTd4wFJyRflCLjYr4O2dRyd7n2/20260228_023612_GaussianIntegralScene.mp4",
    specMarkdown: genericSpec(
      "Evaluating the Gaussian Integral with Polar Coordinates",
      "Show Gaussian area in 1D, lift to 2D, transform to polar coordinates, and conclude with sqrt(pi).",
    ),
    code: genericCode,
  },
];

export const exampleCategories = [
  {
    name: "Trigonometry",
    items: [
      {
        title: "Sine Wave Animation",
        description: "Animate a sine wave showing the relationship between circular motion and wave patterns.",
        tags: ["sine wave", "unit circle", "periodic function"],
        prompt: "Show how a rotating unit circle maps to a live sine wave graph.",
      },
      {
        title: "Cosine and Sine Relationship",
        description: "Show cosine and sine as phase-shifted functions on a coordinate plane.",
        tags: ["cosine", "phase shift", "trigonometric functions"],
        prompt: "Visualize sine and cosine together and highlight the pi/2 phase offset.",
      },
    ],
  },
  {
    name: "Geometry",
    items: [
      {
        title: "Pythagorean Theorem Proof",
        description: "Visual proof of the Pythagorean theorem using area rearrangement.",
        tags: ["pythagorean theorem", "geometric proof", "right triangle"],
        prompt: "Create an area-rearrangement proof for a^2 + b^2 = c^2.",
      },
      {
        title: "Circle Area Derivation",
        description: "Derive pi r^2 by cutting a circle into sectors and rearranging.",
        tags: ["circle area", "pi", "geometry derivation"],
        prompt: "Cut circle sectors and rearrange into a near-rectangle to derive area formula.",
      },
    ],
  },
  {
    name: "Calculus",
    items: [
      {
        title: "Derivative as Tangent Slope",
        description: "Visualize derivative as tangent slope on a moving point over a curve.",
        tags: ["derivative", "tangent line", "slope", "calculus"],
        prompt: "Animate a point moving on y=x^2 and draw tangent slope value in real time.",
      },
      {
        title: "Riemann Sum Integration",
        description: "Animate Riemann sums converging to area under curve.",
        tags: ["integration", "riemann sum", "area under curve"],
        prompt: "Increase rectangle count to show Riemann sum converging to integral.",
      },
      {
        title: "Fundamental Theorem of Calculus",
        description: "Show the visual relationship between differentiation and integration.",
        tags: ["fundamental theorem", "antiderivative", "calculus connection"],
        prompt: "Connect area accumulation function with derivative recovery.",
      },
    ],
  },
  {
    name: "Linear Algebra",
    items: [
      {
        title: "Matrix Transformation",
        description: "Visualize how 2x2 matrices transform vectors and shapes in plane.",
        tags: ["matrix transformation", "linear map", "rotation matrix"],
        prompt: "Apply a 2x2 matrix to a grid and show vector basis transformation.",
      },
      {
        title: "Eigenvectors Visualization",
        description: "Show how eigenvectors remain on their span under transformation.",
        tags: ["eigenvector", "eigenvalue", "linear transformation"],
        prompt: "Demonstrate invariant directions for a matrix transformation.",
      },
      {
        title: "Dot Product Geometric Meaning",
        description: "Illustrate geometric interpretation of dot product as projection.",
        tags: ["dot product", "projection", "vector geometry"],
        prompt: "Show dot product as signed projection length times magnitude.",
      },
    ],
  },
  {
    name: "Advanced Topics",
    items: [
      {
        title: "Fourier Series Visualization",
        description: "Demonstrate how periodic waves are built from sine components.",
        tags: ["fourier series", "harmonic analysis", "wave synthesis"],
        prompt: "Build a square wave by adding harmonics one by one.",
      },
      {
        title: "Complex Number Multiplication",
        description: "Show multiplication as rotation and scaling on complex plane.",
        tags: ["complex numbers", "euler formula", "rotation"],
        prompt: "Visualize multiplying complex numbers as geometric transform.",
      },
      {
        title: "Taylor Series Approximation",
        description: "Visualize local polynomial approximation and convergence behavior.",
        tags: ["taylor series", "polynomial approximation", "convergence"],
        prompt: "Compare function and Taylor polynomials near expansion point.",
      },
    ],
  },
];

export const useCasePages: Record<"manim-for-educators" | "manim-for-students" | "manim-for-youtube", UseCasePageContent> = {
  "manim-for-educators": {
    badge: "For Educators",
    title: "Create Math Animations for Your Classroom in Minutes",
    subtitle:
      "Turn any math concept into an engaging animated video. No coding required. Perfect for lectures, online courses, and student engagement.",
    ctaPrimary: "Try Free - Create Your First Animation",
    ctaSecondary: "See Example Animations",
    whyTitle: "Why Educators Choose AnimG",
    whySubtitle:
      "Creating math animations used to require hours of coding. Now you can describe what you want and get a professional video in minutes.",
    whyItems: [
      {
        title: "Save Hours of Prep Time",
        description: "No need to learn Python or Manim. Describe your animation in plain English.",
      },
      {
        title: "Boost Student Engagement",
        description: "Visual animations help students understand complex concepts faster.",
      },
      {
        title: "Use Anywhere",
        description: "Download videos and use them in slides, Zoom lectures, or YouTube.",
      },
    ],
    topicsTitle: "Perfect for Any Math Topic",
    topics: [
      { title: "Algebra & Equations", description: "Visualize equation solving, graphing functions, and transformations." },
      { title: "Geometry & Proofs", description: "Animate constructions, theorem proofs, and 3D shapes." },
      { title: "Calculus", description: "Show derivatives, integrals, limits, and area under curves." },
      { title: "Linear Algebra", description: "Demonstrate matrix operations and linear transformations." },
    ],
    proTitle: "Unlimited Animations for Your Entire Curriculum",
    proSubtitle: "With Pro, you can create animations for every lesson throughout the school year.",
    proItems: [
      "Create unlimited animations",
      "Download videos for offline use",
      "Access to all advanced AI models",
      "Update and refine animations anytime",
      "Priority rendering queue",
    ],
    proPriceLine: "$7/month",
    proPriceHint: "Cancel anytime",
    socialProof: "Join 1,000+ educators creating engaging math content with AnimG",
    finalTitle: "Start Creating Today",
    finalSubtitle: "Try AnimG free with 2 animations. No credit card required.",
  },
  "manim-for-students": {
    badge: "For Students",
    title: "Visualize Math Concepts for Better Understanding",
    subtitle:
      "Create professional animations for projects, presentations, and homework. Turn abstract math into visual understanding.",
    ctaPrimary: "Try Free - Create Your First Animation",
    ctaSecondary: "See Example Animations",
    whyTitle: "Why Students Use AnimG",
    whySubtitle: "Understanding math is easier when you can see it.",
    whyItems: [
      { title: "Understand Better", description: "Animated concepts improve deep understanding over memorization." },
      { title: "Impress Your Professors", description: "Stand out with professional visual explanations." },
      { title: "Easy to Use", description: "No coding or installation required." },
    ],
    topicsTitle: "Perfect for Any Course",
    topics: [
      { title: "Calculus", description: "Visualize limits, derivatives, integrals, and series." },
      { title: "Linear Algebra", description: "Animate matrices, eigenvectors, and vector spaces." },
      { title: "Differential Equations", description: "Show solution evolution and phase portraits." },
      { title: "Discrete Math", description: "Animate graph algorithms and combinatorics proofs." },
      { title: "Statistics", description: "Visualize distributions and hypothesis tests." },
      { title: "Physics Math", description: "Animate waves, vector fields, and coordinate transforms." },
    ],
    faqTitle: "Frequently Asked Questions",
    faqs: [
      {
        question: "Can I use AnimG for school assignments?",
        answer: "Yes. AnimG is suitable for projects, presentations, and homework deliverables.",
      },
      {
        question: "Do I need to know programming?",
        answer: "No. You can describe animation intent in plain language.",
      },
      {
        question: "Is AnimG free for students?",
        answer: "Free tier includes 2 animations. Pro unlocks unlimited generation.",
      },
      {
        question: "What format are the videos?",
        answer: "Videos are exported as MP4 and work with major slide and editing tools.",
      },
    ],
    proTitle: "Unlimited Animations All Semester",
    proSubtitle: "One subscription covers all your courses.",
    proItems: [
      "Unlimited animations",
      "Download videos for presentations",
      "Access to all AI models",
      "Update animations anytime",
      "Works for any math course",
    ],
    proPriceLine: "$7/month",
    proPriceHint: "Less than a coffee per week",
    socialProof: "Join thousands of students visualizing math with AnimG",
    finalTitle: "Start Visualizing Math Today",
    finalSubtitle: "Try AnimG free with 2 animations. No credit card required.",
  },
  "manim-for-youtube": {
    badge: "For Content Creators",
    title: "Create 3Blue1Brown-Style Animations for Your Content",
    subtitle:
      "Make professional mathematical animations without coding. Great for YouTube, online courses, TikTok, and educational content.",
    ctaPrimary: "Try Free - Create Your First Animation",
    ctaSecondary: "See Example Animations",
    whyTitle: "Why Creators Choose AnimG",
    whySubtitle: "Learning Manim and Python takes months. With AnimG, ship faster.",
    whyItems: [
      { title: "No Coding Required", description: "Skip months of setup and describe what you need." },
      { title: "Boost Production Value", description: "Professional animations improve watch time and retention." },
      { title: "Export Anywhere", description: "MP4 output works with every major editor and platform." },
    ],
    topicsTitle: "Perfect for Any Math Content",
    topics: [
      { title: "YouTube Explainers", description: "Break down theorems with step-by-step visual proofs." },
      { title: "Online Courses", description: "Create polished lesson visuals for course platforms." },
      { title: "TikTok & Reels", description: "Generate short-form math animations quickly." },
      { title: "Problem Walkthroughs", description: "Animate equations and graph-based solutions." },
      { title: "Visual Essays", description: "Support long-form documentary style math storytelling." },
      { title: "Presentations", description: "Upgrade conference talks and webinars with motion visuals." },
    ],
    faqTitle: "Frequently Asked Questions",
    faqs: [
      {
        question: "Can I use AnimG videos commercially?",
        answer: "Yes. Pro includes download and commercial usage rights for your own content.",
      },
      {
        question: "How close is this to 3Blue1Brown style?",
        answer: "AnimG uses Manim-based workflows, so visual language can be very similar when prompted well.",
      },
      {
        question: "What video format does AnimG export?",
        answer: "High-quality MP4 compatible with Premiere, Final Cut, DaVinci, and CapCut.",
      },
      {
        question: "Can I edit generated code?",
        answer: "Yes. Use Playground to refine timing, styling, and transitions.",
      },
    ],
    proTitle: "Unlimited Animations for All Your Content",
    proSubtitle: "Create as many animations as needed for your full publishing pipeline.",
    proItems: [
      "Unlimited animations per month",
      "Download HD videos (no watermark)",
      "Access to advanced AI models",
      "Commercial use rights",
      "Priority rendering queue",
    ],
    proPriceLine: "$7/month",
    proPriceHint: "Less than a cup of coffee per video",
    socialProof: "Join 1,000+ creators making animations for YouTube, courses, and more",
    finalTitle: "Start Creating Today",
    finalSubtitle: "Try AnimG free with 2 animations and ship your next video faster.",
  },
};

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export const legalDocuments: Record<"terms" | "privacy" | "refund", LegalDocument> = {
  terms: {
    title: "Terms of Service",
    lastUpdated: "Last Updated: 3/9/2026",
    sections: [
      {
        title: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing or using AnimG, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.",
        ],
      },
      {
        title: "2. Description of Service",
        paragraphs: [
          "AnimG provides AI-powered generation, rendering, and sharing workflows for mathematical animations built on Manim.",
        ],
        bullets: [
          "Manim AI Creator: chat-driven specification and code generation",
          "Online Playground: direct code editing and rendering",
          "Publish & Explore: public sharing and discovery",
          "Account-linked storage for prompts, code, videos, and conversation history",
        ],
      },
      {
        title: "3. User Accounts and Authentication",
        paragraphs: [
          "Some features require an authenticated account. You are responsible for account security and activity under your account.",
        ],
      },
      {
        title: "4. Subscription Plans and Pricing",
        bullets: [
          "Free Plan: limited generations, limited models, daily playground cap, no download",
          "Pro Plan: unlimited generation, all models, unlimited playground renders, download support",
          "Payments are processed by Stripe",
        ],
      },
      {
        title: "5. User Content and Intellectual Property",
        paragraphs: [
          "You retain rights to your generated content while granting AnimG a limited license to process and host it for service operation.",
          "Published animations are publicly visible until unpublished.",
        ],
      },
      {
        title: "6. Prohibited Uses",
        bullets: [
          "Illegal, harmful, or infringing content",
          "Unauthorized system access attempts",
          "Spam, misuse, or reverse engineering of core models",
        ],
      },
      {
        title: "7. Service Limitations and Availability",
        paragraphs: [
          "Availability, render complexity, and output constraints may apply. Service may be updated, suspended, or modified at any time.",
        ],
      },
      {
        title: "8. Limitation of Liability",
        paragraphs: [
          "Service is provided as-is and as-available. AnimG is not liable for indirect or consequential damages.",
        ],
      },
      {
        title: "9. Contact Information",
        paragraphs: ["Questions: animg@voycrew.com"],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated: 3/9/2026",
    sections: [
      {
        title: "1. Introduction",
        paragraphs: [
          "AnimG respects your privacy and describes how personal data is collected, processed, and protected.",
        ],
      },
      {
        title: "2. Data We Collect",
        bullets: [
          "Identity data: profile and account information",
          "Technical data: device, browser, and IP",
          "Usage data: generation, rendering, and interaction events",
          "Content data: prompts, code, videos, metadata",
          "Subscription and payment metadata (payments processed by Stripe)",
        ],
      },
      {
        title: "3. How We Use Your Data",
        bullets: [
          "Provide generation and rendering services",
          "Store and manage project history",
          "Display published content on explore pages",
          "Improve model quality and reliability",
          "Support billing, security, and compliance",
        ],
      },
      {
        title: "4. Data Sharing and Transfers",
        paragraphs: [
          "Data may be processed by service providers such as Firebase, Stripe, and AI infrastructure providers under contractual controls.",
        ],
      },
      {
        title: "5. Your Rights",
        bullets: [
          "Access, correction, deletion",
          "Objection and restriction",
          "Data portability (where applicable)",
        ],
      },
      {
        title: "6. Contact",
        paragraphs: ["Privacy inquiries: animg@voycrew.com"],
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    lastUpdated: "Last Updated: 3/9/2026",
    sections: [
      {
        title: "1. Overview",
        paragraphs: [
          "This policy explains refund eligibility for subscriptions and one-time credits.",
        ],
      },
      {
        title: "2. Subscription Refunds",
        bullets: [
          "Monthly plans: request within 7 days of initial purchase or renewal",
          "After 7 days: no refund eligibility, but cancellation remains available",
          "Cancellation prevents future billing and does not automatically trigger refund",
        ],
      },
      {
        title: "3. One-Time Purchase Refunds",
        bullets: [
          "Unused credits: full refund within 14 days",
          "Partially used credits: prorated refund within 14 days",
          "Fully used or aged purchases: not refundable",
        ],
      },
      {
        title: "4. How to Request a Refund",
        bullets: [
          "Email animg@voycrew.com with subject: Refund Request",
          "Include account email, transaction id, purchase date, and reason",
          "Typical review SLA: 5 business days",
        ],
      },
      {
        title: "5. Contact",
        paragraphs: ["Refund support: animg@voycrew.com"],
      },
    ],
  },
};

export function getAnimationBySlug(slug: string): AnimationItem | undefined {
  return communityAnimations.find((item) => item.slug === slug);
}

export function getLocalePageTitle(locale: Locale): string {
  if (locale === "zh") return "AnimG | 在线 Manim 数学动画，一句话生成";
  if (locale === "de") return "AnimG | Manim AI Mathe-Animationen";
  return "Manim Online - AI Math Animation Generator | AnimG";
}
