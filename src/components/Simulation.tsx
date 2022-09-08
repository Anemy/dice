import { css } from '@emotion/react';

import { Scene } from './Cast';
// import { Dots } from './Dots';

const simulationStyles = css({
  // color: 'rgb(50, 20, 200)',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
});

function Simulation({
  paused,
  size,
}: {
  paused?: boolean;
  size?: {
    width: number;
    height: number;
  },
}): JSX.Element {
  return (
    <>
      {/* <div css={simulationStyles}> */}
        <Scene
          paused={paused}
          styles={simulationStyles}
          size={size}
        />
        {/* <Dots /> */}
      {/* </div> */}
    </>
  );
}

export { Simulation };
