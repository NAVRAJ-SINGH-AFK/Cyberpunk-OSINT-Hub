import { Router } from "express";
import { z } from "zod";

const router = Router();

const ExtractRequestSchema = z.object({
  filename: z.string(),
  data: z.string(),
  mimeType: z.string().optional(),
});

interface MetadataTag {
  group: string;
  tag: string;
  value: string;
}

function parseExifFromBase64(
  filename: string,
  base64Data: string,
  mimeType: string
): MetadataTag[] {
  const tags: MetadataTag[] = [];
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  const buffer = Buffer.from(base64Data, "base64");
  const bytes = new Uint8Array(buffer);

  tags.push({ group: "File", tag: "FileName", value: filename });
  tags.push({
    group: "File",
    tag: "FileSize",
    value: `${buffer.length} bytes`,
  });
  tags.push({ group: "File", tag: "MIMEType", value: mimeType || "unknown" });
  tags.push({ group: "File", tag: "FileExtension", value: ext || "unknown" });

  const hexHeader = Array.from(bytes.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
  tags.push({ group: "File", tag: "HexHeader", value: hexHeader });

  if (ext === "jpg" || ext === "jpeg") {
    tags.push({ group: "File", tag: "FileType", value: "JPEG Image" });
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      tags.push({ group: "EXIF", tag: "ValidHeader", value: "Yes (FFD8)" });
    }

    const exifTags = parseJpegExif(bytes);
    tags.push(...exifTags);
  } else if (ext === "png") {
    tags.push({ group: "File", tag: "FileType", value: "PNG Image" });
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      tags.push({ group: "PNG", tag: "ValidHeader", value: "Yes (89504E47)" });
    }
    const pngMeta = parsePngChunks(bytes);
    tags.push(...pngMeta);
  } else if (ext === "gif") {
    tags.push({ group: "File", tag: "FileType", value: "GIF Image" });
    const header = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
    tags.push({ group: "GIF", tag: "Header", value: header });
    const version = String.fromCharCode(bytes[3], bytes[4], bytes[5]);
    tags.push({ group: "GIF", tag: "Version", value: version });
  } else if (ext === "pdf") {
    tags.push({ group: "File", tag: "FileType", value: "PDF Document" });
    const header = buffer.toString("ascii", 0, 8);
    tags.push({ group: "PDF", tag: "Header", value: header.trim() });
    const pdfText = buffer.toString("latin1");
    const titleMatch = pdfText.match(/\/Title\s*\(([^)]+)\)/);
    if (titleMatch)
      tags.push({ group: "PDF", tag: "Title", value: titleMatch[1] });
    const authorMatch = pdfText.match(/\/Author\s*\(([^)]+)\)/);
    if (authorMatch)
      tags.push({ group: "PDF", tag: "Author", value: authorMatch[1] });
    const creatorMatch = pdfText.match(/\/Creator\s*\(([^)]+)\)/);
    if (creatorMatch)
      tags.push({ group: "PDF", tag: "Creator", value: creatorMatch[1] });
    const producerMatch = pdfText.match(/\/Producer\s*\(([^)]+)\)/);
    if (producerMatch)
      tags.push({ group: "PDF", tag: "Producer", value: producerMatch[1] });
    const creationMatch = pdfText.match(/\/CreationDate\s*\(([^)]+)\)/);
    if (creationMatch)
      tags.push({
        group: "PDF",
        tag: "CreationDate",
        value: creationMatch[1],
      });
  } else if (ext === "mp3") {
    tags.push({ group: "File", tag: "FileType", value: "MP3 Audio" });
    const id3Header = buffer.toString("ascii", 0, 3);
    if (id3Header === "ID3") {
      tags.push({ group: "ID3", tag: "HasID3Tag", value: "Yes" });
      const version = `ID3v2.${bytes[3]}`;
      tags.push({ group: "ID3", tag: "Version", value: version });
    }
  } else if (ext === "docx" || ext === "xlsx" || ext === "pptx") {
    tags.push({
      group: "File",
      tag: "FileType",
      value: "Office Open XML Document",
    });
    tags.push({ group: "Office", tag: "Format", value: ext.toUpperCase() });
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
      tags.push({ group: "Office", tag: "ValidZipHeader", value: "Yes (504B)" });
    }
  } else if (ext === "zip") {
    tags.push({ group: "File", tag: "FileType", value: "ZIP Archive" });
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
      tags.push({ group: "ZIP", tag: "ValidHeader", value: "Yes (504B0304)" });
    }
  } else {
    tags.push({ group: "File", tag: "FileType", value: "Binary/Unknown" });
  }

  return tags;
}

