{
	"translatorID": "e034d9be-c420-42cf-8311-23bca5735a32",
	"label": "Baidu Scholar",
	"creator": "l0o0<linxzh1989@gmail.com>",
	"target": "^https?://(www\\.)?xueshu\\.baidu\\.com/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2023-11-29 13:22:57"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2017 Philipp Zumstein

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
	if (url.includes('paperid=')) {
		return "journalArticle";
	}
	else if (getSearchResults(doc, true)) {
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('h3 > a[href*="show?paperid="]');
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
	let id = url.match(/paperid=(\w+)/);
	// Z.debug(id);
	if (id) {
		let bibUrl = `https://xueshu.baidu.com/u/citation?type=bib&${id[0]}`;
		let bibText = await requestText(bibUrl);
		let translator = Zotero.loadTranslator("import");
		translator.setTranslator('9cb70025-a888-4a29-a210-93ec52da40d4');
		translator.setString(bibText);
		translator.setHandler('itemDone', (_obj, item) => {
			item.url = url;
			item.abstractNote = text(doc, 'p.abstract');
			let tagsList = doc.querySelectorAll("div.kw_wr p.kw_main a");
			if (tagsList && tagsList.length == 1) {
				item.tags = tagsList[0].innerText.split("；");
			}
			else if (tagsList && tagsList.length > 1) {
				tagsList.forEach(function (tag) {
					item.tags.push(tag.innerText);
				});
			}
			item.DOI = text(doc, "div.doi_wr p.kw_main");
			// Z.debug(item.abstractNote);
			// Z.debug(item.tags);
			item.complete();
		});
		await translator.translate();
	}
}
/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://xueshu.baidu.com/usercenter/paper/show?paperid=b3ab239032d44d951d8eee26d7bc44bf&site=xueshu_se",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "Zotero: information management software 2.0",
				"creators": [
					{
						"firstName": "Peter",
						"lastName": "Fernandez",
						"creatorType": "author"
					}
				],
				"date": "2011",
				"DOI": "info:doi/10.1108/07419051111154758",
				"abstractNote": "Purpose – The purpose of this paper is to highlight how the open-source bibliographic management program Zotero harnesses Web 2.0 features to make library resources more accessible to casual users without sacrificing advanced features. This reduces the barriers understanding library resources and provides additional functionality when organizing information resources. Design/methodology/approach – The paper reviews select aspects of the program to illustrate how it can be used by patrons and information professionals, and why information professionals should be aware of it. Findings – Zotero has some limitations, but succeeds in meeting the information management needs of a wide variety of users, particularly users who use online resources. Originality/value – This paper is of interest to information professionals seeking free software that can make managing bibliographic information easier for themselves and their patrons.",
				"issue": "4",
				"itemID": "2011Zotero",
				"libraryCatalog": "Baidu Scholar",
				"pages": "5-7",
				"publicationTitle": "Library Hi Tech News",
				"shortTitle": "Zotero",
				"url": "https://xueshu.baidu.com/usercenter/paper/show?paperid=b3ab239032d44d951d8eee26d7bc44bf&site=xueshu_se",
				"volume": "28",
				"attachments": [],
				"tags": [
					{
						"tag": "Citation management"
					},
					{
						"tag": "Internet"
					},
					{
						"tag": "Library services"
					},
					{
						"tag": "Open source"
					},
					{
						"tag": "Reference management"
					},
					{
						"tag": "Technology"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://xueshu.baidu.com/s?wd=zotero&rsv_bp=0&tn=SE_baiduxueshu_c1gjeupa&rsv_spt=3&ie=utf-8&f=8&rsv_sug2=0&sc_f_para=sc_tasktype%3D%7BfirstSimpleSearch%7D",
		"items": "multiple"
	}
]
/** END TEST CASES **/
