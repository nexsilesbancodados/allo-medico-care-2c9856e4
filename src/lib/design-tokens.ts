export const tokens = {
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
  },

  shadow: {
    card: "shadow-sm hover:shadow-md transition-shadow duration-200",
    float: "shadow-lg shadow-primary/10",
    modal: "shadow-2xl shadow-black/20",
  },

  animation: {
    fadeUp: "animate-in fade-in slide-in-from-bottom-4 duration-300",
    fadeIn: "animate-in fade-in duration-200",
    scaleIn: "animate-in zoom-in-95 duration-200",
  },

  gradient: {
    patient: "from-blue-600 via-blue-500 to-cyan-500",
    doctor: "from-emerald-700 via-emerald-600 to-teal-500",
    laudista: "from-slate-800 via-blue-900 to-blue-800",
    admin: "from-purple-700 via-purple-600 to-violet-500",
    clinic: "from-orange-600 via-orange-500 to-amber-400",
    danger: "from-red-600 to-red-500",
    success: "from-emerald-600 to-emerald-500",
  },

  status: {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    waiting: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    in_progress: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    completed: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700",
    cancelled: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    urgent: "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-700",
    pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },

  ring: {
    patient: "ring-blue-400",
    doctor: "ring-emerald-400",
    laudista: "ring-blue-600",
    admin: "ring-purple-400",
    clinic: "ring-orange-400",
    receptionist: "ring-amber-400",
    support: "ring-yellow-400",
    partner: "ring-green-400",
  },
} as const;

export type StatusKey = keyof typeof tokens.status;
export type GradientKey = keyof typeof tokens.gradient;
export type RadiusKey = keyof typeof tokens.radius;
