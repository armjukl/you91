import { useState } from 'react';
import Head from 'next/head';
import SubscriptionForm from '@/components/SubscriptionForm';
import dynamic from 'next/dynamic';

// 动态导入二维码组件，避免服务端渲染问题
const QRCode = dynamic(() => import('react-qr-code'), {
  ssr: false,
  loading: () => <div>加载二维码中...</div>
});

export default function Home() {
  const [subscriptionLink, setSubscriptionLink] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  const handleGenerateLink = (data: {
    host: string;
    uuid: string;
    path: string;
    sni: string;
    type: 'ws' | 'tcp' | 'http';
    format: 'vless' | 'vmess';
  }) => {
    const { host, uuid, path, sni, type, format } = data;
    const baseUrl = window.location.origin;
    const queryParams = new URLSearchParams({
      host,
      uuid,
      path: path || '/?ed=2560',
      ...(sni && { sni }),
      type,
      format
    });
    
    const link = `${baseUrl}/api/subscribe?${queryParams.toString()}`;
    setSubscriptionLink(link);
    setShowQrCode(true);
  };

  return (
    <div>
      <Head>
        <title>优选订阅生成器</title>
        <meta name="description" content="生成优选节点订阅链接" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container">
        <h1>优选订阅生成器</h1>
        <SubscriptionForm onSubmit={handleGenerateLink} />
        
        {subscriptionLink && (
          <div className="result-section">
            <h2>您的订阅链接</h2>
            <div className="input-group">
              <input
                type="text"
                value={subscriptionLink}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button onClick={() => navigator.clipboard.writeText(subscriptionLink)}>
                复制链接
              </button>
            </div>
            
            {showQrCode && (
              <div className="qrcode-section">
                <div style={{ 
                  background: 'white', 
                  padding: '16px', 
                  display: 'inline-block',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}>
                  <QRCode 
                    value={subscriptionLink}
                    size={200}
                    level="H"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>
                <p>扫描二维码导入订阅</p>
                <button 
                  onClick={() => setShowQrCode(false)}
                  style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    fontSize: '12px'
                  }}
                >
                  隐藏二维码
                </button>
              </div>
            )}
            
            {!showQrCode && (
              <button 
                onClick={() => setShowQrCode(true)}
                style={{
                  marginTop: '15px',
                  padding: '8px 16px'
                }}
              >
                显示二维码
              </button>
            )}
          </div>
        )}
      </main>
      
      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 2rem;
          color: #333;
        }
        
        .result-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        
        .input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .input-group input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .input-group button {
          padding: 0.5rem 1rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .qrcode-section {
          text-align: center;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
