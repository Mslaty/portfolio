# Deploy en Vercel (gratis)

## Requisitos previos

- Cuenta en [Vercel](https://vercel.com) (puedes registrarte con GitHub)
- Cuenta en [GitHub](https://github.com) (o GitLab/Bitbucket)
- Node.js 18+ instalado localmente

## Paso 1: Preparar el repositorio

```bash
cd Portfolio
npm install
npm run build   # verificar que compila sin errores
```

Inicializa git y sube a GitHub:

```bash
git init
git add .
git commit -m "Initial commit - Portfolio"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/portfolio.git
git push -u origin main
```

## Paso 2: Conectar con Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Haz clic en **Import Git Repository**
3. Selecciona tu repositorio `portfolio`
4. Vercel detectara automaticamente que es un proyecto Vite

### Configuracion del proyecto

| Campo              | Valor          |
|--------------------|----------------|
| Framework Preset   | Vite           |
| Build Command      | `npm run build`|
| Output Directory   | `dist`         |
| Install Command    | `npm install`  |

5. Haz clic en **Deploy**

## Paso 3: Dominio personalizado (opcional)

1. En el dashboard de tu proyecto en Vercel, ve a **Settings > Domains**
2. Anade tu dominio personalizado
3. Configura los DNS segun las instrucciones de Vercel

## Notas importantes

### API Key de Gemini
- La API key de Gemini se introduce en el navegador del usuario y se guarda en `localStorage`
- **No se almacena en el servidor** ni en variables de entorno de Vercel
- Cada usuario necesita su propia key gratuita de [Google AI Studio](https://aistudio.google.com/apikey)

### Limites del plan gratuito de Vercel
- 100 GB de ancho de banda/mes
- Builds ilimitados
- Deploys automaticos con cada push a `main`
- Preview deploys en cada Pull Request
- SSL automatico

### Gemini API gratuita
- Modelo `gemini-2.5-flash`: gratuito con limites generosos, mejor razonamiento y extraccion
- 15 RPM (peticiones por minuto) en el tier gratuito
- 1M tokens/minuto de entrada
- Suficiente para uso de portfolio/demo

## Comandos utiles

```bash
# Desarrollo local
npm run dev

# Build de produccion
npm run build

# Preview del build
npm run preview
```

## Estructura del proyecto

```
Portfolio/
├── public/           # Assets estaticos
├── src/
│   ├── components/   # Componentes reutilizables
│   ├── pages/        # Paginas (Landing, OCR)
│   ├── App.tsx       # Router principal
│   ├── main.tsx      # Entry point
│   └── index.css     # Estilos globales
├── index.html        # HTML base
├── package.json
├── vite.config.ts
└── tsconfig.json
```
