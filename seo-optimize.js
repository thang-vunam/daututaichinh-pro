/**
 * GÓI TỐI ƯU HÓA SEO CẤP TỐC: MỤC LỤC & TỐC ĐỘ (Lite Youtube)
 * Code tự động chạy sau khi trang load xong.
 */
function initAllSeo() {
    initFavicon();
    initTableOfContents();
    optimizeYoutubeEmbeds();
    initSocialShareButtons();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSeo);
} else {
    initAllSeo();
}

function bindTocInteractions(tocCard) {
    if (!tocCard || tocCard.dataset.tocBound) return;
    tocCard.dataset.tocBound = 'true';

    // Đảm bảo nút đóng/mở hoạt động
    const toggleBtn = tocCard.querySelector('.toc-toggle');
    if (toggleBtn) {
        toggleBtn.onclick = function() {
            tocCard.classList.toggle('collapsed');
        };
    }

    // Gắn click handler cho từng link TOC để cuộn trang chính xác (tránh bị thanh menu che)
    tocCard.querySelectorAll('.toc-list a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const headerOffset = 100; // Chiều cao thanh menu cố định + padding an toàn
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initTableOfContents() {
    // Nếu trang đã có Mục lục HTML dựng sẵn -> Chỉ gắn sự kiện tương tác
    const existingToc = document.querySelector('.seo-toc-container');
    if (existingToc) {
        bindTocInteractions(existingToc);
        return;
    }

    // Chỉ lấy H2, H3 trong phần bài viết chính để tránh lấy nhầm Header/Footer
    const articleBody = document.querySelector('.blog-article') || document.querySelector('article') || document.body;
    const headings = articleBody.querySelectorAll('h2, h3');
    
    // Nếu bài viết có ít hơn 2 tiêu đề, không đáng để vẽ Mục lục
    if (headings.length < 2) return;

    const tocCard = document.createElement('div');
    tocCard.className = 'seo-toc-container';
    
    let tocHTML = `
        <div class="toc-header">
            <span class="toc-title"><i class="fa-solid fa-list-ul"></i> Nội dung chính</span>
            <button class="toc-toggle"><i class="fa-solid fa-chevron-up"></i></button>
        </div>
        <ul class="toc-list">
    `;

    headings.forEach((heading, index) => {
        // Tạo ID mỏ neo nếu thẻ chưa có ID
        if (!heading.id) {
            heading.id = 'heading-' + index;
        }
        
        const text = heading.innerText;
        const level = heading.tagName.toLowerCase() === 'h2' ? 'toc-h2' : 'toc-h3';
        const anchor = '#' + heading.id;
        
        tocHTML += `<li class="${level}"><a href="${anchor}">${text}</a></li>`;
    });

    tocHTML += `</ul>`;
    tocCard.innerHTML = tocHTML;

    // Tìm vị trí chèn: Sau thẻ figure ảnh bìa hoặc sau H1
    const figure = articleBody.querySelector('figure.article-cover-figure') || articleBody.querySelector('figure');
    if (figure && figure.nextSibling) {
        articleBody.insertBefore(tocCard, figure.nextSibling);
    } else {
        const h1 = articleBody.querySelector('h1');
        if (h1 && h1.nextElementSibling) {
            articleBody.insertBefore(tocCard, h1.nextElementSibling.nextSibling || h1.nextElementSibling);
        } else {
            articleBody.prepend(tocCard);
        }
    }

    bindTocInteractions(tocCard);

    // Tiêm CSS động cho Mục Lục
    const style = document.createElement('style');
    style.innerHTML = `
        /* Global fixes cho việc Menu che khuất tiêu đề */
        html { scroll-behavior: smooth; }
        h1, h2, h3, h4, h5, h6 { scroll-margin-top: 110px; }

        .seo-toc-container {
            background: rgba(155, 89, 240, 0.05);
            border: 1px solid rgba(155, 89, 240, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            backdrop-filter: blur(8px);
            transition: all 0.3s ease;
        }
        .toc-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 15px;
        }
        .toc-title { font-weight: 600; font-size: 1.1rem; color: #fff; }
        .toc-toggle { background: transparent; border: none; color: #cbd5e1; cursor: pointer; padding: 5px; transition: 0.3s; }
        .toc-list { list-style: none; padding: 0 !important; margin: 0 !important; }
        .toc-list li { margin-bottom: 10px; line-height: 1.4; }
        .toc-h2 { font-weight: 500; }
        .toc-h3 { padding-left: 20px; font-size: 0.95em; }
        .toc-list a { text-decoration: none; color: #cbd5e1; transition: color 0.2s; display: block; }
        .toc-list a:hover { color: #00e5ff; }
        
        /* Chế độ thu gọn */
        .seo-toc-container.collapsed .toc-list { display: none; }
        .seo-toc-container.collapsed .toc-toggle { transform: rotate(180deg); color: #00e5ff; }
        
        /* Reponsive Mobile */
        @media screen and (max-width: 768px) {
            .seo-toc-container { padding: 15px; margin: 20px 0; }
            .toc-title { font-size: 1rem; }
            .toc-h3 { padding-left: 15px; font-size: 0.9em; }
        }
    `;
    document.head.appendChild(style);
}

function optimizeYoutubeEmbeds() {
    // Lấy cả iframe dùng src và data-src (lazy load)
    const iframes = document.querySelectorAll('iframe[src*="youtube.com/embed"], iframe[data-src*="youtube.com/embed"]');
    
    iframes.forEach(iframe => {
        const src = iframe.src || iframe.getAttribute('data-src');
        // Trích xuất ID youtube ẩn sau embed/ (Bỏ qua query params nếu có)
        const match = src.match(/embed\/([^?]+)/);
        if(!match) return;
        
        const videoId = match[1];
        const wrapperEl = document.createElement('div');
        wrapperEl.className = 'lite-youtu-facade';
        // Hiển thị ảnh bìa chất lượng hqdefault
        wrapperEl.style.backgroundImage = `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)`;
        
        // Nút Play Youtube giả lập
        wrapperEl.innerHTML = `<div class="lite-play-btn"></div>`;
        
        // Khi người dùng bấm vào -> Mới sinh Iframe thật (Giúp Core Web Vitals Xanh Mượt do tải JS Youtube chậm lại)
        wrapperEl.addEventListener('click', function() {
            // Re-create the iframe with autoplay
            const activeIframe = document.createElement('iframe');
            activeIframe.setAttribute('frameborder', '0');
            activeIframe.setAttribute('allowfullscreen', '1');
            activeIframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
            activeIframe.style.width = '100%';
            activeIframe.style.height = '100%';
            // Chèn autoplay params
            const newSrc = src.includes('?') ? src + '&autoplay=1' : src + '?autoplay=1';
            activeIframe.setAttribute('src', newSrc);
            
            this.innerHTML = '';
            this.appendChild(activeIframe);
        });

        // Hủy bỏ class .video-wrapper cũ vì nó gây ra lỗi double-padding khoảng trắng
        if (iframe.parentNode.classList.contains('video-wrapper')) {
            iframe.parentNode.parentNode.replaceChild(wrapperEl, iframe.parentNode);
        } else {
            // Thay thế iframe thông thường
            iframe.parentNode.replaceChild(wrapperEl, iframe);
        }
    });

    // Cấy CSS của facade
    if(iframes.length > 0 && !document.getElementById('lite-yt-css')) {
        const css = document.createElement('style');
        css.id = 'lite-yt-css';
        css.innerHTML = `
            .lite-youtu-facade {
                background-color: #000;
                position: relative;
                display: block;
                background-position: center;
                background-size: cover;
                cursor: pointer;
                border-radius: 12px;
                overflow: hidden;
                width: 100%;
                /* Tỉ lệ chuẩn 16:9 */
                aspect-ratio: 16 / 9;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                margin: 20px 0;
            }
            .lite-play-btn {
                width: 68px; height: 48px; position: absolute;
                background-color: rgba(33, 33, 33, 0.8);
                border-radius: 15%; border: none;
                top: 50%; left: 50%; transform: translate(-50%, -50%);
                transition: background-color 0.2s cubic-bezier(0.0,0.0,0.2,1);
            }
            .lite-youtu-facade:hover .lite-play-btn {
                background-color: #f00; /* Màu đỏ cờ Youtube khi hover */
            }
            .lite-play-btn:before {
                content: ""; border-style: solid; border-width: 11px 0 11px 21px;
                border-color: transparent transparent transparent #fff;
                position: absolute; top: 13px; left: 26px;
            }
        `;
        document.head.appendChild(css);
    }
}

// ========== LOAD RELATED ARTICLES IN SIDEBAR ==========
document.addEventListener('DOMContentLoaded', () => {
    const relatedListContainer = document.getElementById('related-articles-list');
    if (!relatedListContainer) return;

    // Determine current path and category
    // Location can be like '/market/nhan-dinh-thi-truong.html' or '/blog/bai-viet.html'
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(p => p);
    
    let currentCategory = '';
    if (pathParts.length >= 2) {
        currentCategory = pathParts[pathParts.length - 2];
    } else if (pathParts.length === 1 && !currentPath.endsWith('.html')) {
        currentCategory = pathParts[0];
    }

    if (!currentCategory) {
        relatedListContainer.innerHTML = '<div class="sidebar-empty">Không có bài viết liên quan</div>';
        return;
    }

    // Load _catalog.json from the current category directory
    // Support both absolute path and local preview (file:// or relative fallback)
    const catalogUrl = window.location.protocol === 'file:' 
        ? '_catalog.json' 
        : `/${currentCategory}/_catalog.json`;

    fetch(catalogUrl)
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải danh sách bài viết');
            return response.json();
        })
        .then(articles => {
            // Normalize URL comparison to avoid slashes mismatch
            const cleanUrl = url => url.toLowerCase().replace(/^\/+/g, '').replace(/\.html$/, '').trim();
            const currentCleanedUrl = cleanUrl(currentPath);

            // Filter out current article
            let related = articles.filter(art => {
                const artSlug = art.slug;
                const artCleanedUrl = cleanUrl(currentCategory + '/' + artSlug);
                return artCleanedUrl !== currentCleanedUrl;
            });

            // Limit to max 4 articles
            related = related.slice(0, 4);

            if (related.length === 0) {
                relatedListContainer.innerHTML = '<div class="sidebar-empty">Không có bài viết liên quan</div>';
                return;
            }

            relatedListContainer.innerHTML = related.map(art => {
                let linkUrl = window.location.protocol === 'file:' 
                    ? `${art.slug}.html` 
                    : `/${currentCategory}/${art.slug}.html`;

                const formattedDate = art.date || '';

                return `
                    <a href="${linkUrl}" class="sidebar-item-card">
                        <h4>${art.title}</h4>
                        <div class="sidebar-item-meta">
                            <span>📅 ${formattedDate}</span>
                        </div>
                    </a>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Lỗi tải bài viết liên quan:', error);
            relatedListContainer.innerHTML = '<div class="sidebar-empty">Không thể tải bài viết liên quan</div>';
        });
});

// ========== TỰ ĐỘNG CHÈN CỤM NÚT CHIA SẺ MẠNG XÃ HỘI ==========
function initSocialShareButtons() {
    // Chỉ chạy trên các trang có nội dung bài viết
    const article = document.querySelector('.blog-article') || document.querySelector('article.article-main');
    if (!article) return;
    if (document.querySelector('.social-share-container')) return; // Tránh trùng lặp

    const currentUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'Đầu tư & Tài chính chuyên sâu');

    const shareContainer = document.createElement('div');
    shareContainer.className = 'social-share-container';
    shareContainer.innerHTML = `
        <div class="social-share-title">
            <span>📢 Chia sẻ bài viết hữu ích này:</span>
        </div>
        <div class="social-share-buttons">
            <a href="https://zalo.me/share?url=${currentUrl}" target="_blank" rel="noopener noreferrer" class="btn-share btn-share-zalo" title="Chia sẻ bài viết qua Zalo">
                <span class="share-icon">💬</span> Chia sẻ Zalo
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${currentUrl}" target="_blank" rel="noopener noreferrer" class="btn-share btn-share-fb" title="Chia sẻ lên Facebook">
                <span class="share-icon">🌐</span> Facebook
            </a>
            <button type="button" class="btn-share btn-share-copy" onclick="copyArticleLink(this)" title="Sao chép liên kết bài viết">
                <span class="share-icon">🔗</span> <span class="btn-copy-text">Sao chép Link</span>
            </button>
        </div>
    `;

    // Tìm vị trí chèn tối ưu: Trước hộp CTA nhận tài liệu hoặc trước thẻ Footer bài viết
    const ctaBox = article.querySelector('#cta-open-popup-blog') ? article.querySelector('#cta-open-popup-blog').closest('div') : null;
    if (ctaBox) {
        article.insertBefore(shareContainer, ctaBox);
    } else {
        article.appendChild(shareContainer);
    }
}

window.copyArticleLink = function(btn) {
    const url = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => showCopiedStatus(btn)).catch(() => fallbackCopy(url, btn));
    } else {
        fallbackCopy(url, btn);
    }
};

function fallbackCopy(text, btn) {
    try {
        const temp = document.createElement('input');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showCopiedStatus(btn);
    } catch(e) {
        alert('Đã sao chép link: ' + text);
    }
}

function showCopiedStatus(btn) {
    const textSpan = btn.querySelector('.btn-copy-text');
    if (!textSpan) return;
    const oldText = textSpan.innerText;
    textSpan.innerText = '✅ Đã sao chép!';
    btn.classList.add('copied');
    setTimeout(() => {
        textSpan.innerText = oldText;
        btn.classList.remove('copied');
    }, 2500);
}

function initFavicon() {
    if (!document.querySelector("link[rel*='icon']")) {
        const link32 = document.createElement('link');
        link32.rel = 'icon';
        link32.type = 'image/png';
        link32.sizes = '32x32';
        link32.href = '/favicon-32x32.png';
        document.head.appendChild(link32);

        const apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        apple.sizes = '180x180';
        apple.href = '/favicon.png';
        document.head.appendChild(apple);
    }
}



