{
	"translatorID": "f306107f-dabb-41ac-8fa2-f7f858feb11f",
	"label": "Wenjin",
	"creator": "Xingzhong Lin",
	"target": "https?://find.nlc.cn/search",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2023-12-10 12:35:16"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2020 Xingzhong Lin, https://github.com/Zotero-CN/translators_CN
	
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
	if (url.includes('/search/showDocDetails')) {
		return detectType(doc);
	}
	else if (url.includes("search/doSearch?query") && getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}

function detectType(doc) {
	var itemType = {
		普通古籍: "book",
		善本: "book",
		学位论文: "thesis",
		特藏古籍: "book",
		期刊论文: "journalArticle",
		期刊: "journalArticle",
		报纸: "newspaperArticle",
		专著: "book",
		报告: "report"
	};
	return itemType[text(doc, 'span.book_val')];
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('div.article_item div.book_name > a');
	for (let row of rows) {
		let click = row.getAttribute('onclick').split("'");
		// Z.debug(click);
		let href = "http://find.nlc.cn/search/showDocDetails?docId="
			+ click[3]
			+ "&dataSource="
			+ click[5]
			+ "&query="
			+ encodeURI(click[7]);
		// Z.debug(href);
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
	var itemType = detectType(doc);
	var newItem = new Zotero.Item(itemType);
	var data = {
		innerData: Object.fromEntries(Array.from(doc.querySelectorAll('.book_item'))
			.map(element => [text(element, 'span:first-child').replace(/\s/g, ''), trimLabel(element)])),
		getWith: function () {
			let results = [];
			for (let i = 0; i < arguments.length; i++) {
				results.push(this.innerData[`${arguments[i]}：`]);
			}
			let result = results.find(element => element);
			return result
				? result
				: '';
		}
	};
	Z.debug(data);
	newItem.title = text(doc, '.book_name');
	newItem.date = data.getWith('出版发行时间', '论文授予时间');
	newItem.publicationTitle = data.getWith('刊名');
	let tags = data.getWith('关键词', '中文关键词') + data.getWith('英文关键词');
	tags = tags.split(/[，；,;]/).filter(tag => tag);
	tags.forEach(tag => newItem.tags.push(tag));
	newItem.place = data.getWith('出版、发行地');
	let page = data.getWith('载体形态', '页', '印刷页码').replace(/页$/, '');
	if (itemType === "book" || itemType === "thesis") {
		newItem.numPages = page;
	}
	else {
		newItem.pages = page;
	}
	newItem.publisher = data.getWith('出版、发行者');
	Z.debug(data.getWith('所有责任者', '作者'));
	data.getWith('所有责任者', '作者').split(/[,;，；]|\s{2}/).forEach((author) => {
		Z.debug(author);
		let creatorType = 'author';
		if (author.endsWith("指导")) {
			creatorType = "contributor";
		}
		newItem.creators.push(ZU.cleanAuthor(author.replace(/[等主编著指导]*$/, ''), creatorType));
	});
	newItem.creators.forEach((creator) => {
		if (/[\u4e00-\u9fa5]/.test(creator.lastName)) {
			creator.fieldMode = 1;
		}
	});
	newItem.language = data.getWith('语种');
	newItem.abstractNote = text(doc, 'div.zy_pp_val') || data.getWith('引文');
	newItem.university = data.getWith('论文授予机构');
	newItem.issue = tryMatch(data.getWith('期'), /0?(\d*)/, 1);
	newItem.ISBN = data.getWith('标识号');
	newItem.url = url;
	newItem.complete();
}

function trimLabel(element) {
	if (!element) return '';
	// Deep copy to avoid affecting the original page.
	let elementCopy = element.cloneNode(true);
	if (elementCopy.firstElementChild) {
		elementCopy.removeChild(elementCopy.firstElementChild);
	}
	return /(作者)|(关键词)/.test(element.innerText)
		? elementCopy.innerText.trim()
		: ZU.trimInternal(elementCopy.innerText);
}

function tryMatch(string, pattern, index = 0) {
	if (!string) return '';
	let match = string.match(pattern);
	return (match && match[index])
		? match[index]
		: '';
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://find.nlc.cn/search/showDocDetails?docId=-4203196484494800823&dataSource=ucs01&query=%E6%B0%B4%E5%90%88%E7%89%A9",
		"items": [
			{
				"itemType": "book",
				"title": "天然气水合物气藏开发",
				"creators": [
					{
						"firstName": "",
						"lastName": "郭平",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "刘士鑫",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "杜建芬",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2006",
				"ISBN": "9787502156039",
				"abstractNote": "本书在介绍水合物研究现状、基本性质、水合物相态基础上，系统论述了水合物气藏的形成与勘探技术、钻井与取样、开采方法、开发前景，以及天然气水合物技术的应用。",
				"language": "Chinese 汉语",
				"libraryCatalog": "Wenjin",
				"numPages": "187",
				"place": "北京",
				"publisher": "石油工业出版社",
				"url": "http://find.nlc.cn/search/showDocDetails?docId=-4203196484494800823&dataSource=ucs01&query=%E6%B0%B4%E5%90%88%E7%89%A9",
				"attachments": [],
				"tags": [
					{
						"tag": "天然气水合物"
					},
					{
						"tag": "气田开发"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://find.nlc.cn/search/showDocDetails?docId=7225006674714026291&dataSource=ucs01,bslw&query=%E4%BF%A1%E7%94%A8",
		"items": [
			{
				"itemType": "thesis",
				"title": "基于信用衍生工具的银行业信贷资产管理",
				"creators": [
					{
						"firstName": "",
						"lastName": "尹灼",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "王国刚",
						"creatorType": "contributor",
						"fieldMode": 1
					}
				],
				"language": "Chinese 汉语",
				"libraryCatalog": "Wenjin",
				"numPages": "289",
				"university": "中国社会科学院",
				"url": "http://find.nlc.cn/search/showDocDetails?docId=7225006674714026291&dataSource=ucs01,bslw&query=%E4%BF%A1%E7%94%A8",
				"attachments": [],
				"tags": [
					{
						"tag": "信用"
					},
					{
						"tag": "信贷"
					},
					{
						"tag": "资金管理"
					},
					{
						"tag": "银行"
					},
					{
						"tag": "风险管理"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://find.nlc.cn/search/showDocDetails?docId=-8373230212045865087&dataSource=cjfd&query=wgcna",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "基于WGCNA算法的基因共表达网络构建理论及其R软件实现",
				"creators": [
					{
						"firstName": "",
						"lastName": "宋长新",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "雷萍",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "王婷",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2013-02-28",
				"abstractNote": "WGCNA(weighted geneco-expression network analysis)算法是一种构建基因共表达网络的典型系统生物学算法,该算法基于高通量的基因信使RNA(mRNA)表达芯片数据,被广泛应用于国际生物医学领域。本文旨在介绍WGCNA的基本数理原理,并依托R软件包WGNCA以实例的方式介绍其应用。WGCNA算法首先假定基因网络服从无尺度分布,并定义基因共表达相关矩阵、基因网络形成的邻接函数,然后计算不同节点的相异系数,并据此构建分层聚类树(hierarchical clusteringtree),该聚类树的不同分支代表不同的基因模块(module),模块内基因共表达程度高,而分数不同模块的基因共表达程度低。最后,探索模块与特定表型或疾病的关联关系,最终达到鉴定疾病治疗的靶点基因、基因网络的目的。",
				"issue": "01",
				"libraryCatalog": "Wenjin",
				"pages": "143-149",
				"publicationTitle": "基因组学与应用生物学 Genomics and Applied Biology",
				"url": "http://find.nlc.cn/search/showDocDetails?docId=-8373230212045865087&dataSource=cjfd&query=wgcna",
				"attachments": [],
				"tags": [
					{
						"tag": " Gene co"
					},
					{
						"tag": " R software"
					},
					{
						"tag": "R软件WGCNA"
					},
					{
						"tag": "WGCNA算法"
					},
					{
						"tag": "expression network"
					},
					{
						"tag": "基因共表达网络"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
