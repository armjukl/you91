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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const externalApiUrl = 'https://vps789.com/openApi/cfIpTop20';
  const defaultPort = 443; // 默认端口，与上一个接口转换保持一致，因为原始数据中没有提供端口信息。
                           // 如果需要2096等其他端口，需要有额外的逻辑来判

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
            // 格式：[ip]:[port]#[label]-[avgScore]
            transformedLines.push(`${item.ip}:${defaultPort}#${item.label}-${item.avgScore}`);
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
