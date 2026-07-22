/* ===== 广州美食地图 - 主页面逻辑 ===== */

// ---------- 全局状态 ----------
let allShops = [];
let filteredShops = [];
let currentCategory = 'all';
let currentSearch = '';

// ---------- DOM 引用 ----------
const cardGrid = document.getElementById('cardGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const shopCount = document.getElementById('shopCount');
const categoryTabs = document.getElementById('categoryTabs');
const detailModal = document.getElementById('detailModal');
const modalImageContainer = document.getElementById('modalImageContainer');
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
    // 渲染后立即启动懒加载
    initLazyLoading();
  }

  shopCount.textContent = `共 ${filteredShops.length} 家`;

  // 缓存到 sessionStorage
  try {
    sessionStorage.setItem('gzfood_shops', JSON.stringify(allShops));
  } catch (e) { /* quota exceeded, ignore */ }
}

// ---------- IntersectionObserver 懒加载 ----------
let lazyObserver = null;
function initLazyLoading() {
  // 断开旧 observer
  if (lazyObserver) lazyObserver.disconnect();

  lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        if (src && !img.src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
        lazyObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '300px 0px', // 提前 300px 开始加载
    threshold: 0.01
  });

  cardGrid.querySelectorAll('.lazy-img').forEach(img => {
    lazyObserver.observe(img);
  });
}

// 卡片缩略图 URL（400px，秒加载）
function getThumbUrl(url) {
  if (!url) return url;
  return url.replace(/\.webp$/, '.thumb.webp');
}

// 向后兼容：将旧单图格式转为 images 数组
function getShopImages(shop) {
  if (shop.images && shop.images.length > 0) return shop.images;
  if (shop.imageUrl) {
    return [{
      url: shop.imageUrl,
      fit: shop.imageFit || 'cover',
      posX: shop.imagePosX ?? 50,
      posY: shop.imagePosY ?? 50,
      zoom: shop.imageZoom ?? 1
    }];
  }
  return [];
}

// 为单张图片生成 className + style
function imageStyle(img) {
  const fit = img.fit || 'cover';
  const posX = img.posX ?? 50;
  const posY = img.posY ?? 50;
  const zoom = img.zoom ?? 1;
  const customized = fit === 'cover' && (zoom !== 1 || posX !== 50 || posY !== 50);
  const cls = customized ? 'object-contain'
    : (fit === 'contain' ? 'object-contain' : fit === 'fill' ? 'object-fill' : 'object-cover');
  const sty = customized
    ? `object-position:${posX}% ${posY}%;transform:scale(${zoom});transform-origin:${posX}% ${posY}%`
    : (fit === 'cover' ? `object-position:${posX}% ${posY}%` : '');
  return { cls, sty };
}

