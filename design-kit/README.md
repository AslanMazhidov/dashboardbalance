# Design Kit — Balance Coffee

Переносимая дизайн-система из проекта InvestPlatform.
Копируй эту папку в новый Next.js проект и получай тот же визуальный стиль.

## Стек

- **Tailwind CSS v4** + PostCSS
- **Radix UI** (radix-ui) — примитивы
- **Class Variance Authority** (CVA) — варианты компонентов
- **Framer Motion** — анимации
- **Lucide React** — иконки
- **cmdk** — command palette
- **react-day-picker** — календарь

## Быстрый старт

### 1. Установи зависимости

```bash
npm install radix-ui class-variance-authority clsx tailwind-merge lucide-react framer-motion cmdk react-day-picker tw-animate-css
npm install -D tailwindcss @tailwindcss/postcss shadcn
```

### 2. Скопируй файлы

```
design-kit/
├── globals.css              →  src/app/globals.css
├── postcss.config.mjs       →  postcss.config.mjs (корень проекта)
├── lib/
│   └── utils.ts             →  src/lib/utils.ts
└── components/ui/
    ├── avatar.tsx            →  src/components/ui/avatar.tsx
    ├── badge.tsx             →  src/components/ui/badge.tsx
    ├── button.tsx            →  src/components/ui/button.tsx
    ├── calendar.tsx          →  src/components/ui/calendar.tsx
    ├── card.tsx              →  src/components/ui/card.tsx
    ├── command.tsx           →  src/components/ui/command.tsx
    ├── dialog.tsx            →  src/components/ui/dialog.tsx
    ├── dropdown-menu.tsx     →  src/components/ui/dropdown-menu.tsx
    ├── input.tsx             →  src/components/ui/input.tsx
    ├── label.tsx             →  src/components/ui/label.tsx
    ├── metric-card.tsx       →  src/components/ui/metric-card.tsx
    ├── page-header.tsx       →  src/components/ui/page-header.tsx
    ├── popover.tsx           →  src/components/ui/popover.tsx
    ├── select.tsx            →  src/components/ui/select.tsx
    ├── separator.tsx         →  src/components/ui/separator.tsx
    ├── sheet.tsx             →  src/components/ui/sheet.tsx
    ├── skeleton.tsx          →  src/components/ui/skeleton.tsx
    ├── switch.tsx            →  src/components/ui/switch.tsx
    ├── table.tsx             →  src/components/ui/table.tsx
    ├── tabs.tsx              →  src/components/ui/tabs.tsx
    ├── textarea.tsx          →  src/components/ui/textarea.tsx
    └── tooltip.tsx           →  src/components/ui/tooltip.tsx
```

### 3. Настрой шрифт в root layout

```tsx
// src/app/layout.tsx
import { Inter } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
```

### 4. Настрой path alias

В `tsconfig.json` убедись что есть:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Цветовая палитра

| Токен | Цвет | Использование |
|-------|-------|--------------|
| `--primary` / `brand` | `#1B4332` | Основной — глубокий лесной зелёный |
| `--brand-hover` | `#2D6A4F` | Hover состояние primary |
| `--brand-light` | `#D1FAE5` | Лёгкий фон для brand элементов |
| `--profit` | `#059669` | Положительные значения (прибыль) |
| `--profit-bg` | `#ECFDF5` | Фон для положительных бейджей |
| `--loss` / `--destructive` | `#DC2626` | Отрицательные значения (убыток) |
| `--loss-bg` | `#FEF2F2` | Фон для отрицательных бейджей |
| `--gold` | `#D97706` | Акцент (янтарный) |
| `--warm` | `#92400E` | Тёплый коричневый |
| `--background` | `#FFFFFF` | Основной фон |
| `--foreground` | `#0A0A0A` | Основной текст |
| `--muted` | `#F5F5F4` | Приглушённый фон |
| `--border` | `#E5E5E5` | Границы |
| `--sidebar` | `#1C1917` | Тёмный сайдбар |

## Система теней

```css
--shadow-xs:  0 1px 2px rgba(0,0,0,0.04)
--shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-md:  0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)
--shadow-lg:  0 8px 25px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)
--shadow-xl:  0 16px 40px rgba(0,0,0,0.1)
```

Использование: `shadow-[var(--shadow-sm)]`, `hover:shadow-[var(--shadow-md)]`

## Компоненты

### Базовые
- **Button** — 6 вариантов (default, destructive, outline, secondary, ghost, link) + 8 размеров
- **Input** / **Textarea** — стилизованные поля ввода
- **Label** — доступная метка формы
- **Badge** — бейдж с вариантами
- **Separator** — горизонтальный/вертикальный разделитель
- **Skeleton** — заглушка загрузки

### Данные
- **Table** — составная таблица (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
- **Card** — составная карточка (Card, CardHeader, CardTitle, CardContent, CardFooter)
- **MetricCard** — анимированная карточка метрики с трендом (profit/loss)

### Навигация
- **Tabs** — табы с вариантами (default, line)
- **Select** — выпадающий список
- **DropdownMenu** — контекстное меню
- **Command** — командная палитра (Ctrl+K)

### Оверлеи
- **Dialog** — модальное окно
- **Sheet** — выдвижная панель (4 стороны)
- **Popover** — всплывающее окно
- **Tooltip** — подсказка

### Формы
- **Switch** — переключатель (sm, default)
- **Calendar** — выбор даты

### Лейаут
- **PageHeader** — заголовок страницы с анимацией
- **Avatar** — аватар с размерами и группировкой

## Утилиты

### `cn()` — merge классов
```tsx
import { cn } from "@/lib/utils"

<div className={cn("base-class", condition && "conditional-class", className)} />
```

### CSS утилиты (из globals.css)
- `.tabular-nums` — моноширинные цифры для финансовых данных
- `.grain-overlay` — текстура зерна для премиум-элементов
- `.skeleton-shimmer` — анимация мерцания для загрузки

## Кастомизация

Чтобы изменить цветовую схему, отредактируй переменные в `globals.css`:

```css
:root {
  --primary: #1B4332;    /* Замени на свой brand color */
  --ring: #1B4332;       /* Совпадает с primary */
}

@theme inline {
  --color-brand: #1B4332;       /* Замени */
  --color-brand-hover: #2D6A4F; /* Замени */
  --color-brand-light: #D1FAE5; /* Замени */
}
```
