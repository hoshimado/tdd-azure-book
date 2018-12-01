# 第３章　ライブラリのI/Oの実動作をテストで確認しながら実装する


本書で利用する「SQLite3」のコマンドラインツールは、以下の公式サイトのページから取得できます。
ページの中段にある「Precompiled Binaries for Windows」の項の3つめ「sqlite-tools-win32-x86-3250300.zip」を取得してください。

https://www.sqlite.org/download.html

※公式の「インストール方法」はこちらで参照できます。→ http://www.sqlitetutorial.net/download-install-sqlite/

取得した「sqlite-tools-win32-x86-3250300.zip」を展開すると次の３つを現れます。これらをサンプルコードの「db」フォルダ配下に格納してください（※本書で利用するのはsqlite3.exeのみとなります）。

* sqldiff.exe
* sqlite3.exe
* sqlite3_analyzer.exe

※サンプルコードには、実行に必要なテーブルと読み取り用データを作成済みの「mydb.sqlite3」を既に入れてあります。sqlite3コマンドは中身の確認や再作成する場合などに利用ください。

※テスト動作時に、実際のSQLiteデータベースファイル「mydb.sqlite3」を必要とするのは「節3.1」のコードのみです。

本章のサンプルコードで利用するSQLiteのテーブルの作成コマンドは次のテキストファイルからコピー＆ペーストできます。「db」フォルダ内に「sqlite3.exe」が置かれた状態で実行してください。

[create_sqlite_table.txt](./create_sqlite_table.txt)



## 3.1節　テストフレームワークから実際の外部I/Oを試行する

[section3-1](./section3-1)

## 3.2節　外部I/Oをスタブ化する

[section3-2](./section3-2)

## 3.3節　現在時刻を内部的に利用する関数のテスト作成

[section3-3](./section3-3)

