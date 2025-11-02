import { useState } from 'react';
import Head from 'next/head';
import SubscriptionForm, { SubscriptionFormSubmitData } from '@/components/SubscriptionForm';
import dynamic from 'next/dynamic';

// 动态导入二维码组件，避免服务端渲染问题
const QRCode = dynamic(() => import('react-qr-code'), {
  ssr: false,
  loading: () => <div>加载二维码中...</div>
});

export default function Home() {
  const [subscriptionLink, setSubscriptionLink] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  const handleGenerateLink = (data: SubscriptionFormSubmitData) => {
    const baseUrl = window.location.origin;
    const queryParams = new URLSearchParams();

    if (data.mode === 'template') {
      queryParams.set('mode', 'template');
      queryParams.set('templateLink', data.templateLink.trim());
    } else {
      const { host, uuid, path, sni, type, format } = data;
      queryParams.set('mode', 'standard');
      queryParams.set('host', host);
      queryParams.set('uuid', uuid);
      queryParams.set('path', path || '/?ed=2560');
      if (sni) {
        queryParams.set('sni', sni);
      }
      queryParams.set('type', type);
      queryParams.set('format', format);
    }
    
    const link = `${baseUrl}/api/subscribe?${queryParams.toString()}`;
    setSubscriptionLink(link);
    setShowQrCode(true);
  };

  return (
    <div className="page-wrapper">
      <Head>
        <title>优选订阅生成器</title>
        <meta name="description" content="生成优选节点订阅链接" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main className="container">
        <div className="header">
          <h1>✨ 优选订阅生成器</h1>
          <p className="subtitle">快速生成您的专属节点订阅链接</p>
        </div>
        
        <SubscriptionForm onSubmit={handleGenerateLink} />
        
        {subscriptionLink && (
          <div className="result-section">
            <h2>🎉 您的订阅链接已生成</h2>
            <div className="input-group">
              <input
                type="text"
                value={subscriptionLink}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(subscriptionLink);
                  const btn = event?.target as HTMLButtonElement;
                  const originalText = btn.textContent;
                  btn.textContent = '✓ 已复制';
                  setTimeout(() => {
                    btn.textContent = originalText || '复制链接';
                  }, 2000);
                }}
              >
                📋 复制链接
              </button>
            </div>
            
            {showQrCode && (
              <div className="qrcode-section">
                <div className="qrcode-wrapper">
                  <QRCode 
                    value={subscriptionLink}
                    size={220}
                    level="H"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>
                <p className="qrcode-hint">📱 使用客户端扫描二维码快速导入</p>
                <button 
                  className="toggle-qr-btn"
                  onClick={() => setShowQrCode(false)}
                >
                  隐藏二维码
                </button>
              </div>
            )}
            
            {!showQrCode && (
              <button 
                className="toggle-qr-btn show"
                onClick={() => setShowQrCode(true)}
              >
                📲 显示二维码
              </button>
            )}
          </div>
        )}
      </main>
      
      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .container {
          max-width: 850px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2.5rem;
          animation: fadeInDown 0.6s ease-out;
        }
        
        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.75rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          letter-spacing: -0.5px;
        }
        
        .subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 400;
          margin: 0;
        }
        
        .result-section {
          margin-top: 2rem;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          animation: fadeInUp 0.5s ease-out;
        }
        
        .result-section h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #2c3e50;
          font-size: 1.5rem;
          font-weight: 600;
          text-align: center;
        }
        
        .input-group {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        
        .input-group input {
          flex: 1;
          padding: 0.875rem 1rem;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 0.95rem;
          background: #fafbfc;
          color: #495057;
          transition: all 0.3s ease;
        }
        
        .input-group input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .copy-btn {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          white-space: nowrap;
        }
        
        .copy-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        .copy-btn:active {
          transform: translateY(0);
        }
        
        .qrcode-section {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 2px solid #f0f0f0;
          animation: fadeIn 0.4s ease-out;
        }
        
        .qrcode-wrapper {
          background: white;
          padding: 1.5rem;
          display: inline-block;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          margin-bottom: 1rem;
        }
        
        .qrcode-hint {
          color: #6c757d;
          font-size: 0.95rem;
          margin: 1rem 0;
          font-weight: 500;
        }
        
        .toggle-qr-btn {
          padding: 0.75rem 1.5rem;
          background: #f8f9fa;
          color: #495057;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        
        .toggle-qr-btn:hover {
          background: white;
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }
        
        .toggle-qr-btn.show {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .toggle-qr-btn.show:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          h1 {
            font-size: 2rem;
          }
          
          .subtitle {
            font-size: 1rem;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          .copy-btn {
            width: 100%;
          }
          
          .result-section {
            padding: 1.5rem;
          }
        }
      `}</style>
      
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
