import { css, Global } from '@emotion/react';
import emotionReset from 'emotion-reset';

import { Simulation } from './components/Simulation';

// const appStyles = css({
//   background: 'purple'
// });

// const globalStyles = css({
//   ...emotionReset
// })

const globalStyles = css`
  ${emotionReset}

  *, *::after, *::before {
    box-sizing: border-box;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    font-smoothing: antialiased;
  }
`;

function App() {
  return (
    <>
      <Simulation />
      <Global styles={globalStyles} />
    </>
  );
}

export { App };
