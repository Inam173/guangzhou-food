/* ===== 广州美食地图 - 管理后台逻辑 ===== */

// ---------- 全局状态 ----------
let adminShops = [];
let deleteTargetId = null;

// ---------- DOM 引用 ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 配置
const cfgOwner      = $('#cfgOwner');
const cfgRepo       = $('#cfgRepo');
const cfgBranch     = $('#cfgBranch');
const cfgToken      = $('#cfgToken');
const configStatus  = $('#configStatus');
const btnSaveConfig = $('#btnSaveConfig');
const btnTestConfig = $('#btnTestConfig');

// 列表
const adminSearchInput = $('#adminSearchInput');
const adminShopCount  = $('#adminShopCount');
const shopTableBody   = $('#shopTableBody');
const shopListMobile  = $('#shopListMobile');
const btnNewShop      = $('#btnNewShop');
const btnExport       = $('#btnExport');
const btnImport       = $('#btnImport');
const importFileInput = $('#importFileInput');

// 表单弹窗
const formModal     = $('#formModal');
const shopForm      = $('#shopForm');
const formTitle     = $('#formTitle');
const formId        = $('#formId');
const formName      = $('#formName');
const formCategory  = $('#formCategory');
const formRating    = $('#formRating');
const formPrice     = $('#formPrice');
const formAddress   = $('#formAddress');
const formLat       = $('#formLat');
const formLng       = $('#formLng');
const formImageFile = $('#formImageFile');
const imagesContainer = $('#imagesContainer');
const btnAddImage = $('#btnAddImage');
const formDianpingUrl = $('#formDianpingUrl');
const formTags      = $('#formTags');
const formNotes     = $('#formNotes');
const formVisitedDate = $('#formVisitedDate');
const btnSubmitForm = $('#btnSubmitForm');
const btnCloseForm  = $('#btnCloseForm');
const btnCancelForm = $('#btnCancelForm');

// 删除弹窗
const deleteModal     = $('#deleteModal');
const deleteShopName  = $('#deleteShopName');
const btnCancelDelete = $('#btnCancelDelete');
const btnConfirmDelete = $('#btnConfirmDelete');

// ---------- 多图管理 ----------
let formImages = [];

function defaultImage() {
  return { url: '', fit: 'cover', posX: 50, posY: 50, zoom: 1 };
}

