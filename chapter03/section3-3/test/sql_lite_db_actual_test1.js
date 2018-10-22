/*
    [sql_lite_db_actual_test1.js]

    encoding=utf-8
*/

var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
require('date-utils');

const sql_parts = require("../src/sql_lite_db.js");


describe( "sql_lite_db_actual_test1.js", function(){
    var createPromiseForSqlConnection = sql_parts.createPromiseForSqlConnection;
    var closeConnection = sql_parts.closeConnection;

    var getListOfActivityLogWhereDeviceKey = sql_parts.getListOfActivityLogWhereDeviceKey;

    describe( "【実際にアクセス】::getListOfActivityLogWhereDeviceKey()",function(){
        this.timeout(5000);

        it("正常系。期間指定なし。",function(){
            var period = null; //無しの場合
            var deviceKey = "にゃーん。";

            // アクセス前処理
            var sqlConfig = { "database" : "./db/mydb.sqlite3" }; // npm test 実行フォルダ、からの相対パス
            var promise = createPromiseForSqlConnection( sqlConfig );

            // 被テスト関数の実行
            return shouldFulfilled(
                promise.then( function(){
                    return getListOfActivityLogWhereDeviceKey( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", null );
                })
			).then(function( result ){
                // アクセス後処理
                closeConnection( sqlConfig.database );

                // 実行結果の確認
                console.log( result );
            });
        });
    });
});

