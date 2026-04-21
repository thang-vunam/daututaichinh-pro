/**
 * GÓI TỐI ƯU HÓA SEO CẤP TỐC: MỤC LỤC & TỐC ĐỘ (Lite Youtube)
 * Code tự động chạy sau khi trang load xong.
 */
document.addEventListener('DOMContentLoaded', function() {
    initTableOfContents();
    optimizeYoutubeEmbeds();
});

function initTableOfContents() {
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
            <button class="toc-toggle" onclick="this.parentElement.parentElement.classList.toggle('collapsed')"><i class="fa-solid fa-chevron-up"></i></button>
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

    // Tìm vị trí chèn: Sau đoạn Sapo (đoạn thẻ p đầu tiên sau thẻ H1)
    const h1 = articleBody.querySelector('h1');
    if (h1 && h1.nextElementSibling) {
        // Nếu thẻ tiếp theo là ảnh tải bìa, thì chèn sau ảnh
        let insertNode = h1.nextElementSibling;
        if (insertNode.tagName.toLowerCase() === 'div' && insertNode.querySelector('img')) {
            insertNode = insertNode.nextElementSibling;
        }
        if (insertNode) {
            articleBody.insertBefore(tocCard, insertNode.nextSibling);
        } else {
            articleBody.insertBefore(tocCard, h1.nextSibling);
        }
    } else {
        articleBody.prepend(tocCard);
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

    // Tiêm CSS động cho Mục Lục
    const style = document.createElement('style');
    style.innerHTML = `
        /* Global fixes cho việc Menu che khuất tiêu đề */
        html { scroll-behavior: smooth; }
        h1, h2, h3, h4, h5, h6 { scroll-margin-top: 110px; }

        .seo-toc-container {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 18px 24px;
            margin: 25px 0;
            backdrop-filter: blur(8px);
            transition: all 0.3s ease;
        }
        .toc-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 12px;
        }
        .toc-title { font-weight: 600; font-size: 1.1rem; color: #f8fafc; }
        .toc-toggle { background: transparent; border: none; color: #cbd5e1; cursor: pointer; padding: 5px; transition: 0.3s; }
        .toc-list { list-style: none; padding: 0 !important; margin: 0 !important; }
        .toc-list li { margin-bottom: 8px; line-height: 1.4; }
        .toc-h2 { margin-top: 12px; font-weight: 600; }
        .toc-h3 { padding-left: 20px; font-size: 0.95em; color: #94a3b8; }
        .toc-list a { text-decoration: none; color: #60a5fa; transition: color 0.2s; display: block; }
        .toc-list a:hover { color: #93c5fd; text-decoration: underline; }
        
        /* Chế độ thu gọn */
        .seo-toc-container.collapsed .toc-list { display: none; }
        .seo-toc-container.collapsed .toc-toggle { transform: rotate(180deg); }
        
        /* Reponsive Mobile (Trên điện thoại màn hình nhỏ thu gọn font, padding lại 1 chút) */
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
