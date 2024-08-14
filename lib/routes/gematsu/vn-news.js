// 导入必要的模组
const got = require('@/utils/got'); // 自订的 got
const cheerio = require('cheerio'); // 可以使用类似 jQuery 的 API HTML 解析器
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    // 在此处编写您的逻辑
	const baseUrl = 'https://www.gematsu.com';
	
	
	// 注意，".data" 属性包含了请求返回的目标页面的完整 HTML 源代码
    const { data: response } = await got(`${baseUrl}/tag/visual-novel`);
    const $ = cheerio.load(response);
	
	
	// 我们使用 Cheerio 选择器选择所有tbody中的tr标签
    const list = $('div.gematsu-listing--visual-novel article.gematsu-post')
        // 使用“toArray()”方法将选择的所有 DOM 元素以数组的形式返回。
        .toArray()
        // 使用“map()”方法遍历数组，并从每个元素中解析需要的数据。
        .map((item) => {
            item = $(item);
            const a = item.find('h2 a').first();

            return {
                title: a.text(),
                // `link` 需要一个绝对 URL，但 `a.attr('href')` 返回一个相对 URL。
                link: `${a.attr('href')}`,
                //pubDate: parseDate(item.find('relative-time').attr('datetime')),
				pubDate: parseDate(item.find('span.datestamp time').attr('datetime')),
                //author: item.find('td').eq(6).find('a').first().attr('href'),
                //description: `[民间汉化] ${a.text()}<br><br>${item.find('td.tc6 a').attr('href')}`,
                //category: item
                //    .find('a[id^=label]')
                //    .toArray()
                //    .map((item) => $(item).text()),
            };
        });
		
		
	const items = await Promise.all(
        list.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);
				
				// 获取 '.post__featured-image' 的 HTML 内容
				var featuredImageHTML = $('.post__featured-image').first();
				// 获取 '.post__content-main' 的 HTML 内容
				var contentMainHTML = $('.post__content-main').first().html();

				// 使用模板字符串将两者组合起来
				var combinedHTML = `${featuredImageHTML}${contentMainHTML}`;

                // 选择类名为“comment-body”的第一个元素
                item.description = combinedHTML;

                // 上面每个列表项的每个属性都在此重用，
                // 并增加了一个新属性“description”
                return item;
            })
        )
    );

    ctx.state.data = {
        // 在此处输出您的 RSS
         // 源标题
         title: `视觉小说新闻`,
         // 源链接
         link: `${baseUrl}/tag/visual-novel`,
         // 源文章
         item: items,
    };
};