import { css } from '@emotion/react';
import { useState } from 'react';
import { Simulation } from './Simulation';
import { CopyBlock, monokaiSublime } from 'react-code-blocks';

const simulationSize = 400;

const simulationContainerStyles = css({
  width: simulationSize,
  height: simulationSize,
  position: 'relative',
  border: '1px solid gray',
});

function Code({
  code
}: {
  code: string;
}) {
  return (
    <div>
      <CopyBlock
        text={code}
        language="typescript"
        showLineNumbers={false}
        // startingLineNumber={startingLineNumber}
        theme={monokaiSublime}
        codeBlock
      />
    </div>
  );
}

const codeForBasicScene = `
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;`;

const codeForBasicCube3d = `const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);`;

const codeForPhysicsPlane = `// Create the physics ground plane.
const planeShape = new CANNON.Plane();
const planeBody = new CANNON.Body({ mass: 0 });
planeBody.addShape(planeShape);
// Rotate so the plane faces up.
planeBody.quaternion.setFromAxisAngle(
  new CANNON.Vec3(1, 0, 0),
  -Math.PI / 2
);`;

function Body({
  children
}: {
  children: React.ReactChild | React.ReactChildren | React.ReactChild[]
}) {
  return (
    <p>
      {children}
    </p>
  )
};

// <a target="_blank" rel="noopener noreferrer" href="LINK">TEXTTEXT</a>