function parseJpegExif(bytes: Uint8Array): MetadataTag[] {
  const tags: MetadataTag[] = [];

  let offset = 2;
  while (offset < bytes.length - 4) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];

    if (marker === 0xe1) {
      const segLen =
        (bytes[offset + 2] << 8) | bytes[offset + 3];
      const exifHeader = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      if (exifHeader === "Exif") {
        tags.push({ group: "EXIF", tag: "ExifSegmentFound", value: "Yes" });
        tags.push({
          group: "EXIF",
          tag: "ExifSegmentSize",
          value: `${segLen} bytes`,
        });

        const exifData = bytes.slice(offset + 10, offset + 2 + segLen);
        const exifTags = parseExifIFD(exifData);
        tags.push(...exifTags);
      }

      offset += 2 + segLen;
    } else if (marker === 0xfe) {
      const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
      const comment = String.fromCharCode(
        ...bytes.slice(offset + 4, offset + 2 + segLen)
      );
      tags.push({ group: "JPEG", tag: "Comment", value: comment });
      offset += 2 + segLen;
    } else if (marker === 0xc0 || marker === 0xc2) {
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      tags.push({ group: "Image", tag: "ImageWidth", value: `${width}` });
      tags.push({ group: "Image", tag: "ImageHeight", value: `${height}` });
      tags.push({
        group: "Image",
        tag: "Dimensions",
        value: `${width}x${height}`,
      });
      break;
    } else if (marker === 0xda) {
      break;
    } else {
      if (offset + 3 >= bytes.length) break;
      const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (segLen < 2) break;
      offset += 2 + segLen;
    }
  }

  return tags;
}

const EXIF_TAGS: Record<number, { group: string; name: string }> = {
  0x010f: { group: "Camera", name: "Make" },
  0x0110: { group: "Camera", name: "Model" },
  0x0131: { group: "Software", name: "Software" },
  0x0132: { group: "DateTime", name: "DateTime" },
  0x013b: { group: "Author", name: "Artist" },
  0x8298: { group: "Author", name: "Copyright" },
  0x9003: { group: "DateTime", name: "DateTimeOriginal" },
  0x9004: { group: "DateTime", name: "DateTimeDigitized" },
  0xa430: { group: "Camera", name: "LensMake" },
  0xa431: { group: "Camera", name: "BodySerialNumber" },
  0xa432: { group: "Camera", name: "LensModel" },
  0x8769: { group: "EXIF", name: "ExifIFDOffset" },
  0x8825: { group: "GPS", name: "GPSIFDOffset" },
  0x9201: { group: "Camera", name: "ShutterSpeedValue" },
  0x9202: { group: "Camera", name: "ApertureValue" },
  0x9203: { group: "Camera", name: "BrightnessValue" },
  0x9205: { group: "Camera", name: "MaxApertureValue" },
  0x9207: { group: "Camera", name: "MeteringMode" },
  0x9208: { group: "Camera", name: "LightSource" },
  0x9209: { group: "Camera", name: "Flash" },
  0x920a: { group: "Camera", name: "FocalLength" },
  0x0213: { group: "Image", name: "YCbCrPositioning" },
  0x0112: { group: "Image", name: "Orientation" },
  0x011a: { group: "Image", name: "XResolution" },
  0x011b: { group: "Image", name: "YResolution" },
  0x0128: { group: "Image", name: "ResolutionUnit" },
  0xa002: { group: "Image", name: "PixelXDimension" },
  0xa003: { group: "Image", name: "PixelYDimension" },
  0xa001: { group: "Image", name: "ColorSpace" },
};

const GPS_TAGS: Record<number, string> = {
  0x0001: "GPSLatitudeRef",
  0x0002: "GPSLatitude",
  0x0003: "GPSLongitudeRef",
  0x0004: "GPSLongitude",
  0x0005: "GPSAltitudeRef",
  0x0006: "GPSAltitude",
  0x0007: "GPSTimeStamp",
  0x0012: "GPSMapDatum",
  0x001d: "GPSDateStamp",
};

function readUint16(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (littleEndian) {
    return data[offset] | (data[offset + 1] << 8);
  }
  return (data[offset] << 8) | data[offset + 1];
}

function readUint32(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (littleEndian) {
    return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
  }
  return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
}

