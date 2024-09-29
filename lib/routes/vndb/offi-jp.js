// 导入必要的模组
const got = require('@/utils/got'); // 自订的 got
const cheerio = require('cheerio'); // 可以使用类似 jQuery 的 API HTML 解析器
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    // 在此处编写您的逻辑
	const baseUrl = 'https://vndb.org';
	
	// 注意，".data" 属性包含了请求返回的目标页面的完整 HTML 源代码
    const { data: response } = await got(`${baseUrl}/r?q=&o=d&s=released&f=06741032hen2xzh_dHans-2xzh_dHant-N48033gjaNc01058FSdu81X4281X7Q81XfV81XEUNg01bgin2gja`);
    const $ = cheerio.load(response);
	
	
	// 我们使用 Cheerio 选择器选择所有tbody中的tr标签
    const item = $('tbody tr')
        // 使用“toArray()”方法将选择的所有 DOM 元素以数组的形式返回。
        .toArray()
        // 使用“map()”方法遍历数组，并从每个元素中解析需要的数据。
        .map((item) => {
            item = $(item);
            const a = item.find('a').first();
			//获取所有ul li下的a标签，注:外部链接
			const exter = item.find('ul li a');
			//获取.tc6类下的a标签，注:内部链接
			const inter = item.find('.tc6 a');
			//获取.tc4类下第二个标签，注:(patch)(unofficial patch)(drm-free)(drm)
			const tc4Second = item.find('.tc4').children().eq(1);
			
			//获取VNDB Release编号
			let rid = a.attr('href');
			//去除前面多余的/
			if (rid.startsWith('/')) {
				rid = rid.substring(1);
			}
			//给编号赋予a标签
			const ridLink = `<a href="${baseUrl}/${rid}">${rid}</a>`;
			
			// 获取所有类名包含 'icon-plat-' 的元素
			const icons = item.find("[class*='icon-plat-']"); 
			// 初始化 platforms 变量
			let platforms = '';
			// 单独检查 icon-plat- 类的元素并遍历添加到platforms
			if (icons.length > 0) {
				icons.each((index, element) => {
				platforms += `[${$(element).attr('title')}]&nbsp`;
				});
			}
			
			// 单独判断是否有.tc4类下第二个标签
			let small = '';
			if (tc4Second.length > 0) {
				small = tc4Second.text();
			}
			
			
			// 构建 description 字符串
			let descriptionContent = `[公式日本語] (${ridLink}) ${a.attr('title')} ${small} ${platforms}<br><br>`;
			
			if (exter.length > 0) {
				// 如果找到 ul li a 标签，则遍历所有a标签并拼接成字符串
				exter.each((index, element) => {
				descriptionContent += `${$(element)}<br><br>`;
				});
			} else if (inter.length > 0) {
				// 如果没有找到 ul li a 标签，但找到 .tc6 a 标签，添加到 description
				inter.each((index, element) => {
				descriptionContent += `${$(element).attr('href')}<br><br>`;
				});
			} else {
				// 如果都没有找到，则没有链接
				descriptionContent += `undefined`;
				}
				
			
			

            return {
                title: a.attr('title'),
                // `link` 需要一个绝对 URL，但 `a.attr('href')` 返回一个相对 URL。
                link: `${baseUrl}${a.attr('href')}`,
                //pubDate: parseDate(item.find('relative-time').attr('datetime')),
				pubDate: parseDate(item.find('td').first().text()),
                //author: item.find('td').eq(6).find('a').first().attr('href'),
				description: descriptionContent,
                //category: item
                //    .find('a[id^=label]')
                //    .toArray()
                //    .map((item) => $(item).text()),
            };
        });

    ctx.state.data = {
        // 在此处输出您的 RSS
         // 源标题
         title: `公式日本語`,
         // 源链接
         link: `${baseUrl}/r?q=&o=d&s=released&f=06741032hen2xzh_dHans-2xzh_dHant-N48033gjaNc01058FSdu81X4281X7Q81XfV81XEUNg01bgin2gja`,
         // 源文章
         item: item,
    };
};