function renderImageEntry(img, index) {
  const idx = index;
  const zoomPct = Math.round((img.zoom || 1) * 100);
  const fit = img.fit || 'cover';
  const posX = img.posX ?? 50;
  const posY = img.posY ?? 50;
  const hasUrl = img.url && img.url.trim();
  const customized = fit === 'cover' && (img.zoom !== 1 || posX !== 50 || posY !== 50);
  const previewFit = customized ? 'object-contain' : (fit === 'contain' ? 'object-contain' : fit === 'fill' ? 'object-fill' : 'object-cover');
  const previewStyle = customized
    ? `object-position:${posX}% ${posY}%;transform:scale(${img.zoom || 1});transform-origin:${posX}% ${posY}%`
    : (fit === 'cover' ? `object-position:${posX}% ${posY}%` : '');

  return `
    <div class="image-entry bg-gray-50 rounded-lg p-3 border border-gray-200" data-img-index="${idx}">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-gray-600">📷 图片 ${idx + 1}</span>
        ${formImages.length > 1 ? `<button type="button" class="btn-remove-img text-red-400 hover:text-red-600 text-xs transition" data-img-index="${idx}">✕ 移除</button>` : ''}
      </div>
      <div class="flex gap-2 mb-2">
        <input type="url" id="imgUrl-${idx}" value="${escapeHTML(img.url || '')}" placeholder="https://example.com/photo.jpg"
               class="img-url-input form-input flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
        <button type="button" class="btn-img-upload px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition whitespace-nowrap" data-img-index="${idx}">
          📁 上传
        </button>
      </div>
      <div class="flex items-start gap-3">
        <div class="w-20 bg-gray-200 rounded-lg overflow-hidden shrink-0" style="aspect-ratio:4/3">
          ${hasUrl
            ? `<img id="imgPreview-${idx}" src="${escapeHTML(img.url)}" class="w-full h-full ${previewFit}" style="${previewStyle}" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-xl\\'>🍜</div>'">`
            : `<div class="w-full h-full flex items-center justify-center text-xl">🍜</div>`}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex gap-1 mb-1">
            ${['cover','contain','fill'].map(f => `
              <label class="flex-1 cursor-pointer">
                <input type="radio" name="imgFit-${idx}" value="${f}" ${fit === f ? 'checked' : ''} class="sr-only peer img-fit-radio" data-img-index="${idx}">
                <span class="block text-center px-1 py-1 text-xs rounded border border-gray-300 bg-white peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500 transition">${f==='cover'?'🔲撑满':f==='contain'?'🖼️完整':'↔️拉伸'}</span>
              </label>
            `).join('')}
          </div>
          <div class="img-sliders space-y-1" style="display:${fit==='cover'?'':'none'}">
            <div class="flex items-center gap-1">
              <span class="text-xs w-5">🔍</span>
              <input type="range" id="imgZoom-${idx}" min="50" max="200" value="${zoomPct}" class="img-slider flex-1 h-1 accent-amber-500" data-img-index="${idx}" data-key="zoom" data-scale="100">
              <span class="text-xs w-10 text-right img-zoom-label">${zoomPct}%</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs w-5">↔️</span>
              <input type="range" id="imgPosX-${idx}" min="0" max="100" value="${posX}" class="img-slider flex-1 h-1 accent-amber-500" data-img-index="${idx}" data-key="posX">
              <span class="text-xs w-10 text-right img-posx-label">${posX}%</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs w-5">↕️</span>
              <input type="range" id="imgPosY-${idx}" min="0" max="100" value="${posY}" class="img-slider flex-1 h-1 accent-amber-500" data-img-index="${idx}" data-key="posY">
              <span class="text-xs w-10 text-right img-posy-label">${posY}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderImages() {
  imagesContainer.innerHTML = formImages.map((img, i) => renderImageEntry(img, i)).join('');
}

function readImageFromForm(index) {
  const urlEl = document.getElementById('imgUrl-' + index);
  const url = urlEl ? urlEl.value.trim() : (formImages[index]?.url || '');
  const fitRadio = document.querySelector(`input[name="imgFit-${index}"]:checked`);
  const fit = fitRadio ? fitRadio.value : 'cover';
  const zoomEl = document.getElementById('imgZoom-' + index);
  const posXEl = document.getElementById('imgPosX-' + index);
  const posYEl = document.getElementById('imgPosY-' + index);
  return {
    url,
    fit,
    posX: posXEl ? parseInt(posXEl.value) || 50 : 50,
    posY: posYEl ? parseInt(posYEl.value) || 50 : 50,
    zoom: zoomEl ? parseInt(zoomEl.value) / 100 || 1 : 1
  };
}

function refreshPreview(index) {
  const img = readImageFromForm(index);
  formImages[index] = img;
  const preview = document.getElementById('imgPreview-' + index);
  if (!preview) return;
  const customized = img.fit === 'cover' && (img.zoom !== 1 || img.posX !== 50 || img.posY !== 50);
  const fitClass = customized ? 'object-contain' : (img.fit === 'contain' ? 'object-contain' : img.fit === 'fill' ? 'object-fill' : 'object-cover');
  const sty = customized
    ? `object-position:${img.posX}% ${img.posY}%;transform:scale(${img.zoom});transform-origin:${img.posX}% ${img.posY}%`
    : (img.fit === 'cover' ? `object-position:${img.posX}% ${img.posY}%` : '');
  preview.className = `w-full h-full ${fitClass}`;
  preview.style = sty;
  if (img.url) preview.src = img.url;
}

