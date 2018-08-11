import ApparatusGenerator from 'apparatus-generator';
import * as ut from './utils';

const sketch = p => {
  let app_gen;
  let apparatus;
  let scale = 12;
  let shuffle = 100;
  let tick = 0;

  p.setup = () => {
    p.createCanvas(800, 800);
    p.background('#f6ddbb');
    p.fill(255);
    p.frameRate(20);
    p.noStroke();
    app_gen = new ApparatusGenerator(20, 25, {
      solidness: 1,
      initiate_chance: 1,
      roundness: 0.1,
      colors: ['#d63644', '#396c68', '#f59647', '#4d3240', '#893f49', '#89e3b7', '#817c77']
    });

    setup_apparatus();
  };

  function setup_apparatus() {
    apparatus = app_gen.generate();
    apparatus.forEach(part => {
      part.x2 = part.x1 + part.w;
      part.y2 = part.y1 + part.h;
      part.path = [
        { x: part.x1, y: part.y1 },
        { x: part.x1, y: part.y1 },
        { x: part.x1, y: part.y1 },
        { x: part.x1, y: part.y1 }
      ];
    });

    for (let i = 4; i < shuffle; i++) {
      apparatus.forEach(part => {
        part.path.push({ x: part.x1, y: part.y1 });
      });
      let direction = p.floor(p.random(4));
      let chosen = apparatus[p.floor(p.random(apparatus.length))];
      let neighborhood = get_neighborhood(chosen, apparatus, direction);
      shift_all(neighborhood, direction, i);
    }
  }

  p.draw = () => {
    p.background('#f6ddbb');

    if (tick >= shuffle) {
      setup_apparatus();
      tick = 0;
    }
    apparatus.forEach(part => {
      display_rect(part, scale, shuffle - tick - 1);
    });
    tick++;
  };

  function get_neighborhood(r1, rs, dir) {
    let ns = [r1];
    let ms = ut.union(ns, ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equals), equals);

    while (ms.length > ns.length) {
      ns = ms;
      ms = ut.union(ns, ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equals), equals);
    }
    return ms;
  }

  function get_neighbors(r1, rs, dir) {
    return rs.filter(r => is_neighbor(r1, r, dir));
  }

  function is_neighbor(r1, r2, dir) {
    if (equals(r1, r2)) return false; // Identical
    if (dir == 0) return r2.y2 == r1.y1 && r2.x1 < r1.x2 && r2.x2 > r1.x1; // North
    if (dir == 1) return r2.x1 == r1.x2 && r2.y1 < r1.y2 && r2.y2 > r1.y1; // East
    if (dir == 2) return r2.y1 == r1.y2 && r2.x1 < r1.x2 && r2.x2 > r1.x1; // South
    if (dir == 3) return r2.x2 == r1.x1 && r2.y1 < r1.y2 && r2.y2 > r1.y1; // West
    return false; // Error
  }

  function equals(r1, r2) {
    return r1.x1 == r2.x1 && r1.y1 == r2.y1 && r1.x2 == r2.x2 && r1.y2 == r2.y2;
  }

  function shift_all(rs, dir, time) {
    rs.forEach(r => shift(r, dir, time));
  }

  function shift(r, dir, time) {
    let sx = dir % 2 == 0 ? 0 : dir == 1 ? 1 : -1;
    let sy = dir % 2 == 0 ? (dir == 2 ? 1 : -1) : 0;

    r.x1 += sx;
    r.y1 += sy;
    r.x2 += sx;
    r.y2 += sy;
    r.path[time] = { x: r.x1, y: r.y1 };
  }

  function display_rect(r, scale, time) {
    p.fill(r.col ? r.col : '#fff');
    p.rect(r.path[time].x * scale, r.path[time].y * scale, r.w * scale, r.h * scale);
  }
};

new p5(sketch);
