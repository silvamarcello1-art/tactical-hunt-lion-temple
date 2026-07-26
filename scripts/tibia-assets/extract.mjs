import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const sourceRoot =
  process.argv[2] ??
  "C:/Users/Joao/Downloads/SPRS + 2026/SPRS + 2026/rubinot- 2026/objectbuilder";
const outputRoot = path.resolve(process.argv[3] ?? ".tibia-preview");
const gameOutputRoot = path.resolve(
  process.argv[4] ?? "public/assets/tibia",
);
const datPath = path.join(sourceRoot, "Tibia.dat");
const sprPath = path.join(sourceRoot, "Tibia.spr");

const u8 = (buffer, offset) => buffer.readUInt8(offset);
const u16 = (buffer, offset) => buffer.readUInt16LE(offset);
const i8 = (buffer, offset) => buffer.readInt8(offset);
const u32 = (buffer, offset) => buffer.readUInt32LE(offset);
const i32 = (buffer, offset) => buffer.readInt32LE(offset);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const target = y * (width * 4 + 1);
    scanlines[target] = 0;
    rgba.copy(scanlines, target + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    pngChunk("IHDR", header),
    pngChunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function parseDat(buffer) {
  const counts = {
    item: u16(buffer, 4),
    outfit: u16(buffer, 6),
    effect: u16(buffer, 8),
    missile: u16(buffer, 10),
  };
  const categories = [
    ["item", 100, counts.item],
    ["outfit", 1, counts.outfit],
    ["effect", 1, counts.effect],
    ["missile", 1, counts.missile],
  ];
  const things = { item: [], outfit: [], effect: [], missile: [] };
  let cursor = 12;

  const skipProperties = () => {
    while (true) {
      const flag = u8(buffer, cursor++);
      if (flag === 0xff) return;
      switch (flag) {
        case 0x00:
        case 0x08:
        case 0x09:
        case 0x1a:
        case 0x1d:
        case 0x1e:
        case 0x21:
        case 0x23:
          cursor += 2;
          break;
        case 0x16:
        case 0x19:
          cursor += 4;
          break;
        case 0x22: {
          cursor += 6;
          const nameLength = u16(buffer, cursor);
          cursor += 2 + nameLength + 4;
          break;
        }
        case 0x27:
          cursor += 16;
          break;
        default:
          if (
            flag <= 0x26 ||
            flag === 0xfe
          ) {
            break;
          }
          throw new Error(
            `Unknown DAT property 0x${flag.toString(16)} at byte ${cursor - 1}`,
          );
      }
    }
  };

  const readFrameGroup = (groupType = 0) => {
    const width = u8(buffer, cursor++);
    const height = u8(buffer, cursor++);
    const exactSize = width > 1 || height > 1 ? u8(buffer, cursor++) : 32;
    const layers = u8(buffer, cursor++);
    const patternX = u8(buffer, cursor++);
    const patternY = u8(buffer, cursor++);
    const patternZ = u8(buffer, cursor++);
    const frames = u8(buffer, cursor++);
    const durations = [];
    let animationMode = 0;
    let loopCount = 0;
    let startFrame = 0;
    if (frames > 1) {
      animationMode = u8(buffer, cursor++);
      loopCount = i32(buffer, cursor);
      cursor += 4;
      startFrame = i8(buffer, cursor++);
      for (let frame = 0; frame < frames; frame += 1) {
        durations.push({
          min: u32(buffer, cursor),
          max: u32(buffer, cursor + 4),
        });
        cursor += 8;
      }
    }
    const spriteCount =
      width * height * layers * patternX * patternY * patternZ * frames;
    const spriteIds = [];
    for (let index = 0; index < spriteCount; index += 1) {
      spriteIds.push(u32(buffer, cursor));
      cursor += 4;
    }
    return {
      groupType,
      width,
      height,
      exactSize,
      layers,
      patternX,
      patternY,
      patternZ,
      frames,
      animationMode,
      loopCount,
      startFrame,
      durations,
      spriteIds,
    };
  };

  for (const [category, minId, maxId] of categories) {
    for (let id = minId; id <= maxId; id += 1) {
      skipProperties();
      const groups = [];
      const groupCount = category === "outfit" ? u8(buffer, cursor++) : 1;
      for (let group = 0; group < groupCount; group += 1) {
        const groupType = category === "outfit" ? u8(buffer, cursor++) : 0;
        groups.push(readFrameGroup(groupType));
      }
      things[category].push({ id, category, groups });
    }
  }

  if (cursor !== buffer.length) {
    throw new Error(
      `DAT alignment failed: stopped at ${cursor}, file has ${buffer.length} bytes`,
    );
  }
  return { signature: u32(buffer, 0), counts, things };
}

class SprReader {
  constructor(filePath) {
    this.handle = fs.openSync(filePath, "r");
    const header = Buffer.alloc(8);
    fs.readSync(this.handle, header, 0, 8, 0);
    this.signature = u32(header, 0);
    this.count = u32(header, 4);
    this.offsets = Buffer.alloc(this.count * 4);
    fs.readSync(this.handle, this.offsets, 0, this.offsets.length, 8);
  }

  read(spriteId) {
    const pixels = Buffer.alloc(32 * 32 * 4);
    if (spriteId <= 0 || spriteId > this.count) return pixels;
    const offset = u32(this.offsets, (spriteId - 1) * 4);
    if (offset === 0) return pixels;
    const prefix = Buffer.alloc(5);
    fs.readSync(this.handle, prefix, 0, 5, offset);
    const transparent = [prefix[0], prefix[1], prefix[2]];
    const dataLength = u16(prefix, 3);
    const data = Buffer.alloc(dataLength);
    fs.readSync(this.handle, data, 0, dataLength, offset + 5);
    let cursor = 0;
    let pixel = 0;
    while (cursor + 4 <= data.length && pixel < 1024) {
      const transparentCount = u16(data, cursor);
      const coloredCount = u16(data, cursor + 2);
      cursor += 4;
      pixel += transparentCount;
      for (
        let index = 0;
        index < coloredCount && cursor + 4 <= data.length && pixel < 1024;
        index += 1
      ) {
        const target = pixel * 4;
        pixels[target] = data[cursor++];
        pixels[target + 1] = data[cursor++];
        pixels[target + 2] = data[cursor++];
        pixels[target + 3] = data[cursor++];
        pixel += 1;
      }
    }
    if (transparent[0] !== 255 || transparent[1] !== 0 || transparent[2] !== 255) {
      // The package declares transparency=false; the three bytes are still
      // present in the legacy SPR record and are intentionally ignored.
    }
    return pixels;
  }

  close() {
    fs.closeSync(this.handle);
  }
}

function spriteIndex(group, x, y, layer, patternX, patternY, patternZ, frame) {
  return (
    ((((((frame * group.patternZ + patternZ) * group.patternY + patternY) *
      group.patternX +
      patternX) *
      group.layers +
      layer) *
      group.height +
      y) *
      group.width) +
    x
  );
}

function composeThing(reader, thing, options = {}) {
  const group =
    thing.groups.find((candidate) => candidate.groupType === (options.groupType ?? 0)) ??
    thing.groups[0];
  const width = group.width * 32;
  const height = group.height * 32;
  const rgba = Buffer.alloc(width * height * 4);
  const direction = Math.min(options.direction ?? 2, group.patternX - 1);
  const firstLayer = options.layerIndex ?? 0;
  const lastLayer = options.allLayers ? group.layers : firstLayer + 1;
  for (let layer = firstLayer; layer < lastLayer; layer += 1) {
    for (let tileY = 0; tileY < group.height; tileY += 1) {
      for (let tileX = 0; tileX < group.width; tileX += 1) {
        const index = spriteIndex(
          group,
          tileX,
          tileY,
          layer,
          direction,
          0,
          0,
          options.frame ?? 0,
        );
        const sprite = reader.read(group.spriteIds[index]);
        const drawX = (group.width - tileX - 1) * 32;
        const drawY = (group.height - tileY - 1) * 32;
        for (let y = 0; y < 32; y += 1) {
          for (let x = 0; x < 32; x += 1) {
            const source = (y * 32 + x) * 4;
            if (sprite[source + 3] === 0) continue;
            const target = ((drawY + y) * width + drawX + x) * 4;
            sprite.copy(rgba, target, source, source + 4);
          }
        }
      }
    }
  }
  return { width, height, rgba, group };
}

function rgbaColor(value) {
  return [
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ];
}

function colorizeOutfit(base, mask, palette) {
  const output = Buffer.from(base.rgba);
  const colors = {
    head: rgbaColor(palette.head),
    body: rgbaColor(palette.body),
    legs: rgbaColor(palette.legs),
    feet: rgbaColor(palette.feet),
  };
  for (let pixel = 0; pixel < mask.rgba.length; pixel += 4) {
    if (mask.rgba[pixel + 3] === 0) continue;
    const red = mask.rgba[pixel];
    const green = mask.rgba[pixel + 1];
    const blue = mask.rgba[pixel + 2];
    let target = colors.head;
    if (red > green * 1.35 && red > blue * 1.35) target = colors.body;
    else if (green > red * 1.35 && green > blue * 1.35) target = colors.legs;
    else if (blue > red * 1.35 && blue > green * 1.35) target = colors.feet;
    const intensity = Math.max(red, green, blue) / 255;
    output[pixel] = Math.round(target[0] * intensity);
    output[pixel + 1] = Math.round(target[1] * intensity);
    output[pixel + 2] = Math.round(target[2] * intensity);
    output[pixel + 3] = mask.rgba[pixel + 3];
  }
  return { width: base.width, height: base.height, rgba: output };
}

function placeImage(
  target,
  targetWidth,
  targetHeight,
  image,
  x,
  y,
  size = 64,
  alignBottom = true,
) {
  const offsetX = x + Math.floor((size - image.width) / 2);
  const offsetY = alignBottom
    ? y + size - image.height
    : y + Math.floor((size - image.height) / 2);
  for (let sourceY = 0; sourceY < image.height; sourceY += 1) {
    for (let sourceX = 0; sourceX < image.width; sourceX += 1) {
      const source = (sourceY * image.width + sourceX) * 4;
      if (image.rgba[source + 3] === 0) continue;
      const targetX = offsetX + sourceX;
      const targetY = offsetY + sourceY;
      if (
        targetX < 0 ||
        targetY < 0 ||
        targetX >= targetWidth ||
        targetY >= targetHeight
      ) {
        continue;
      }
      const destination = (targetY * targetWidth + targetX) * 4;
      image.rgba.copy(target, destination, source, source + 4);
    }
  }
}

function createPixiSheet(reader, definitions, fileBase, kind) {
  const cell = 64;
  const frames = {};
  const rows =
    kind === "outfit"
      ? definitions.length * 4
      : definitions.length;
  const columns = 4;
  const width = columns * cell;
  const height = rows * cell;
  const rgba = Buffer.alloc(width * height * 4);
  let row = 0;
  for (const definition of definitions) {
    const thing = dat.things[kind].find(
      (candidate) => candidate.id === definition.id,
    );
    const directions = kind === "outfit"
      ? ["south", "east", "north", "west"]
      : ["effect"];
    for (let direction = 0; direction < directions.length; direction += 1) {
      const groupType =
        kind === "outfit" &&
        thing.groups.some((candidate) => candidate.groupType === 1)
          ? 1
          : 0;
      const group =
        thing.groups.find((candidate) => candidate.groupType === groupType) ??
        thing.groups[0];
      for (let frame = 0; frame < columns; frame += 1) {
        const options = {
          groupType,
          direction,
          frame: frame % Math.max(1, group.frames),
          layerIndex: 0,
        };
        let image = composeThing(reader, thing, options);
        if (definition.palette && group.layers > 1) {
          const mask = composeThing(reader, thing, {
            ...options,
            layerIndex: 1,
          });
          image = colorizeOutfit(image, mask, definition.palette);
        }
        placeImage(
          rgba,
          width,
          height,
          image,
          frame * cell,
          row * cell,
          cell,
          kind === "outfit",
        );
        const name =
          kind === "outfit"
            ? `${definition.key}-${directions[direction]}-${frame}`
            : `${definition.key}-${frame}`;
        frames[name] = {
          frame: { x:frame * cell, y:row * cell, w:cell, h:cell },
          rotated:false,
          trimmed:false,
          spriteSourceSize:{ x:0, y:0, w:cell, h:cell },
          sourceSize:{ w:cell, h:cell },
        };
      }
      row += 1;
    }
  }
  fs.mkdirSync(path.dirname(fileBase), { recursive:true });
  fs.writeFileSync(`${fileBase}.png`, encodePng(width, height, rgba));
  fs.writeFileSync(
    `${fileBase}.json`,
    JSON.stringify(
      {
        frames,
        meta:{
          app:"Tactical Hunt Tibia SPR importer",
          version:"1.0",
          image:path.basename(`${fileBase}.png`),
          format:"RGBA8888",
          size:{ w:width, h:height },
          scale:"1",
        },
      },
      null,
      2,
    ),
  );
}

const digitFont = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
};

