# TODO

## 未通过ESLint

- [ ] CNKI
- [ ] Dangdang
- [ ] Duxiu
- [ ] GFSOSO
- [ ] National Public Service Platform for Standards Information - China
- [ ] Ncpssd
- [ ] Nlc.cn
- [ ] People's Daily
- [ ] ProQuestCN Thesis
- [ ] Soopat
- [ ] SuperLib
- [ ] Wanfang Data
- [ ] Weixin
- [ ] Wenjin
- [ ] xiaoyuzhoufm
- [ ] Zhihu

## 其他

- [ ] Cubox
  - [ ] `header`缺少必要信息
  - [ ] 缺`data.json`记录

## 开发建议

1. 克隆[官方仓库](https://github.com/zotero/translators/blob/master)到本地后，在终端跳转到trnslators目录，输入`npm install`以启用ESLint
2. 对于使用VS Code的开发者，将`.vscode`文件夹移动到`master`分支下，在master分支完成开发后，使用快捷键 <kbd>F5</kbd> 调用 ESLint
3. 将本仓库的`check_data.py`移动到translators_CN的开发目录下，在提交前检查是否已填写汉化文件`data.json`
