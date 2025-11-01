import { useState } from 'react';

interface SubscriptionFormProps {
  onSubmit: (data: {
    host: string;
    uuid: string;
    path: string;
    sni: string;
    type: 'ws' | 'tcp' | 'http';
    format: 'vless' | 'vmess';
  }) => void;
}

type SubscriptionFormValues = Parameters<SubscriptionFormProps['onSubmit']>[0];

export default function SubscriptionForm({ onSubmit }: SubscriptionFormProps) {
  const [formData, setFormData] = useState<SubscriptionFormValues>({
    host: '',
    uuid: '',
    path: '/?ed=2560',
    sni: '',
    type: 'ws',
    format: 'vless'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof SubscriptionFormValues;

    setFormData(prev => {
      if (key === 'format') {
        return { ...prev, format: value as SubscriptionFormValues['format'] };
      }

      if (key === 'type') {
        return { ...prev, type: value as SubscriptionFormValues['type'] };
      }

      return { ...prev, [key]: value } as SubscriptionFormValues;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="subscription-form">
      <div className="form-group">
        <label htmlFor="host">主机地址 (Host)</label>
        <input
          type="text"
          id="host"
          name="host"
          value={formData.host}
          onChange={handleChange}
          placeholder="例如: example.com"
          required
        />
      </div>
       <div className="form-group">
        <label htmlFor="uuid">用户UUID</label>
        <input
          type="text"
          id="uuid"
          name="uuid"
          value={formData.uuid}
          onChange={handleChange}
          placeholder="例如: 550e8400-e29b-41d4-a716-446655440000"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="path">路径 (Path)</label>
        <input
          type="text"
          id="path"
          name="path"
          value={formData.path}
          onChange={handleChange}
          placeholder="例如: /video"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="sni">SNI (服务器名称指示)</label>
        <input
          type="text"
          id="sni"
          name="sni"
          value={formData.sni}
          onChange={handleChange}
          placeholder="可选，默认与主机相同"
        />
      </div>

      <div className="form-group">
        <label htmlFor="format">订阅协议</label>
        <select
          id="format"
          name="format"
          value={formData.format}
          onChange={handleChange}
        >
          <option value="vless">VLESS</option>
          <option value="vmess">VMess</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="type">传输类型</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="ws">WebSocket (ws)</option>
          <option value="tcp">TCP</option>
          <option value="http">HTTP</option>
        </select>
      </div>

      <button type="submit" className="generate-btn">
        生成订阅链接
      </button>
      
        <style jsx>{`
        .subscription-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }
        
        input, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .generate-btn {
          width: 100%;
          padding: 1rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .generate-btn:hover {
          background-color: #0056b3;
        }
      `}</style>
    </form>
  );
}