function parseExifIFD(data: Uint8Array): MetadataTag[] {
  const tags: MetadataTag[] = [];

  if (data.length < 8) return tags;

  const byteOrder = String.fromCharCode(data[0], data[1]);
  const littleEndian = byteOrder === "II";

  const magic = readUint16(data, 2, littleEndian);
  if (magic !== 42) return tags;

  let ifdOffset = readUint32(data, 4, littleEndian);

  const parseIFD = (offset: number, tagDict: Record<number, { group: string; name: string }>, gpsMode = false) => {
    if (offset + 2 > data.length) return;
    const numEntries = readUint16(data, offset, littleEndian);
    offset += 2;

    for (let i = 0; i < numEntries; i++) {
      if (offset + 12 > data.length) break;
      const tagId = readUint16(data, offset, littleEndian);
      const dataType = readUint16(data, offset + 2, littleEndian);
      const numValues = readUint32(data, offset + 4, littleEndian);

      let value = "";

      if (dataType === 2) {
        let strOffset: number;
        if (numValues <= 4) {
          strOffset = offset + 8;
        } else {
          strOffset = readUint32(data, offset + 8, littleEndian);
        }
        if (strOffset + numValues <= data.length) {
          value = "";
          for (let j = 0; j < numValues; j++) {
            const c = data[strOffset + j];
            if (c === 0) break;
            value += String.fromCharCode(c);
          }
          value = value.trim();
        }
      } else if (dataType === 3) {
        const v = numValues <= 2
          ? readUint16(data, offset + 8, littleEndian)
          : readUint16(data, readUint32(data, offset + 8, littleEndian), littleEndian);
        value = v.toString();
      } else if (dataType === 4 || dataType === 9) {
        const rawOffset = offset + 8;
        value = readUint32(data, rawOffset, littleEndian).toString();
      } else if (dataType === 5 || dataType === 10) {
        const ratOffset = readUint32(data, offset + 8, littleEndian);
        if (ratOffset + 8 <= data.length) {
          const num = readUint32(data, ratOffset, littleEndian);
          const den = readUint32(data, ratOffset + 4, littleEndian);
          if (den !== 0) value = (num / den).toFixed(4);
        }
      }

      if (gpsMode) {
        const gpsTagName = GPS_TAGS[tagId];
        if (gpsTagName && value) {
          tags.push({ group: "GPS", tag: gpsTagName, value });
        }
      } else {
        const exifTag = tagDict[tagId];
        if (exifTag && value) {
          if (exifTag.name === "ExifIFDOffset") {
            parseIFD(parseInt(value), EXIF_TAGS);
          } else if (exifTag.name === "GPSIFDOffset") {
            parseGpsIFD(parseInt(value));
          } else {
            tags.push({ group: exifTag.group, tag: exifTag.name, value });
          }
        }
      }

      offset += 12;
    }
  };

  const parseGpsIFD = (offset: number) => {
    if (offset + 2 > data.length) return;
    const numEntries = readUint16(data, offset, littleEndian);
    offset += 2;

    let latRef = "";
    let lat: number[] = [];
    let lonRef = "";
    let lon: number[] = [];

    for (let i = 0; i < numEntries; i++) {
      if (offset + 12 > data.length) break;
      const tagId = readUint16(data, offset, littleEndian);
      const dataType = readUint16(data, offset + 2, littleEndian);
      const numValues = readUint32(data, offset + 4, littleEndian);

      if (dataType === 2 && numValues <= 4) {
        const ref = String.fromCharCode(data[offset + 8]);
        if (tagId === 0x0001) latRef = ref;
        else if (tagId === 0x0003) lonRef = ref;
        const gpsTagName = GPS_TAGS[tagId];
        if (gpsTagName) tags.push({ group: "GPS", tag: gpsTagName, value: ref });
      } else if (dataType === 5) {
        const ratOffset = readUint32(data, offset + 8, littleEndian);
        const rationals: number[] = [];
        for (let j = 0; j < numValues; j++) {
          const rOff = ratOffset + j * 8;
          if (rOff + 8 <= data.length) {
            const num = readUint32(data, rOff, littleEndian);
            const den = readUint32(data, rOff + 4, littleEndian);
            if (den !== 0) rationals.push(num / den);
          }
        }

        const gpsTagName = GPS_TAGS[tagId];
        if (gpsTagName && rationals.length > 0) {
          if (tagId === 0x0002) lat = rationals;
          else if (tagId === 0x0004) lon = rationals;
          const formatted = rationals.map((r) => r.toFixed(6)).join(", ");
          tags.push({ group: "GPS", tag: gpsTagName, value: formatted });
        }
      }

      offset += 12;
    }

    if (lat.length >= 3 && lon.length >= 3) {
      const latDecimal = lat[0] + lat[1] / 60 + lat[2] / 3600;
      const lonDecimal = lon[0] + lon[1] / 60 + lon[2] / 3600;
      const finalLat = latRef === "S" ? -latDecimal : latDecimal;
      const finalLon = lonRef === "W" ? -lonDecimal : lonDecimal;
      tags.push({
        group: "GPS",
        tag: "GPSDecimalCoordinates",
        value: `${finalLat.toFixed(6)}, ${finalLon.toFixed(6)}`,
      });
    }
  };

  parseIFD(ifdOffset, EXIF_TAGS);

  return tags;
}

