import { css } from '@emotion/react';

import { Scene } from './Cast';

const simulationStyles = css({
  // color: 'rgb(50, 20, 200)',
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
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
