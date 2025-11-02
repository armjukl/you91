import type { NextApiRequest, NextApiResponse } from 'next';

// 定义外部API返回的数据结构，用于类型提示
interface IpDetail {
  ip: string;
  ydLatencyAvg: number;
  ydPkgLostRateAvg: number;
  ltLatencyAvg: number;
  ltPkgLostRateAvg: number;
  dxLatencyAvg: number;
  dxPkgLostRateAvg: number;
  avgScore: number;
  ydScore: number;
  dxScore: number;
  ltScore: number;
}

interface ExternalApiResponse {
  code: number;
  message: string;
  count: number;
  data: {
    CT?: IpDetail[];
    CU?: IpDetail[];
    CM?: IpDetail[];
  };
}

function formatEndpointHost(host: string): string {
  const trimmed = host.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed;
  }
  return trimmed.includes(':') ? `[${trimmed}]` : trimmed;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const externalApiUrl = 'https://vps789.com/openApi/cfIpApi';
  const defaultPort = 443; // 默认端口，因为原始数据中没有提供端口信息，根据你的示例输出，443是常见的HTTPS端口。
                           // 如果需要2096等其他端口，需要有额外的逻辑来判断。

  try {
    // 1. 从外部API获取数据
    const response = await fetch(externalApiUrl);

    if (!response.ok) {
      console.error(`Error fetching external API: ${response.status} ${response.statusText}`);
      return res.status(response.status).send('Error fetching data from external API.');
    }

    const externalData: ExternalApiResponse = await response.json();

    // 2. 转换数据格式
    const transformedLines: string[] = [];

    if (externalData && externalData.data) {
      const categories: Array<keyof ExternalApiResponse['data']> = ['CT', 'CU', 'CM'];

      for (const category of categories) {
        const ipList = externalData.data[category];
        if (ipList && Array.isArray(ipList)) {
          for (const item of ipList) {
            // 确保ip和avgScore存在且类型正确
            if (item.ip && typeof item.avgScore === 'number') {
              const formattedHost = formatEndpointHost(item.ip);
              if (!formattedHost) {
                continue;
              }
              // 格式：[ip]:[port]#[CT/CU/CM]-[avgScore]
              transformedLines.push(`${formattedHost}:${defaultPort}#${category}-${item.avgScore}`);
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