function drawLabel(target, targetWidth, x, y, label) {
  let cursor = x;
  for (const character of label) {
    const glyph = digitFont[character];
    if (!glyph) continue;
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((value, columnIndex) => {
        if (value !== "1") return;
        const offset = ((y + rowIndex) * targetWidth + cursor + columnIndex) * 4;
        target[offset] = 235;
        target[offset + 1] = 201;
        target[offset + 2] = 92;
        target[offset + 3] = 255;
      });
    });
    cursor += 4;
  }
}

function createContactSheet(reader, things, filePath, columns = 10) {
  const cellWidth = 100;
  const cellHeight = 106;
  const rows = Math.ceil(things.length / columns);
  const width = columns * cellWidth;
  const height = rows * cellHeight;
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 11;
    rgba[i + 1] = 15;
    rgba[i + 2] = 18;
    rgba[i + 3] = 255;
  }
  things.forEach((thing, index) => {
    const image = composeThing(reader, thing);
    const cellX = (index % columns) * cellWidth;
    const cellY = Math.floor(index / columns) * cellHeight;
    const scale = Math.min(1, 88 / image.width, 88 / image.height);
    const drawWidth = Math.max(1, Math.floor(image.width * scale));
    const drawHeight = Math.max(1, Math.floor(image.height * scale));
    const startX = cellX + Math.floor((cellWidth - drawWidth) / 2);
    const startY = cellY + Math.floor((88 - drawHeight) / 2);
    for (let y = 0; y < drawHeight; y += 1) {
      for (let x = 0; x < drawWidth; x += 1) {
        const sourceX = Math.min(image.width - 1, Math.floor(x / scale));
        const sourceY = Math.min(image.height - 1, Math.floor(y / scale));
        const source = (sourceY * image.width + sourceX) * 4;
        if (image.rgba[source + 3] === 0) continue;
        const target = ((startY + y) * width + startX + x) * 4;
        image.rgba.copy(rgba, target, source, source + 4);
      }
    }
    const label = String(thing.id);
    drawLabel(
      rgba,
      width,
      cellX + Math.floor((cellWidth - label.length * 4 + 1) / 2),
      cellY + 95,
      label,
    );
  });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, encodePng(width, height, rgba));
}

