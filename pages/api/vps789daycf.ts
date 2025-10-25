import type { NextApiRequest, NextApiResponse } from 'next';

// 定义外部API返回的数据结构，用于类型提示
interface TopIpDetail {
  id: number;
  vpsId: number;
  hostProvider?: string; // 可选字段
  ip: string;
  locationCountry?: string; // 可选字段
  locationCity?: string; // 可选字段
  avgLatency: number;
  avgPkgLostRate: number;
  ydLatency: number;
  ydPkgLostRate: number;
  ltLatency: number;
  ltPkgLostRate: number;
  dxLatency: number;
  dxPkgLostRate: number;
  label: string;
  createdTime: string;
  avgScore: number;
  ydScore: number;
  dxScore: number;
  ltScore: number;
}

interface ExternalTopApiResponse {
  code: number;
  message: string;
  count: number;
  data: {
    good?: TopIpDetail[];
  };
}

// 判断字符串是否为IP地址的辅助函数
function isIPAddress(str: string): boolean {
  // IPv4地址正则
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6地址正则（简化版本）
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(str) || ipv6Regex.test(str);
}

// 域名验证正则表达式
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const externalApiUrl = 'https://vps789.com/openApi/cfIpTop20';
  const defaultPort = 443; // 默认端口

  try {
    // 1. 从外部API获取数据
    const response = await fetch(externalApiUrl);

    if (!response.ok) {
      console.error(`Error fetching external API: ${response.status} ${response.statusText}`);
      return res.status(response.status).send('Error fetching data from external API.');
    }

    const externalData: ExternalTopApiResponse = await response.json();
    
    // 2. 转换数据格式
    const transformedLines: string[] = [];

    if (externalData && externalData.data && externalData.data.good) {
      const ipList = externalData.data.good;
      
      if (Array.isArray(ipList)) {
        for (const item of ipList) {
          // 确保ip, label, avgScore 存在且类型正确
          if (item.ip && item.label && typeof item.avgScore === 'number') {
            const address = item.ip.trim();
            
            // 检查是否为IP地址或域名
            const isIP = isIPAddress(address);
            const isDomain = isValidDomain(address);
            
            if (isIP || isDomain) {
              // 格式：[ip或域名]:[port]#[label]-[avgScore]
              transformedLines.push(`${address}:${defaultPort}#${item.label}-${item.avgScore}`);
            } else {
              console.warn(`Invalid address format: ${address}, skipping...`);
            }
          }
        }
      }
    }

    // 3. 将所有行用换行符连接起来
    const resultString = transformedLines.join('\n');

    // 4. 设置响应头为纯文本，并发送结果
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(resultString);

  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).send('Internal Server Error.');
  }
}