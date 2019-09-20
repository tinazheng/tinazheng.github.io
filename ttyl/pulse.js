const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;
const { Engine, Render, World, Bodies, Body, Runner, Composite } = Matter;
const airpodBody = {
  position: { x: 300, y: 400 },
  mass: 20,
  isSensor: false,
  density: 20,
  restitution: 0.6,
  slop: 0.2,
  vertices:[
    { "x":22, "y":10 }, { "x":13, "y":8 }, { "x":7, "y":10 }, { "x":2, "y":17 }, { "x":2, "y":26 }, { "x":11, "y":62 }, { "x":38, "y":71 }, { "x":27, "y":17 },
    { "x":65, "y":122 }, { "x":73, "y":112 }, { "x":38, "y":71 }, { "x":11, "y":62 }, { "x":19, "y":104 }, { "x":24, "y":116 }, { "x":40, "y":127 }, { "x":55, "y":127 },
    { "x":31, "y":123 }, { "x":40, "y":127 }, { "x":24, "y":116 },
    { "x":4, "y":13 }, { "x":2, "y":17 }, { "x":7, "y":10 },
    { "x":38, "y":71 }, { "x":73, "y":112 }, { "x":75, "y":106 }, { "x":74, "y":89 }, { "x":63, "y":75 }, { "x":59, "y":73 }, { "x":53, "y":71 },
    { "x":71, "y":83 }, { "x":63, "y":75 }, { "x":74, "y":89 }
  ],
  render: {
    sprite: {
      texture: './AirPod.png',
    }
  }
};

const wallOptions = {
  isStatic: true,
  render: { visible: false },
}

// create an engine
var engine = Engine.create({
  positionIterations: 10,
  velocityIterations: 10,
});

// create a renderer
var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: windowWidth,
    height: windowHeight,
    wireframes: false,
    background: 'transparent',
  }
});

const distanceToBase = 200;
const originalGravity = engine.world.gravity.y;

const base = document.getElementById('ring').getBoundingClientRect();

const airpod1StartX = ((base.left + base.right) / 2);
const airpod1StartY = ((base.top + base.bottom) / 2) - distanceToBase;

const airpod2StartX = airpod1StartX - distanceToBase;
const airpod2StartY = airpod1StartY + distanceToBase;

const airpod1 = Body.create({
  ...airpodBody,
  position: {
    x: airpod1StartX,
    y: airpod1StartY,
  }
});

const airpod2 = Body.create({
  ...airpodBody,
  position: {
    x: airpod2StartX,
    y: airpod2StartY,
  }
});

Body.rotate(airpod2, 5);

const boundaryWidth = 10;
const groundHeight = 95;

const ceiling = Bodies.rectangle(windowWidth / 2, boundaryWidth / 2, windowWidth, boundaryWidth, wallOptions);
const ground = Bodies.rectangle(windowWidth / 2, windowHeight - (boundaryWidth / 2), windowWidth, groundHeight, wallOptions);
const rightWall = Bodies.rectangle(windowWidth - (boundaryWidth / 2), windowHeight / 2, boundaryWidth, windowHeight - (boundaryWidth + groundHeight), wallOptions);
const leftWall = Bodies.rectangle(boundaryWidth / 2, windowHeight / 2, boundaryWidth, windowHeight - (boundaryWidth + groundHeight), wallOptions);

World.add(engine.world, [airpod1, airpod2]);

var isLanding = false;
var isGoingBack = false;
var hasShotAirpods = false;
const expandedRings = [];
const maxNumRings = 10;

const ZERO_VELOCITY = { x: 0, y: 0 };
const FOUR_SECONDS = 4000;
const HALF_SECOND = 500;

const shootOutAirpods = () => {
  Body.applyForce(airpod1, { x: airpod1.position.x, y: airpod1.position.y }, { x: 2, y: -2 });
  Body.applyForce(airpod2, { x: airpod2.position.x, y: airpod2.position.y }, { x: -4, y: -2 });

  setTimeout(() => {
    if (!isGoingBack) {
      Body.setVelocity(airpod1, ZERO_VELOCITY);
      Body.setVelocity(airpod2, ZERO_VELOCITY);
    }
  }, FOUR_SECONDS);
  hasShotAirpods = true;
}

var airpodAngleOffset = 0; // in radians. for reference, 360 degree is 2 * Math.PI
const angleOffsetPerTimestep = (2 * Math.PI) / 1000;
const radius = 200;
const STILL_SPEED_THRESHOLD = 0.3 // anything less than speed of 0.3 is considered stationery
const POS_THRESHOLD = 5;

const isStill = (body) => body.speed > 0.01 && body.speed < STILL_SPEED_THRESHOLD;
const isWithinPositionRange = (first, second) => Math.abs(first.x - second.x) < POS_THRESHOLD && Math.abs(first.y - second.y) < POS_THRESHOLD;