function writeThingPng(reader, thing, filePath, options = {}) {
  const image = composeThing(reader, thing, options);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, encodePng(image.width, image.height, image.rgba));
}

const dat = parseDat(fs.readFileSync(datPath));
const spr = new SprReader(sprPath);
fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(
  path.join(outputRoot, "index.json"),
  JSON.stringify(
    {
      datSignature: dat.signature,
      sprSignature: spr.signature,
      spriteCount: spr.count,
      counts: dat.counts,
      things: dat.things,
    },
    null,
    2,
  ),
);

for (const category of ["outfit", "effect"]) {
  const pageSize = category === "outfit" ? 200 : 160;
  const things = dat.things[category];
  for (let start = 0; start < things.length; start += pageSize) {
    const end = Math.min(things.length, start + pageSize);
    createContactSheet(
      spr,
      things.slice(start, end),
      path.join(
        outputRoot,
        `${category}-${things[start].id}-${things[end - 1].id}.png`,
      ),
    );
  }
}

for (let start = 0; start < 2000; start += 200) {
  const things = dat.things.item.slice(start, start + 200);
  createContactSheet(
    spr,
    things,
    path.join(
      outputRoot,
      `item-${things[0].id}-${things[things.length - 1].id}.png`,
    ),
  );
}

for (const id of [128, 134, 138, 144, 1384, 1385, 1386]) {
  const thing = dat.things.outfit.find((candidate) => candidate.id === id);
  for (let direction = 0; direction < 4; direction += 1) {
    writeThingPng(
      spr,
      thing,
      path.join(outputRoot, "selected", `outfit-${id}-dir-${direction}.png`),
      { direction },
    );
  }
}

