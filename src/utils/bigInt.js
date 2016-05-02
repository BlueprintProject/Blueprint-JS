digitsStr = '0123456789abcdef';
for (bpe = 0;
  (1 << (bpe + 1)) > (1 << bpe); bpe++);
bpe >>= 1;
mask = (1 << bpe) - 1;
radix = (1 << bpe) + 1;
s6 = new Array(0)

function negative(x) {
  return ((x[x.length - 1] >> (bpe - 1)) & 1);
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function greaterShift(x, y, shift) {
  var i, kx = x.length,
    ky = y.length;

  var k = ((kx + shift) < ky) ? (kx + shift) : ky;
  for (i = ky - 1 - shift; i < kx && i >= 0; i++)
    if (x[i] > 0)
      return 1; //if there are nonzeros in x to the left of the first column of y, then x is bigger
  for (i = kx - 1 + shift; i < ky; i++)
    if (y[i] > 0)
      return 0; //if there are nonzeros in y to the left of the first column of x, then x is not bigger
  for (i = k - 1; i >= shift; i--)
    if (x[i - shift] > y[i]) return 1;
    else
  if (x[i - shift] < y[i]) return 0;
  return 0;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function divide_(x, y, q, r) {
  var kx, ky;
  var i, j, y1, y2, c, a, b;
  copy_(r, x);
  for (ky = y.length; y[ky - 1] == 0; ky--); //ky is number of elements in y, not including leading zeros

  //normalize: ensure the most significant element of y has its highest bit set
  b = y[ky - 1];
  for (a = 0; b; a++)
    b >>= 1;
  a = bpe - a; //a is how many bits to shift so that the high order bit of y is leftmost in its array element
  leftShift_(y, a); //multiply both by 1<<a now, then divide both by that at the end
  leftShift_(r, a);

  //Rob Visser discovered a bug: the following line was originally just before the normalization.
  for (kx = r.length; r[kx - 1] == 0 && kx > ky; kx--); //kx is number of elements in normalized x, not including leading zeros

  copyInt_(q, 0); // q=0
  while (!greaterShift(y, r, kx - ky)) { // while (leftShift_(y,kx-ky) <= r) {
    subShift_(r, y, kx - ky); //   r=r-leftShift_(y,kx-ky)
    q[kx - ky]++; //   q[kx-ky]++;
  } // }

  for (i = kx - 1; i >= ky; i--) {
    if (r[i] == y[ky - 1])
      q[i - ky] = mask;
    else
      q[i - ky] = Math.floor((r[i] * radix + r[i - 1]) / y[ky - 1]);

    //The following for(;;) loop is equivalent to the commented while loop,
    //except that the uncommented version avoids overflow.
    //The commented loop comes from HAC, which assumes r[-1]==y[-1]==0
    //  while (q[i-ky]*(y[ky-1]*radix+y[ky-2]) > r[i]*radix*radix+r[i-1]*radix+r[i-2])
    //    q[i-ky]--;
    for (;;) {
      y2 = (ky > 1 ? y[ky - 2] : 0) * q[i - ky];
      c = y2 >> bpe;
      y2 = y2 & mask;
      y1 = c + q[i - ky] * y[ky - 1];
      c = y1 >> bpe;
      y1 = y1 & mask;

      if (c == r[i] ? y1 == r[i - 1] ? y2 > (i > 1 ? r[i - 2] : 0) : y1 > r[i - 1] : c > r[i])
        q[i - ky]--;
      else
        break;
    }

    linCombShift_(r, y, -q[i - ky], i - ky); //r=r-q[i-ky]*leftShift_(y,i-ky)
    if (negative(r)) {
      addShift_(r, y, i - ky); //r=r+leftShift_(y,i-ky)
      q[i - ky]--;
    }
  }

  rightShift_(y, a); //undo the normalization step
  rightShift_(r, a); //undo the normalization step
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function int2bigInt(t, bits, minSize) {
  var i, k;
  k = Math.ceil(bits / bpe) + 1;
  k = minSize > k ? minSize : k;
  var buff = new Array(k);
  copyInt_(buff, t);
  return buff;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function str2bigInt(s, base, minSize) {
  var d, i, j, x, y, kk;
  var k = s.length;
  if (base == -1) { //comma-separated list of array elements in decimal
    x = new Array(0);
    for (;;) {
      y = new Array(x.length + 1);
      for (i = 0; i < x.length; i++)
        y[i + 1] = x[i];
      y[0] = parseInt(s, 10);
      x = y;
      d = s.indexOf(',', 0);
      if (d < 1)
        break;
      s = s.substring(d + 1);
      if (s.length == 0)
        break;
    }
    if (x.length < minSize) {
      y = new Array(minSize);
      copy_(y, x);
      return y;
    }
    return x;
  }

  x = int2bigInt(0, base * k, 0);
  for (i = 0; i < k; i++) {
    d = digitsStr.indexOf(s.substring(i, i + 1), 0);
    if (base <= 36 && d >= 36) //convert lowercase to uppercase if base<=36
      d -= 26;
    if (d >= base || d < 0) { //stop at first illegal character
      break;
    }
    multInt_(x, base);
    addInt_(x, d);
  }

  for (k = x.length; k > 0 && !x[k - 1]; k--); //strip off leading zeros
  k = minSize > k + 1 ? minSize : k + 1;
  y = new Array(k);
  kk = k < x.length ? k : x.length;
  for (i = 0; i < kk; i++)
    y[i] = x[i];
  for (; i < k; i++)
    y[i] = 0;
  return y;
}

function isZero(x) {
  var i;
  for (i = 0; i < x.length; i++)
    if (x[i])
      return 0;
  return 1;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function bigInt2str(x, base) {
  var i, t, s = "";

  if (s6.length != x.length)
    s6 = dup(x);
  else
    copy_(s6, x);

  if (base == -1) { //return the list of array contents
    for (i = x.length - 1; i > 0; i--)
      s += x[i] + ',';
    s += x[0];
  } else { //return it in the given base
    while (!isZero(s6)) {
      t = divInt_(s6, base); //t=s6 % base; s6=floor(s6/base);
      s = digitsStr.substring(t, t + 1) + s;
    }
  }
  if (s.length == 0)
    s = "0";
  return s;
}

function dup(x) {
  var i;
  var buff = new Array(x.length);
  copy_(buff, x);
  return buff;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function copy_(x, y) {
  var i;
  var k = x.length < y.length ? x.length : y.length;
  for (i = 0; i < k; i++)
    x[i] = y[i];
  for (i = k; i < x.length; i++)
    x[i] = 0;
}

function copyInt_(x, n) {
  var i, c;
  for (c = n, i = 0; i < x.length; i++) {
    x[i] = c & mask;
    c >>= bpe;
  }
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function addInt_(x, n) {
  var i, k, c, b;
  x[0] += n;
  k = x.length;
  c = 0;
  for (i = 0; i < k; i++) {
    c += x[i];
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
    if (!c) return; //stop carrying as soon as the carry is zero
  }
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function rightShift_(x, n) {
  var i;
  var k = Math.floor(n / bpe);
  if (k) {
    for (i = 0; i < x.length - k; i++) //right shift x by k elements
      x[i] = x[i + k];
    for (; i < x.length; i++)
      x[i] = 0;
    n %= bpe;
  }
  for (i = 0; i < x.length - 1; i++) {
    x[i] = mask & ((x[i + 1] << (bpe - n)) | (x[i] >> n));
  }
  x[i] >>= n;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function leftShift_(x, n) {
  var i;
  var k = Math.floor(n / bpe);
  if (k) {
    for (i = x.length; i >= k; i--) //left shift x by k elements
      x[i] = x[i - k];
    for (; i >= 0; i--)
      x[i] = 0;
    n %= bpe;
  }
  if (!n)
    return;
  for (i = x.length - 1; i > 0; i--) {
    x[i] = mask & ((x[i] << n) | (x[i - 1] >> (bpe - n)));
  }
  x[i] = mask & (x[i] << n);
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function multInt_(x, n) {
  var i, k, c, b;
  if (!n)
    return;
  k = x.length;
  c = 0;
  for (i = 0; i < k; i++) {
    c += x[i] * n;
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
  }
}

function divInt_(x, n) {
  var i, r = 0,
    s;
  for (i = x.length - 1; i >= 0; i--) {
    s = r * radix + x[i];
    x[i] = Math.floor(s / n);
    r = s % n;
  }
  return r;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function linCombShift_(x, y, b, ys) {
  var i, c, k, kk;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  for (c = 0, i = ys; i < k; i++) {
    c += x[i] + b * y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
  }

  for (i = k; c && i < kk; i++) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
  }
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function subShift_(x, y, ys) {
  var i, c, k, kk;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  for (c = 0, i = ys; i < k; i++) {
    c += x[i] - y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
  }

  for (i = k; c && i < kk; i++) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
  }
}

module.exports = {
  divide: divide_,
  int2bigInt: int2bigInt,
  str2bigInt: str2bigInt,
  bigInt2str: bigInt2str
}
