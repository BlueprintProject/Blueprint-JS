/* jshint ignore:start */
var addInt_, bigInt2str, bpe, copyInt_, copy_, digitsStr, divInt_, divide_, dup, greaterShift, int2bigInt, isZero, leftShift_, linCombShift_, mask, multInt_, negative, radix, rightShift_, s6, str2bigInt, subShift_;

digitsStr = '0123456789abcdef';

negative = function(x) {
  return x[x.length - 1] >> bpe - 1 & 1;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

greaterShift = function(x, y, shift) {
  var i, k, kx, ky;
  i = void 0;
  kx = x.length;
  ky = y.length;
  k = kx + shift < ky ? kx + shift : ky;
  i = ky - 1 - shift;
  while (i < kx && i >= 0) {
    if (x[i] > 0) {
      return 1;
    }
    i++;
  }
  i = kx - 1 + shift;
  while (i < ky) {
    if (y[i] > 0) {
      return 0;
    }
    i++;
  }
  i = k - 1;
  while (i >= shift) {
    if (x[i - shift] > y[i]) {
      return 1;
    } else if (x[i - shift] < y[i]) {
      return 0;
    }
    i--;
  }
  return 0;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

divide_ = function(x, y, q, r) {
  var a, b, c, i, j, kx, ky, y1, y2;
  kx = void 0;
  ky = void 0;
  i = void 0;
  j = void 0;
  y1 = void 0;
  y2 = void 0;
  c = void 0;
  a = void 0;
  b = void 0;
  copy_(r, x);
  ky = y.length;
  while (y[ky - 1] === 0) {
    ky--;
  }
  b = y[ky - 1];
  a = 0;
  while (b) {
    b >>= 1;
    a++;
  }
  a = bpe - a;
  leftShift_(y, a);
  leftShift_(r, a);
  kx = r.length;
  while (r[kx - 1] === 0 && kx > ky) {
    kx--;
  }
  copyInt_(q, 0);
  while (!greaterShift(y, r, kx - ky)) {
    subShift_(r, y, kx - ky);
    q[kx - ky]++;
  }
  i = kx - 1;
  while (i >= ky) {
    if (r[i] === y[ky - 1]) {
      q[i - ky] = mask;
    } else {
      q[i - ky] = Math.floor((r[i] * radix + r[i - 1]) / y[ky - 1]);
    }
    while (true) {
      y2 = (ky > 1 ? y[ky - 2] : 0) * q[i - ky];
      c = y2 >> bpe;
      y2 = y2 & mask;
      y1 = c + q[i - ky] * y[ky - 1];
      c = y1 >> bpe;
      y1 = y1 & mask;
      if ((c === r[i] ? (y1 === r[i - 1] ? y2 > (i > 1 ? r[i - 2] : 0) : y1 > r[i - 1]) : c > r[i])) {
        q[i - ky]--;
      } else {
        break;
      }
    }
    linCombShift_(r, y, -q[i - ky], i - ky);
    if (negative(r)) {
      addShift_(r, y, i - ky);
      q[i - ky]--;
    }
    i--;
  }
  rightShift_(y, a);
  rightShift_(r, a);
};


/* istanbul ignore next: The code missed in tests will not be used in production */

int2bigInt = function(t, bits, minSize) {
  var buff, i, k;
  i = void 0;
  k = void 0;
  k = Math.ceil(bits / bpe) + 1;
  k = minSize > k ? minSize : k;
  buff = new Array(k);
  copyInt_(buff, t);
  return buff;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

str2bigInt = function(s, base, minSize) {
  var d, i, j, k, kk, x, y;
  d = void 0;
  i = void 0;
  j = void 0;
  x = void 0;
  y = void 0;
  kk = void 0;
  k = s.length;
  if (base === -1) {
    x = new Array(0);
    while (true) {
      y = new Array(x.length + 1);
      i = 0;
      while (i < x.length) {
        y[i + 1] = x[i];
        i++;
      }
      y[0] = parseInt(s, 10);
      x = y;
      d = s.indexOf(',', 0);
      if (d < 1) {
        break;
      }
      s = s.substring(d + 1);
      if (s.length === 0) {
        break;
      }
    }
    if (x.length < minSize) {
      y = new Array(minSize);
      copy_(y, x);
      return y;
    }
    return x;
  }
  x = int2bigInt(0, base * k, 0);
  i = 0;
  while (i < k) {
    d = digitsStr.indexOf(s.substring(i, i + 1), 0);
    if (base <= 36 && d >= 36) {
      d -= 26;
    }
    if (d >= base || d < 0) {
      break;
    }
    multInt_(x, base);
    addInt_(x, d);
    i++;
  }
  k = x.length;
  while (k > 0 && !x[k - 1]) {
    k--;
  }
  k = minSize > k + 1 ? minSize : k + 1;
  y = new Array(k);
  kk = k < x.length ? k : x.length;
  i = 0;
  while (i < kk) {
    y[i] = x[i];
    i++;
  }
  while (i < k) {
    y[i] = 0;
    i++;
  }
  return y;
};

isZero = function(x) {
  var i;
  i = void 0;
  i = 0;
  while (i < x.length) {
    if (x[i]) {
      return 0;
    }
    i++;
  }
  return 1;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

bigInt2str = function(x, base) {
  var i, s, s6, t;
  i = void 0;
  t = void 0;
  s = '';
  if (s6.length !== x.length) {
    s6 = dup(x);
  } else {
    copy_(s6, x);
  }
  if (base === -1) {
    i = x.length - 1;
    while (i > 0) {
      s += x[i] + ',';
      i--;
    }
    s += x[0];
  } else {
    while (!isZero(s6)) {
      t = divInt_(s6, base);
      s = digitsStr.substring(t, t + 1) + s;
    }
  }
  if (s.length === 0) {
    s = '0';
  }
  return s;
};

dup = function(x) {
  var buff, i;
  i = void 0;
  buff = new Array(x.length);
  copy_(buff, x);
  return buff;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

copy_ = function(x, y) {
  var i, k;
  i = void 0;
  k = x.length < y.length ? x.length : y.length;
  i = 0;
  while (i < k) {
    x[i] = y[i];
    i++;
  }
  i = k;
  while (i < x.length) {
    x[i] = 0;
    i++;
  }
};

copyInt_ = function(x, n) {
  var c, i;
  i = void 0;
  c = void 0;
  c = n;
  i = 0;
  while (i < x.length) {
    x[i] = c & mask;
    c >>= bpe;
    i++;
  }
};


/* istanbul ignore next: The code missed in tests will not be used in production */

addInt_ = function(x, n) {
  var b, c, i, k;
  i = void 0;
  k = void 0;
  c = void 0;
  b = void 0;
  x[0] += n;
  k = x.length;
  c = 0;
  i = 0;
  while (i < k) {
    c += x[i];
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
    if (!c) {
      return;
    }
    i++;
  }
};


/* istanbul ignore next: The code missed in tests will not be used in production */

rightShift_ = function(x, n) {
  var i, k;
  i = void 0;
  k = Math.floor(n / bpe);
  if (k) {
    i = 0;
    while (i < x.length - k) {
      x[i] = x[i + k];
      i++;
    }
    while (i < x.length) {
      x[i] = 0;
      i++;
    }
    n %= bpe;
  }
  i = 0;
  while (i < x.length - 1) {
    x[i] = mask & (x[i + 1] << bpe - n | x[i] >> n);
    i++;
  }
  x[i] >>= n;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

leftShift_ = function(x, n) {
  var i, k;
  i = void 0;
  k = Math.floor(n / bpe);
  if (k) {
    i = x.length;
    while (i >= k) {
      x[i] = x[i - k];
      i--;
    }
    while (i >= 0) {
      x[i] = 0;
      i--;
    }
    n %= bpe;
  }
  if (!n) {
    return;
  }
  i = x.length - 1;
  while (i > 0) {
    x[i] = mask & (x[i] << n | x[i - 1] >> bpe - n);
    i--;
  }
  x[i] = mask & x[i] << n;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

multInt_ = function(x, n) {
  var b, c, i, k;
  i = void 0;
  k = void 0;
  c = void 0;
  b = void 0;
  if (!n) {
    return;
  }
  k = x.length;
  c = 0;
  i = 0;
  while (i < k) {
    c += x[i] * n;
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
    i++;
  }
};

divInt_ = function(x, n) {
  var i, r, s;
  i = void 0;
  r = 0;
  s = void 0;
  i = x.length - 1;
  while (i >= 0) {
    s = r * radix + x[i];
    x[i] = Math.floor(s / n);
    r = s % n;
    i--;
  }
  return r;
};


/* istanbul ignore next: The code missed in tests will not be used in production */

linCombShift_ = function(x, y, b, ys) {
  var c, i, k, kk;
  i = void 0;
  c = void 0;
  k = void 0;
  kk = void 0;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  c = 0;
  i = ys;
  while (i < k) {
    c += x[i] + b * y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
    i++;
  }
  i = k;
  while (c && i < kk) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
    i++;
  }
};


/* istanbul ignore next: The code missed in tests will not be used in production */

subShift_ = function(x, y, ys) {
  var c, i, k, kk;
  i = void 0;
  c = void 0;
  k = void 0;
  kk = void 0;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  c = 0;
  i = ys;
  while (i < k) {
    c += x[i] - y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
    i++;
  }
  i = k;
  while (c && i < kk) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
    i++;
  }
};

bpe = 0;

while (1 << bpe + 1 > 1 << bpe) {
  bpe++;
}

bpe >>= 1;

mask = (1 << bpe) - 1;

radix = (1 << bpe) + 1;

s6 = new Array(0);

module.exports = {
  divide: divide_,
  int2bigInt: int2bigInt,
  str2bigInt: str2bigInt,
  bigInt2str: bigInt2str
};


/* jshint ignore:end */

// ---
// generated by coffee-script 1.9.2
