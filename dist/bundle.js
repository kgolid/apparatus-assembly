(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  class index {
    constructor(
      width,
      height,
      {
        initiate_chance = 0.8,
        extension_chance = 0.8,
        vertical_chance = 0.8,
        horizontal_symmetry = true,
        vertical_symmetry = false,
        roundness = 0.1,
        solidness = 0.5,
        colors = [],
        color_mode = 'group',
        group_size = 0.8
      } = {}
    ) {
      this.xdim = Math.round(width * 2 + 11, 0);
      this.ydim = Math.round(height * 2 + 11, 0);
      this.radius_x = width;
      this.radius_y = height;
      this.chance_new = initiate_chance;
      this.chance_extend = extension_chance;
      this.chance_vertical = vertical_chance;
      this.colors = colors;
      this.color_mode = color_mode;
      this.group_size = group_size;
      this.h_symmetric = horizontal_symmetry;
      this.v_symmetric = vertical_symmetry;
      this.roundness = roundness;
      this.solidness = solidness;
    }

    generate() {
      this.main_color = get_random(this.colors);
      this.id_counter = 0;

      let grid = new Array(this.ydim + 1);
      for (var i = 0; i < grid.length; i++) {
        grid[i] = new Array(this.xdim + 1);
        for (var j = 0; j < grid[i].length; j++) {
          if (i == 0 || j == 0) {
            grid[i][j] = { h: false, v: false, in: false, col: null };
          } else if (this.h_symmetric && j > grid[i].length / 2) {
            grid[i][j] = deep_copy(grid[i][grid[i].length - j]);
            grid[i][j].v = grid[i][grid[i].length - j + 1].v;
          } else if (this.v_symmetric && i > grid.length / 2) {
            grid[i][j] = deep_copy(grid[grid.length - i][j]);
            grid[i][j].h = grid[grid.length - i + 1][j].h;
          } else {
            grid[i][j] = this.next_block(j, i, grid[i][j - 1], grid[i - 1][j]);
          }
        }
      }
      let rects = convert_linegrid_to_rectangles(grid);
      return rects;
    }

    next_block(x, y, left, top) {
      const context = this;

      if (!left.in && !top.in) {
        return block_set_1(x, y);
      }

      if (left.in && !top.in) {
        if (left.h) return block_set_3(x, y);
        return block_set_2(x, y);
      }

      if (!left.in && top.in) {
        if (top.v) return block_set_5(x, y);
        return block_set_4(x, y);
      }

      if (left.in && top.in) {
        if (!left.h && !top.v) return block_set_6();
        if (left.h && !top.v) return block_set_7(x, y);
        if (!left.h && top.v) return block_set_8(x, y);
        return block_set_9(x, y);
      }

      // --- Block sets ----

      function block_set_1(x, y) {
        if (start_new_from_blank(x, y)) return new_block();
        return { v: false, h: false, in: false, col: null, id: null };
      }

      function block_set_2(x, y) {
        if (start_new_from_blank(x, y)) return new_block();
        return { v: true, h: false, in: false, col: null, id: null };
      }

      function block_set_3(x, y) {
        if (extend(x, y)) return { v: false, h: true, in: true, col: left.col, id: left.id };
        return block_set_2(x, y);
      }

      function block_set_4(x, y) {
        if (start_new_from_blank(x, y)) return new_block();
        return { v: false, h: true, in: false, col: null, id: null };
      }

      function block_set_5(x, y) {
        if (extend(x, y)) return { v: true, h: false, in: true, col: top.col, id: top.id };
        return block_set_4(x, y);
      }

      function block_set_6() {
        return { v: false, h: false, in: true, col: left.col, id: left.id };
      }

      function block_set_7(x, y) {
        if (extend(x, y)) return { v: false, h: true, in: true, col: left.col, id: left.id };
        if (start_new(x, y)) return new_block();
        return { v: true, h: true, in: false, col: null, id: null };
      }

      function block_set_8(x, y) {
        if (extend(x, y)) return { v: true, h: false, in: true, col: top.col, id: top.id };
        if (start_new(x, y)) return new_block();
        return { v: true, h: true, in: false, col: null, id: null };
      }

      function block_set_9(x, y) {
        if (vertical_dir()) return { v: true, h: false, in: true, col: top.col, id: top.id };
        return { v: false, h: true, in: true, col: left.col, id: left.id };
      }

      // ---- Blocks ----

      function new_block() {
        let col;
        if (context.color_mode === 'random') {
          col = get_random(context.colors);
        } else if (context.color_mode === 'main') {
          col = Math.random() > 0.75 ? get_random(context.colors) : context.main_color;
        } else if (context.color_mode === 'group') {
          let keep = Math.random() > 0.5 ? left.col : top.col;
          context.main_color =
            Math.random() > context.group_size ? get_random(context.colors) : keep || context.main_color;
          col = context.main_color;
        } else {
          col = context.main_color;
        }

        return { v: true, h: true, in: true, col: col, id: context.id_counter++ };
      }

      // ---- Decisions ----

      function start_new_from_blank(x, y) {
        if (!active_position(x, y, -1 * (1 - context.roundness))) return false;
        return Math.random() <= context.solidness;
      }

      function start_new(x, y) {
        if (!active_position(x, y, 0)) return false;
        return Math.random() <= context.chance_new;
      }

      function extend(x, y) {
        if (!active_position(x, y, 1 - context.roundness)) return false;
        return Math.random() <= context.chance_extend;
      }

      function vertical_dir() {
        return Math.random() <= context.chance_vertical;
      }

      function active_position(x, y, fuzzy) {
        let fuzziness = 1 + Math.random() * fuzzy;
        let xa = Math.pow(x - context.xdim / 2, 2) / Math.pow(context.radius_x * fuzziness, 2);
        let ya = Math.pow(y - context.ydim / 2, 2) / Math.pow(context.radius_y * fuzziness, 2);
        return xa + ya < 1;
      }
    }
  }

  function get_random(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function deep_copy(obj) {
    let nobj = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        nobj[key] = obj[key];
      }
    }
    return nobj;
  }

  // --- Conversion ---
  function convert_linegrid_to_rectangles(grid) {
    let nw_corners = get_nw_corners(grid);
    extend_corners_to_rectangles(nw_corners, grid);
    return nw_corners;
  }

  function get_nw_corners(grid) {
    let nw_corners = [];
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        let cell = grid[i][j];
        if (cell.h && cell.v && cell.in) nw_corners.push({ x1: j, y1: i, col: cell.col, id: cell.id });
      }
    }
    return nw_corners;
  }

  function extend_corners_to_rectangles(corners, grid) {
    corners.map(c => {
      let accx = 1;
      while (c.x1 + accx < grid[c.y1].length && !grid[c.y1][c.x1 + accx].v) {
        accx++;
      }
      let accy = 1;
      while (c.y1 + accy < grid.length && !grid[c.y1 + accy][c.x1].h) {
        accy++;
      }
      c.w = accx;
      c.h = accy;
      return c;
    });
  }

  // List utils

  function contains(xs, y, eq) {
    return xs.some(x => eq(x, y));
  }

  function union(xs, ys, eq) {
    let zs = [];
    xs.forEach(x => zs.push(x));
    ys.forEach(y => {
      if (!contains(xs, y, eq)) zs.push(y);
    });
    return zs;
  }

  function flatten(xs, eq) {
    return xs.reduce((acc, val) => union(acc, val, eq), []);
  }

  function get_random_from(list) {
    return list[Math.floor(Math.random() * list.length)]
  }

  // ---- Direction utils ----

    // Get random direction among n choices.
    function random_dir(n) {
      if (n === 2) return Math.random() > 0.5 ? 0 : 2; // Up or down (50/50)
      if (n === 3) return Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? 2 : 0; // Up, right or down (25/50/25)
      return Math.floor(Math.random() * n); // Up, right, down or left (25/25/25/25)
    }

    // Get horizontally mirrored direction.
    function mirror(dir) {
      if (is_vertical(dir)) return dir;
      if (dir == 1) return 3;
      if (dir == 3) return 1;
    }

    // Check wether direction is vertical.
    function is_vertical(dir) {
      return dir == 0 || dir == 2;
    }

  const sketch = p => {
    let app_gen, apparatus;
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
      app_gen = new index(26, 36, {
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
      apparatus = app_gen.generate();
      populate_apparatus(apparatus);

      let chosen, origin, direction;
      let start_from_new_part = true;
      for (let i = final_frame_duration; i < shuffle; i++) {
        if (i === shuffle / 2) symmetric_assembly = false;

        apparatus.forEach(part => {part.path.push({ x: part.x1, y: part.y1 });});
        if (start_from_new_part) {
          chosen = get_random_from(apparatus);
          origin = symmetric_assembly ? get_with_id(apparatus, chosen.id) : [chosen];
          direction = symmetric_assembly && origin.length === 1 ? random_dir(2) : random_dir(symmetric_assembly ? 3 : 4);
        }
        start_from_new_part = p.random() > movement_length;

        if (is_vertical(direction) || !symmetric_assembly) {
          let neighborhood = get_neighborhood(origin, apparatus, direction);
          shift_all(neighborhood, direction, i);
        } else {
          let neighborhood_left = get_neighborhood([origin[0]], apparatus, mirror(direction));
          let neighborhood_right = get_neighborhood([origin[1]], apparatus, direction);
          shift_all(neighborhood_left, mirror(direction), i);
          shift_all(neighborhood_right, direction, i);
        }  
      }
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
      let ms = union(ns, flatten(ns.map(n => get_neighbors(n, rs, dir)), equal_rect), equal_rect);

      while (ms.length > ns.length) {
        ns = ms;
        ms = union(ns, flatten(ns.map(n => get_neighbors(n, rs, dir)), equal_rect), equal_rect);
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
      let sx = is_vertical(dir) ? 0 : dir == 1 ? 1 : -1;
      let sy = !is_vertical(dir) ? 0 : dir == 2 ? 1 : -1;

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

})));
