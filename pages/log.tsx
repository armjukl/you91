// pages/log.ts
import { GetServerSideProps } from 'next';
import React from 'react';

interface LogEntry {
  timestamp: string;
  ip: string;
  url: string;
  userAgent?: string;
}

interface LogPageProps {
  logs: LogEntry[]; // 假设我们从某个地方获取日志
}

export default function LogPage({ logs }: LogPageProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <style>{`
        .log-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .log-container h1 {
          color: #2c3e50;
          margin-bottom: 2rem;
          font-size: 2rem;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        
        .log-table-wrapper {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.17);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          overflow: hidden;
          padding: 1.5rem;
        }
        
        .log-table-wrapper table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .log-table-wrapper thead tr {
          background: rgba(100, 150, 200, 0.1);
          border-bottom: 1px solid rgba(200, 210, 220, 0.3);
        }
        
        .log-table-wrapper th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
        }
        
        .log-table-wrapper tbody tr {
          border-bottom: 1px solid rgba(200, 210, 220, 0.2);
          transition: background-color 0.3s ease;
        }
        
        .log-table-wrapper tbody tr:hover {
          background: rgba(100, 150, 200, 0.08);
        }
        
        .log-table-wrapper td {
          padding: 0.875rem 1rem;
          color: #5a6c7d;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }
        
        .log-table-wrapper tbody tr:last-child {
          border-bottom: none;
        }
      `}</style>
      <div className="log-container">
        <h1>📊 订阅生成访问日志</h1>
        <div className="log-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>时间戳</th>
                <th>IP 地址</th>
                <th>请求 URL</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td>{log.timestamp}</td>
                  <td>{log.ip}</td>
                  <td>{log.url}</td>
                  <td>{log.userAgent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 这里假设你有一个获取日志的方法，例如从文件或数据库
// 实际部署中，你可能需要从自己的日志存储中获取数据
export const getServerSideProps: GetServerSideProps = async () => {
  // 示例日志数据，实际应用中你应该从日志文件或数据库读取
  const sampleLogs: LogEntry[] = [
    {
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1',
      url: '/api/subscribe?host=example.com&uuid=123',
      userAgent: 'Mozilla/5.0...'
    }
  ];

  return {
    props: {
      logs: sampleLogs
    }
  };
};