// 事件委托：图片条目内的所有交互
imagesContainer.addEventListener('click', async (e) => {
  // 移除按钮
  const removeBtn = e.target.closest('.btn-remove-img');
  if (removeBtn) {
    const idx = parseInt(removeBtn.dataset.imgIndex);
    formImages.splice(idx, 1);
    renderImages();
    return;
  }
  // 上传按钮
  const uploadBtn = e.target.closest('.btn-img-upload');
  if (uploadBtn) {
    formImageFile.dataset.targetIndex = uploadBtn.dataset.imgIndex;
    formImageFile.click();
    return;
  }
});

// 上传文件处理
formImageFile.addEventListener('change', async () => {
  const idx = parseInt(formImageFile.dataset.targetIndex || '0');
  const file = formImageFile.files[0];
  if (!file) return;

  const c = getConfig();
  if (!c.owner || !c.repo || !c.token) {
    showToast('请先配置 GitHub 连接信息', 'error');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showToast('文件超过 50MB，建议先压缩再上传', 'error');
    return;
  }

  const uploadBtn = document.querySelector(`.btn-img-upload[data-img-index="${idx}"]`);
  if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = '⏳'; }

  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });

    const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
    const imagePath = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const apiUrl = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${imagePath}`;

    const resp = await fetchWithTimeout(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${c.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `📷 上传图片：${file.name}`,
        content: base64,
        branch: c.branch,
      }),
    }, 30000);

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${resp.status}`);
    }

    const rawUrl = `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch}/${imagePath}`;
    const urlEl = document.getElementById('imgUrl-' + idx);
    if (urlEl) { urlEl.value = rawUrl; }
    formImages[idx].url = rawUrl;
    refreshPreview(idx);
    showToast('上传成功！', 'success');
  } catch (err) {
    showToast('上传失败：' + err.message, 'error');
  } finally {
    if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = '📁 上传'; }
    formImageFile.value = '';
  }
});

// 事件委托：fit radio / slider / url 输入变化 → 更新预览
imagesContainer.addEventListener('change', (e) => {
  if (e.target.classList.contains('img-fit-radio')) {
    const idx = parseInt(e.target.dataset.imgIndex);
    formImages[idx].fit = e.target.value;
    // 重新渲染以显示/隐藏滑块
    formImages = formImages.map((img, i) => i === idx ? readImageFromForm(i) : img);
    renderImages();
  }
});

imagesContainer.addEventListener('input', (e) => {
  if (e.target.classList.contains('img-slider')) {
    const idx = parseInt(e.target.dataset.imgIndex);
    const key = e.target.dataset.key;
    const scale = parseInt(e.target.dataset.scale || '1');
    const val = parseInt(e.target.value) / scale;
    formImages[idx][key] = val;
    // 更新标签
    const labelClass = key === 'zoom' ? 'img-zoom-label' : key === 'posX' ? 'img-posx-label' : 'img-posy-label';
    const entry = e.target.closest('.image-entry');
    if (entry) {
      const label = entry.querySelector('.' + labelClass);
      if (label) label.textContent = e.target.value + '%';
    }
    refreshPreview(idx);
  }
  if (e.target.classList.contains('img-url-input')) {
    const idx = parseInt(e.target.closest('.image-entry')?.dataset.imgIndex);
    if (idx >= 0) {
      formImages[idx].url = e.target.value;
      // 完全重渲染（URL 从空变为有值时预览 img 元素需要从头创建）
      renderImages();
    }
  }
});

// 添加图片按钮
btnAddImage.addEventListener('click', () => {
  if (formImages.length >= 5) { showToast('最多5张图片', 'error'); return; }
  formImages.push(defaultImage());
  renderImages();
});
function getConfig() {
  return {
    owner: localStorage.getItem('gzfood_owner') || '',
    repo: localStorage.getItem('gzfood_repo') || '',
    branch: localStorage.getItem('gzfood_branch') || 'main',
    token: localStorage.getItem('gzfood_token') || '',
  };
}

function saveConfig() {
  localStorage.setItem('gzfood_owner', cfgOwner.value.trim());
  localStorage.setItem('gzfood_repo', cfgRepo.value.trim());
  localStorage.setItem('gzfood_branch', cfgBranch.value.trim() || 'main');
  localStorage.setItem('gzfood_token', cfgToken.value.trim());
  showToast('配置已保存 ✓', 'success');
  setConfigStatus('saved', '配置已保存', 'text-green-500');
}