function parsePngChunks(bytes: Uint8Array): MetadataTag[] {
  const tags: MetadataTag[] = [];

  let offset = 8;
  while (offset + 12 < bytes.length) {
    const chunkLen =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (chunkType === "IHDR" && offset + 24 < bytes.length) {
      const width =
        (bytes[offset + 8] << 24) |
        (bytes[offset + 9] << 16) |
        (bytes[offset + 10] << 8) |
        bytes[offset + 11];
      const height =
        (bytes[offset + 12] << 24) |
        (bytes[offset + 13] << 16) |
        (bytes[offset + 14] << 8) |
        bytes[offset + 15];
      const bitDepth = bytes[offset + 16];
      const colorType = bytes[offset + 17];
      const colorTypes: Record<number, string> = {
        0: "Grayscale",
        2: "RGB",
        3: "Indexed",
        4: "Grayscale+Alpha",
        6: "RGBA",
      };
      tags.push({ group: "Image", tag: "ImageWidth", value: `${width}` });
      tags.push({ group: "Image", tag: "ImageHeight", value: `${height}` });
      tags.push({
        group: "Image",
        tag: "Dimensions",
        value: `${width}x${height}`,
      });
      tags.push({
        group: "Image",
        tag: "BitDepth",
        value: `${bitDepth}`,
      });
      tags.push({
        group: "Image",
        tag: "ColorType",
        value: colorTypes[colorType] ?? `${colorType}`,
      });
    } else if (chunkType === "tEXt" && chunkLen > 0) {
      const textData = bytes.slice(offset + 8, offset + 8 + chunkLen);
      const nullIdx = textData.indexOf(0);
      if (nullIdx > -1) {
        const keyword = String.fromCharCode(...textData.slice(0, nullIdx));
        const text = String.fromCharCode(...textData.slice(nullIdx + 1));
        tags.push({
          group: "Metadata",
          tag: keyword,
          value: text.trim(),
        });
      }
    } else if (chunkType === "iTXt" && chunkLen > 0) {
      const textData = bytes.slice(offset + 8, offset + 8 + chunkLen);
      const nullIdx = textData.indexOf(0);
      if (nullIdx > -1) {
        const keyword = String.fromCharCode(...textData.slice(0, nullIdx));
        const compressed = textData[nullIdx + 1];
        if (!compressed) {
          const start = nullIdx + 5;
          const langNullIdx = textData.indexOf(0, start);
          if (langNullIdx > -1) {
            const transNullIdx = textData.indexOf(0, langNullIdx + 1);
            if (transNullIdx > -1) {
              const text = String.fromCharCode(
                ...textData.slice(transNullIdx + 1)
              );
              tags.push({
                group: "Metadata",
                tag: keyword,
                value: text.trim(),
              });
            }
          }
        }
      }
    } else if (chunkType === "IEND") {
      break;
    }

    offset += 12 + chunkLen;
  }

  return tags;
}

function extractGps(
  tags: MetadataTag[]
): { lat: number | null; lng: number | null } {
  const coordTag = tags.find((t) => t.tag === "GPSDecimalCoordinates");
  if (coordTag) {
    const parts = coordTag.value.split(",").map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }
  return { lat: null, lng: null };
}

const CLUE_CHECKLIST = [
  "Check file hex headers for hidden signatures",
  "Analyze color palette for steganographic patterns",
  "Inspect LSB (Least Significant Bit) of image data",
  "Look for appended data after file EOF marker",
  "Check for hidden ZIP or RAR archives within file",
  "Analyze audio spectrograms if media file",
  "Try running strings command on binary data",
  "Check for Base64 or encoded payloads in comments",
  "Inspect file for whitespace steganography",
  "Examine font embedding data in document files",
];

router.post("/metadata/extract", async (req, res) => {
  const result = ExtractRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "validation_error", message: result.error.message });
    return;
  }

  const { filename, data, mimeType } = result.data;

  try {
    const tags = parseExifFromBase64(
      filename,
      data,
      mimeType ?? "application/octet-stream"
    );

    const { lat, lng } = extractGps(tags);
    const gpsFound = lat !== null && lng !== null;

    const clues =
      tags.length <= 5
        ? CLUE_CHECKLIST
        : tags.some((t) => t.group === "GPS")
        ? []
        : [
            "No GPS data found — try cross-referencing with known location databases",
            "Check camera model to narrow geographic region of sale",
            "Software version may indicate country-specific firmware",
          ];

    const buffer = Buffer.from(data, "base64");

    res.json({
      filename,
      fileSize: buffer.length,
      mimeType: mimeType ?? "application/octet-stream",
      tags,
      gpsFound,
      lat: lat ?? null,
      lng: lng ?? null,
      clues,
    });
  } catch (err) {
    res.status(500).json({
      error: "extraction_error",
      message: "Failed to extract metadata",
    });
  }
});

export default router;