for (const id of [177, 211, 231, 236, 241, 244, 268, 269, 301, 517, 521, 536, 538, 539, 691, 706]) {
  const thing = dat.things.effect.find((candidate) => candidate.id === id);
  writeThingPng(
    spr,
    thing,
    path.join(outputRoot, "selected", `effect-${id}.png`),
  );
}

for (const id of [100, 101, 103, 104, 417, 418, 419, 425, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 452, 453, 480, 481]) {
  const thing = dat.things.item.find((candidate) => candidate.id === id);
  writeThingPng(
    spr,
    thing,
    path.join(outputRoot, "selected", `item-${id}.png`),
  );
}

createPixiSheet(
  spr,
  [
    {
      key:"knight",
      id:134,
      palette:{ head:0xd4a15e, body:0x9b352c, legs:0x354559, feet:0x513a28 },
    },
    {
      key:"druid",
      id:144,
      palette:{ head:0xd1a36c, body:0x377a4d, legs:0x694a2b, feet:0x2b4933 },
    },
    {
      key:"sorcerer",
      id:138,
      palette:{ head:0xe1bf81, body:0x6550a5, legs:0x313b73, feet:0x452c55 },
    },
    { key:"lion-knight", id:1384 },
    { key:"lion-warlock", id:1385 },
    { key:"drume", id:1386 },
  ],
  path.join(gameOutputRoot, "outfits"),
  "outfit",
);

