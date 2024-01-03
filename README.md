# TODO

## 阻塞任务

1. GFSOSO
   - 代码陈旧
   - 网站变动较大
2. Jd
   - 数据有限且粗糙
3. ProQuestCN Thesis
   - 缺少测试用例
   - 无访问权限
4. Soopat
   - 无访问权限

## 局限

1. Baidu Scholar
   - 有时可能无法识别条目，或条目类型不正确
2. Ncpssd
   - 无法下载PDF
3. PubScholar
   - 不支持首页推荐文章
   - 多条目抓取可能会缺少字段
4. Wanfang data
   - 无法下载PDF

## 开发建议

1. 克隆^[1] [官方仓库](https://github.com/zotero/translators/blob/master)到本地后，在终端跳转到trnslators目录，输入`npm install`以启用ESLint。
2. 对于使用VS Code的开发者，将`.vscode`文件夹移动到**官方仓库克隆文件夹下的master分支**下，在**官方仓库克隆文件夹下的master分支**分支完成开发后，使用快捷键 <kbd>F5</kbd> 调用 ESLint。
3. 不使用VS Code的开发者，完成 1. 的基础上，在**官方仓库克隆文件夹下的master分支**开发完成后，在终端输入`npm run lint -- "xxx.js" --fix`调用 ESLint。
4. 将本仓库的`check_data.py`移动到translators_CN的开发目录下，在提交前运行`check_data.py`检查是否已填写汉化文件`data.json`。

[1] 注：如果你clone官方仓库有困难，可以下载官方仓库的`.zip`包，解压后在终端输入`git init`以便继续使用`npm install`。
