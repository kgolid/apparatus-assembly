import ApparatusGenerator from 'apparatus-generator';
import * as tome from 'chromotome';
import * as ut from './utils';

const sketch = p => {
  let app_gen, apparata;
  const number_of_apparata = 9;
  const scale = 2.5;
  const shuffle = 300;
  let tick = 0;
  const final_frame_duration = 120;
  let symmetric_assembly = true;
  const movement_length = 0.85;
  const row_length = 3;

  p.setup = () => {
    p.createCanvas(1200, 1000);
    p.background('#eee8e2');
    p.fill(0);
    p.frameRate(40);
    p.strokeWeight(1.5);
    p.stroke('#5c3936');

    apparata = [];
    app_gen = new ApparatusGenerator(25, 35, {
      solidness: 0.5,
      initiate_chance: 0.9,
      extension_chance: 0.88,
      vertical_chance: 0.6,
      roundness: 0,
      group_size: 0.82,
      colors: tome.get('retro-washedout').colors
    });

    for (let i = 0; i < number_of_apparata / row_length; i++) {
      setup_apparatus(row_length);
    }
  };

  function setup_apparatus(n) {
    let apparatus = app_gen.generate();

    for (let i = 0; i < n; i++) {
      let extra_shuffle = p.floor(p.random(100));
      let animatable_app = populate_apparatus(apparatus, extra_shuffle);
      animate_apparatus(animatable_app, extra_shuffle);
      apparata.push(animatable_app);
    }
  }

  function populate_apparatus(app, extra_shuffle) {
    let new_app = [];
    app.forEach(part => {
      let new_part = {
        ...part,
        x2: part.x1 + part.w,
        y2: part.y1 + part.h,
        path: []
      };
      for (let i = 0; i < final_frame_duration - extra_shuffle; i++) {
        new_part.path.push({ x: new_part.x1, y: new_part.y1 });
      }
      new_app.push(new_part);
    });
    return new_app;
  }

  function animate_apparatus(apparatus, extra_shuffle) {
    symmetric_assembly = true;
    let chosen, origin, direction;
    let start_from_new_part = true;
    let actual_ff_duration = final_frame_duration - extra_shuffle;
    for (let i = actual_ff_duration; i < shuffle; i++) {
      if (i - actual_ff_duration >= (shuffle - actual_ff_duration) / 2) {
        symmetric_assembly = false;
      }

      apparatus.forEach(part => {
        part.path.push({ x: part.x1, y: part.y1 });
      });
      if (start_from_new_part) {
        chosen = ut.get_random_from(apparatus);
        origin = symmetric_assembly
          ? get_with_id(apparatus, chosen.id)
          : [chosen];
        direction =
          symmetric_assembly && origin.length === 1
            ? ut.random_dir(2)
            : ut.random_dir(symmetric_assembly ? 3 : 4);
      }
      start_from_new_part = p.random() > movement_length;

      if (ut.is_vertical(direction) || !symmetric_assembly) {
        let neighborhood = get_neighborhood(origin, apparatus, direction);
        shift_all(neighborhood, direction, i);
      } else {
        let neighborhood_left = get_neighborhood(
          [origin[0]],
          apparatus,
          ut.mirror(direction)
        );
        let neighborhood_right = get_neighborhood(
          [origin[1]],
          apparatus,
          direction
        );
        shift_all(neighborhood_left, ut.mirror(direction), i);
        shift_all(neighborhood_right, direction, i);
      }
    }
  }

  p.draw = () => {
    p.background('#eee8e2');
    p.translate(
      (p.width - (app_gen.xdim + 2) * scale) / (row_length + 1),
      (p.height - (app_gen.ydim + 2) * scale) / 6
    );

    if (tick >= shuffle) {
      apparata = [];
      for (let i = 0; i < number_of_apparata / row_length; i++) {
        setup_apparatus(row_length);
      }
      tick = 0;
    }

    for (let i = 0; i < apparata.length; i++) {
      display_apparatus(apparata[i]);
      p.translate((p.width - (app_gen.xdim + 2) * scale) / (row_length + 1), 0);
      if (i % row_length === row_length - 1)
        p.translate(
          (-row_length * (p.width - (app_gen.xdim + 2) * scale)) /
            (row_length + 1),
          (p.height - (app_gen.ydim + 2) * scale) / 3
        );
    }

    tick++;
  };

  function display_apparatus(appar) {
    appar.forEach(part => {
      display_rect(part, scale, shuffle - tick - 1);
    });
  }

  function get_neighborhood(ps, rs, dir) {
    let ns = ps;
    let ms = ut.union(
      ns,
      ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equal_rect),
      equal_rect
    );

    while (ms.length > ns.length) {
      ns = ms;
      ms = ut.union(
        ns,
        ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equal_rect),
        equal_rect
      );
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
    p.rect(
      r.path[time].x * scale,
      r.path[time].y * scale,
      r.w * scale,
      r.h * scale
    );
  }

  p.keyPressed = () => {
    if (p.keyCode === 83) symmetric_assembly = !symmetric_assembly;
    else if (p.keyCode === 80) p.saveCanvas('apparatus_assembly', 'png');
  };
};

new p5(sketch);
