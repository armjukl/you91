import { NextApiRequest, NextApiResponse } from 'next';
import { existsSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ProxyConfig, SubscribeMode, AddressItem } from '@/types';
import { processContent, encodeBase64 } from '@/utils/helpers';

// 配置（可以从环境变量获取）
const proxyConfig: ProxyConfig = {
  subConverter: process.env.SUB_API || 'sub.cmliussss.net',
  subProtocol: process.env.SUB_PROTOCOL || 'https',
  subConfig: process.env.SUB_CONFIG || 'https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini',
  fileName: process.env.SUB_NAME || '优选订阅生成器',
  noTLS: process.env.NO_TLS || 'false',
  alpn: process.env.ALPN || 'h3',
  proxyIPs: process.env.PROXY_IPS ? process.env.PROXY_IPS.split(',') : [],
  matchProxyIP: process.env.MATCH_PROXY_IPS ? process.env.MATCH_PROXY_IPS.split(',') : [],
  httpsPorts: process.env.HTTPS_PORTS ? process.env.HTTPS_PORTS.split(',') : ['2053', '2083', '2087', '2096', '8443']
};

// 获取当前域名
function getCurrentDomain(req: NextApiRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || 'https'; // 默认为 https
  const host = req.headers.host || 'localhost:3000'; // 获取 host (域名和端口)
  
  // 如果是本地开发环境，使用 http
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const finalProtocol = isLocal ? 'http' : protocol;
  
  return `${finalProtocol}://${host}`;
}

// 从 API 获取地址列表
async function fetchAddressesFromAPI(apiUrls: string[]): Promise<string> {
  const addresses: string[] = [];

  // 使用 Promise.allSettled 确保即使某些 API 失败也不会影响整体
  const results = await Promise.allSettled(
    apiUrls.map(url =>
      fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then(text => {
        // 处理 API 返回的内容
        const lines = text.split('\n').filter(line => line.trim() !== '');
        return lines.join(',');
      })
      .catch(error => {
        console.error(`Failed to fetch from ${url}:`, error);
        return ''; // 返回空字符串表示失败
      })
    )
  );

  // 收集所有成功的结果
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      addresses.push(result.value);
    }
  }

  return addresses.join(',');
}

type TransportType = 'ws' | 'tcp' | 'http';
type FormatType = 'vless' | 'vmess';

function getFirstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function resolveMode(modeValue: string | undefined): SubscribeMode {
  if (!modeValue) return 'standard';
  const normalized = modeValue.toLowerCase();
  if (normalized === 'template' || normalized === 'link') {
    return 'template';
  }
  return 'standard';
}

function formatHostForLink(host: string): string {
  const trimmed = host.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed;
  }
  return trimmed.includes(':') ? `[${trimmed}]` : trimmed;
}

function padBase64(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  const padding = normalized.length % 4;
  if (padding === 0) {
    return normalized;
  }
  return normalized + '='.repeat(4 - padding);
}

function generateFromTemplateLink(templateLink: string, addresses: AddressItem[]): string[] {
  const normalized = templateLink.trim();
  if (!normalized) {
    throw new Error('Template link is empty');
  }

  const lower = normalized.toLowerCase();
  if (lower.startsWith('vless://')) {
    return generateVlessFromTemplate(normalized, addresses);
  }

  if (lower.startsWith('vmess://')) {
    return generateVmessFromTemplate(normalized, addresses);
  }

  throw new Error('Only VLESS and VMess template links are supported');
}

function generateVlessFromTemplate(templateLink: string, addresses: AddressItem[]): string[] {
  const scheme = 'vless://';
  const body = templateLink.slice(scheme.length);
  const atIndex = body.indexOf('@');
  if (atIndex === -1) {
    throw new Error('Invalid VLESS template link: missing "@" segment');
  }

  const userInfo = body.slice(0, atIndex);
  const remainder = body.slice(atIndex + 1);

  let suffixIndex = remainder.length;
  for (const separator of ['/', '?', '#']) {
    const idx = remainder.indexOf(separator);
    if (idx !== -1 && idx < suffixIndex) {
      suffixIndex = idx;
    }
  }

  const hostPortSegment = remainder.slice(0, suffixIndex).trim();
  if (!hostPortSegment) {
    throw new Error('Invalid VLESS template link: missing host');
  }
  const suffix = remainder.slice(suffixIndex);

  let extractedPort = '';
  if (hostPortSegment.startsWith('[')) {
    const closingIndex = hostPortSegment.indexOf(']');
    if (closingIndex === -1) {
      throw new Error('Invalid VLESS template link: malformed IPv6 host');
    }
    const afterBracket = hostPortSegment.slice(closingIndex + 1);
    if (afterBracket.startsWith(':')) {
      extractedPort = afterBracket.slice(1);
    }
  } else {
    const lastColonIndex = hostPortSegment.lastIndexOf(':');
    if (lastColonIndex !== -1) {
      extractedPort = hostPortSegment.slice(lastColonIndex + 1);
    }
  }

  const defaultPort = extractedPort || '443';

  return addresses.map(addr => {
    const hostForLink = formatHostForLink(addr.ip);
    const port = (addr.port && addr.port.trim()) || defaultPort;
    return `${scheme}${userInfo}@${hostForLink}:${port}${suffix}`;
  });
}

