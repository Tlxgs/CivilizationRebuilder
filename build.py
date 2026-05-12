import re
import os

# 读取 index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ========== 1. 处理 CSS ==========
# 找到所有 <link rel="stylesheet" href="..."> 
css_links = re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', html)
combined_css = ''
for css_file in css_links:
    if os.path.exists(css_file):
        with open(css_file, 'r', encoding='utf-8') as f:
            combined_css += f.read() + '\n'
        # 删除这个 link 标签
        html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="' + re.escape(css_file) + r'"[^>]*>', '', html)
    else:
        print(f'警告: 找不到文件 {css_file}')

# 在 <head> 末尾插入合并后的 CSS
if combined_css:
    html = html.replace('</head>', f'<style>\n{combined_css}\n</style>\n</head>')

# ========== 2. 处理 JS ==========
# 找到所有 <script src="..."></script>
script_tags = re.findall(r'<script[^>]*src="([^"]+)"[^>]*></script>', html)
combined_js = ''
for js_file in script_tags:
    if os.path.exists(js_file):
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()
            # 为每个文件添加来源注释
            combined_js += f'\n// ====== {js_file} ======\n'
            combined_js += content + '\n'
        # 删除这个 script 标签
        html = re.sub(r'<script[^>]*src="' + re.escape(js_file) + r'"[^>]*></script>', '', html)
    else:
        print(f'警告: 找不到文件 {js_file}')

# 在 </body> 前插入合并后的 JS
if combined_js:
    html = html.replace('</body>', f'<script>\n{combined_js}\n</script>\n</body>')

# ========== 3. 输出 ==========
os.makedirs('dist', exist_ok=True)
with open('dist/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ 完成！合并后的文件在: dist/index.html')