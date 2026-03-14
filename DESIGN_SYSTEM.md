# AloClínica Design System

## ⚠️ PRESERVE ESTAS CLASSES — NÃO REMOVER

As seguintes classes CSS estão definidas em `src/index.css` e **DEVEM** ser mantidas em todos os componentes JSX.

### Classes obrigatórias em cards

| Classe | Quando usar | Efeito |
|--------|------------|--------|
| `kpi-card` | Todo card de estatística/KPI | Hover: translateY(-4px) + shadow profunda |
| `card-interactive` | Todo card clicável | Hover: translateY(-3px) scale(1.005) + border primary |
| `glass` | Headers com backdrop | Blur 20px + saturação 190% |
| `glass-strong` | Modais/overlays | Blur 28px + saturação 210% |
| `shimmer-v2` | Loading skeletons | Animação shimmer suave |
| `text-gradient-brand` | Números de destaque | Gradiente primary→secondary |
| `mesh-gradient` | Fundos de seção | Gradiente radial decorativo |

### Regra de uso nos dashboards

```tsx
// ✅ CORRETO — KPI card
<div className="kpi-card p-4 rounded-2xl bg-card border border-border/50">

// ✅ CORRETO — Card clicável
<div className="card-interactive flex items-center gap-3 p-4 rounded-2xl border cursor-pointer">

// ✅ CORRETO — Skeleton loading
<div className="shimmer-v2 h-20 rounded-xl" />

// ❌ ERRADO — sem classe do design system
<div className="p-4 rounded-2xl bg-card border hover:shadow-md transition-all">
```

### Animações definidas no CSS

- `.card-interactive:hover` → `translateY(-3px) scale(1.005)` + shadow + border glow
- `.kpi-card:hover` → `translateY(-4px) scale(1.01)` + shadow profunda
- `.glass` → `backdrop-blur(20px) saturate(190%)`

### Gradiente padrão por role

```
patient:      from-blue-500 to-cyan-500
doctor:       from-emerald-500 to-teal-500  
admin:        from-red-500 to-rose-500
clinic:       from-blue-500 to-indigo-500
partner:      from-green-500 to-emerald-500
affiliate:    from-purple-500 to-violet-500
```

