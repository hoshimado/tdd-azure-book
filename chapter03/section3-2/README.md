# 第３章　ライブラリのI/Oの実動作をテストで確認しながら実装する

本章の次の節で利用する、「リスト3-4」までを反映したサンプルコードが、こちらのリポジトリです。

* 3.2 外部I/Oをスタブ化する

紙面上では記載を省略しましたが、テストの実行コマンドは以下です。
実行結果は、前節（[section3-1](../section3-1)）とほぼ同様になります。
実際のSQLiteデータベースファイル「mydb.sqlite3」へアクセスすること無く、
テストコード内のみで動作を完了する点が異なります。

`npm test test\sql_lite_db_test1.js`

## 補足

* 実際にログのReadをスタブ内で完結させるテストコード（紙面上で解説）
  * sql_lite_db_test1.js
* 実際にログのReadを行うが、ファイル「mydb.sqlite3」を未準備なので今回は失敗するテストコード（As Is）
  * sql_lite_db_actual_test1.js
* 実際にログのWriteを行うが、ファイル「mydb.sqlite3」を未準備なので今回は失敗するテストコード（As Is）
  * sql_lite_db_actual_test2.js
* 実際にユーザーのWriteを行うが、ファイル「mydb.sqlite3」を未準備なので失敗するテストコード（As Is）
  * sql_lite_db_actual_test3.js
