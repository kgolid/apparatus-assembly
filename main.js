import ApparatusGenerator from 'apparatus-generator';
import * as ut from './utils';

const sketch = p => {
  let app_gen;
  let scale = 6;
  let shuffle = 200;
  let tick = 0;
  let final_frame_duration = 25;
  let symmetric_assembly = true;
  let movement_length = 0.82;

  p.setup = () => {
    p.createCanvas(800, 800);
    p.background('#eee8e2');
    p.fill(0);
    p.frameRate(30);
    p.strokeWeight(3);
    p.stroke('#5c3936');
    app_gen = new ApparatusGenerator(26, 36, {
      solidness: 0.5,
      initiate_chance: 0.9,
      extension_chance: 0.86,
      vertical_chance: 0.5,
      roundness: 0,
      group_size: 0.82,
      colors: ['#dfa372', '#b76254', '#878a87', '#e8e0d4', '#cbdbc8', '#b29e91', '#9f736c']
    });

    setup_apparatus();
  };

  function setup_apparatus() {
    symmetric_assembly = true;
    let apparatus = app_gen.generate();
    populate_apparatus(apparatus);

    let chosen, origin, direction;
    let start_from_new_part = true;
    for (let i = final_frame_duration; i < shuffle; i++) {
      if (i === shuffle / 2) symmetric_assembly = false;

      apparatus.forEach(part => {part.path.push({ x: part.x1, y: part.y1 });});
      if (start_from_new_part) {
        chosen = apparatus[p.floor(p.random(apparatus.length))];
        origin = symmetric_assembly ? get_with_id(apparatus, chosen.id) : [chosen];
        direction = symmetric_assembly && origin.length === 1 ? ut.random_dir(2) : ut.random_dir(symmetric_assembly ? 3 : 4);
      }
      start_from_new_part = p.random() > movement_length;

      if (ut.is_vertical(direction) || !symmetric_assembly) {
        let neighborhood = get_neighborhood(origin, apparatus, direction);
        shift_all(neighborhood, direction, i);
      } else {
        let neighborhood_left = get_neighborhood([origin[0]], apparatus, ut.mirror(direction));
        let neighborhood_right = get_neighborhood([origin[1]], apparatus, direction);
        shift_all(neighborhood_left, ut.mirror(direction), i);
        shift_all(neighborhood_right, direction, i);
      }  
    }
    clean_board();
  }

  function populate_apparatus(app) {
    app.forEach(part => {
      part.x2 = part.x1 + part.w;
      part.y2 = part.y1 + part.h;
      part.path = [];
      for (let i = 0; i < final_frame_duration; i++) {
        part.path.push({ x: part.x1, y: part.y1 });
      }
    });
  }

  function clean_board() {

  }

  p.draw = () => {
    p.background('#eee8e2');
    p.translate(
      (p.width - (app_gen.xdim + 2) * scale) / 2, 
      (p.height - (app_gen.ydim + 2) * scale) / 2
    );

    if (tick >= shuffle) {
      setup_apparatus();
      tick = 0;
    }
    apparatus.forEach(part => {
      display_rect(part, scale, shuffle - tick - 1);
    });
    tick++;
  };

  function get_neighborhood(ps, rs, dir) {
    let ns = ps;
    let ms = ut.union(ns, ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equal_rect), equal_rect);

    while (ms.length > ns.length) {
      ns = ms;
      ms = ut.union(ns, ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equal_rect), equal_rect);
    }
    return ms;
  }

  function get_neighbors(r1, rs, dir) {
    return rs.filter(r => is_neighbor(r1, r, dir));
  }

  function is_neighbor(r1, r2, dir) {
    if (equal_rect(r1, r2)) return false; // Identical
    if (dir == 0) return r2.y2 == r1.y1 && r2.x1 < r1.x2 && r2.x2 > r1.x1; // North
    if (dir == 1) return r2.x1 == r1.x2 && r2.y1 < r1.y2 && r2.y2 > r1.y1; // East
    if (dir == 2) return r2.y1 == r1.y2 && r2.x1 < r1.x2 && r2.x2 > r1.x1; // South
    if (dir == 3) return r2.x2 == r1.x1 && r2.y1 < r1.y2 && r2.y2 > r1.y1; // West
    return false; // Error
  }

  function equal_rect(r1, r2) {
    return r1.x1 == r2.x1 && r1.y1 == r2.y1 && r1.x2 == r2.x2 && r1.y2 == r2.y2;
  }

  function shift_all(rs, dir, time) {
    rs.forEach(r => shift(r, dir, time));
  }

  function shift(r, dir, time) {
    let sx = ut.is_vertical(dir) ? 0 : dir == 1 ? 1 : -1;
    let sy = !ut.is_vertical(dir) ? 0 : dir == 2 ? 1 : -1;

    r.x1 += sx;
    r.y1 += sy;
    r.x2 += sx;
    r.y2 += sy;
    r.path[time] = { x: r.x1, y: r.y1 };
  }

  function get_with_id(rs, id) {
    return rs.filter(r => r.id === id);
  }

  function display_rect(r, scale, time) {
    p.fill(r.col ? r.col : '#fff');
    p.rect(r.path[time].x * scale, r.path[time].y * scale, r.w * scale, r.h * scale);
  }

  p.keyPressed = () => {
    if (p.keyCode === 83) symmetric_assembly = !symmetric_assembly;
    else if (p.keyCode === 80) p.saveCanvas('apparatus_assembly', 'png');
  };
};

new p5(sketch);
