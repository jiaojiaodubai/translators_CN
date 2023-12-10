{
	"translatorID": "dbc3b499-88b6-4661-88c0-c27ac57ccd59",
	"label": "People's Daily",
	"creator": "pixiandouban",
	"target": "^https?://data.people.com.cn/rmrb",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2023-12-10 09:39:36"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2023 pixiandouban

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

function detectWeb(doc, url) {
	var lists = doc.querySelector(".title_list, .daodu_warp");
	if (url.includes('qs') || lists) { //搜索界面
		return "multiple";
	}
	else {
		return "newspaperArticle";
	}
}

function getSearchResults(doc, checkOnly) {
	var articleList = doc.querySelectorAll(".title_list a, .daodu_warp a, .sreach_li a.open_detail_link");
	var items = {};
	for (let article of articleList) {
		Z.debug(article.textContent);
		Z.debug(article.href);
		items[article.href] = article.textContent;
	}
	return items;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('.title_list a, .daodu_warp a, .sreach_li a.open_detail_link');
	for (let row of rows) {
		let href = row.href;
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		let items = await Zotero.selectItems(getSearchResults(doc, false));
		if (!items) return;
		for (let url of Object.keys(items)) {
			await scrape(await requestDocument(url));
		}
	}
	else {
		await scrape(doc, url);
	}
}

async function scrape(doc, url = doc.location.href) {
	var type = detectWeb(doc, url);
	var item = new Zotero.Item(type);

	item.title = ZU.xpathText(doc, '//div[@class="title"]');
	var authors = ZU.xpathText(doc, '//div[@class="author"]');
	if (authors) {
		authors = authors.replace("【作者：", "").replace("】", "").split(/[，、\s;]+/);
		//Z.debug(authors);
		if (authors.length > 1) {
			for (i = 0; i < authors.length; i += 1) {
				item.creators.push(ZU.cleanAuthor((authors[i]), "author"));
			}
		}
		else if (authors.length === 1) {
			item.creators.push(ZU.cleanAuthor((authors[0]), "author"));
		}
	}
	item.language = 'zh-CN';
	item.url = url;

	item.abstractNote = [];
	//Z.debug(item.abstractNote);

	item.publicationTitle = "人民日报";
	item.ISSN = "1672-8386";
	//item.CN = "11-0065"; //统一刊号

	var d = doc.querySelectorAll('div.sha_left span');
	item.date = d[0].innerText;
	Z.debug(item.date);

	item.attachments.push({
		title: "Snapshot",
		document: doc
	});

	item.complete();
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://data.people.com.cn/rmrb/20221111/2/9c32c291fb004412bad9eaa6ce828f46",
		"items": [
			{
				"itemType": "newspaperArticle",
				"language": "zh-CN",
				"title": "李克强参观中柬文化遗产交流合作30年成果展并出席文物修复移交仪式"
			}
		]
	},
	{
		"type": "web",
		"url": "http://data.people.com.cn/rmrb/20221111/1/4778f051fb5f49ab9709e7f4d6ed25fe",
		"title": "听取新冠肺炎疫情防控工作汇报 研究部署进一步优化防控工作的二十条措施"
	}
]
/** END TEST CASES **/
