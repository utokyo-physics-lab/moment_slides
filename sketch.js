// p5.js and Matter.js interactive simulations

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      MouseConstraint = Matter.MouseConstraint,
      Mouse = Matter.Mouse,
      Composite = Matter.Composite,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Constraint = Matter.Constraint,
      Vertices = Matter.Vertices,
      Events = Matter.Events;

// ---------------------------------------------------------
// Simulation 1: Lever Principle
// ---------------------------------------------------------
const leverSketch = (p) => {
  let engine;
  let world;
  let mConstraint;
  
  let fulcrum;
  let plank;
  let boxBig;
  let boxSmall;

  p.setup = () => {
    let canvas = p.createCanvas(900, 400);
    canvas.parent('sim-lever');

    engine = Engine.create();
    world = engine.world;

    // Ground
    let ground = Bodies.rectangle(450, 390, 910, 40, { isStatic: true, render: { fillStyle: '#e5e7eb' } });

    // Fulcrum (Triangle)
    fulcrum = Bodies.polygon(450, 330, 3, 40, { 
      isStatic: true, 
      angle: -Math.PI/2, // point up
      render: { fillStyle: '#1d4ed8' } 
    });

    // Plank
    plank = Bodies.rectangle(450, 280, 700, 20, { 
      render: { fillStyle: '#3b82f6' },
      friction: 0.8
    });

    // Pivot constraint
    let pivot = Constraint.create({
      bodyA: plank,
      pointB: { x: 450, y: 280 },
      stiffness: 1,
      length: 0
    });

    // Boxes
    // Big box: 100x100, mass = 4
    boxBig = Bodies.rectangle(250, 220, 100, 100, { 
      render: { fillStyle: '#f97316' },
      friction: 0.8
    });
    Body.setMass(boxBig, 4);

    // Small box: 50x50, mass = 1
    boxSmall = Bodies.rectangle(750, 240, 50, 50, { 
      render: { fillStyle: '#f97316' },
      friction: 0.8
    });
    Body.setMass(boxSmall, 1);

    Composite.add(world, [ground, fulcrum, plank, pivot, boxBig, boxSmall]);

    // Mouse interaction
    let canvasMouse = Mouse.create(canvas.elt);
    canvasMouse.pixelRatio = p.pixelDensity();
    mConstraint = MouseConstraint.create(engine, {
      mouse: canvasMouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Composite.add(world, mConstraint);

    Runner.run(Runner.create(), engine);
  };

  p.draw = () => {
    p.background('#f8fafc');
    p.noStroke();

    // Draw Ground
    p.fill('#cbd5e1');
    p.rectMode(p.CENTER);
    p.rect(450, 390, 910, 40);

    // Draw Fulcrum
    p.fill('#1e3a8a'); // dark blue
    p.triangle(450, 290, 410, 370, 490, 370);

    // Draw Plank
    p.fill('#3b82f6');
    drawBody(p, plank);

    // Draw Boxes
    p.fill('#ea580c');
    drawBody(p, boxBig);
    p.fill('#fff');
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("重い", boxBig.position.x, boxBig.position.y - 10);
    p.textSize(20);
    p.text("重さ: 4", boxBig.position.x, boxBig.position.y + 20);

    p.fill('#f97316');
    drawBody(p, boxSmall);
    p.fill('#fff');
    p.textSize(16);
    p.text("軽い", boxSmall.position.x, boxSmall.position.y - 5);
    p.textSize(12);
    p.text("重さ: 1", boxSmall.position.x, boxSmall.position.y + 10);
  };
};

// ---------------------------------------------------------
// Simulation 2: Digital Scale and Carrot Cut
// ---------------------------------------------------------
const scaleSketch = (p) => {
  let engine;
  let world;
  let mConstraint;
  
  let thickPart;
  let thinPart;
  let scalePlatform;
  let scaleWeight = 0;

  p.setup = () => {
    let canvas = p.createCanvas(900, 450);
    canvas.parent('sim-scale');

    engine = Engine.create();
    world = engine.world;

    setupScene();

    // Mouse interaction
    let canvasMouse = Mouse.create(canvas.elt);
    canvasMouse.pixelRatio = p.pixelDensity();
    mConstraint = MouseConstraint.create(engine, {
      mouse: canvasMouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Composite.add(world, mConstraint);

    Runner.run(Runner.create(), engine);

    // Collision Event to measure weight
    Events.on(engine, 'collisionActive', function(event) {
      let pairs = event.pairs;
      let currentWeight = 0;
      for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i];
        if (pair.bodyA === scalePlatform || pair.bodyB === scalePlatform) {
          let otherBody = pair.bodyA === scalePlatform ? pair.bodyB : pair.bodyA;
          if (otherBody === thickPart || otherBody === thinPart) {
            currentWeight += otherBody.mass;
          }
        }
      }
      // Smooth the scale reading
      scaleWeight += (currentWeight - scaleWeight) * 0.2;
    });
    
    Events.on(engine, 'collisionEnd', function(event) {
       // Reset will naturally happen as collisionActive won't add it
    });
  };

  function setupScene() {
    let ground = Bodies.rectangle(450, 440, 910, 40, { isStatic: true });
    
    // Scale Platform
    scalePlatform = Bodies.rectangle(450, 380, 300, 20, { isStatic: true, isSensor: false });

    // Carrot properties
    // Total height (x-axis) = 360. Total base (y-axis) = 120.
    // Cut at x = 120.
    // Thick part: trapezoid.
    let thickVerts = Vertices.create([{x:0, y:-60}, {x:120, y:-40}, {x:120, y:40}, {x:0, y:60}]);
    thickPart = Bodies.fromVertices(200, 150, thickVerts, { friction: 0.8 });
    Body.setMass(thickPart, 5); // Proportional to 5/9
    
    // Thin part: triangle.
    let thinVerts = Vertices.create([{x:0, y:-40}, {x:240, y:0}, {x:0, y:40}]);
    thinPart = Bodies.fromVertices(700, 150, thinVerts, { friction: 0.8 });
    Body.setMass(thinPart, 4); // Proportional to 4/9

    Composite.add(world, [ground, scalePlatform, thickPart, thinPart]);
  }

  p.draw = () => {
    p.background('#f8fafc');
    p.noStroke();

    // Draw Ground
    p.fill('#cbd5e1');
    p.rectMode(p.CENTER);
    p.rect(450, 440, 910, 40);

    // Draw Scale Base
    p.fill('#94a3b8');
    p.rect(450, 410, 260, 40, 10);
    // Draw Scale Platform
    p.fill('#e2e8f0');
    drawBody(p, scalePlatform);
    
    // Calculate display weight (if no active collision, slowly decay to 0)
    // We update scaleWeight in collisionActive, but if nothing is touching, we must decay it
    let anyTouching = false;
    let bodies = [thickPart, thinPart];
    for(let b of bodies) {
        if(Matter.Bounds.overlaps(b.bounds, scalePlatform.bounds)) {
            // Simple proximity check, physics handles the rest
            anyTouching = true;
        }
    }
    if(!anyTouching) scaleWeight *= 0.8;
    if(scaleWeight < 0.1) scaleWeight = 0;

    // Draw Digital Display
    p.fill('#0f172a');
    p.rect(450, 410, 120, 30, 5);
    p.fill('#22c55e'); // Green LED color
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.textFont('monospace');
    p.text(scaleWeight.toFixed(1) + " g", 450, 410);

    // Draw Thick part (Carrot)
    p.fill('#f97316'); // Orange
    p.stroke('#c2410c');
    p.strokeWeight(3);
    drawBody(p, thickPart);
    p.fill('#fff'); p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('sans-serif');
    p.textSize(24);
    p.text("太い方", thickPart.position.x, thickPart.position.y);
    
    // Draw Thin part (Carrot)
    p.fill('#f97316'); p.stroke('#c2410c'); p.strokeWeight(3);
    drawBody(p, thinPart);
    p.fill('#fff'); p.noStroke();
    p.textSize(20);
    p.text("細い方", thinPart.position.x, thinPart.position.y);
    
    // Instructions
    p.fill('#64748b');
    p.noStroke();
    p.textSize(24);
    p.text("マウスでつかんで、電子天秤にのせてみよう", 450, 50);
  };
};

// Helper function to draw Matter.js body in p5
function drawBody(p, body) {
  p.beginShape();
  for (let i = 0; i < body.parts.length; i++) {
    let part = body.parts[i];
    if (i === 0 && body.parts.length > 1) continue; // Skip the hull for compound bodies if needed
    for (let j = 0; j < part.vertices.length; j++) {
      p.vertex(part.vertices[j].x, part.vertices[j].y);
    }
  }
  p.endShape(p.CLOSE);
}

// Initialize both sketches
new p5(leverSketch);
new p5(scaleSketch);
