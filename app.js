/* ===== 广州美食地图 - 主页面逻辑 ===== */

// ---------- 全局状态 ----------
let allShops = [];
let filteredShops = [];
let currentCategory = 'all';
let currentSort = 'rating-desc';
let currentSearch = '';

// ---------- DOM 引用 ----------
const cardGrid = document.getElementById('cardGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const shopCount = document.getElementById('shopCount');
const categoryTabs = document.getElementById('categoryTabs');
const detailModal = document.getElementById('detailModal');
const closeModal = document.getElementById('closeModal');

// ---------- 数据加载 ----------
// 先尝试从 sessionStorage 缓存加载，再请求远程

async function loadData() {
  try {
    // 部分云服务商可能会对 raw.githubusercontent.com 有访问问题
    // 如果你使用 GitHub Pages 部署，data.json 在同目录下直接 fetch 即可
    // 添加时间戳防止浏览器缓存旧数据
    const response = await fetch('data.json?v=' + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allShops = data.shops || [];
    applyAllFilters();
  } catch (err) {
    console.error('加载数据失败:', err);
    // 尝试从 sessionStorage 加载缓存
    const cached = sessionStorage.getItem('gzfood_shops');
    if (cached) {
      allShops = JSON.parse(cached);
      applyAllFilters();
      showToast('已加载缓存数据', 'info');
    } else {
      cardGrid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400">
        <p class="text-4xl mb-3">😅</p>
        <p class="text-lg">数据加载失败</p>
        <p class="text-sm mt-1">请确认 data.json 文件存在，或去管理后台导入数据</p>
      </div>`;
    }
  }
}

// ---------- 筛选 ----------
function filterShops() {
  let result = [...allShops];

  // 分类筛选
  if (currentCategory !== 'all') {
    result = result.filter(s => s.category === currentCategory);
  }

  // 搜索筛选
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    result = result.filter(s => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (s.notes || '').toLowerCase().includes(q)
      );
    });
  }

  // 排序
  result.sort((a, b) => {
    switch (currentSort) {
      case 'rating-desc':
        return (b.rating || 0) - (a.rating || 0);
      case 'price-asc':
        return (a.pricePerPerson || 0) - (b.pricePerPerson || 0);
      case 'price-desc':
        return (b.pricePerPerson || 0) - (a.pricePerPerson || 0);
      case 'date-desc':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'visited-desc':
        return new Date(b.visitedDate || 0).getTime() - new Date(a.visitedDate || 0).getTime();
      default:
        return 0;
    }
  });

  filteredShops = result;
}

// ---------- 渲染 ----------
function render() {
  filterShops();

  if (filteredShops.length === 0) {
    cardGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    cardGrid.innerHTML = filteredShops.map(shop => createCardHTML(shop)).join('');
  }

  shopCount.textContent = `共 ${filteredShops.length} 家`;

  // 缓存到 sessionStorage
  try {
    sessionStorage.setItem('gzfood_shops', JSON.stringify(allShops));
  } catch (e) { /* quota exceeded, ignore */ }
}

function createCardHTML(shop) {
  const stars = '⭐'.repeat(Math.floor(shop.rating || 0));
  const tags = (shop.tags || []).slice(0, 3).map(t =>
    `<span class="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">${escapeHTML(t)}</span>`
  ).join('');

  const imageUrl = shop.imageUrl || '';
  const imageHTML = imageUrl
    ? `<div class="relative w-full h-44 overflow-hidden">
         <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(shop.name)}" class="w-full h-44 object-cover card-image absolute inset-0" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')">
         <div class="hidden w-full h-44 card-image flex items-center justify-center text-5xl absolute inset-0">🍜</div>
       </div>`
    : `<div class="w-full h-44 card-image flex items-center justify-center text-5xl">🍜</div>`;

  return `
    <div class="shop-card bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
         onclick="openDetail('${shop.id}')">
      ${imageHTML}
      <div class="p-4">
        <div class="flex items-start justify-between mb-1">
          <h3 class="font-bold text-gray-900 text-base truncate pr-2">${escapeHTML(shop.name)}</h3>
        </div>
        <div class="flex items-center gap-2 mb-2 text-sm">
          <span class="star-rating text-sm">${stars}</span>
          <span class="text-gray-400 text-xs">${shop.rating || '-'}</span>
          <span class="text-gray-300">·</span>
          <span class="text-gray-600 text-xs">💰${shop.pricePerPerson || '-'}/人</span>
          <span class="text-gray-300">·</span>
          <span class="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">${escapeHTML(shop.category)}</span>
        </div>
        <div class="flex flex-wrap gap-1 mb-2">${tags || '<span class="text-gray-300 text-xs">暂无标签</span>'}</div>
        <p class="text-gray-400 text-xs flex items-center gap-1 truncate">
          <span>📍</span> ${escapeHTML(shop.address)}
        </p>
      </div>
    </div>`;
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 详情弹窗 ----------
function openDetail(id) {
  const shop = allShops.find(s => s.id === id);
  if (!shop) return;

  document.getElementById('modalImage').src = shop.imageUrl || '';
  document.getElementById('modalImage').onerror = function() {
    this.style.display = 'none';
    this.nextElementSibling.style.display = 'none';
  };
  document.getElementById('modalImage').style.display = '';
  if (document.getElementById('modalImage').nextElementSibling) {
    document.getElementById('modalImage').nextElementSibling.style.display = '';
  }
  document.getElementById('modalCategory').textContent = shop.category;
  document.getElementById('modalName').textContent = shop.name;
  document.getElementById('modalRating').innerHTML = '⭐'.repeat(Math.floor(shop.rating || 0)) + ` ${shop.rating}`;
  document.getElementById('modalPrice').textContent = `💰 人均 ¥${shop.pricePerPerson || '-'}`;
  document.getElementById('modalNotes').textContent = shop.notes || '暂无备注';
  document.getElementById('modalAddress').textContent = shop.address;
  document.getElementById('modalVisitedDate').textContent = shop.visitedDate
    ? `探店日期：${shop.visitedDate}`
    : '探店日期：未记录';

  // Tags
  const tagsContainer = document.getElementById('modalTags');
  tagsContainer.innerHTML = (shop.tags || []).map(t =>
    `<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">${escapeHTML(t)}</span>`
  ).join('');

  // 地图链接 - 高德地图
  if (shop.coordinates && shop.coordinates.lat && shop.coordinates.lng) {
    const { lng, lat } = shop.coordinates;
    const name = encodeURIComponent(shop.name);
    // 高德地图 marker URI（手机和桌面通用）
    const gaodeURL = `https://uri.amap.com/marker?position=${lng},${lat}&name=${name}&callnative=1`;
    document.getElementById('modalMapLink').href = gaodeURL;
    document.getElementById('modalMapLink').classList.remove('hidden');
  } else {
    // 没有坐标时用地址搜索
    const addr = encodeURIComponent(shop.address);
    document.getElementById('modalMapLink').href = `https://uri.amap.com/search?keyword=${addr}&callnative=1`;
  }

  // 大众点评链接
  const dianpingBtn = document.getElementById('modalDianpingLink');
  if (shop.dianpingUrl) {
    dianpingBtn.href = shop.dianpingUrl;
    dianpingBtn.classList.remove('hidden');
  } else {
    dianpingBtn.classList.add('hidden');
  }

  detailModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeDetail() {
  detailModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

closeModal.addEventListener('click', closeDetail);
detailModal.addEventListener('click', function(e) {
  if (e.target === detailModal) closeDetail();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && !detailModal.classList.contains('hidden')) {
    closeDetail();
  }
});

// ---------- 分类筛选 ----------
categoryTabs.addEventListener('click', function(e) {
  const btn = e.target.closest('.category-btn');
  if (!btn) return;

  // 更新 active 状态
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  currentCategory = btn.dataset.category;
  applyAllFilters();
});

// ---------- 搜索（防抖） ----------
let searchTimer;
searchInput.addEventListener('input', function() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = searchInput.value;
    applyAllFilters();
  }, 300);
});

// ---------- 排序 ----------
sortSelect.addEventListener('change', function() {
  currentSort = sortSelect.value;
  applyAllFilters();
});

// ---------- 统一应用筛选 ----------
function applyAllFilters() {
  render();
}

// ---------- Toast 提示 ----------
function showToast(msg, type) {
  type = type || 'info';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ---------- 管理入口可见性 ----------
// 只有配置过 GitHub Token 的浏览器（你）才显示管理按钮
if (localStorage.getItem('gzfood_token')) {
  const adminLink = document.getElementById('adminLink');
  if (adminLink) adminLink.classList.remove('hidden');
}

// ---------- 启动 ----------
loadData();