function generateVmessFromTemplate(templateLink: string, addresses: AddressItem[]): string[] {
  const scheme = 'vmess://';
  const payload = templateLink.slice(scheme.length).trim();
  if (!payload) {
    throw new Error('Invalid VMess template link: missing payload');
  }

  let baseConfig: Record<string, unknown>;
  try {
    const decoded = Buffer.from(padBase64(payload), 'base64').toString('utf-8');
    baseConfig = JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid VMess template link: unable to decode payload');
  }

  if (!baseConfig || typeof baseConfig !== 'object') {
    throw new Error('Invalid VMess template link: malformed payload');
  }

  const originalPortValue = (baseConfig as Record<string, unknown>).port;
  const originalPort = typeof originalPortValue === 'number'
    ? String(originalPortValue)
    : typeof originalPortValue === 'string' && originalPortValue.trim()
      ? originalPortValue.trim()
      : '443';

  return addresses.map(addr => {
    const config = { ...(baseConfig as Record<string, unknown>) };
    const portToUse = (addr.port && addr.port.trim()) || originalPort;
    const host = addr.ip.trim();

    (config as Record<string, unknown>).add = host;

    if (typeof originalPortValue === 'number') {
      const numericPort = Number(portToUse);
      (config as Record<string, unknown>).port = Number.isNaN(numericPort) ? originalPortValue : numericPort;
    } else {
      (config as Record<string, unknown>).port = portToUse;
    }

    const encoded = Buffer.from(JSON.stringify(config), 'utf-8').toString('base64');
    return `${scheme}${encoded}`;
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

// 1. 获取客户端 IP
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers['x-real-ip'];
  const clientIP = typeof forwarded === 'string' 
    ? forwarded.split(/, /)[0] 
    : realIP || req.socket.remoteAddress || 'unknown';

  console.log('realip:', realIP,clientIP);

  // 2. 记录日志
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: clientIP,
    url: req.url || '',
    userAgent: req.headers['user-agent'] || 'unknown',
    query: req.query
  };

  const logDir = '/tmp/logs';
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  const logFile = join(logDir, 'subscriptions.log');
  try {
    appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('写入日志失败:', error);
  }

//不知道要不要放在前面

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const rawHost = getFirstQueryValue(req.query.host);
    const rawUuid = getFirstQueryValue(req.query.uuid);
    const rawPath = getFirstQueryValue(req.query.path);
    const rawSni = getFirstQueryValue(req.query.sni);
    const rawType = getFirstQueryValue(req.query.type);
    const rawFormat = getFirstQueryValue(req.query.format);
    const rawModeValue = getFirstQueryValue(req.query.mode);
    const rawTemplateLink =
      getFirstQueryValue((req.query as { templateLink?: string | string[] }).templateLink) ||
      getFirstQueryValue((req.query as { template?: string | string[] }).template);
    const rawExtra = getFirstQueryValue(req.query.extra);

    const mode: SubscribeMode = resolveMode(rawModeValue);

    console.log('Request parameters:', {
      mode,
      host: rawHost,
      uuid: rawUuid,
      path: rawPath,
      sni: rawSni,
      type: rawType,
      format: rawFormat,
      templateProvided: Boolean(rawTemplateLink),
      extra: rawExtra
    });

    let sanitizedHost = '';
    let sanitizedUuid = '';
    let requestedPath = '/?ed=2560';
    let requestedSni = '';
    let transport: TransportType = 'ws';
    let subscriptionFormat: FormatType = 'vless';
    let templateLink = '';

    if (mode === 'template') {
      templateLink = (rawTemplateLink || '').trim();
      if (!templateLink) {
        return res.status(400).json({ error: 'Missing templateLink parameter' });
      }
    } else {
      sanitizedHost = (rawHost || '').trim();
      sanitizedUuid = (rawUuid || '').trim();

      if (!sanitizedHost || !sanitizedUuid) {
        return res.status(400).json({ error: 'Missing required parameters: host and uuid' });
      }

      requestedPath = (rawPath && rawPath.trim()) || '/?ed=2560';
      requestedSni = (rawSni && rawSni.trim()) || sanitizedHost;

      const transportCandidate = ((rawType || 'ws').trim().toLowerCase()) as TransportType;
      const supportedTransports: TransportType[] = ['ws', 'tcp', 'http'];
      transport = supportedTransports.includes(transportCandidate) ? transportCandidate : 'ws';

      const formatCandidate = ((rawFormat || 'vless').trim().toLowerCase()) as FormatType;
      const supportedFormats: FormatType[] = ['vless', 'vmess'];
      if (!supportedFormats.includes(formatCandidate)) {
        return res.status(400).json({ error: `Unsupported format: ${formatCandidate}` });
      }
      subscriptionFormat = formatCandidate;
    }

    // 获取当前域名
    const currentDomain = getCurrentDomain(req);
    console.log('Current domain:', currentDomain);
    if (mode === 'template') {
      console.log('Effective parameters:', { mode, templateLinkLength: templateLink.length });
    } else {
      console.log('Effective parameters:', { mode, transport, subscriptionFormat, requestedPath, requestedSni });
    }
    
    // 构建动态地址 API 列表
    const dynamicAddressesApi = [
      `${currentDomain}/api/vps789hourcf`,
      `${currentDomain}/api/vps789daycf`
    ];
    
    //'https://raw.githubusercontent.com/cmliu/WorkerVless2sub/main/addressesapi.txt','https://addressesapi.090227.xyz/CloudFlareYes','https://addressesapi.090227.xyz/ip.164746.xyz'
    
    // 获取地址列表 - 优先使用动态 API
    let addressesContent = '';
    
    // 首先尝试从环境变量获取 API 地址
    const addressesApiUrls = process.env.ADDRESSES_API 
      ? process.env.ADDRESSES_API.split(',') 
      : dynamicAddressesApi;
    
    console.log('Using addresses APIs:', addressesApiUrls);
    
    try {
      addressesContent = await fetchAddressesFromAPI(addressesApiUrls);
      console.log('Fetched addresses from API:', addressesContent);
    } catch (error) {
      console.error('Failed to fetch addresses from API:', error);
      // 如果 API 获取失败，使用环境变量中的静态地址
      addressesContent = process.env.ADDRESSES || '';
      console.log('Using static addresses:', addressesContent);
    }
    
    // 如果仍然没有地址，使用默认地址
    if (!addressesContent) {
      console.log('No addresses found, using fallback');
      addressesContent = 'time.is:2053#Keaeye提优支持,icook.hk:2083#备用节点,sk.moe:2096#备用节点,142.171.137.37:8443#备用节点';
    }
    
    const processed = processContent(addressesContent);
    console.log('Processed addresses count:', processed.addresses.length);

    let subscriptionLines: string[] = [];

    if (mode === 'template') {
      try {
        subscriptionLines = generateFromTemplateLink(templateLink, processed.addresses);
      } catch (templateError) {
        console.error('Template generation error:', templateError);
        const message = templateError instanceof Error ? templateError.message : 'Invalid template link';
        return res.status(400).json({ error: message });
      }
    } else {
      subscriptionLines = processed.addresses.map((addr, index) => {
        const hostOrIp = addr.ip.trim();
        const port = (addr.port && addr.port.trim()) || '443';
        const remark = addr.remark?.trim() || `${sanitizedHost}-${index + 1}`;

        if (subscriptionFormat === 'vmess') {
          const vmessConfig: Record<string, string> = {
            v: '2',
            ps: remark,
            add: hostOrIp,
            port,
            id: sanitizedUuid,
            aid: '0',
            scy: 'auto',
            net: transport,
            type: 'none',
            tls: 'tls'
          };

          if (transport === 'ws' || transport === 'http') {
            vmessConfig.host = sanitizedHost;
            vmessConfig.path = requestedPath;
          }

          if (requestedSni) {
            vmessConfig.sni = requestedSni;
          }

          if (proxyConfig.alpn) {
            vmessConfig.alpn = proxyConfig.alpn;
          }

          vmessConfig.fp = 'random';

          const vmessPayload = Buffer.from(JSON.stringify(vmessConfig), 'utf-8').toString('base64');
          return `vmess://${vmessPayload}`;
        }

        const params = new URLSearchParams({
          encryption: 'none',
          security: 'tls',
          fp: 'random',
          type: transport,
          allowInsecure: '1'
        });

        if (requestedSni) {
          params.set('sni', requestedSni);
        }

        if (proxyConfig.alpn) {
          params.set('alpn', proxyConfig.alpn);
        }

        params.set('host', sanitizedHost);
        params.set('path', requestedPath);

        const hostForLink = formatHostForLink(hostOrIp);
        return `vless://${sanitizedUuid}@${hostForLink}:${port}?${params.toString()}#${encodeURIComponent(remark)}`;
      });
    }

    const subscriptionContent = subscriptionLines.join('\n');
    const normalizedContent = subscriptionLines.length ? `${subscriptionContent}\n` : '';

    console.log('Generated subscription content length:', normalizedContent.length);

    // 始终返回 Base64 编码的内容
    const base64Content = encodeBase64(normalizedContent);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    // 直接返回内容，不设置下载头
    return res.status(200).send(base64Content);
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
