import { AddressItem, ProcessedContent } from '@/types';

// Base64 解码（浏览器和Node.js兼容）
export const decodeBase64 = (str: string): string => {
  if (typeof window !== 'undefined') {
    return atob(str);
  } else {
    return Buffer.from(str, 'base64').toString('binary');
  }
};

// Base64 编码（浏览器和Node.js兼容）
export const encodeBase64 = (str: string): string => {
  if (typeof window !== 'undefined') {
    return btoa(str);
  } else {
    return Buffer.from(str, 'binary').toString('base64');
  }
};

// 整理内容函数
export const processContent = (content: string): ProcessedContent => {
  const replaced = content.replace(/[|"'\\r\\n]+/g, ',').replace(/,+/g, ',');
  let cleaned = replaced;
  if (cleaned.charAt(0) === ',') cleaned = cleaned.slice(1);
  if (cleaned.charAt(cleaned.length - 1) === ',') cleaned = cleaned.slice(0, cleaned.length - 1);
  
  const addressArray = cleaned.split(',');
  const addresses: AddressItem[] = [];
  
  for (const item of addressArray) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const [addressPartRaw, ...remarkParts] = trimmed.split('#');
    const remark = remarkParts.length ? remarkParts.join('#').trim() : undefined;
    const addressPart = addressPartRaw.trim();
    if (!addressPart) continue;

    let host = '';
    let port = '443';

    if (addressPart.startsWith('[')) {
      const closingIndex = addressPart.indexOf(']');
      if (closingIndex === -1) {
        continue;
      }

      host = addressPart.slice(1, closingIndex).trim();
      const remainder = addressPart.slice(closingIndex + 1).trim();
      if (remainder.startsWith(':')) {
        const candidatePort = remainder.slice(1).trim();
        if (/^\d+$/.test(candidatePort)) {
          port = candidatePort;
        }
      }
    } else {
      const colonMatches = addressPart.match(/:/g);
      const colonCount = colonMatches ? colonMatches.length : 0;

      if (colonCount === 1) {
        const lastColonIndex = addressPart.lastIndexOf(':');
        const candidatePort = addressPart.slice(lastColonIndex + 1).trim();
        if (/^\d+$/.test(candidatePort)) {
          port = candidatePort;
          host = addressPart.slice(0, lastColonIndex).trim();
        } else {
          host = addressPart.trim();
        }
      } else {
        host = addressPart.trim();
      }
    }

    if (!host) {
      continue;
    }

    const normalizedHost = host.replace(/^\[|\]$/g, '');
    const normalizedPort = port && port.trim() ? port.trim() : '443';
    const normalizedRemark = remark && remark.length ? remark : undefined;

    addresses.push({
      ip: normalizedHost,
      port: normalizedPort,
      remark: normalizedRemark
    });
  }
  
  return { addresses, content: cleaned };
};

// 生成UUID
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 校验IPv4地址
export const isValidIPv4 = (address: string): boolean => {
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(address);
};