function createCardHTML(shop) {
  const stars = createStarsHTML(shop.rating);
  const tags = (shop.tags || []).slice(0, 3).map(t =>
    `<span class="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">${escapeHTML(t)}</span>`
  ).join('');

  const images = getShopImages(shop);

  let imageHTML;
  if (images.length === 0) {
    imageHTML = `<div class="w-full card-image flex items-center justify-center text-5xl">🍜</div>`;
  } else if (images.length === 1) {
    const s = imageStyle(images[0]);
    imageHTML = `<div class="relative w-full card-image overflow-hidden">
      <img data-src="${escapeHTML(getThumbUrl(images[0].url))}" alt="${escapeHTML(shop.name)}" class="lazy-img w-full h-full ${s.cls} absolute inset-0 opacity-0 transition-opacity duration-500" style="${s.sty}" onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')" onload="this.classList.remove('opacity-0')">
      <div class="hidden w-full h-full card-image flex items-center justify-center text-5xl absolute inset-0">🍜</div>
    </div>`;
  } else {
    // 多图轮播：第一张用 data-src 参与懒加载，其余用 data-lazy-src 切换时才加载
    const slides = images.map((img, i) => {
      const s = imageStyle(img);
      const attr = i === 0
        ? `data-src="${escapeHTML(getThumbUrl(img.url))}" class="lazy-img w-full h-full ${s.cls} opacity-0 transition-opacity duration-500"`
        : `data-lazy-src="${escapeHTML(getThumbUrl(img.url))}" class="w-full h-full ${s.cls} opacity-0 transition-opacity duration-500"`;
      return `<div class="carousel-slide w-full h-full flex-shrink-0 relative">
        <img ${attr} alt="${escapeHTML(shop.name)} ${i+1}" style="${s.sty}" onerror="this.parentElement.classList.add('hidden')" onload="this.classList.remove('opacity-0')">
      </div>`;
    }).join('');

    const dots = images.map((_, i) =>
      `<span class="carousel-dot inline-block w-2 h-2 rounded-full bg-white/70 mx-0.5 cursor-pointer transition ${i === 0 ? '!bg-white w-3' : ''}" data-index="${i}"></span>`
    ).join('');

    imageHTML = `<div class="card-carousel relative w-full card-image overflow-hidden" data-current="0" data-shop-id="${shop.id}">
      <div class="carousel-track flex w-full h-full transition-transform duration-300 ease-out">
        ${slides}
      </div>
      <div class="carousel-dots absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center z-10">${dots}</div>
      <button class="carousel-btn carousel-prev absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center text-sm shadow transition z-10" data-dir="-1">‹</button>
      <button class="carousel-btn carousel-next absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center text-sm shadow transition z-10" data-dir="1">›</button>
      <div class="absolute inset-0 cursor-pointer" data-action="detail"></div>
    </div>`;
  }

  return `
    <div class="shop-card bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
      ${imageHTML}
      <div class="p-4 cursor-pointer" onclick="openDetail('${shop.id}')">
        <div class="flex items-start justify-between mb-1">
          <h3 class="font-bold text-gray-900 text-base truncate pr-2">${escapeHTML(shop.name)}</h3>
        </div>
        <div class="flex items-center gap-2 mb-2 text-sm">
          <span class="star-rating text-sm">${stars}</span>
          <span class="text-gray-400 text-xs">${shop.rating || '-'}</span>
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

// ---------- 轮播交互（事件委托） ----------
function moveCarousel(carousel, newIndex, count) {
  if (newIndex < 0) newIndex = count - 1;
  if (newIndex >= count) newIndex = 0;
  carousel.dataset.current = newIndex;
  const track = carousel.querySelector('.carousel-track');
  track.style.transform = `translateX(-${newIndex * 100}%)`;
  // 按需加载当前及相邻 slide 的图片（如果还没加载过）
  const slides = carousel.querySelectorAll('.carousel-slide');
  [newIndex, (newIndex + 1) % count, (newIndex - 1 + count) % count].forEach(idx => {
    const slide = slides[idx];
    if (!slide) return;
    const img = slide.querySelector('img');
    if (img && img.dataset.lazySrc && !img.src) {
      img.src = img.dataset.lazySrc;
      img.removeAttribute('data-lazy-src');
    }
  });
  // 更新圆点
  const dots = carousel.querySelectorAll('.carousel-dot');
  dots.forEach((d, i) => {
    d.classList.toggle('!bg-white', i === newIndex);
    d.classList.toggle('w-3', i === newIndex);
    d.classList.toggle('bg-white/70', i !== newIndex);
  });
}

cardGrid.addEventListener('click', (e) => {
  // Detail 点击（图片区域非按钮位置）
  const detailArea = e.target.closest('[data-action="detail"]');
  if (detailArea) {
    const carousel = detailArea.closest('.card-carousel');
    if (carousel) {
      openDetail(carousel.dataset.shopId);
    }
    return;
  }
  // 轮播按钮
  const btn = e.target.closest('.carousel-btn');
  if (btn) {
    e.stopPropagation();
    const carousel = btn.closest('.card-carousel');
    const dir = parseInt(btn.dataset.dir);
    const current = parseInt(carousel.dataset.current) || 0;
    const count = carousel.querySelectorAll('.carousel-slide').length;
    moveCarousel(carousel, current + dir, count);
    return;
  }
  // 圆点
  const dot = e.target.closest('.carousel-dot');
  if (dot) {
    e.stopPropagation();
    const carousel = dot.closest('.card-carousel');
    const index = parseInt(dot.dataset.index);
    const count = carousel.querySelectorAll('.carousel-slide').length;
    moveCarousel(carousel, index, count);
    return;
  }
});

// 触摸滑动
let touchStartX = 0;
cardGrid.addEventListener('touchstart', (e) => {
  const carousel = e.target.closest('.card-carousel');
  if (carousel) touchStartX = e.touches[0].clientX;
}, { passive: true });

cardGrid.addEventListener('touchend', (e) => {
  const carousel = e.target.closest('.card-carousel');
  if (!carousel) return;
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) < 30) return;
  const current = parseInt(carousel.dataset.current) || 0;
  const count = carousel.querySelectorAll('.carousel-slide').length;
  moveCarousel(carousel, current + (diff > 0 ? 1 : -1), count);
});

// 弹窗轮播
detailModal.addEventListener('click', (e) => {
  const btn = e.target.closest('.carousel-btn');
  if (btn) {
    e.stopPropagation();
    const carousel = btn.closest('.modal-carousel');
    if (!carousel) return;
    const dir = parseInt(btn.dataset.dir);
    const current = parseInt(carousel.dataset.current) || 0;
    const count = carousel.querySelectorAll('.carousel-slide').length;
    moveCarousel(carousel, current + dir, count);
    return;
  }
  const dot = e.target.closest('.carousel-dot');
  if (dot) {
    e.stopPropagation();
    const carousel = dot.closest('.modal-carousel');
    if (!carousel) return;
    const index = parseInt(dot.dataset.index);
    const count = carousel.querySelectorAll('.carousel-slide').length;
    moveCarousel(carousel, index, count);
    return;
  }
});

let modalTouchStartX = 0;
detailModal.addEventListener('touchstart', (e) => {
  const carousel = e.target.closest('.modal-carousel');
  if (carousel) modalTouchStartX = e.touches[0].clientX;
}, { passive: true });

detailModal.addEventListener('touchend', (e) => {
  const carousel = e.target.closest('.modal-carousel');
  if (!carousel) return;
  const diff = modalTouchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) < 30) return;
  const current = parseInt(carousel.dataset.current) || 0;
  const count = carousel.querySelectorAll('.carousel-slide').length;
  moveCarousel(carousel, current + (diff > 0 ? 1 : -1), count);
});

// 生成星级 HTML（支持半星）
function createStarsHTML(rating) {
  const r = rating || 0;
  const fullStars = Math.floor(r);
  const fraction = r - fullStars;
  const hasHalf = fraction >= 0.25 && fraction < 0.75;
  const roundUp = fraction >= 0.75;

  let html = '';
  for (let i = 0; i < fullStars; i++) {
    html += '<span class="star-full">★</span>';
  }
  if (hasHalf) {
    html += '<span class="star-half">★</span>';
  }
  if (roundUp) {
    html += '<span class="star-full">★</span>';
  }
  return html;
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

  const images = getShopImages(shop);
  const modalImgContainer = document.getElementById('modalImageContainer');
  const modalImage = document.getElementById('modalImage');
  const modalImgOverlay = modalImage.nextElementSibling;

  if (images.length <= 1) {
    // 单图或无图
    modalImgContainer.innerHTML = `
      <img id="modalImage" src="${images[0]?.url || ''}" alt="" class="w-full h-56 object-cover rounded-t-2xl">
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-t-2xl"></div>
      <span id="modalCategory" class="absolute bottom-3 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700"></span>`;
    // Re-bind modalImage reference after replacing HTML
    const newModalImage = document.getElementById('modalImage');
    newModalImage.onerror = function() {
      this.style.display = 'none';
      if (this.nextElementSibling) this.nextElementSibling.style.display = 'none';
    };
  } else {
    // 多图轮播
    const slides = images.map((img, i) => {
      const s = imageStyle(img);
      return `<div class="carousel-slide w-full flex-shrink-0 relative">
        <img src="${escapeHTML(img.url)}" alt="" class="w-full h-56 ${s.cls}" style="${s.sty}" onerror="this.parentElement.classList.add('hidden')">
      </div>`;
    }).join('');
    const dots = images.map((_, i) =>
      `<span class="carousel-dot inline-block w-2 h-2 rounded-full bg-white/70 mx-0.5 cursor-pointer transition ${i === 0 ? '!bg-white w-3' : ''}" data-index="${i}"></span>`
    ).join('');
    modalImgContainer.innerHTML = `
      <div class="modal-carousel relative w-full h-56 overflow-hidden rounded-t-2xl" data-current="0">
        <div class="carousel-track flex w-full h-full transition-transform duration-300 ease-out">${slides}</div>
        <div class="carousel-dots absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center z-10">${dots}</div>
        <button class="carousel-btn carousel-prev absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center text-sm shadow transition z-10" data-dir="-1">‹</button>
        <button class="carousel-btn carousel-next absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center text-sm shadow transition z-10" data-dir="1">›</button>
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        <span id="modalCategory" class="absolute bottom-12 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 z-10"></span>
      </div>`;
  }
  document.getElementById('modalCategory').textContent = shop.category;
  document.getElementById('modalName').textContent = shop.name;
  document.getElementById('modalRating').innerHTML = createStarsHTML(shop.rating) + ` ${shop.rating}`;
  const notesText = shop.notes || '暂无备注';
  document.getElementById('modalNotes').innerHTML = escapeHTML(notesText).replace(/\n/g, '<br>');
  document.getElementById('modalAddress').textContent = shop.address;
  const visitedRow = document.getElementById('modalVisitedRow');
  if (shop.visitedDate) {
    document.getElementById('modalVisitedDate').textContent = `探店日期：${shop.visitedDate}`;
    visitedRow.classList.remove('hidden');
  } else {
    visitedRow.classList.add('hidden');
  }

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
    // 没有坐标时优先用店名搜索（比地址更精准）
    const keyword = encodeURIComponent(shop.name);
    document.getElementById('modalMapLink').href = `https://uri.amap.com/search?keyword=${keyword}&callnative=1`;
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

  // 如果点击已选中的分类，切换回「全部」
  const isActive = btn.classList.contains('active');
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));

  if (isActive && btn.dataset.category !== 'all') {
    // 回到全部
    const allBtn = document.querySelector('[data-category="all"]');
    if (allBtn) allBtn.classList.add('active');
    currentCategory = 'all';
  } else {
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
  }

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