const onClick = () => {
  isLanding = true;
  isGoingBack = false;

  // add boundaries to the scene so that airpods can bounce off walls
  World.add(engine.world, [ground, ceiling, rightWall, leftWall]);

  if (!hasShotAirpods && !isGoingBack) {
    shootOutAirpods();
  }

  // add gravity into the scene so that airpods fall naturally
  engine.world.gravity.y = originalGravity;

  // garbage collect pulse-rings that have already been emitted
  if (expandedRings.length > maxNumRings) {
    const ringToRemove = expandedRings.shift();
    ringToRemove.remove();
  }

  // clone pulse-ring and then scale it for pulse effect
  const originalRing = document.getElementById('ring');
  const ringToExpand = originalRing.cloneNode(false);
  document.getElementById('pulse-rings').appendChild(ringToExpand);
  ringToExpand.style.opacity = 1;
  ringToExpand.classList.add('ring-expand');
  lastExpandedRing = ringToExpand;
}

function onMouseMove(e) {
  const { pageX, pageY } = e;
  const rings = document.getElementById('pulse-container');
  rings.style.top = pageY;
  rings.style.left = pageX;
}

engine.world.gravity.y = 0;

function updateRotation() {
  if (isLanding) {
    if (isStill(airpod1) && isStill(airpod2)) {
      setTimeout(() => {
        isLanding = false;
        isGoingBack = true;
        [ground, ceiling, rightWall, leftWall].forEach(body => Composite.remove(engine.world, body));
      }, HALF_SECOND);
    }
  }
  // logic to send airpods back to circle after falling
  if (isGoingBack) {
    const ringCoordinates = document.getElementById('ring').getBoundingClientRect();
    const x = (ringCoordinates.right + ringCoordinates.left) / 2;
    const y = (ringCoordinates.top + ringCoordinates.bottom) / 2;

    const airpod1OffsetX = radius;
    const airpod1OffsetY = 0;

    const airpod2OffsetX = -1 * radius;
    const airpod2OffsetY = 0;

    const airpod1XPos = x + radius;
    const airpod1YPos = y;

    const airpod2XPos = x - radius;
    const airpod2YPos = y;

    if (isWithinPositionRange(airpod1.position, { x: airpod1XPos, y: airpod1YPos }) &&
      isWithinPositionRange(airpod2.position, { x: airpod2XPos, y: airpod2YPos })) {
        airpodAngleOffset = 0;
        isGoingBack = false;
        hasShotAirpods = false;
        engine.world.gravity.y = 0;
        Body.setVelocity(airpod1, ZERO_VELOCITY);
        Body.setVelocity(airpod2, ZERO_VELOCITY);
      } else {
        const velocity1 = { x: (airpod1XPos - airpod1.position.x) / 10, y: (airpod1YPos - airpod1.position.y) / 10};
        const velocity2 = { x: (airpod2XPos - airpod2.position.x) / 10, y: (airpod2YPos - airpod2.position.y) / 10};

        Body.setVelocity(airpod1, velocity1);
        Body.setVelocity(airpod2, velocity2);
      }
  }
  // logic to rotate airpods around in a circle
  if (!isLanding && !isGoingBack) {
    const ringCoordinates = document.getElementById('ring').getBoundingClientRect();
    const x = (ringCoordinates.right + ringCoordinates.left) / 2;
    const y = (ringCoordinates.top + ringCoordinates.bottom) / 2;

    airpodAngleOffset = (airpodAngleOffset + angleOffsetPerTimestep) % (2 * Math.PI);

    const airpod1OffsetX = Math.cos(airpodAngleOffset) * radius;
    const airpod1OffsetY = Math.sin(airpodAngleOffset) * radius;

    const airpod2OffsetX = Math.cos(airpodAngleOffset + Math.PI) * radius;
    const airpod2OffsetY = Math.sin(airpodAngleOffset + Math.PI) * radius;

    const airpod1XPos = x + airpod1OffsetX;
    const airpod1YPos = y + airpod1OffsetY;

    const airpod2XPos = x + airpod2OffsetX;
    const airpod2YPos = y + airpod2OffsetY;

    Body.setPosition(airpod1, { x: airpod1XPos, y: airpod1YPos });
    Body.setPosition(airpod2, { x: airpod2XPos, y: airpod2YPos });

    Body.rotate(airpod1, 0.02);
    Body.rotate(airpod2, 0.02);
  }

  window.requestAnimationFrame(updateRotation);
}

window.requestAnimationFrame(updateRotation);

window.addEventListener('click', onClick);
window.addEventListener('mousemove', onMouseMove);

Runner.create({ isFixed: true });
Runner.run(engine);
Render.run(render);
