const QR_VERSION = 5;
const QR_SIZE = 17 + QR_VERSION * 4;
const DATA_CODEWORDS = 108;
const EC_CODEWORDS = 26;
const MAX_BYTES = 106;
const ALIGNMENT_POSITIONS = [6, 30];

class BitBuffer {
  bits: number[] = [];

  append(value: number, length: number) {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push((value >>> i) & 1);
    }
  }

  toBytes() {
    const bytes: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j += 1) {
        value = (value << 1) | (this.bits[i + j] ?? 0);
      }
      bytes.push(value);
    }
    return bytes;
  }
}

const GF_EXP = new Array<number>(512);
const GF_LOG = new Array<number>(256);

let gfValue = 1;
for (let i = 0; i < 255; i += 1) {
  GF_EXP[i] = gfValue;
  GF_LOG[gfValue] = i;
  gfValue <<= 1;
  if (gfValue & 0x100) gfValue ^= 0x11d;
}
for (let i = 255; i < 512; i += 1) {
  GF_EXP[i] = GF_EXP[i - 255];
}

function gfMultiply(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function polynomialMultiply(left: number[], right: number[]) {
  const product = new Array<number>(left.length + right.length - 1).fill(0);
  left.forEach((leftValue, leftIndex) => {
    right.forEach((rightValue, rightIndex) => {
      product[leftIndex + rightIndex] ^= gfMultiply(leftValue, rightValue);
    });
  });
  return product;
}

function reedSolomonGenerator(degree: number) {
  let generator = [1];
  for (let i = 0; i < degree; i += 1) {
    generator = polynomialMultiply(generator, [1, GF_EXP[i]]);
  }
  return generator;
}

function reedSolomonRemainder(data: number[], degree: number) {
  const generator = reedSolomonGenerator(degree);
  const work = [...data, ...new Array<number>(degree).fill(0)];

  for (let i = 0; i < data.length; i += 1) {
    const factor = work[i];
    if (factor === 0) continue;
    for (let j = 0; j < generator.length; j += 1) {
      work[i + j] ^= gfMultiply(generator[j], factor);
    }
  }

  return work.slice(data.length);
}

function encodeData(text: string) {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > MAX_BYTES) {
    throw new Error("QR URL is too long for the local demo encoder");
  }

  const buffer = new BitBuffer();
  buffer.append(0b0100, 4);
  buffer.append(bytes.length, 8);
  bytes.forEach((byte) => buffer.append(byte, 8));

  const capacityBits = DATA_CODEWORDS * 8;
  buffer.append(0, Math.min(4, capacityBits - buffer.bits.length));
  while (buffer.bits.length % 8 !== 0) buffer.append(0, 1);

  const codewords = buffer.toBytes();
  while (codewords.length < DATA_CODEWORDS) {
    codewords.push(codewords.length % 2 === 0 ? 0xec : 0x11);
  }

  return [...codewords, ...reedSolomonRemainder(codewords, EC_CODEWORDS)];
}

function formatBits(mask: number) {
  const errorCorrectionLevelLow = 1;
  const data = (errorCorrectionLevelLow << 3) | mask;
  let remainder = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if (((remainder >>> i) & 1) !== 0) {
      remainder ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function maskCondition(mask: number, x: number, y: number) {
  if (mask === 0) return (x + y) % 2 === 0;
  return false;
}

export function createQrMatrix(text: string) {
  const modules = Array.from({ length: QR_SIZE }, () =>
    new Array<boolean | null>(QR_SIZE).fill(null),
  );
  const reserved = Array.from({ length: QR_SIZE }, () =>
    new Array<boolean>(QR_SIZE).fill(false),
  );

  function setModule(x: number, y: number, dark: boolean, reserve = true) {
    if (x < 0 || y < 0 || x >= QR_SIZE || y >= QR_SIZE) return;
    modules[y][x] = dark;
    if (reserve) reserved[y][x] = true;
  }

  function placeFinder(left: number, top: number) {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const targetX = left + x;
        const targetY = top + y;
        const inPattern = x >= 0 && x <= 6 && y >= 0 && y <= 6;
        const dark =
          inPattern &&
          (x === 0 ||
            x === 6 ||
            y === 0 ||
            y === 6 ||
            (x >= 2 && x <= 4 && y >= 2 && y <= 4));
        setModule(targetX, targetY, dark);
      }
    }
  }

  function placeAlignment(centerX: number, centerY: number) {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        const distance = Math.max(Math.abs(x), Math.abs(y));
        setModule(centerX + x, centerY + y, distance === 2 || distance === 0);
      }
    }
  }

  function writeFormat(mask: number) {
    const bits = formatBits(mask);
    const bit = (index: number) => ((bits >>> index) & 1) !== 0;

    for (let i = 0; i <= 5; i += 1) setModule(8, i, bit(i));
    setModule(8, 7, bit(6));
    setModule(8, 8, bit(7));
    setModule(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) setModule(14 - i, 8, bit(i));

    for (let i = 0; i < 8; i += 1) setModule(QR_SIZE - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) {
      setModule(8, QR_SIZE - 15 + i, bit(i));
    }
  }

  placeFinder(0, 0);
  placeFinder(QR_SIZE - 7, 0);
  placeFinder(0, QR_SIZE - 7);

  for (let i = 8; i < QR_SIZE - 8; i += 1) {
    const dark = i % 2 === 0;
    if (!reserved[6][i]) setModule(i, 6, dark);
    if (!reserved[i][6]) setModule(6, i, dark);
  }

  ALIGNMENT_POSITIONS.forEach((x) => {
    ALIGNMENT_POSITIONS.forEach((y) => {
      const overlapsFinder =
        (x === 6 && y === 6) ||
        (x === 6 && y === QR_SIZE - 7) ||
        (x === QR_SIZE - 7 && y === 6);
      if (!overlapsFinder) placeAlignment(x, y);
    });
  });

  setModule(8, QR_SIZE - 8, true);

  const mask = 0;
  writeFormat(mask);

  const codewords = encodeData(text);
  const dataBits = codewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => (codeword >>> (7 - index)) & 1),
  );

  let bitIndex = 0;
  let upward = true;
  for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < QR_SIZE; vertical += 1) {
      const y = upward ? QR_SIZE - 1 - vertical : vertical;
      for (let column = 0; column < 2; column += 1) {
        const x = right - column;
        if (reserved[y][x]) continue;
        const dataBit = (dataBits[bitIndex] ?? 0) === 1;
        bitIndex += 1;
        setModule(x, y, dataBit !== maskCondition(mask, x, y), false);
      }
    }
    upward = !upward;
  }

  return modules.map((row) => row.map((value) => value === true));
}
