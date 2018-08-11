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

export { contains, union, flatten };
