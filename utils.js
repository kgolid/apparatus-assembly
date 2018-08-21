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

export { contains, union, flatten, get_random_from, random_dir, mirror, is_vertical };
