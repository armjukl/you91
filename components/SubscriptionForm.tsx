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
  const [mode, setMode] = useState<SubscriptionMode>('standard');
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
        
        .mode-options {
          display: flex;
          gap: 1rem;
        }
        
        .mode-options label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background-color 0.2s;
          color: #555;
        }
        
        .mode-options label.active {
          color: #0070f3;
          border-color: rgba(0, 112, 243, 0.3);
          background-color: rgba(0, 112, 243, 0.08);
        }
        
        .mode-options input {
          accent-color: #0070f3;
        }
        
        input[type='text'],
        select,
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        textarea {
          min-height: 120px;
          resize: vertical;
          line-height: 1.5;
        }
        
        .field-hint {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #666;
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