function Blog(): JSX.Element {
  const [ paused, setPaused ] = useState(false);

  return (
    <>
      <Body>
        In this blog post we&apos;ll go over how we created the following 3d lucky dice simulation for the Dybbuk website.
      </Body>
      <Body>
        The source code is available on <a target="_blank" rel="noopener noreferrer" href="https://github.com/Anemy/dice">GitHub</a>
      </Body>
      <Body>
        This is <strong>not</strong> a beginner tutorial; we will not go through the project setup and not all of the code is described in this post (see the code linked above).
      </Body>
      <div css={simulationContainerStyles}>
        <Simulation
          paused={paused}
          size={{
            width: simulationSize,
            height: simulationSize
          }}
        />
      </div>
      <button
        onClick={() => setPaused(paused => !paused)}
      >
        {paused ? 'Resume' : 'Pause'}
      </button>

      <h3>Technology and Setup</h3>

      <Body>
        The simulation is built with typescript (a typed superset of javascript).
        <br />
        For the 3D rendering we&apos;re using <a target="_blank" rel="noopener noreferrer" href="https://threejs.org/">THREE.js</a>.
        <br />
        And for the physics we are using <a target="_blank" rel="noopener noreferrer" href="http://www.cannonjs.org/">CANNON.js</a>.
      </Body>
      
      
      <Body>
        First step is rendering something, a former colleague of mine (Lucas) would always say
        <br />
        &quot;Let&apos;s get some pixels on the screen&quot;.
      </Body>
      <Body>
        To avoid complicating this tutorial with boilerplate I&apos;ll be skipping over project and scene creation.
        <br />
        If you&apos;re not familiar with THREE.js and creating a basic scene I&apos;d recommend following the THREE.js introduction on how to create your first scene:
        <br />
        <a target="_blank" rel="noopener noreferrer" href="https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene">https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene</a>
        <br />
        Now that you have a scene with an animation loop let&apos;s add a cube:
      </Body>

      {/* <Body>
        To start let&apos;s create a <a target="_blank" rel="noopener noreferrer" href="https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene">scene</a> where we&apos;ll render things to.
      </Body>

      <Code code={codeForBasicScene} />

      <Body>
        Now let&apos;s add a 
      </Body> */}

      <Code code={codeForBasicCube3d} />

      <Body>
        Before we add gravity we&apos;ll want something for this <em>dice</em> to fall onto.
        <br />
        To compute the physics, so we can skip some physics and math degrees, we&apos;ll be using CANNON.js library.
        <br />
        The physics shape <a target="_blank" rel="noopener noreferrer" href="https://schteppe.github.io/cannon.js/docs/classes/Plane.html">Plane</a> will be our ground:
      </Body>

      <Code code={codeForPhysicsPlane} />

      <Body>

        <br />
        Now we can apply gravity to the die and watch it fall to the ground.
      </Body>

      <div>
        SHOW_ADD_CANNON
      </div>

      <div>
        SHOW_DICE_FALLING_WITH_CANNON
      </div>

      <Body>
      </Body>

      <h3>Physics</h3>

      <Body>
        To cast the die we add some random forces on initialization.
      </Body>

      <Body>
        Now we need to know what number is facing up on the dice once it has stabilized.
      </Body>

      <Body>
        To do this we need to compute the orientation of the die.
        <br />
        We can compute the orientation of the die by attaching points to each side of the die
        and then performing all of the physics on the entire group, die and points.
        <br />
        After the dice is rotated we apply the rotation to these points and calculate
        the point with the highest y position. That point indicates the top facing side.
      </Body>

      <div>
        CODE_FOR_SHOWING_HIGHEST_Y_POS?
      </div>

      <h3>Model and Material</h3>

      <Body>
        To make it look as a proper dice should we&apos;ll import a dice model and material into our scene.
        We used a creative commons model from  . 
        <br />
        A quick google search will find you many high quality existing models out there with various licensing and prices.
        <br />
        Alternatively we could have modelled it ourselves as it is a simple shape and material.
      </Body>

      <Body>
        We now have a running dice simulation with a nice model where we can see
        the ending number of the dice.
      </Body>

      <h3>Rolling the lucky 7</h3>

      <Body>
        We want the dice to always land on <strong>3</strong> and <strong>4</strong> for a total of <strong>7</strong>.
        <br />
        One way of doing this is applying a pushing force on the stabilized die to
        make it rotate to the intended orientation.
      </Body>

      <Body>
        This approach worked most of the time, and had an interesting look.
        <br />
        The dice would occasionally run into each other and be unable to rotate to their intended side.
        <br />
        Ultimately we decided this method seemed a little too &apos;loaded&apos; and cartoonish.
      </Body>

      <div>
        Simulation with the force bump?
      </div>

      <Body>
        We want to have the dice always land on their intended sides without the extra push force at the end.
        <br />
        We had two options of how to do this:
        <br />
        <strong>1.</strong> Math it up and create an equation that would always land the dice with their intended side up, this could hard to do with the possible collisions involved.
        <br />
        <strong>2.</strong> Run the random simulation a lot of times and save the initial parameters of the tosses which achieve the intended lucky 7.
      </Body>

      <Body>
        Approach <strong>#1</strong> was tempting, but I thought it could potentially take a long time and would be harder to tweak, so I went with the less elegant and complete solution, <strong>#2</strong>.
        <br />
        We&apos;ll gather a set of initial dice states, involving position, rotation, velocity, and angular velocity. Then we&apos;ll use those values to run the simulation users see on the page.
        <br />
        With enough data entries this method will effectively give the same impression as the first method.
      </Body>

      <Body>
        So we ran the simulation on an accelerated time scale about X times to gain X entries in our `LuckyNumbers` array.
      </Body>

      <Body>
        The ending result is a lucky dice tossing simulation.
      </Body>

      <Body>
        Thanks for your time, feel free to give me a follow on twitter: <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/rofloos">Twitter</a>
      </Body>

      <Body>
        The source code is available on <a target="_blank" rel="noopener noreferrer" href="https://github.com/Anemy/dice">GitHub</a>
      </Body>


      <Body>Feel free to make suggestions or fix typos on this blog post on github: LINK_BLOG_POST_HERE</Body>

      <div css={simulationContainerStyles}>
        <Simulation
          paused={paused}
          size={{
            width: simulationSize,
            height: simulationSize
          }}
        />
      </div>
      <button
        onClick={() => setPaused(paused => !paused)}
      >
        {paused ? 'Resume' : 'Pause'}
      </button>
    </>
  );
}

export { Blog };