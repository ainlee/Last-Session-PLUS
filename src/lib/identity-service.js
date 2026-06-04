/**
 * 身份驗證服務
 * 處理 Google Drive OAuth2 認證流程
 * （Microsoft OneDrive 支援已封存至 _archive/features）
 */

const PROVIDERS = {
  GOOGLE: 'google',
};

/**
 * 獲取認證令牌
 * @param {string} provider 服務提供商 (google)
 * @returns {Promise<string>} 認證令牌
 */
async function getToken(provider) {
  if (provider === PROVIDERS.GOOGLE) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Google Auth Error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(token);
        }
      });
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * 移除認證令牌 (登出)
 * @param {string} provider 服務提供商
 */
async function removeToken(provider) {
  if (provider === PROVIDERS.GOOGLE) {
    return new Promise((resolve) => {
      chrome.identity.removeToken({ token: 'any' }, () => {
        resolve();
      });
    });
  }
}

/**
 * 登出並撤銷令牌
 * @param {string} provider 服務提供商
 */
async function logout(provider) {
  if (provider === PROVIDERS.GOOGLE) {
    const token = await getToken(provider).catch(() => null);
    if (token) {
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`, { method: 'POST' });
    }
  }
  await removeToken(provider);
}

export default {
  PROVIDERS,
  getToken,
  removeToken,
  logout,
};
