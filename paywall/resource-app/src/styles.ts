import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  :root {
    --bg: #0a0b0e;
    --bg-2: #13161c;
    --panel: rgba(19, 22, 28, 0.86);
    --panel-strong: #1a1d24;
    --border: rgba(255, 255, 255, 0.08);
    --text: #e2e8f0;
    --muted: #94a3b8;
    --accent: #00ff9d;
    --accent-2: #3b82f6;
    --accent-3: #10b981;
    --warn: #f59e0b;
    --shadow: 0 22px 60px rgba(0, 0, 0, 0.45);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    color: var(--text);
    background:
      radial-gradient(900px 500px at 5% -10%, rgba(0, 255, 157, 0.16), transparent 65%),
      radial-gradient(900px 500px at 110% 0%, rgba(59, 130, 246, 0.18), transparent 60%),
      radial-gradient(700px 420px at 50% 120%, rgba(16, 185, 129, 0.16), transparent 70%),
      linear-gradient(180deg, #090b11 0%, #0a111f 45%, #0c1426 100%);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  #root {
    min-height: 100vh;
  }
`;
