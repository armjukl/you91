import { useState, type ChangeEvent, type FormEvent } from 'react';

export type SubscriptionMode = 'standard' | 'template';

export type SubscriptionFormSubmitData =
  | {
      mode: 'standard';
      host: string;
      uuid: string;
      path: string;
      sni: string;
      type: 'ws' | 'tcp' | 'http';
      format: 'vless' | 'vmess';
    }
  | {
      mode: 'template';
      templateLink: string;
    };

interface SubscriptionFormProps {
  onSubmit: (data: SubscriptionFormSubmitData) => void;
}

type StandardFormState = {
  host: string;
  uuid: string;
  path: string;
  sni: string;
  type: 'ws' | 'tcp' | 'http';
  format: 'vless' | 'vmess';
};

const initialStandardForm: StandardFormState = {
  host: '',
  uuid: '',
  path: '/?ed=2560',
  sni: '',
  type: 'ws',
  format: 'vless'
};

export default function SubscriptionForm({ onSubmit }: SubscriptionFormProps) {
  const [mode, setMode] = useState<SubscriptionMode>('template');
  const [standardForm, setStandardForm] = useState<StandardFormState>(initialStandardForm);
  const [templateLink, setTemplateLink] = useState('');

  const handleModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as SubscriptionMode);
  };

  const handleStandardChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setStandardForm(prev => {
      if (name === 'format') {
        return { ...prev, format: value as StandardFormState['format'] };
      }

      if (name === 'type') {
        return { ...prev, type: value as StandardFormState['type'] };
      }

      return { ...prev, [name]: value } as StandardFormState;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'template') {
      const trimmedTemplate = templateLink.trim();
      if (!trimmedTemplate) {
        return;
      }

      onSubmit({
        mode: 'template',
        templateLink: trimmedTemplate
      });
      return;
    }

    onSubmit({
      mode: 'standard',
      ...standardForm
    });
  };

  return (
    <form onSubmit={handleSubmit} className="subscription-form">
      <div className="form-group">
        <label>生成模式</label>
        <div className="mode-options">
          <label className={mode === 'standard' ? 'active' : ''}>
            <input
              type="radio"
              name="mode"
              value="standard"
              checked={mode === 'standard'}
              onChange={handleModeChange}
            />
            参数生成
          </label>
          <label className={mode === 'template' ? 'active' : ''}>
            <input
              type="radio"
              name="mode"
              value="template"
              checked={mode === 'template'}
              onChange={handleModeChange}
            />
            节点链接替换
          </label>
        </div>
      </div>

      {mode === 'standard' ? (
        <>
          <div className="form-group">
            <label htmlFor="host">主机地址 (Host)</label>
            <input
              type="text"
              id="host"
              name="host"
              value={standardForm.host}
              onChange={handleStandardChange}
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
              value={standardForm.uuid}
              onChange={handleStandardChange}
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
              value={standardForm.path}
              onChange={handleStandardChange}
              placeholder="例如: /video"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sni">SNI (服务器名称指示)</label>
            <input
              type="text"
              id="sni"
              name="sni"
              value={standardForm.sni}
              onChange={handleStandardChange}
              placeholder="可选，默认与主机相同"
            />
          </div>

          <div className="form-group">
            <label htmlFor="format">订阅协议</label>
            <select
              id="format"
              name="format"
              value={standardForm.format}
              onChange={handleStandardChange}
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
              value={standardForm.type}
              onChange={handleStandardChange}
            >
              <option value="ws">WebSocket (ws)</option>
              <option value="tcp">TCP</option>
              <option value="http">HTTP</option>
            </select>
          </div>
        </>
      ) : (
        <div className="form-group">
          <label htmlFor="templateLink">节点链接</label>
          <textarea
            id="templateLink"
            name="templateLink"
            value={templateLink}
            onChange={event => setTemplateLink(event.target.value)}
            placeholder="请输入完整的节点链接，例如: vless://uuid@example.com:2053?encryption=none#示例"
            required
          />
          <p className="field-hint">订阅器会仅替换链接中的主机地址与端口，其余参数保持不变。</p>
        </div>
      )}

      <button type="submit" className="generate-btn">
        生成订阅链接
      </button>

      <style jsx>{`
        .subscription-form {
          background: rgba(255, 255, 255, 0.7);
          padding: 2.5rem;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.17);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        
        .form-group {
          margin-bottom: 1.75rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.625rem;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
        }
        
        .mode-options {
          display: flex;
          gap: 1rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 14px;
          border: 1px solid rgba(200, 210, 220, 0.3);
          backdrop-filter: blur(10px);
        }
        
        .mode-options label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 10px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #5a6c7d;
          font-weight: 500;
          flex: 1;
          background: rgba(255, 255, 255, 0.5);
        }
        
        .mode-options label:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 12px rgba(100, 150, 200, 0.15);
        }
        
        .mode-options label.active {
          color: white;
          border: 1px solid rgba(100, 150, 200, 0.5);
          background: rgba(100, 150, 200, 0.7);
          box-shadow: 0 4px 15px rgba(100, 150, 200, 0.25);
          backdrop-filter: blur(10px);
        }
        
        .mode-options input {
          accent-color: rgba(100, 150, 200, 0.9);
        }
        
        input[type='text'],
        select,
        textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid rgba(200, 210, 220, 0.4);
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.5);
          color: #2c3e50;
          backdrop-filter: blur(10px);
        }
        
        input[type='text']:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: rgba(100, 150, 200, 0.6);
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 0 3px rgba(100, 150, 200, 0.1);
        }
        
        textarea {
          min-height: 140px;
          resize: vertical;
          line-height: 1.6;
          font-family: 'Courier New', monospace;
        }
        
        .field-hint {
          margin-top: 0.625rem;
          font-size: 0.875rem;
          color: #5a6c7d;
          line-height: 1.5;
          padding: 0.5rem 0.75rem;
          background: rgba(100, 150, 200, 0.1);
          border-radius: 8px;
          border-left: 3px solid rgba(100, 150, 200, 0.6);
        }
        
        .generate-btn {
          width: 100%;
          padding: 1.125rem;
          background: rgba(100, 150, 200, 0.7);
          color: white;
          border: 1px solid rgba(100, 150, 200, 0.5);
          border-radius: 12px;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          letter-spacing: 0.5px;
        }
        
        .generate-btn:hover {
          transform: translateY(-2px);
          background: rgba(100, 150, 200, 0.85);
          box-shadow: 0 6px 20px rgba(100, 150, 200, 0.3);
        }
        
        .generate-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </form>
  );
}
