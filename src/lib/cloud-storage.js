/**
 * 雲端儲存服務
 * Google Drive API 進行數據同步
 * （OneDrive 支援已封存至 _archive/features）
 */

import identityService from './identity-service';

const FILE_NAME = 'last_session_sync.json';
const CONTENT_TYPE = 'application/json';

/**
 * Google Drive API 實作
 */
const googleDrive = {
  async upload(token, data) {
    const metadata = {
      name: FILE_NAME,
      parents: ['appDataFolder'],
    };

    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and 'appDataFolder' in parents`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const searchData = await searchResponse.json();
    const fileId = searchData.files?.[0]?.id;

    const body = new Blob([JSON.stringify(data)], { type: CONTENT_TYPE });
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', body);

    const url = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const response = await fetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error(`Google Drive Upload Error: ${response.statusText}`);
    return await response.json();
  },

  async download(token) {
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and 'appDataFolder' in parents`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const searchData = await searchResponse.json();
    const fileId = searchData.files?.[0]?.id;

    if (!fileId) return null;

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Google Drive Download Error: ${response.statusText}`);
    return await response.json();
  },
};

/**
 * 雲端儲存主接口
 */
async function uploadData(provider, data) {
  const token = await identityService.getToken(provider);
  if (provider === identityService.PROVIDERS.GOOGLE) {
    return await googleDrive.upload(token, data);
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

async function downloadData(provider) {
  const token = await identityService.getToken(provider);
  if (provider === identityService.PROVIDERS.GOOGLE) {
    return await googleDrive.download(token);
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

export default {
  uploadData,
  downloadData,
};
