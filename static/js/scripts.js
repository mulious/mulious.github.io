const content_dir = 'contents/';  // 内容目录路径
const config_file = 'config.yml';
const section_names = [
    'home',
    'differential-equations',
    'linear-algebra',
    'stochastic-processes',
    'mathematical-statistics',
    'real-analysis',
    'politics'
]; // 所有章节名称列表

window.addEventListener('DOMContentLoaded', event => {
    // 激活Bootstrap滚动监听
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    }

    // 折叠响应式导航栏
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.forEach(responsiveNavItem => {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // 加载YAML配置
    fetch(content_dir + config_file)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        })
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.innerHTML = yml[key];
                } else {
                    console.warn(`Element with ID '${key}' not found`);
                }
            })
        })
        .catch(error => console.error('YAML加载错误:', error));

    // 配置marked.js
    marked.setOptions({
        mangle: false,
        headerIds: false,
        breaks: true,  // 自动换行
        gfm: true      // GitHub风格的Markdown
    });

    // 加载所有Markdown内容
    const loadPromises = section_names.map(name => {
        return fetch(`${content_dir}${name}.md`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${name}.md: ${response.status}`);
                return response.text();
            })
            .then(markdown => {
                const targetElement = document.getElementById(`${name}-md`);
                if (targetElement) {
                    targetElement.innerHTML = marked.parse(markdown);
                } else {
                    console.warn(`Target element for ${name} not found`);
                }
            })
            .catch(error => {
                console.error(`加载 ${name}.md 失败:`, error);
                const targetElement = document.getElementById(`${name}-md`);
                if (targetElement) {
                    targetElement.innerHTML = `
                        <div class="alert alert-warning">
                            无法加载内容: ${error.message}
                        </div>
                    `;
                }
            });
    });

    // 所有内容加载完成后渲染数学公式
    Promise.all(loadPromises)
        .then(() => {
            if (typeof MathJax !== 'undefined') {
                MathJax.typesetPromise().catch(err => console.error('MathJax渲染错误:', err));
            }
        });
});