function loadConfigUI() {
  const c = getConfig();
  cfgOwner.value = c.owner;
  cfgRepo.value = c.repo;
  cfgBranch.value = c.branch;
  cfgToken.value = c.token;
  if (c.owner && c.repo && c.token) {
    setConfigStatus('saved', '已配置', 'text-green-500');
  }
}

function setConfigStatus(status, text, className) {
  configStatus.textContent = text;
  configStatus.className = 'text-xs ' + className;
}

btnSaveConfig.addEventListener('click', saveConfig);

// ---------- 测试连接 ----------
btnTestConfig.addEventListener('click', async () => {
  const c = {
    owner: cfgOwner.value.trim(),
    repo: cfgRepo.value.trim(),
    branch: cfgBranch.value.trim() || 'main',
    token: cfgToken.value.trim(),
  };
  if (!c.owner || !c.repo || !c.token) {
    showToast('请先填写完整配置', 'error');
    return;
  }

  setConfigStatus('testing', '测试中...', 'text-blue-500');
  btnTestConfig.disabled = true;

  try {
    const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/data.json`;
    const resp = await fetch(url, {
      headers: {
        'Authorization': `token ${c.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (resp.ok || resp.status === 404) {
      setConfigStatus('ok', '连接成功 ✓', 'text-green-500');
      showToast('GitHub 连接成功！', 'success');
      // 自动保存
      saveConfig();
    } else if (resp.status === 401) {
      setConfigStatus('error', 'Token 无效', 'text-red-500');
      showToast('Token 无效，请检查', 'error');
    } else if (resp.status === 404) {
      setConfigStatus('error', '仓库不存在', 'text-red-500');
      showToast('仓库或分支不存在', 'error');
    } else {
      setConfigStatus('error', `HTTP ${resp.status}`, 'text-red-500');
      showToast(`请求失败：HTTP ${resp.status}`, 'error');
    }
  } catch (err) {
    setConfigStatus('error', '网络错误', 'text-red-500');
    showToast('网络错误：' + err.message, 'error');
  } finally {
    btnTestConfig.disabled = false;
  }
});

// ---------- 图片压缩 ----------
function compressImage(file, maxWidth, quality, format) {
  format = format || 'image/jpeg';
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      // 如果原图宽度小于最大宽度，不放大
      const width = Math.min(img.width, maxWidth);
      const height = Math.round(img.height * (width / img.width));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 输出 base64（去掉 data: 前缀）
      const dataUrl = canvas.toDataURL(format, quality);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
}

// ---------- 工具：带超时的 fetch ----------
function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ---------- GitHub API 操作 ----------
async function githubGetFile() {
  const c = getConfig();
  const apiUrl = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/data.json?ref=${c.branch}`;

  // ⚠️ 优先用 API 读取（始终返回最新数据，避免 raw CDN 缓存导致旧数据覆盖）
  try {
    const apiResp = await fetchWithTimeout(apiUrl, {
      headers: {
        'Authorization': `token ${c.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (apiResp.ok) {
      const fileData = await apiResp.json();
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      return { content, sha: fileData.sha, isNew: false };
    }
    if (apiResp.status === 404) {
      return { content: null, sha: null, isNew: true };
    }
    // API 失败不抛错，继续尝试 raw URL 降级
    console.warn('GitHub API 读取失败，尝试 raw URL 降级...');
  } catch (e) {
    console.warn('GitHub API 网络错误，尝试 raw URL 降级...', e.message);
  }

  // 降级：raw URL（加时间戳打破 CDN 缓存）
  try {
    const rawResp = await fetchWithTimeout(
      `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch}/data.json?t=${Date.now()}`
    );
    if (rawResp.ok) {
      const data = await rawResp.json();
      return { content: data, sha: null, isNew: false };
    }
  } catch (e) { /* raw URL 也失败，最终报错 */ }

  throw new Error('无法读取 GitHub 数据，请检查网络连接');
}

async function githubPutFile(shops, commitMsg) {
  const c = getConfig();
  const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/data.json`;
  const content = JSON.stringify({ shops }, null, 2);

  // 最多重试 2 次（应对并发修改导致的 SHA 不匹配）
  for (let attempt = 0; attempt < 2; attempt++) {
    // 获取最新 SHA
    let sha = null;
    try {
      const getResp = await fetchWithTimeout(url + `?ref=${c.branch}`, {
        headers: {
          'Authorization': `token ${c.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (getResp.ok) {
        const fd = await getResp.json();
        sha = fd.sha;
      }
    } catch (e) { /* file may not exist yet */ }

    const body = {
      message: commitMsg,
      content: btoa(unescape(encodeURIComponent(content))), // UTF-8 safe base64
      branch: c.branch,
    };
    if (sha) body.sha = sha;

    const resp = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${c.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) return resp.json();

    const err = await resp.json().catch(() => ({}));
    // 如果是 SHA 不匹配，重试一次（重新获取最新 SHA）
    if (err.message && err.message.includes('does not match') && attempt === 0) {
      console.warn('SHA 冲突，自动重试...');
      continue;
    }
    throw new Error(err.message || `HTTP ${resp.status}`);
  }
}

