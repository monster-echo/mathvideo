export type Persona = "teacher" | "creator" | "institution";

export type Plan = {
  id: string;
  name: string;
  audience: Persona | "starter";
  monthlyPrice: number;
  yearlyPrice: number;
  highlights: string[];
  cta: string;
};

export const navLinks = [
  { href: "/creator", label: "创作" },
  { href: "/explore", label: "发现" },
  { href: "/playground", label: "演练场" },
  { href: "/subscription", label: "价格" },
  { href: "/support", label: "支持" },
];

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    audience: "starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlights: [
      "每月 10 分钟渲染额度",
      "720p 导出 + 水印",
      "公开项目 3 个",
      "基础模板库",
    ],
    cta: "免费开始",
  },
  {
    id: "teacher_pro",
    name: "Teacher Pro",
    audience: "teacher",
    monthlyPrice: 29,
    yearlyPrice: 24,
    highlights: [
      "每月 300 分钟教学动画",
      "课堂讲解词 + 作业题自动生成",
      "1080p 无水印下载",
      "课程模板与章节复用",
    ],
    cta: "升级教师版",
  },
  {
    id: "creator_pro",
    name: "Creator Pro",
    audience: "creator",
    monthlyPrice: 39,
    yearlyPrice: 32,
    highlights: [
      "每月 500 分钟创作额度",
      "品牌主题包与批量导出",
      "商用授权与版权凭证",
      "高级模型与优先队列",
    ],
    cta: "升级创作者版",
  },
  {
    id: "school_team",
    name: "School Team",
    audience: "institution",
    monthlyPrice: 99,
    yearlyPrice: 82,
    highlights: [
      "10 席位起，支持班级空间",
      "素材库、审批流与权限管理",
      "共享模板 + 统一品牌",
      "SLA 与专属成功经理",
    ],
    cta: "预约机构演示",
  },
];

export const ahaMoments = [
  "第一个动画渲染成功后，付费转化率最高。",
  "下载高清无水印导出时展示升级弹层。",
  "批量导出/课程包生成时触发机构版引导。",
];

export const featuredAnimations = [
  {
    id: "gaussian-proof",
    title: "Gaussian Integral Proof",
    duration: "0:34",
    tags: ["calculus", "proof"],
    summary: "极坐标法可视化高斯积分推导，适合课堂演示。",
  },
  {
    id: "cross-product",
    title: "3D Cross Product",
    duration: "0:28",
    tags: ["linear-algebra", "3d"],
    summary: "右手法则 + 面积解释，强调向量方向关系。",
  },
  {
    id: "greens-theorem",
    title: "Green's Theorem Journey",
    duration: "0:41",
    tags: ["vector-field", "teaching"],
    summary: "以路径积分故事化方式解释面积与旋度。",
  },
];
