// 导入必要的模组
const got = require('@/utils/got'); // 自订的 got
const cheerio = require('cheerio'); // 可以使用类似 jQuery 的 API HTML 解析器
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    // 在此处编写您的逻辑
	const baseUrl = 'http://hawabi.blog.fc2.com';
	
	
	// 注意，".data" 属性包含了请求返回的目标页面的完整 HTML 源代码
    const { data: response } = await got(`${baseUrl}`);
    const $ = cheerio.load(response);
	
	
	// 我们使用 Cheerio 选择器选择所有tbody中的tr标签
    const item = $('.content')
        // 使用“toArray()”方法将选择的所有 DOM 元素以数组的形式返回。
        .toArray()
        // 使用“map()”方法遍历数组，并从每个元素中解析需要的数据。
        .map((item) => {
            item = $(item);
            const a = item.find('a').first();

            return {
                title: a.text(),
                // `link` 需要一个绝对 URL，但 `a.attr('href')` 返回一个相对 URL。
                link: `${a.attr('href')}`,
                //pubDate: parseDate(item.find('relative-time').attr('datetime')),
				pubDate: parseDate(item.find('td').first().text()),
                //author: item.find('td').eq(6).find('a').first().attr('href'),
                //description: `[官方中文] ${a.text()}<br><br>${item.find('td').eq(6).find('a').first().attr('href')}`,
				description: `${a.text()}<br><br>${item.find('img').first()}`,
                //category: item
                //    .find('a[id^=label]')
                //    .toArray()
                //    .map((item) => $(item).text()),
            };
        });

    ctx.state.data = {
        // 在此处输出您的 RSS
         // 源标题
         title: `hww news`,
         // 源链接
         link: `${baseUrl}`,
         // 源文章
         item: item,
    };
};