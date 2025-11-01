export type SubscribeMode = 'standard' | 'template';

export interface SubscribeRequest {
  host?: string;
  uuid?: string;
  path?: string;
  sni?: string;
  type?: 'ws' | 'tcp' | 'http';
  format?: 'vless' | 'vmess';
  mode?: SubscribeMode;
  extra?: string;
  templateLink?: string;
}

export interface ProxyConfig {
  subConverter: string;
  subProtocol: string;
  subConfig: string;
  fileName: string;
  noTLS: string;
  alpn: string;
  proxyIPs: string[];
  matchProxyIP: string[];
  httpsPorts: string[];
}

export interface AddressItem {
  ip: string;
  port: string;
  remark?: string;
}

export interface ProcessedContent {
  addresses: AddressItem[];
  content: string;
}