createPixiSheet(
  spr,
  [
    { key:"ice", id:536 },
    { key:"fire", id:521 },
    { key:"energy", id:517 },
    { key:"heal", id:268 },
    { key:"physical", id:537 },
    { key:"holy", id:247 },
    { key:"earth", id:46 },
  ],
  path.join(gameOutputRoot, "effects"),
  "effect",
);

const tileAssets = {
  "floor-stone":417,
  "floor-ornate":418,
  "floor-gold":419,
  "floor-mosaic":425,
  "wall-horizontal":440,
  "wall-vertical":441,
  "wall-column":443,
  "wall-corner":444,
  "temple-carpet":452,
  "temple-carpet-alt":453,
};
for (const [name, id] of Object.entries(tileAssets)) {
  const thing = dat.things.item.find((candidate) => candidate.id === id);
  writeThingPng(
    spr,
    thing,
    path.join(gameOutputRoot, "tiles", `${name}.png`),
  );
}
fs.writeFileSync(
  path.join(gameOutputRoot, "manifest.json"),
  JSON.stringify(
    {
      source:"rubinot- 2026/ObjectBuilder Tibia.dat + Tibia.spr",
      generatedAt:new Date().toISOString(),
      entities:{
        knight:134,
        druid:144,
        sorcerer:138,
        lionKnight:1384,
        lionWarlock:1385,
        drume:1386,
      },
      effects:{ ice:536, fire:521, energy:517, heal:268, physical:537, holy:247, earth:46 },
      tiles:tileAssets,
    },
    null,
    2,
  ),
);

spr.close();
console.log(
  JSON.stringify(
    {
      outputRoot,
      datSignature: dat.signature,
      sprSignature: spr.signature,
      spriteCount: spr.count,
      counts: dat.counts,
    },
    null,
    2,
  ),
);
