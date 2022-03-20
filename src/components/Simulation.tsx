import { css } from '@emotion/react';

const simulationStyles = css({
  color: 'rgb(50, 20, 200)'
});

function Simulation(): JSX.Element {
  return (
    <div css={simulationStyles}>Simulation</div>
  );
}

export { Simulation };