// ---------- 数据读取 ----------
async function loadAdminShops() {
  // 1. 始终先加载本地 data.json（秒开，不依赖网络）
  try {
    const resp = await fetch('data.json?v=' + Date.now());
    const data = await resp.json();
    adminShops = data.shops || [];
  } catch (e) {
    adminShops = [];
  }
  renderAdminList();

  // 2. 如果配置了 GitHub，后台同步最新数据
  const c = getConfig();
  if (!c.owner || !c.repo) return;

  try {
    const result = await githubGetFile();
    if (result.content && result.content.shops) {
      adminShops = result.content.shops;
      renderAdminList();
    }
  } catch (err) {
    // 静默失败，本地数据已经显示了
    console.warn('GitHub 同步失败，使用本地数据:', err.message);
  }
}

// ---------- 渲染列表 ----------
function getFilteredAdminShops() {
  const q = (adminSearchInput.value || '').toLowerCase().trim();
  if (!q) return adminShops;
  return adminShops.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.address.toLowerCase().includes(q) ||
    s.category.includes(q)
  );
}

function renderAdminList() {
  const list = getFilteredAdminShops();
  adminShopCount.textContent = `${list.length} 家`;

  // 桌面表格
  if (list.length === 0) {
    shopTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-300">暂无数据，点击「➕ 新增店铺」开始记录</td></tr>`;
  } else {
    shopTableBody.innerHTML = list.map(s => `
      <tr class="border-b border-gray-50 hover:bg-orange-50/50 transition">
        <td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(s.name)}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">${escapeHTML(s.category)}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <span class="text-orange-500 font-medium">${s.rating || '-'}</span>
        </td>
        <td class="px-4 py-3 text-center text-gray-600">¥${s.pricePerPerson || '-'}</td>
        <td class="px-4 py-3 text-gray-500 text-xs max-w-40 truncate">${escapeHTML(s.address || '-')}</td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="editShop('${s.id}')" class="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs transition">编辑</button>
            <button onclick="confirmDelete('${s.id}')" class="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs transition">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 手机列表
  if (list.length === 0) {
    shopListMobile.innerHTML = '<p class="text-center text-gray-300 py-12 text-sm">暂无数据</p>';
  } else {
    shopListMobile.innerHTML = list.map(s => `
      <div class="p-4 flex items-center justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-gray-800 truncate">${escapeHTML(s.name)}</span>
            <span class="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs shrink-0">${escapeHTML(s.category)}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>⭐${s.rating || '-'}</span>
            <span>💰¥${s.pricePerPerson || '-'}</span>
            <span class="truncate">📍${escapeHTML(s.address || '-')}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 ml-3 shrink-0">
          <button onclick="editShop('${s.id}')" class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs">编辑</button>
          <button onclick="confirmDelete('${s.id}')" class="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs">删除</button>
        </div>
      </div>
    `).join('');
  }
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 表单操作 ----------
function openForm(shop) {
  if (shop) {
    formTitle.textContent = '编辑店铺';
    formId.value = shop.id;
    formName.value = shop.name || '';
    formCategory.value = shop.category || '';
    formRating.value = shop.rating ?? 4.0;
    formPrice.value = shop.pricePerPerson || '';
    formAddress.value = shop.address || '';
    formLat.value = shop.coordinates?.lat || '';
    formLng.value = shop.coordinates?.lng || '';
    // 多图兼容：优先 images 数组，兼容旧单图格式
    if (shop.images && shop.images.length > 0) {
      formImages = shop.images.map(img => ({
        url: img.url || '',
        fit: img.fit || 'cover',
        posX: img.posX ?? 50,
        posY: img.posY ?? 50,
        zoom: img.zoom ?? 1
      }));
    } else if (shop.imageUrl) {
      formImages = [{
        url: shop.imageUrl,
        fit: shop.imageFit || 'cover',
        posX: shop.imagePosX ?? 50,
        posY: shop.imagePosY ?? 50,
        zoom: shop.imageZoom ?? 1
      }];
    } else {
      formImages = [defaultImage()];
    }
    renderImages();
    formDianpingUrl.value = shop.dianpingUrl || '';
    formTags.value = (shop.tags || []).join(', ');
    formNotes.value = shop.notes || '';
    formVisitedDate.value = shop.visitedDate || '';
  } else {
    formTitle.textContent = '新增店铺';
    shopForm.reset();
    formId.value = '';
    formRating.value = '4.0';
    formImages = [defaultImage()];
    renderImages();
    formVisitedDate.value = new Date().toISOString().split('T')[0];
  }
  formModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  formName.focus();
}

function closeForm() {
  formModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

btnNewShop.addEventListener('click', () => openForm(null));
btnCloseForm.addEventListener('click', closeForm);
btnCancelForm.addEventListener('click', closeForm);
formModal.addEventListener('click', (e) => {
  if (e.target === formModal) closeForm();
});

// ---------- 表单提交 ----------
shopForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const c = getConfig();
  if (!c.owner || !c.repo || !c.token) {
    showToast('请先配置 GitHub 连接信息', 'error');
    return;
  }

  const now = new Date().toISOString();
  const isEdit = !!formId.value;
  const shopData = {
    id: formId.value || crypto.randomUUID(),
    name: formName.value.trim(),
    category: formCategory.value,
    rating: parseFloat(formRating.value) || 0,
    pricePerPerson: parseInt(formPrice.value) || 0,
    address: formAddress.value.trim(),
    coordinates: {
      lat: parseFloat(formLat.value) || null,
      lng: parseFloat(formLng.value) || null,
    },
    images: formImages.map((_, i) => readImageFromForm(i)).filter(img => img.url),
    dianpingUrl: formDianpingUrl.value.trim(),
    tags: formTags.value.split(',').map(t => t.trim()).filter(Boolean),
    notes: formNotes.value.trim(),
    visitedDate: formVisitedDate.value || null,
    createdAt: isEdit ? undefined : now,
    updatedAt: now,
  };

  // Edit: merge createdAt from existing
  if (isEdit) {
    const existing = adminShops.find(s => s.id === shopData.id);
    if (existing) shopData.createdAt = existing.createdAt;
    else shopData.createdAt = now;
  }

  btnSubmitForm.disabled = true;
  btnSubmitForm.textContent = '⏳ 正在保存...';

  try {
    // 修改本地数组
    let newShops;
    if (isEdit) {
      const idx = adminShops.findIndex(s => s.id === shopData.id);
      if (idx >= 0) {
        newShops = [...adminShops];
        newShops[idx] = shopData;
      } else {
        newShops = [...adminShops, shopData];
      }
    } else {
      newShops = [...adminShops, shopData];
    }

    // 写入 GitHub
    const commitMsg = isEdit
      ? `✏️ 编辑：${shopData.name}`
      : `➕ 新增：${shopData.name}`;
    await githubPutFile(newShops, commitMsg);

    // 更新本地状态
    adminShops = newShops;
    renderAdminList();
    closeForm();
    showToast(isEdit ? '编辑成功！主页约1分钟后更新' : '新增成功！主页约1分钟后更新', 'success');
  } catch (err) {
    showToast('保存失败：' + err.message, 'error');
    console.error(err);
  } finally {
    btnSubmitForm.disabled = false;
    btnSubmitForm.textContent = '💾 保存到 GitHub';
  }
});

// ---------- 编辑 ----------
function editShop(id) {
  const shop = adminShops.find(s => s.id === id);
  if (shop) openForm(shop);
}

// ---------- 删除 ----------
function confirmDelete(id) {
  const shop = adminShops.find(s => s.id === id);
  if (!shop) return;
  deleteTargetId = id;
  deleteShopName.textContent = `确定要删除「${shop.name}」吗？`;
  deleteModal.classList.remove('hidden');
}

btnCancelDelete.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  deleteTargetId = null;
});

deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteModal.classList.add('hidden');
    deleteTargetId = null;
  }
});

btnConfirmDelete.addEventListener('click', async () => {
  if (!deleteTargetId) return;

  const c = getConfig();
  if (!c.owner || !c.repo || !c.token) {
    showToast('请先配置 GitHub 连接信息', 'error');
    return;
  }

  const shop = adminShops.find(s => s.id === deleteTargetId);
  btnConfirmDelete.disabled = true;
  btnConfirmDelete.textContent = '删除中...';

  try {
    const newShops = adminShops.filter(s => s.id !== deleteTargetId);
    await githubPutFile(newShops, `🗑️ 删除：${shop?.name || deleteTargetId}`);

    adminShops = newShops;
    renderAdminList();
    deleteModal.classList.add('hidden');
    deleteTargetId = null;
    showToast('删除成功！', 'success');
  } catch (err) {
    showToast('删除失败：' + err.message, 'error');
  } finally {
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.textContent = '确认删除';
  }
});

// ---------- 导出 ----------
btnExport.addEventListener('click', () => {
  const data = JSON.stringify({ shops: adminShops }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date().toISOString().split('T')[0];
  a.download = `guangzhou-food-backup-${now}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('导出成功！文件已下载', 'success');
});

// ---------- 导入 ----------
btnImport.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.shops || !Array.isArray(data.shops)) {
      throw new Error('JSON 格式不正确，需要包含 "shops" 数组');
    }

    const c = getConfig();
    if (c.owner && c.repo && c.token) {
      // 如果有 GitHub 配置，直接写入
      if (!confirm(`即将导入 ${data.shops.length} 家店铺到 GitHub，会覆盖现有数据。确认继续？`)) {
        return;
      }
      await githubPutFile(data.shops, `📤 批量导入 ${data.shops.length} 家店铺`);
      adminShops = data.shops;
      renderAdminList();
      showToast(`导入成功！${data.shops.length} 家店铺已写入`, 'success');
    } else {
      // 没有 GitHub 配置，只更新本地
      adminShops = data.shops;
      renderAdminList();
      showToast(`已加载 ${data.shops.length} 家店铺（仅本地，未写入 GitHub）`, 'info');
    }
  } catch (err) {
    showToast('导入失败：' + err.message, 'error');
  } finally {
    importFileInput.value = '';
  }
});

// ---------- 搜索 ----------
adminSearchInput.addEventListener('input', () => {
  renderAdminList();
});

// ---------- Toast ----------
function showToast(msg, type) {
  type = type || 'info';
  // 移除已有 toast
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---------- 键盘快捷键 ----------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!formModal.classList.contains('hidden')) closeForm();
    if (!deleteModal.classList.contains('hidden')) {
      deleteModal.classList.add('hidden');
      deleteTargetId = null;
    }
  }
});

// ---------- 启动 ----------
loadConfigUI();
loadAdminShops();
