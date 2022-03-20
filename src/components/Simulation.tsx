import { css } from '@emotion/react';

import { Scene } from './Scene';

const simulationStyles = css({
  color: 'rgb(50, 20, 200)',
});

function Simulation(): JSX.Element {
  return (
    <div css={simulationStyles}>
      {/* <h1>Simulation</h1> */}
      <div>
        <Scene />
      </div>
    </div>
  );
}

export { Simulation };
